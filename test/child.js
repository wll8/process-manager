setTimeout(() => {
  process.exit()
}, 5 * 1e3);

process.on(`message`, (msg) => {
  process.send(`${msg}-${process.ppid}-${process.pid}`)
  process.stdout.write(`stdout`)
  process.stderr.write(`stderr`)
})
