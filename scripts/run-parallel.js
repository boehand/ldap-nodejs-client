#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const script = process.argv[2];

if (!script) {
  console.error('Usage: node scripts/run-parallel.js <script-name>');
  process.exit(1);
}

const workspaces = [
  { name: 'backend', path: 'packages/backend', color: '\x1b[36m' },
  { name: 'frontend', path: 'packages/frontend', color: '\x1b[35m' },
];
const reset = '\x1b[0m';

console.log(`\n  Running "${script}" in all workspaces (parallel)...\n`);

const children = workspaces.map(({ name, path: wsPath, color }) => {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npm.cmd' : 'npm';
  const child = spawn(cmd, ['--workspace', wsPath, 'run', script], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const prefix = `${color}[${name}]${reset} `;

  child.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line) process.stdout.write(`${prefix}${line}\n`);
    }
  });

  child.stderr.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line) process.stderr.write(`${prefix}${line}\n`);
    }
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${prefix}exited with code ${code}`);
    }
  });

  return child;
});

function cleanup() {
  for (const child of children) {
    child.kill();
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
