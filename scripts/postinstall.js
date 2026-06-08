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

try {
  // Check if this is a fresh install (node_modules exists but dist doesn't)
  const hasNodeModules = fs.existsSync(path.join(rootDir, 'node_modules'));
  const backendHasDist = fs.existsSync(path.join(rootDir, 'packages/backend/dist'));

  if (!hasNodeModules || !backendHasDist) {
    console.log('📦 Building packages...\n');

    try {
      execSync('pnpm build', { cwd: rootDir, stdio: 'inherit' });
      console.log('\n✅ Build complete!\n');
    } catch (error) {
      console.error('⚠️  Build failed. You can try running:');
      console.error('   pnpm build\n');
      process.exit(1);
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
  console.log('     pnpm dev\n');
  console.log('  3. Or build for production:');
  console.log('     pnpm build\n');
} catch (error) {
  console.error('Setup error:', error.message);
  process.exit(1);
}
