import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('an occupied API port fails startup instead of announcing a running server', { timeout: 120000 }, async () => {
  const blocker = createServer();
  // Match the API's wildcard bind; Windows can allow a loopback-only and wildcard listener on one port.
  await new Promise((resolve) => blocker.listen(0, '0.0.0.0', resolve));
  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, PORT: String(blocker.address().port), DATABASE_URL: 'postgresql://qa:qa@127.0.0.1:1/qa', DIRECT_URL: 'postgresql://qa:qa@127.0.0.1:1/qa' },
    windowsHide: true,
  });
  let stdout = '', stderr = '';
  child.stdout.on('data', (data) => { stdout += data; });
  child.stderr.on('data', (data) => { stderr += data; });
  // This checks binding correctness, not module cold-start performance on the shared Windows host.
  const timer = setTimeout(() => child.kill(), 110000);
  try {
    const code = await new Promise((resolve) => child.once('exit', resolve));
    assert.equal(code, 1, `stdout=${stdout.slice(-800)} stderr=${stderr.slice(-800)}`);
    assert.match(stderr, /EADDRINUSE/);
    assert.doesNotMatch(stdout, /API running on port/);
  } finally { clearTimeout(timer); child.kill(); await new Promise((resolve) => blocker.close(resolve)); }
});
