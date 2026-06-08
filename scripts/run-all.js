#!/usr/bin/env node

/**
 * Run npm scripts across all workspaces
 * Usage: node scripts/run-all.js <script-name>
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const script = process.argv[2];

if (!script) {
  console.error('Usage: node scripts/run-all.js <script-name>');
  console.error('Example: node scripts/run-all.js build');
  process.exit(1);
}

const workspaces = ['packages/backend', 'packages/frontend'];

console.log(`\n🚀 Running "${script}" in all workspaces...\n`);

let failed = false;

for (const workspace of workspaces) {
  console.log(`📦 ${workspace}:`);
  try {
    execSync(`npm --workspace ${workspace} run ${script}`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log();
  } catch (error) {
    console.error(`❌ Failed in ${workspace}\n`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`✅ Completed "${script}" in all workspaces\n`);
