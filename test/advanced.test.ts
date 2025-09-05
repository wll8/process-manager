import { describe, it, expect, afterEach } from 'vitest'
import { ProcessManager } from '../src'

describe('ProcessManager 高级功能测试', () => {
  let pm: ProcessManager

  afterEach(() => {
    if (pm) {
      pm.kill('SIGKILL')
    }
  })

  it('应该能够处理自动重启', async () => {
    let restartCount = 0
    
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', `
        process.send('started')
        setTimeout(() => process.exit(0), 200)
      `],
      autoReStart: true,
      autoReStartTime: 100
    })

    return new Promise<void>((resolve) => {
      pm.on('message', (msg) => {
        if (msg === 'started') {
          restartCount++
          if (restartCount >= 3) {
            expect(restartCount).toBe(3)
            pm.kill() // 停止自动重启
            resolve()
          }
        }
      })
    })
  })

  it('应该能够发送和接收复杂消息', async () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', `
        process.on('message', (msg) => {
          if (typeof msg === 'object') {
            process.send({ 
              type: 'response', 
              data: msg.data + ' processed',
              timestamp: Date.now()
            })
          }
          setTimeout(() => process.exit(0), 100)
        })
      `],
      autoReStart: false
    })

    return new Promise<void>((resolve) => {
      pm.on('message', (msg) => {
        expect(msg).toHaveProperty('type', 'response')
        expect(msg).toHaveProperty('data', 'test processed')
        expect(msg).toHaveProperty('timestamp')
        resolve()
      })
      
      setTimeout(() => {
        pm.send({ data: 'test' })
      }, 100)
    })
  })

  it('应该能够监听 stdout 输出', async () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', `
        console.log('Hello from stdout')
        setTimeout(() => process.exit(0), 100)
      `],
      autoReStart: false
    })

    return new Promise<void>((resolve) => {
      pm.on('stdout', (data) => {
        expect(data.trim()).toBe('Hello from stdout')
        resolve()
      })
    })
  })

  it('应该能够监听 stderr 输出', async () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', `
        console.error('Error message')
        setTimeout(() => process.exit(0), 100)
      `],
      autoReStart: false
    })

    return new Promise<void>((resolve) => {
      pm.on('stderr', (data) => {
        expect(data.trim()).toBe('Error message')
        resolve()
      })
    })
  })

  it('应该能够正确处理进程关闭事件', async () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', 'setTimeout(() => process.exit(0), 100)'],
      autoReStart: false
    })

    return new Promise<void>((resolve) => {
      pm.on('close', () => {
        // 进程正常退出，只需验证close事件被触发
        expect(pm.getChild()).toBeTruthy() // 进程对象仍存在
        resolve()
      })
    })
  })

  it('应该能够使用自定义 spawn 选项', () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', 'setTimeout(() => process.exit(0), 100)'],
      autoReStart: false,
      spawnOption: {
        env: { ...process.env, CUSTOM_VAR: 'test_value' }
      }
    })

    expect(pm.getChild()).toBeTruthy()
    expect(pm).toBeInstanceOf(ProcessManager)
  })

  it('应该能够使用数组语法运行真实 JavaScript 文件', async () => {
    pm = new ProcessManager([
      'test/child.js',
      '--test-arg'
    ])

    return new Promise<void>((resolve) => {
      let stdoutReceived = false
      let argReceived = false

      pm.on('stdout', (data) => {
        const output = data.toString().trim()
        if (output === 'Hello from child process') {
          stdoutReceived = true
        }
        if (output === 'Test argument received') {
          argReceived = true
        }
      })

      pm.on('close', () => {
        expect(stdoutReceived).toBe(true)
        expect(argReceived).toBe(true)
        resolve()
      })
    })
  })

  it('应该能够使用数组语法与真实 JavaScript 文件通信', async () => {
    pm = new ProcessManager(['test/child.js'])

    return new Promise<void>((resolve) => {
      pm.on('message', (msg) => {
        expect(msg).toBe('Child response: {"test":"data"}')
        resolve()
      })

      // 等待进程启动后发送消息
      setTimeout(() => {
        pm.send({ test: 'data' })
      }, 100)
    })
  })
})