/**
有 bug
- 先运行 npm run bug 启动本进程服务
- 先运行 npm run get 请求进程服务 -- 可以看到请求没有正常完成

无 bug
- 先运行 npm run no-bug 启动原始进程服务
- 先运行 npm run get 请求进程服务 -- 可以看到请求全部通过

分析
可能是 index.js 中有问题

*/

const {
  ProcessManager,
} = require(`./`)

const cp = new ProcessManager(`./node_modules/http-server/bin/http-server . -c-1 -p 10086`.split(` `))

function killProcess(...arg) {
  console.log(`退出程序`)
  cp.kill()
  process.exit()
}
// // 获取进程输出
// cp.on(`stdout`, (data) => {
//   console.log(`stdout: ${data}`);
// })
// cp.on(`stderr`, (data) => {
//   console.log(`stderr: ${data}`);
// })
cp.on('close', (code) => {
  console.log(`子进程退出，退出码 ${code}`);
});
process.on(`SIGTERM`, killProcess)
process.on(`SIGINT`, killProcess)
process.on(`uncaughtException`, killProcess)
process.on(`unhandledRejection`, killProcess)
