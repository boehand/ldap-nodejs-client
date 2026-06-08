#!/usr/bin/env node

/**
 * Post-install hook
 * Runs after npm/pnpm install to build the project
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('\n🔧 LDAP UI - Post-install Setup\n');

// Detect which package manager is being used
function getPackageManager() {
  const npmVersion = process.env.npm_config_user_agent;
  if (npmVersion && npmVersion.includes('pnpm')) {
    return 'pnpm';
  }
  if (npmVersion && npmVersion.includes('yarn')) {
    return 'yarn';
  }
  return 'npm';
}

const pm = getPackageManager();
console.log(`📦 Using package manager: ${pm}\n`);

try {
  // Check if this is a fresh install (node_modules exists but dist doesn't)
  const hasNodeModules = fs.existsSync(path.join(rootDir, 'node_modules'));
  const backendHasDist = fs.existsSync(path.join(rootDir, 'packages/backend/dist'));

  if (!hasNodeModules || !backendHasDist) {
    console.log('📦 Building packages...\n');

    try {
      const buildCmd = pm === 'pnpm' ? 'pnpm build' : 'npm run build';
      execSync(buildCmd, { cwd: rootDir, stdio: 'inherit' });
      console.log('\n✅ Build complete!\n');
    } catch (error) {
      console.error('⚠️  Build failed. You can try running:');
      console.error(`   ${pm} ${pm === 'pnpm' ? 'build' : 'run build'}\n`);
      process.exit(0); // Don't fail installation, just warn
    }
  }

  // Create .env files if they don't exist
  const backendEnv = path.join(rootDir, 'packages/backend/.env');
  const frontendEnv = path.join(rootDir, 'packages/frontend/.env');

  if (!fs.existsSync(backendEnv)) {
    const exampleEnv = path.join(rootDir, 'packages/backend/.env.example');
    if (fs.existsSync(exampleEnv)) {
      fs.copyFileSync(exampleEnv, backendEnv);
      console.log('✓ Created packages/backend/.env (from template)');
    }
  }

  if (!fs.existsSync(frontendEnv)) {
    const exampleEnv = path.join(rootDir, 'packages/frontend/.env.example');
    if (fs.existsSync(exampleEnv)) {
      fs.copyFileSync(exampleEnv, frontendEnv);
      console.log('✓ Created packages/frontend/.env (from template)');
    }
  }

  console.log('\n✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Edit configuration (optional):');
  console.log('     - packages/backend/.env');
  console.log('     - packages/frontend/.env\n');
  console.log('  2. Start development:');
  console.log(`     ${pm} ${pm === 'pnpm' ? 'dev' : 'run dev'}\n`);
  console.log('  3. Or build for production:');
  console.log(`     ${pm} ${pm === 'pnpm' ? 'build' : 'run build'}\n`);
} catch (error) {
  console.error('Setup error:', error.message);
  // Don't exit with error code - let npm installation complete
  process.exit(0);
}

