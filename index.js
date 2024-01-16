class ProcessManager {
  #child = undefined // current process
  #onList = [] // Store the list of listening events and restore them after the process restarts
  #initArg = [] // Store initialization parameters
  #isUserKill = false // Whether to manually terminate for the user
  #isClose = true // Whether the process has exited
  autoReStart = true // Whether to restart automatically
  autoReStartTime = 1 * 1e3 // Automatic restart interval in milliseconds
  constructor(...arg) {
    this.#initArg = arg
    this.start()
  }
  getChild() {
    return this.#child
  }
  send(data) {
    this.#isClose === false && this.#child.send(data)
  }
  on(name, fn, {save = true} = {}) {
    save && this.#onList.push({
      name,
      fn,
    })
    if(name === `message`) {
      this.#child.on(`message`, (msg) => fn(msg))
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
      })
    }
  }
  /**
   * Close child process without restarting
   * @param {string} code
   * -
   * - SIGINT -- Request to end the foreground process
   * - SIGTERM -- Background process before the request ends
   * - SIGKILL -- Forcibly end the background process
   */
  kill(code = `SIGTERM`) {
    this.#child.kill(code)
    this.#isUserKill = true
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
    if(this.#isClose === false) {
      return undefined
    }
    const init = this.#initArg[0]
    const {
      bin = process.argv[0],
      arg = [],
      autoReStart = this.autoReStart,
      autoReStartTime = this.autoReStartTime,
      stdout = process.stdout,
      stderr = process.stderr,
    } = init.length ? {arg: init} : init
    this.autoReStart = autoReStart
    this.autoReStartTime = autoReStartTime

    const { spawn } = require(`child_process`)
    const child = spawn(bin, arg, {
      stdio: [null, null, null, `ipc`],
    })
    this.#isClose = false
    this.#child = child
    this.#child.stdout.pipe(stdout)
    this.#child.stderr.pipe(stderr)
    this.#child.on(`close`, () => {
      this.#isClose = true
      this.#isUserKill === false && this.autoReStart && this.start()
      this.#isUserKill = false
    })
    this.#onList.forEach(({name, fn}) => {
      this.on(name, fn, {save: false})
    })
  }
  /**
   * close the program and start it again
   * @param {number} time
   */
  reboot(time = this.autoReStartTime) {
    const autoReStartOld = this.autoReStart
    this.autoReStart = false
    this.#child.kill()
    this.#child.on(`close`, () => {
      setTimeout(() => {
        this.start()
        this.autoReStart = autoReStartOld
      }, time);
    })
  }
}
module.exports = {
  ProcessManager,
}