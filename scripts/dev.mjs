import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = []

function spawnProcess(command, args, env) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  })

  children.push(child)

  child.on('exit', (code) => {
    if (code !== 0) {
      process.exitCode = code ?? 1
      shutdown()
    }
  })

  return child
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

spawnProcess('node', ['server/index.mjs'], {
  NODE_ENV: 'development',
  HOST: '127.0.0.1',
  PORT: '8787',
})

spawnProcess(npmCommand, ['run', 'dev:client', '--', '--host', '127.0.0.1'], {})
