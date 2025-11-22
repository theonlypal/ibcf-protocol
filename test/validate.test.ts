import assert from 'node:assert';
import test from 'node:test';

import { IBCFFrame } from '../src/types';
import { validateFrame } from '../src/validate';

test('valid minimal frame passes validation', () => {
  const frame: IBCFFrame = {
    version: 'v0.1',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'demo',
    allowedActions: ['log.message'],
    durationSeconds: 60,
    issuedAt: new Date().toISOString(),
  };

  const result = validateFrame(frame);
  assert.equal(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

test('missing required fields fails validation', () => {
  const incomplete = {} as unknown;
  const result = validateFrame(incomplete);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((msg) => msg.includes('version')));
  assert.ok(result.errors.some((msg) => msg.includes('issuer')));
  assert.ok(result.errors.some((msg) => msg.includes('subject')));
  assert.ok(result.errors.some((msg) => msg.includes('intent')));
  assert.ok(result.errors.some((msg) => msg.includes('allowedActions')));
  assert.ok(result.errors.some((msg) => msg.includes('durationSeconds')));
  assert.ok(result.errors.some((msg) => msg.includes('issuedAt')));
});

test('invalid date formats are rejected', () => {
  const frame = {
    version: 'v0.1',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'demo',
    allowedActions: ['log.message'],
    durationSeconds: 60,
    issuedAt: 'not-a-date',
    expiresAt: 'also-not-a-date',
  };

  const result = validateFrame(frame);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((msg) => msg.includes('issuedAt')));
  assert.ok(result.errors.some((msg) => msg.includes('expiresAt')));
});

test('expiresAt before issuedAt fails validation', () => {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() - 1000).toISOString();

  const frame = {
    version: 'v0.1',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'demo',
    allowedActions: ['log.message'],
    durationSeconds: 60,
    issuedAt,
    expiresAt,
  };

  const result = validateFrame(frame);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((msg) => msg.includes('expiresAt')));
});

test('unsupported version fails validation', () => {
  const frame = {
    version: 'v9.9',
    issuer: 'issuer.test',
    subject: 'subject.test',
    intent: 'demo',
    allowedActions: ['log.message'],
    durationSeconds: 60,
    issuedAt: new Date().toISOString(),
  };

  const result = validateFrame(frame);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((msg) => msg.includes('not supported')));
});
