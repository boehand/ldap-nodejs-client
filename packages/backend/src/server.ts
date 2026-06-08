#!/usr/bin/env node
import { startServer } from './api/index.js';
import { getConfig } from './utils/config.js';
import { getLogger } from './utils/logger.js';

async function main() {
  try {
    const config = getConfig();
    const logger = getLogger();

    logger.info('Starting LDAP UI server...');
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Log level: ${config.logLevel}`);

    await startServer(config);
  } catch (error) {
    const logger = getLogger();
    logger.error(error, 'Fatal error');
    process.exit(1);
  }
}

main();
