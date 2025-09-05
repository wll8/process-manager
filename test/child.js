// 简单的测试子进程文件
console.log('Hello from child process')

if (process.argv.includes('--test-arg')) {
  console.log('Test argument received')
}

process.on('message', (msg) => {
  console.log('Child received message:', msg)
  process.send('Child response: ' + JSON.stringify(msg))
})

setTimeout(() => {
  process.exit(0)
}, 200)