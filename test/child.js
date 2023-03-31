setInterval(() => {
  console.log(`\x1b[31mred\x1b[0m`)
  process.send(`pdata`)
}, 1000);

setTimeout(() => {
  process.exit()
}, 5000);

process.on(`message`, (msg) => {
  console.log(`get`, msg, typeof(msg))
})
