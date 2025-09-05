import { ChildProcess, SpawnOptions } from 'child_process'

export interface ProcessManagerOptions {
  bin?: string
  arg?: string[]
  autoReStart?: boolean
  autoReStartTime?: number
  stdout?: (chunk: Buffer, encoding: BufferEncoding, cb: (error?: Error | null, chunk?: Buffer) => void) => void
  stderr?: (chunk: Buffer, encoding: BufferEncoding, cb: (error?: Error | null, chunk?: Buffer) => void) => void
  spawnOption?: SpawnOptions
}

export interface EventListener {
  name: string
  fn: (...args: any[]) => void
}

export type EventName = 'message' | 'stdout' | 'stderr' | 'close'
export type KillSignal = 'SIGINT' | 'SIGTERM' | 'SIGKILL'

export interface ProcessManagerInterface {
  autoReStart: boolean
  autoReStartTime: number
  getChild(): ChildProcess | undefined
  send(data: any): void
  on(name: EventName, fn: (...args: any[]) => void, options?: { save?: boolean }): void
  kill(code?: KillSignal): void
  delStyle(str: string): string
  start(): ChildProcess | undefined
  reboot(time?: number): void
}