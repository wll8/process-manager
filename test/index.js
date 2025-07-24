const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const {
  ProcessManager,
} = require(`../`)

new Promise(async () => {
  const cp = new ProcessManager([`${__dirname}/child.js`])
  cp.on(`close`, () => {
    console.warn(`The child process exited`)
  })
  cp.on(`stdout`, (data) => {
    console.log(`stdout`, data)
  })
  cp.on(`stderr`, (data) => {
    console.log(`stderr`, data)
  })
  cp.on(`message`, (data) => {
    console.log(data)
  })
  setInterval(() => {
    cp.send(`mgr`)
  }, 1 * 1e3);
  
  console.log(`Reboot now, auto-restart should be inherited`)
  await sleep(2 * 1e3)
  cp.reboot(0)
  
  console.log(`Ended manually, should not restart automatically`)
  await sleep(5 * 1e3)
  cp.kill()
  
  console.log(`Manually start, resume automatically restart, should not repeat first listen event`)
  await sleep(5 * 1e3)
  cp.start()
  cp.start()
  cp.start()
  
  function killProcess(...arg) {
    console.log(`Close child process when parent process closes`)
    cp.kill()
    process.exit()
  }
  process.on(`SIGTERM`, killProcess)
  process.on(`SIGINT`, killProcess)
  process.on(`uncaughtException`, killProcess)
  process.on(`unhandledRejection`, killProcess)
})