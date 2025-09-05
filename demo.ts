import { ProcessManager } from './src'

// 简单演示 TypeScript 版本的 ProcessManager
async function demo() {
  console.log('=== TypeScript ProcessManager 演示 ===')
  
  const pm = new ProcessManager({
    bin: 'node',
    arg: ['-e', 'console.log("Hello from child!"); process.send("child-message"); setTimeout(() => process.exit(0), 1000)'],
    autoReStart: false
  })

  pm.on('message', (msg) => {
    console.log('收到消息:', msg)
  })

  pm.on('stdout', (data) => {
    console.log('stdout:', data.trim())
  })

  pm.on('close', () => {
    console.log('子进程已关闭')
  })

  // 发送消息给子进程
  setTimeout(() => {
    pm.send('父进程消息')
  }, 100)

  // 等待进程完成
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log('演示结束')
}

demo().catch(console.error)