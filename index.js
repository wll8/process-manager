const { Transform } = require('stream');

class ProcessManager {
  #child = undefined // current process
  #onList = [] // Store the list of listening events and restore them after the process restarts
  #initArg = [] // Store initialization parameters
  #isUserKill = false // Whether to manually terminate for the user
  #isClose = true // Whether the process has exited
  autoReStart = true // Whether to restart automatically
  autoReStartTime = 1 * 1e3 // Automatic restart interval in milliseconds
  #stdoutTransform = null
  #stderrTransform = null
  constructor(...arg) {
    this.#initArg = arg
    this.start()
  }
  getChild() {
    return this.#child
  }
  send(data) {
    if (this.#isClose === false && this.#child && this.#child.connected) {
      try {
        this.#child.send(data)
      } catch (error) {
        // 忽略发送错误，避免未处理的异常
        console.warn('Failed to send message to child process:', error.message)
      }
    }
  }
  on(name, fn, {save = true} = {}) {
    save && this.#onList.push({
      name,
      fn,
    })
    // 先移除所有旧的监听器，防止重复绑定
    if (name === `message`) {
      this.#child.removeAllListeners(`message`)
      this.#child.on(`message`, (msg) => fn(msg))
    }
    if (name === `stdout`) {
      this.#child.stdout.removeAllListeners(`data`)
      this.#child.stdout.on(`data`, (data) => fn(this.delStyle(String(data))))
    }
    if (name === `stderr`) {
      this.#child.stderr.removeAllListeners(`data`)
      this.#child.stderr.on(`data`, (data) => fn(this.delStyle(String(data))))
    }
    if (name === `close`) {
      this.#child.removeAllListeners(`close`)
      this.#child.on(`close`, () => {
        this.#isClose = true
        if (this.#isUserKill === false && this.autoReStart) {
          setTimeout(() => {
            this.start()
          }, this.autoReStartTime)
        }
        this.#isUserKill = false
        fn()
      })
    }
  }
  /**
   * Close child process without restarting
   * @param {string} code
   * -
   * - SIGINT -- Request to end the foreground process
   * - SIGTERM -- Background process before the request ends
   * - SIGKILL -- Forcibly end the background process
   */
  kill(code = `SIGTERM`) {
    this.#child.kill(code)
    this.#isUserKill = true
  }
  /**
   * Get unstyled terminal output
   * @returns 
   */
  delStyle(str) {
    const text = str.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gm,
      ``
    )
    return text
  }
  start() {
    if(this.#isClose === false) {
      return undefined
    }
    
    // 先解除旧的 pipe 并销毁 Transform 流
    if (this.#child && this.#child.stdout && this.#stdoutTransform) {
      this.#child.stdout.unpipe(this.#stdoutTransform)
      this.#stdoutTransform.destroy()
    }
    if (this.#child && this.#child.stderr && this.#stderrTransform) {
      this.#child.stderr.unpipe(this.#stderrTransform)
      this.#stderrTransform.destroy()
    }

    const init = this.#initArg[0]
    const {
      bin = process.argv[0],
      arg = [],
      autoReStart = this.autoReStart,
      autoReStartTime = this.autoReStartTime,
      stdout = (chunk, encoding, cb) => { process.stdout.write(chunk), cb(null, chunk) },
      stderr = (chunk, encoding, cb) => { process.stderr.write(chunk), cb(null, chunk) },
      spawnOption = {},
    } = init.length ? {arg: init} : init
    this.autoReStart = autoReStart
    this.autoReStartTime = autoReStartTime

    const { spawn } = require(`child_process`)
    const child = spawn(bin, arg, {
      stdio: [null, null, null, `ipc`],
      ...spawnOption,
    })
    this.#isClose = false
    this.#child = child

    // 新建 Transform 并保存引用
    this.#stdoutTransform = new Transform({ 
      transform: (chunk, encoding, cb) => {
        try {
          // 直接输出到控制台
          process.stdout.write(chunk)
          // 调用自定义的 stdout 处理函数
          stdout(chunk, encoding, cb)
        } catch (err) {
          cb(err)
        }
      },
      flush: (cb) => cb()
    })
    this.#stderrTransform = new Transform({ 
      transform: (chunk, encoding, cb) => {
        try {
          // 直接输出到控制台
          process.stderr.write(chunk)
          // 调用自定义的 stderr 处理函数
          stderr(chunk, encoding, cb)
        } catch (err) {
          cb(err)
        }
      },
      flush: (cb) => cb()
    })
    
    // 设置错误处理
    this.#stdoutTransform.on('error', (err) => {
      console.error('stdout transform error:', err)
    })
    this.#stderrTransform.on('error', (err) => {
      console.error('stderr transform error:', err)
    })
    
    // 直接监听子进程的输出，不通过 Transform 流
    this.#child.stdout.on('data', (data) => {
      process.stdout.write(data)
      // 触发 stdout 事件
      this.#child.emit('stdout', this.delStyle(String(data)))
    })
    
    this.#child.stderr.on('data', (data) => {
      process.stderr.write(data)
      // 触发 stderr 事件
      this.#child.emit('stderr', this.delStyle(String(data)))
    })

    // 设置默认的 close 监听器（如果没有用户自定义的 close 监听器）
    if (!this.#onList.find(item => item.name === 'close')) {
      this.#child.on(`close`, () => {
        this.#isClose = true
        if (this.#isUserKill === false && this.autoReStart) {
          setTimeout(() => {
            this.start()
          }, this.autoReStartTime)
        }
        this.#isUserKill = false
      })
    }
    
    // 恢复之前保存的事件监听器
    this.#onList.forEach(({name, fn}) => {
      this.on(name, fn, {save: false})
    })
  }
  /**
   * close the program and start it again
   * @param {number} time
   */
  reboot(time = this.autoReStartTime) {
    const autoReStartOld = this.autoReStart
    this.autoReStart = false
    this.#child.kill()
    this.#child.on(`close`, () => {
      setTimeout(() => {
        this.start()
        this.autoReStart = autoReStartOld
      }, time);
    })
  }
}
module.exports = {
  ProcessManager,
}