import assert from 'node:assert';
import test from 'node:test';

import { IBCFFrame } from '../src/types';
import { createRuntime } from '../src/runtime';
import { validateFrame } from '../src/validate';

test('runtime executes allowed action successfully', async () => {
  const frame: IBCFFrame = {
    version: 'v0.1',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'logging',
    allowedActions: ['log.message'],
    durationSeconds: 600,
    issuedAt: new Date().toISOString(),
  };

  const captured: unknown[] = [];
  const runtime = await createRuntime(frame, {
    'log.message': async (payload) => {
      captured.push(payload);
      return { ok: true };
    },
  });

  assert.ok(runtime);
  const result = await runtime.run('log.message', { text: 'hello' });
  assert.deepStrictEqual(result, { success: true, data: { ok: true } });
  assert.deepStrictEqual(captured, [{ text: 'hello' }]);
});

test('runtime rejects disallowed actions', async () => {
  const frame: IBCFFrame = {
    version: 'v0.1',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'logging',
    allowedActions: ['log.message'],
    durationSeconds: 600,
    issuedAt: new Date().toISOString(),
  };

  const runtime = await createRuntime(frame, {
    'log.message': async () => ({ ok: true }),
  });

  const result = await runtime.run('unknown.action', {});
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('Action not allowed'));
});

test('runtime errors when frame is expired', async () => {
  const issuedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const expiresAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const frame: IBCFFrame = {
    version: 'v0.1',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'logging',
    allowedActions: ['log.message'],
    durationSeconds: 600,
    issuedAt,
    expiresAt,
  };

  await assert.rejects(() => createRuntime(frame, { 'log.message': async () => ({}) }));
});

test('runtime validation rejects unsupported frame', async () => {
  const frame: IBCFFrame = {
    version: 'v9.9',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'logging',
    allowedActions: ['log.message'],
    durationSeconds: 600,
    issuedAt: new Date().toISOString(),
  } as IBCFFrame;

  assert.equal(validateFrame(frame).valid, false);
  await assert.rejects(() => createRuntime(frame, { 'log.message': async () => ({}) }));
});

test('runtime surfaces expired frame during execution window check', async () => {
  const issuedAt = new Date().toISOString();
  const frame: IBCFFrame = {
    version: 'v0.1',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'logging',
    allowedActions: ['log.message'],
    durationSeconds: 1,
    issuedAt,
  };

  const runtime = await createRuntime(frame, {
    'log.message': async () => ({ ok: true }),
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  const result = await runtime.run('log.message', {});
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('Frame is expired'));
});
