const LEVEL_COLOURS = {
  info: '\u001B[36m',
  warn: '\u001B[33m',
  error: '\u001B[31m',
  debug: '\u001B[90m',
}
const RESET = '\u001B[0m'

function write(level, message) {
  const stamp = new Date().toISOString()
  const colour = LEVEL_COLOURS[level] ?? ''
  const line = `${stamp} ${colour}${level.toUpperCase().padEnd(5)}${RESET} ${message}`
  if (level === 'error') process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
}

export const logger = {
  info: (message) => write('info', message),
  warn: (message) => write('warn', message),
  error: (message) => write('error', message),
  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') write('debug', message)
  },
}
