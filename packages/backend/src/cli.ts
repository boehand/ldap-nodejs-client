#!/usr/bin/env node
import { startServer } from './api/index.js';
import { getConfig, setConfig } from './utils/config.js';
import { getLogger, createLogger } from './utils/logger.js';
import type { LdapConfig } from './types/index.js';

function printHelp() {
  console.log(`
LDAP UI - A fast and versatile LDAP editor

Usage: ldap-ui [OPTIONS]

Options:
  -h, --host HOST              Bind socket to this host [default: 127.0.0.1]
  -p, --port PORT              Bind socket to this port [default: 5000]
  -u, --ldap-url URL           LDAP connection URL [default: ldap:///]
  -b, --base-dn DN             LDAP base DN
  -l, --log-level LEVEL        Log level (trace|debug|info|warn|error|fatal) [default: info]
  --version                    Display version and exit
  --help                        Show this help and exit

Environment Variables:
  HOST                         Server host (default: 127.0.0.1)
  PORT                         Server port (default: 5000)
  LDAP_URL                     LDAP URL
  BASE_DN                      LDAP base DN
  LOG_LEVEL                    Log level
  SESSION_SECRET               Session encryption secret (default: change-me-in-production)
  SESSION_TTL                  Session TTL in ms (default: 86400000)

Examples:
  ldap-ui --port 5000
  ldap-ui --host 0.0.0.0 --ldap-url ldap://localhost:389
  ldap-ui --base-dn dc=example,dc=org --log-level debug
  `);
}

function parseArgs(): Partial<LdapConfig> {
  const args = process.argv.slice(2);
  const overrides: Partial<LdapConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        if (!overrides.host) {
          printHelp();
          process.exit(0);
        }
        break;
      case '--version':
        console.log('1.0.0');
        process.exit(0);
        break;
      case '--host':
        overrides.host = args[++i];
        break;
      case '-p':
      case '--port':
        overrides.port = parseInt(args[++i], 10);
        break;
      case '-u':
      case '--ldap-url':
        overrides.defaultLdapUrl = args[++i];
        break;
      case '-b':
      case '--base-dn':
        overrides.defaultBaseDn = args[++i];
        break;
      case '-l':
      case '--log-level':
        overrides.logLevel = args[++i];
        break;
      default:
        if (!arg.startsWith('-')) {
          console.error(`Unknown argument: ${arg}`);
          printHelp();
          process.exit(1);
        }
        break;
    }
  }

  return overrides;
}

async function main() {
  try {
    // Parse CLI arguments and merge with env vars
    const cliOverrides = parseArgs();
    const config = getConfig();
    const mergedConfig: LdapConfig = {
      ...config,
      ...cliOverrides,
    };
    setConfig(mergedConfig);

    // Create logger with potentially overridden log level
    const logger = createLogger(mergedConfig.logLevel);
    logger.info('Starting LDAP UI...');
    logger.info(`Listening on http://${mergedConfig.host}:${mergedConfig.port}`);

    await startServer(mergedConfig);
  } catch (error) {
    const logger = getLogger();
    logger.error(error, 'Fatal error');
    process.exit(1);
  }
}

main();
