/**
 * logger.js
 * ---------
 * Minimal leveled logger. In a real deployment you'd swap this for
 * winston/pino writing structured JSON to stdout for log aggregation --
 * the interface (info/warn/error) is kept the same so that swap is a
 * one-file change.
 */

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (msg) => console.log(`[${timestamp()}] INFO  ${msg}`),
  warn: (msg) => console.warn(`[${timestamp()}] WARN  ${msg}`),
  error: (msg) => console.error(`[${timestamp()}] ERROR ${msg}`),
};

module.exports = logger;
