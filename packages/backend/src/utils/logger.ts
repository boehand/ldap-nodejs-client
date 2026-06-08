import pino from 'pino';
import pinoPretty from 'pino-pretty';

let loggerInstance: pino.Logger | null = null;

export function createLogger(level: string = 'info'): pino.Logger {
  const isDev = process.env.NODE_ENV === 'development';

  const logger = pino(
    {
      level,
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    isDev
      ? pinoPretty({
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        })
      : undefined
  );

  return logger;
}

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger(process.env.LOG_LEVEL || 'info');
  }
  return loggerInstance;
}

export function setLogger(logger: pino.Logger): void {
  loggerInstance = logger;
}

export default getLogger;
