#!/usr/bin/env node

/**
 * Interactive setup wizard for LDAP UI
 * Helps configure backend and frontend
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔧 LDAP UI - Setup Wizard\n');
  console.log('This wizard will help you configure LDAP UI for your environment.\n');

  // Backend Configuration
  console.log('--- Backend Configuration ---\n');

  const ldapUrl =
    (await question('LDAP Server URL (default: ldap://localhost:389): ')) ||
    'ldap://localhost:389';

  const baseDn =
    (await question('LDAP Base DN (e.g., dc=example,dc=org): ')) ||
    'dc=example,dc=org';

  const loginAttr =
    (await question('Login attribute (default: uid): ')) || 'uid';

  const host =
    (await question('Server listen host (default: 127.0.0.1): ')) ||
    '127.0.0.1';

  const port = (await question('Server listen port (default: 5000): ')) || 5000;

  const sessionSecret =
    (await question(
      'Session secret (press Enter to generate random): '
    )) || generateSecret();

  // Frontend Configuration
  console.log('\n--- Frontend Configuration ---\n');

  const defaultLdapUrl =
    (await question(
      `Default LDAP URL in login (default: ${ldapUrl}): `
    )) || ldapUrl;

  const appTitle =
    (await question('App title (default: LDAP UI): ')) || 'LDAP UI';

  // Write configurations
  console.log('\n📝 Writing configuration files...\n');

  const backendEnv = `# LDAP Connection
LDAP_URL=${ldapUrl}
BASE_DN=${baseDn}
LOGIN_ATTR=${loginAttr}

# Server
HOST=${host}
PORT=${port}
NODE_ENV=development

# Security
SESSION_SECRET=${sessionSecret}
SESSION_TTL=86400000

# Logging
LOG_LEVEL=info
`;

  const frontendEnv = `# Backend API
VITE_API_BASE=/api

# Default LDAP URL
VITE_DEFAULT_LDAP_URL=${defaultLdapUrl}

# App title
VITE_APP_TITLE=${appTitle}
`;

  const backendEnvPath = path.join(rootDir, 'packages/backend/.env');
  const frontendEnvPath = path.join(rootDir, 'packages/frontend/.env');

  fs.writeFileSync(backendEnvPath, backendEnv);
  console.log('✓ Created packages/backend/.env');

  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log('✓ Created packages/frontend/.env');

  console.log('\n✨ Setup complete!\n');
  console.log('Quick start commands:');
  console.log('  Development:');
  console.log('    pnpm dev\n');
  console.log('  Production build:');
  console.log('    pnpm build\n');
  console.log('  Start production:');
  console.log('    npm start\n');

  rl.close();
}

function generateSecret() {
  return Math.random().toString(36).substring(2, 34).padEnd(32, '0');
}

main().catch((error) => {
  console.error('Setup error:', error);
  process.exit(1);
});
