/**
 * Structured logger utility with timestamps and log levels.
 * Never outputs sensitive credentials or raw secrets.
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = process.env.LOG_LEVEL || 'info';

/**
 * Formats and prints a structured JSON log message.
 * @param {'debug' | 'info' | 'warn' | 'error'} level - Log severity level
 * @param {string} msg - Primary log message
 * @param {Record<string, unknown>} [meta={}] - Additional context metadata
 */
function log(level, msg, meta = {}) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta
  };

  // Safe serialization omitting any accidental auth keys
  const sanitized = JSON.stringify(payload, (key, value) => {
    if (/key|secret|token|auth/i.test(key) && typeof value === 'string') {
      return '[REDACTED]';
    }
    return value;
  });

  if (level === 'error') {
    process.stderr.write(sanitized + '\n');
  } else {
    process.stdout.write(sanitized + '\n');
  }
}

/** Logs debug messages with context */
export const debug = (msg, meta) => log('debug', msg, meta);

/** Logs informational messages with context */
export const info = (msg, meta) => log('info', msg, meta);

/** Logs warning messages with context */
export const warn = (msg, meta) => log('warn', msg, meta);

/** Logs error messages with context */
export const error = (msg, meta) => log('error', msg, meta);

export default { debug, info, warn, error };
