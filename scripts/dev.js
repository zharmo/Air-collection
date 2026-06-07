const { spawn } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  { name: 'server', args: ['run', 'dev', '--prefix', 'server'] },
  { name: 'client', args: ['run', 'dev', '--prefix', 'client'] },
].map(({ name, args }) => {
  const child = spawn(npmCommand, args, {
    cwd: __dirname + '/..',
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
      stopAll();
    }
  });

  return child;
});

let stopping = false;

function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
