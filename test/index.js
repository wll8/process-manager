const {
  ProcessManager,
} = require(`../`)

const cp = new ProcessManager([`${__dirname}/child.js`])
cp.on(`close`, () => {
  console.log(`close`)
})
cp.on(`stdout`, (data) => {
  console.log(`stdout`, data)
})
cp.on(`message`, (data) => {
  console.log(`get`, data)
})
setTimeout(() => {
  cp.send(`ppdata`)
  cp.send(`text`)
  cp.send({msg: `json`})
}, 2000);

setTimeout(() => {
  cp.kill()
}, 10000);

function killProcess(...arg) {
  cp.kill()
  setTimeout(() => {
    process.exit()
  }, 1000);
}
process.on(`SIGTERM`, killProcess)
process.on(`SIGINT`, killProcess)
process.on(`uncaughtException`, killProcess)
process.on(`unhandledRejection`, killProcess)