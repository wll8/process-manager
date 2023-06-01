A simple node subroutine manager. It includes functions such as manual or automatic process restart and process communication.

## Example

```js
const { ProcessManager } = require(`@wll8/process-manager`);
const cp = new ProcessManager([`${__dirname}/child.js`, `arg`, `arg`]);
cp.send(`text`);
cp.on(`close`, () => {
  console.log(`close`);
});
```

## Use

- type: object

```js
option = {
  bin: `node`, // The first parameter of nodejs spawn
  arg: [], // The second parameter of nodejs spawn
  autoReStart: true, // Automatically restart child processes
  autoReStartTime: 1000, // Restart interval, milliseconds
};
```

- type: array

```js
option = {
  ...option,
  arg: array,
};
```

### cp.on

- message  
  Listen for messages sent by the child process

- stdout  
  Listen to stdout output

- stderr  
  Listen to stderr output

- close  
  Monitor subprocess shutdown completion

### cp.send

Send a message to the child process

### cp.kill

Close child process without restarting

### cp.start

Manually start the process

### cp.reboot

Manually kill the process and restart the process

### cp.getChild

Get the current process instance

## license

MIT
