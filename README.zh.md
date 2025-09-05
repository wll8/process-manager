# @wll8/process-manager

[English](README.md) | [简体中文](README.zh.md)

一个健壮、灵活的 Node.js 子进程管理器，提供自动重启功能、内置通信和完整的 TypeScript 支持。

## 特性

- 🚀 **简单的进程管理**: 简洁的 API 用于创建和管理子进程
- 🔄 **自动重启**: 可配置的进程退出自动重启机制
- 💬 **进程通信**: 内置 IPC 支持实现父子进程间通信
- 📡 **事件处理**: 监听 stdout、stderr、消息和关闭事件
- 🎨 **ANSI 清理**: 自动移除输出中的 ANSI 颜色代码
- 🛡️ **错误处理**: 强大的错误处理和进程清理机制
- 📝 **TypeScript 支持**: 完整的 TypeScript 支持，包含全面的类型定义
- ⚡ **流处理**: 使用 Transform 流的高级流处理

## 安装

```bash
npm install @wll8/process-manager
```

## 快速开始

### 基本用法

```typescript
import { ProcessManager } from '@wll8/process-manager'

// 创建一个简单的进程管理器
const pm = new ProcessManager({
  bin: 'node',
  arg: ['-e', 'console.log("来自子进程的问候!")'],
  autoReStart: true,
  autoReStartTime: 1000
})

// 监听子进程消息
pm.on('message', (msg) => {
  console.log('从子进程收到:', msg)
})

// 向子进程发送消息
pm.send({ type: 'greeting', data: '你好，子进程!' })
```

### 数组语法

```typescript
// 数组模式省略了前面的 node 命令，直接传递参数
// 等价于 node script.js arg1 arg2
const pm = new ProcessManager(['script.js', 'arg1', 'arg2'])

// 也可以使用 Node.js 命令行参数
// 等价于 node -e "console.log('Hello')"
const pm = new ProcessManager(['-e', 'console.log("Hello")'])

// 等价于 node --version
const pm = new ProcessManager(['--version'])
```

## API 参考

### 构造函数

```typescript
new ProcessManager(options: ProcessManagerOptions | string[])
```

#### ProcessManagerOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `bin` | `string` | `process.argv[0]` | 要运行的可执行文件 |
| `arg` | `string[]` | `[]` | 传递给可执行文件的参数 |
| `autoReStart` | `boolean` | `true` | 启用进程退出时自动重启 |
| `autoReStartTime` | `number` | `1000` | 重启前的延迟时间（毫秒） |
| `stdout` | `function` | 默认处理函数 | 自定义 stdout 处理函数 |
| `stderr` | `function` | 默认处理函数 | 自定义 stderr 处理函数 |
| `spawnOption` | `SpawnOptions` | `{}` | Node.js spawn 选项 |

### 静态方法

### 方法

#### `getChild(): ChildProcess | undefined`
返回当前子进程实例。

#### `send(data: any): void`
通过 IPC 向子进程发送数据。

```typescript
pm.send({ action: 'start', params: { delay: 1000 } })
```

#### `on(event: EventName, callback: Function, options?: { save?: boolean }): void`
监听进程事件。

**事件类型:**
- `'message'` - 来自子进程的 IPC 消息
- `'stdout'` - 标准输出数据
- `'stderr'` - 标准错误数据  
- `'close'` - 进程关闭事件

```typescript
pm.on('stdout', (data) => {
  console.log('子进程输出:', data)
})

pm.on('close', () => {
  console.log('进程已关闭')
})
```

#### `kill(signal?: KillSignal): void`
终止子进程。

```typescript
pm.kill('SIGTERM') // 优雅终止
pm.kill('SIGKILL') // 强制杀死
```

#### `start(): ChildProcess | undefined`
手动启动进程（如果已停止）。

#### `reboot(delay?: number): void`
重启进程，可选择延迟时间。

```typescript
pm.reboot(2000) // 2 秒后重启
```

#### `delStyle(str: string): string`
从字符串中移除 ANSI 转义序列。

```typescript
const cleanOutput = pm.delStyle('\x1b[31m红色文本\x1b[0m')
// 返回: "红色文本"
```

## 高级用法

### 自定义流处理器

```typescript
const pm = new ProcessManager({
  bin: 'node',
  arg: ['app.js'],
  stdout: (chunk, encoding, callback) => {
    // 自定义 stdout 处理
    console.log('自定义 stdout:', chunk.toString())
    callback(null, chunk)
  },
  stderr: (chunk, encoding, callback) => {
    // 自定义 stderr 处理
    console.error('自定义 stderr:', chunk.toString())
    callback(null, chunk)
  }
})
```

### 进程通信

**父进程:**
```typescript
const pm = new ProcessManager({
  bin: 'node',
  arg: ['child.js']
})

pm.on('message', (msg) => {
  if (msg.type === 'request') {
    pm.send({ type: 'response', data: '已处理!' })
  }
})
```

**子进程 (child.js):**
```javascript
process.on('message', (msg) => {
  if (msg.type === 'response') {
    console.log('收到响应:', msg.data)
  }
})

// 向父进程发送消息
process.send({ type: 'request', data: '需要处理' })
```

### 错误处理

```typescript
const pm = new ProcessManager({
  bin: 'node',
  arg: ['unstable-app.js'],
  autoReStart: true,
  autoReStartTime: 5000 // 等待 5 秒后重启
})

pm.on('close', () => {
  console.log('进程退出，将在 5 秒后重启...')
})

pm.on('stderr', (error) => {
  console.error('进程错误:', error)
})
```

## 使用示例

### 带自动重启的 Web 服务器

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
    console.log('✅ 服务器已就绪')
  }
})

server.on('close', () => {
  console.log('🔄 服务器崩溃，正在重启...')
})
```

### 开发文件监视器

```typescript
const watcher = new ProcessManager({
  bin: 'npx',
  arg: ['nodemon', 'app.js'],
  autoReStart: false // nodemon 自己处理重启
})

watcher.on('stdout', (data) => {
  if (data.includes('restarting')) {
    console.log('🔄 文件变更，正在重启应用...')
  }
})
```

## 测试

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 带 UI 运行测试
npm run test:ui
```

## TypeScript 支持

本包包含完整的 TypeScript 定义。所有类型均可导出：

```typescript
import { 
  ProcessManager, 
  ProcessManagerOptions, 
  EventName, 
  KillSignal 
} from '@wll8/process-manager'
```

## 系统要求

- Node.js >= 16.0.0
- TypeScript >= 4.0 (对于 TypeScript 项目)

## 许可证

MIT

## 贡献

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 更新日志

### 1.0.4
- 修复背压导致的进程假死问题
- 改进使用 Transform 流的流处理
- 增强错误处理和清理机制
- 添加全面的 TypeScript 支持
- 使用 Vitest 更新测试套件

### 1.0.3
- 输出流改进
- Bug 修复和稳定性改进

### 1.0.2
- 初始 TypeScript 迁移
- 添加类型定义
- 改进 API 一致性

## 支持

如果您遇到任何问题或有疑问，请在 GitHub 上 [提交 issue](https://github.com/wll8/process-manager/issues)。