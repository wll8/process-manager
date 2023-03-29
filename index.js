class ProcessManager {
  #child = undefined
  #onList = []
  #initArg = []
  autoReStart = true
  autoReStartTime = 1 * 1e3
  constructor(...arg) {
    this.#initArg = arg
    this.start()
  }
  send(data) {
    this.#child.send(typeof(data) === `string` ? data : JSON.stringify(data, null, 2))
  }
  on(name, fn, {save = true} = {}) {
    save && this.#onList.push({
      name,
      fn,
    })
    if(name === `message`) {
      this.#child.on(`message`, (msg) => fn(typeof(msg) === `string` ? msg : JSON.parse(msg)))
    }
    if(name === `stdout`) {
      this.#child.stdout.on(`data`, (data) => fn(this.delStyle(String(data))))
    }
    if(name === `stderr`) {
      this.#child.stderr.on(`data`, (data) => fn(this.delStyle(String(data))))
    }
    if(name === `close`) {
      this.#child.on(`close`, () => {
        fn()
        this.autoReStart && this.reStart()
      })
    }
  }
  /**
   * @param {string} code 
   * SIGINT -- Request to end the foreground process
   * SIGTERM -- Background process before the request ends
   * SIGKILL -- Forcibly end the background process
   */
  kill(code = `SIGTERM`) {
    this.#child.kill(code)
    this.autoReStart = false
  }
  /**
   * Get unstyled terminal output
   * @returns 
   */
  delStyle(str) {
    const text = str.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gm,
      ``
    )
    return text
  }
  start() {
    const init = this.#initArg[0]
    const {
      bin = `node`,
      arg = [],
      autoReStart = this.autoReStart,
      autoReStartTime = this.autoReStartTime,
    } = init.length ? {arg: init} : init
    this.autoReStart = autoReStart
    this.autoReStartTime = autoReStartTime

    const { spawn } = require(`child_process`)
    const child = spawn(bin, arg, {
      stdio: [null, null, null, `ipc`],
    })
    this.#child = child
    this.#child.stdout.pipe(process.stdout)
    this.#child.stderr.pipe(process.stderr)
  }
  reStart() {
    setTimeout(() => {
      this.start()
      this.#onList.forEach(({name, fn}) => {
        this.on(name, fn, {save: false})
      })
    }, this.autoReStartTime);
  }
}
module.exports = {
  ProcessManager,
}