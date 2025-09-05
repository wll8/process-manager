# @wll8/process-manager

[English](README.md) | [简体中文](README.zh.md)

A robust and flexible Node.js child process manager with automatic restart capabilities, built-in communication, and TypeScript support.

## Features

- 🚀 **Easy Process Management**: Simple API for spawning and managing child processes
- 🔄 **Automatic Restart**: Configurable automatic restart on process exit
- 💬 **Process Communication**: Built-in IPC support for parent-child communication
- 📡 **Event Handling**: Listen to stdout, stderr, messages, and close events
- 🎨 **ANSI Cleanup**: Automatic removal of ANSI color codes from output
- 🛡️ **Error Handling**: Robust error handling and process cleanup
- 📝 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- ⚡ **Stream Processing**: Advanced stream handling with Transform streams

## Installation

```bash
npm install @wll8/process-manager
```

## Quick Start

### Basic Usage

```typescript
import { ProcessManager } from '@wll8/process-manager'

// Create a simple process manager
const pm = new ProcessManager({
  bin: 'node',
  arg: ['-e', 'console.log("Hello from child process!")'],
  autoReStart: true,
  autoReStartTime: 1000
})

// Listen to messages from child process
pm.on('message', (msg) => {
  console.log('Received from child:', msg)
})

// Send message to child process
pm.send({ type: 'greeting', data: 'Hello child!' })
```

### JavaScript Files (Auto-detection)

```typescript
// Automatically detects .js/.ts/.mjs files and uses node
const pm = new ProcessManager({
  arg: ['script.js', 'arg1', 'arg2']
})

// Or use the convenient static method
const pm = ProcessManager.runJS('script.js', 'arg1', 'arg2')

// Array syntax also auto-detects JS files
const pm = new ProcessManager(['script.js', 'arg1', 'arg2'])
```

### Array Configuration

```typescript
// Alternative syntax for simple cases
const pm = new ProcessManager(['node', '-e', 'console.log("Hello!")'])
```

## API Reference

### Constructor

```typescript
new ProcessManager(options: ProcessManagerOptions | string[])
```

#### ProcessManagerOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bin` | `string` | `process.argv[0]` | Executable binary to run |
| `arg` | `string[]` | `[]` | Arguments to pass to the binary |
| `autoReStart` | `boolean` | `true` | Enable automatic restart on exit |
| `autoReStartTime` | `number` | `1000` | Delay in ms before restart |
| `stdout` | `function` | Default handler | Custom stdout handler |
| `stderr` | `function` | Default handler | Custom stderr handler |
| `spawnOption` | `SpawnOptions` | `{}` | Node.js spawn options |

### Static Methods

#### `ProcessManager.runJS(scriptPath: string, ...args: string[]): ProcessManager`
Convenient method to run JavaScript files without specifying the `node` binary.

```typescript
const pm = ProcessManager.runJS('app.js', '--port', '3000')
```

### Methods

#### `getChild(): ChildProcess | undefined`
Returns the current child process instance.

#### `send(data: any): void`
Send data to the child process via IPC.

```typescript
pm.send({ action: 'start', params: { delay: 1000 } })
```

#### `on(event: EventName, callback: Function, options?: { save?: boolean }): void`
Listen to process events.

**Events:**
- `'message'` - IPC messages from child
- `'stdout'` - Standard output data
- `'stderr'` - Standard error data  
- `'close'` - Process close event

```typescript
pm.on('stdout', (data) => {
  console.log('Child output:', data)
})

pm.on('close', () => {
  console.log('Process closed')
})
```

#### `kill(signal?: KillSignal): void`
Terminate the child process.

```typescript
pm.kill('SIGTERM') // Graceful termination
pm.kill('SIGKILL') // Force kill
```

#### `start(): ChildProcess | undefined`
Manually start the process (if stopped).

#### `reboot(delay?: number): void`
Restart the process with optional delay.

```typescript
pm.reboot(2000) // Restart after 2 seconds
```

#### `delStyle(str: string): string`
Remove ANSI escape sequences from string.

```typescript
const cleanOutput = pm.delStyle('\x1b[31mRed Text\x1b[0m')
// Returns: "Red Text"
```

## Advanced Usage

### Custom Stream Handlers

```typescript
const pm = new ProcessManager({
  bin: 'node',
  arg: ['app.js'],
  stdout: (chunk, encoding, callback) => {
    // Custom stdout processing
    console.log('Custom stdout:', chunk.toString())
    callback(null, chunk)
  },
  stderr: (chunk, encoding, callback) => {
    // Custom stderr processing
    console.error('Custom stderr:', chunk.toString())
    callback(null, chunk)
  }
})
```

### Process Communication

**Parent Process:**
```typescript
const pm = new ProcessManager({
  bin: 'node',
  arg: ['child.js']
})

pm.on('message', (msg) => {
  if (msg.type === 'request') {
    pm.send({ type: 'response', data: 'Processed!' })
  }
})
```

**Child Process (child.js):**
```javascript
process.on('message', (msg) => {
  if (msg.type === 'response') {
    console.log('Got response:', msg.data)
  }
})

// Send message to parent
process.send({ type: 'request', data: 'Need processing' })
```

### Error Handling

```typescript
const pm = new ProcessManager({
  bin: 'node',
  arg: ['unstable-app.js'],
  autoReStart: true,
  autoReStartTime: 5000 // Wait 5 seconds before restart
})

pm.on('close', () => {
  console.log('Process exited, will restart in 5 seconds...')
})

pm.on('stderr', (error) => {
  console.error('Process error:', error)
})
```

## Examples

### Web Server with Auto-Restart

```typescript
import { ProcessManager } from '@wll8/process-manager'

const server = new ProcessManager({
  bin: 'node',
  arg: ['server.js'],
  autoReStart: true,
  autoReStartTime: 2000
})

server.on('stdout', (data) => {
  if (data.includes('Server started')) {
    console.log('✅ Server is ready')
  }
})

server.on('close', () => {
  console.log('🔄 Server crashed, restarting...')
})
```

### Development File Watcher

```typescript
const watcher = new ProcessManager({
  bin: 'npx',
  arg: ['nodemon', 'app.js'],
  autoReStart: false // nodemon handles its own restart
})

watcher.on('stdout', (data) => {
  if (data.includes('restarting')) {
    console.log('🔄 File changed, restarting app...')
  }
})
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## TypeScript Support

This package includes full TypeScript definitions. All types are exported:

```typescript
import { 
  ProcessManager, 
  ProcessManagerOptions, 
  EventName, 
  KillSignal 
} from '@wll8/process-manager'
```

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 4.0 (for TypeScript projects)

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### 1.0.4
- Fixed backpressure issues causing process freezing
- Improved stream handling with Transform streams
- Enhanced error handling and cleanup
- Added comprehensive TypeScript support
- Updated test suite with Vitest

### 1.0.3
- Output stream improvements
- Bug fixes and stability improvements

### 1.0.2
- Initial TypeScript migration
- Added type definitions
- Improved API consistency

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/wll8/process-manager/issues) on GitHub.