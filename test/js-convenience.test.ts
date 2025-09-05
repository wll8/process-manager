import { describe, it, expect, afterEach } from 'vitest'
import { ProcessManager } from '../src'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

describe('JavaScript 便捷运行测试', () => {
  let pm: ProcessManager
  const testScriptPath = join(__dirname, 'temp-script.js')

  afterEach(() => {
    if (pm) {
      pm.kill('SIGKILL')
    }
    try {
      unlinkSync(testScriptPath)
    } catch {}
  })

  it('应该能够自动识别 .js 文件并使用 node 运行', async () => {
    // 创建临时测试脚本
    writeFileSync(testScriptPath, `
      console.log('Hello from auto JS runner');
      setTimeout(() => process.exit(0), 100);
    `)

    pm = new ProcessManager({
      arg: [testScriptPath],
      autoReStart: false
    })

    expect(pm).toBeInstanceOf(ProcessManager)
    expect(pm.getChild()).toBeDefined()
  })

  it('应该能够使用 runJS 静态方法运行 JS 文件', async () => {
    // 创建临时测试脚本
    writeFileSync(testScriptPath, `
      console.log('Hello from runJS method');
      setTimeout(() => process.exit(0), 100);
    `)

    pm = ProcessManager.runJS(testScriptPath)

    expect(pm).toBeInstanceOf(ProcessManager)
    expect(pm.getChild()).toBeDefined()
  })

  it('应该能够使用数组语法自动运行 JS 文件', async () => {
    // 创建临时测试脚本
    writeFileSync(testScriptPath, `
      console.log('Hello from array syntax');
      setTimeout(() => process.exit(0), 100);
    `)

    pm = new ProcessManager([testScriptPath, 'arg1', 'arg2'])

    expect(pm).toBeInstanceOf(ProcessManager)
    expect(pm.getChild()).toBeDefined()
  })

  it('runJS 方法应该能够传递参数', async () => {
    // 创建临时测试脚本
    writeFileSync(testScriptPath, `
      console.log('Arguments:', process.argv.slice(2));
      setTimeout(() => process.exit(0), 100);
    `)

    pm = ProcessManager.runJS(testScriptPath, 'test-arg1', 'test-arg2')

    return new Promise<void>((resolve) => {
      let output = ''
      pm.on('stdout', (data) => {
        output += data
      })

      pm.on('close', () => {
        expect(output).toContain('test-arg1')
        expect(output).toContain('test-arg2')
        resolve()
      })
    })
  })
})