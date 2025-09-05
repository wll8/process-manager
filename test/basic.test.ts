import { describe, it, expect, afterEach } from 'vitest'
import { ProcessManager } from '../src'

describe('ProcessManager 基本测试', () => {
  let pm: ProcessManager

  afterEach(() => {
    if (pm) {
      pm.kill('SIGKILL')
    }
  })

  it('应该能够创建 ProcessManager 实例', () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', 'setTimeout(() => process.exit(0), 100)'],
      autoReStart: false
    })
    
    expect(pm).toBeInstanceOf(ProcessManager)
    expect(pm.getChild()).toBeTruthy()
  })

  it('应该能够获取子进程', () => {
    pm = new ProcessManager({
      bin: 'node', 
      arg: ['-e', 'setTimeout(() => process.exit(0), 100)'],
      autoReStart: false
    })
    
    const child = pm.getChild()
    expect(child).toBeTruthy()
    expect(typeof child?.pid).toBe('number')
  })

  it('应该能够去除 ANSI 样式', () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', 'setTimeout(() => process.exit(0), 100)'],
      autoReStart: false
    })
    
    const styledText = '\u001b[31m红色文字\u001b[0m'
    const cleanText = pm.delStyle(styledText)
    
    expect(cleanText).toBe('红色文字')
  })

  it('应该能够处理进程通信', async () => {
    pm = new ProcessManager({
      bin: 'node',
      arg: ['-e', `
        process.on('message', (msg) => {
          process.send('received: ' + msg)
          setTimeout(() => process.exit(0), 100)
        })
      `],
      autoReStart: false
    })

    return new Promise<void>((resolve) => {
      pm.on('message', (msg) => {
        expect(msg).toBe('received: hello')
        resolve()
      })
      
      // 等待进程启动后发送消息
      setTimeout(() => {
        pm.send('hello')
      }, 100)
    })
  })

  it('应该能够使用数组语法运行 JavaScript 文件', () => {
    // 数组模式省略了前面的 node，等价于 node test/child.js
    pm = new ProcessManager([
      'test/child.js'
    ])
    
    expect(pm).toBeInstanceOf(ProcessManager)
    expect(pm.getChild()).toBeTruthy()
    expect(typeof pm.getChild()?.pid).toBe('number')
  })

  it('应该能够使用数组语法运行 Node.js 命令行参数', () => {
    // 数组模式省略了前面的 node，等价于 node -e "xxx"
    pm = new ProcessManager([
      '-e',
      'setTimeout(() => process.exit(0), 100)'
    ])
    
    expect(pm).toBeInstanceOf(ProcessManager)
    expect(pm.getChild()).toBeTruthy()
    expect(typeof pm.getChild()?.pid).toBe('number')
  })

  it('应该能够使用数组语法运行 JavaScript 文件并传递参数', () => {
    // 数组模式省略了前面的 node，等价于 node test/child.js --test-arg
    pm = new ProcessManager([
      'test/child.js',
      '--test-arg'
    ])
    
    expect(pm).toBeInstanceOf(ProcessManager)
    expect(pm.getChild()).toBeTruthy()
    expect(typeof pm.getChild()?.pid).toBe('number')
  })

  it('应该能够使用数组语法监听输出', async () => {
    // 数组模式省略了前面的 node，等价于 node -e "xxx"
    pm = new ProcessManager([
      '-e',
      'console.log("Array syntax works!"); setTimeout(() => process.exit(0), 100)'
    ])
    
    pm.autoReStart = false

    return new Promise<void>((resolve) => {
      pm.on('stdout', (data) => {
        if (data.trim() === 'Array syntax works!') {
          resolve()
        }
      })
    })
  })

  it('应该能够使用数组语法处理进程通信', async () => {
    // 数组模式省略了前面的 node，等价于 node -e "xxx"
    pm = new ProcessManager([
      '-e',
      `
        process.on('message', (msg) => {
          process.send('array syntax: ' + msg)
          setTimeout(() => process.exit(0), 100)
        })
      `
    ])
    
    pm.autoReStart = false

    return new Promise<void>((resolve) => {
      pm.on('message', (msg) => {
        expect(msg).toBe('array syntax: test')
        resolve()
      })
      
      setTimeout(() => {
        pm.send('test')
      }, 100)
    })
  })
})