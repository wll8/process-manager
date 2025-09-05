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
})