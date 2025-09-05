import { ChildProcess, spawn } from 'child_process'
import { Transform } from 'stream'
import { 
  ProcessManagerOptions, 
  EventListener, 
  EventName, 
  KillSignal, 
  ProcessManagerInterface 
} from './types'

export class ProcessManager implements ProcessManagerInterface {
  private child: ChildProcess | undefined = undefined
  private onList: EventListener[] = []
  private initArg: [string[] | ProcessManagerOptions]
  private isUserKill: boolean = false
  private isClose: boolean = true
  private stdoutTransform: Transform | null = null
  private stderrTransform: Transform | null = null
  
  public autoReStart: boolean = true
  public autoReStartTime: number = 1000

  constructor(...arg: [string[] | ProcessManagerOptions]) {
    this.initArg = arg
    this.start()
  }

  getChild(): ChildProcess | undefined {
    return this.child
  }

  send(data: any): void {
    if (!this.isClose && this.child && this.child.connected) {
      try {
        this.child.send(data)
      } catch (error) {
        console.warn('Failed to send message to child process:', (error as Error).message)
      }
    }
  }

  on(name: EventName, fn: (...args: any[]) => void, { save = true }: { save?: boolean } = {}): void {
    if (save) {
      this.onList.push({ name, fn })
    }

    if (!this.child) return

    switch (name) {
      case 'message':
        this.child.removeAllListeners('message')
        this.child.on('message', (msg) => fn(msg))
        break
      case 'stdout':
        this.child.stdout?.removeAllListeners('data')
        this.child.stdout?.on('data', (data) => fn(this.delStyle(String(data))))
        break
      case 'stderr':
        this.child.stderr?.removeAllListeners('data')
        this.child.stderr?.on('data', (data) => fn(this.delStyle(String(data))))
        break
      case 'close':
        this.child.removeAllListeners('close')
        this.child.on('close', () => {
          this.isClose = true
          if (!this.isUserKill && this.autoReStart) {
            setTimeout(() => {
              this.start()
            }, this.autoReStartTime)
          }
          this.isUserKill = false
          fn()
        })
        break
    }
  }

  kill(code: KillSignal = 'SIGTERM'): void {
    if (this.child) {
      this.child.kill(code)
      this.isUserKill = true
    }
  }

  delStyle(str: string): string {
    return str.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gm,
      ''
    )
  }

  start(): ChildProcess | undefined {
    if (!this.isClose) {
      return undefined
    }

    // 清理旧的 Transform 流
    if (this.child?.stdout && this.stdoutTransform) {
      this.child.stdout.unpipe(this.stdoutTransform)
      this.stdoutTransform.destroy()
    }
    if (this.child?.stderr && this.stderrTransform) {
      this.child.stderr.unpipe(this.stderrTransform)
      this.stderrTransform.destroy()
    }

    const init = this.initArg[0]
    const options: ProcessManagerOptions = Array.isArray(init) 
      ? { arg: init } 
      : init

    const {
      bin = process.argv[0],
      arg = [],
      autoReStart = this.autoReStart,
      autoReStartTime = this.autoReStartTime,
      stdout = (chunk: Buffer, _encoding: BufferEncoding, cb: (error?: Error | null, chunk?: Buffer) => void) => {
        process.stdout.write(chunk)
        cb(null, chunk)
      },
      stderr = (chunk: Buffer, _encoding: BufferEncoding, cb: (error?: Error | null, chunk?: Buffer) => void) => {
        process.stderr.write(chunk)
        cb(null, chunk)
      },
      spawnOption = {}
    } = options

    this.autoReStart = autoReStart
    this.autoReStartTime = autoReStartTime

    const child = spawn(bin, arg, {
      stdio: [null, null, null, 'ipc'],
      ...spawnOption
    })

    this.isClose = false
    this.child = child

    // 创建新的 Transform 流
    this.stdoutTransform = new Transform({
      transform: (chunk: Buffer, encoding: BufferEncoding, cb: (error?: Error | null, chunk?: Buffer) => void) => {
        try {
          process.stdout.write(chunk)
          stdout(chunk, encoding, cb)
        } catch (err) {
          cb(err as Error)
        }
      },
      flush: (cb: () => void) => cb()
    })

    this.stderrTransform = new Transform({
      transform: (chunk: Buffer, _encoding: BufferEncoding, cb: (error?: Error | null, chunk?: Buffer) => void) => {
        try {
          process.stderr.write(chunk)
          stderr(chunk, _encoding, cb)
        } catch (err) {
          cb(err as Error)
        }
      },
      flush: (cb: () => void) => cb()
    })

    // 设置错误处理
    this.stdoutTransform.on('error', (err: Error) => {
      console.error('stdout transform error:', err)
    })
    this.stderrTransform.on('error', (err: Error) => {
      console.error('stderr transform error:', err)
    })

    // 监听子进程输出
    this.child.stdout?.on('data', (data: Buffer) => {
      process.stdout.write(data)
      this.child?.emit('stdout', this.delStyle(String(data)))
    })

    this.child.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data)
      this.child?.emit('stderr', this.delStyle(String(data)))
    })

    // 设置默认的 close 监听器
    if (!this.onList.find(item => item.name === 'close')) {
      this.child.on('close', () => {
        this.isClose = true
        if (!this.isUserKill && this.autoReStart) {
          setTimeout(() => {
            this.start()
          }, this.autoReStartTime)
        }
        this.isUserKill = false
      })
    }

    // 恢复保存的事件监听器
    this.onList.forEach(({ name, fn }) => {
      this.on(name as EventName, fn, { save: false })
    })

    return this.child
  }

  reboot(time: number = this.autoReStartTime): void {
    if (!this.child) return

    const autoReStartOld = this.autoReStart
    this.autoReStart = false
    this.child.kill()
    this.child.on('close', () => {
      setTimeout(() => {
        this.start()
        this.autoReStart = autoReStartOld
      }, time)
    })
  }
}