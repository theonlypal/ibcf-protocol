# IBCF Runtime

IBCF Runtime is a TypeScript/Node.js library and CLI for validating and enforcing intent-bound capability frames. Use it to define what an agent is allowed to do, for how long, and with which actions.

## Installation

```bash
npm install ibcf-runtime
```

The package ships with a CLI entrypoint:

```bash
npx ibcf validate path/to/frame.yaml
npx ibcf explain path/to/frame.json
```

## Frame format

Frames describe who issued a capability, who may use it, what intent it covers, and which actions are permitted in a bounded window.

- `version` (string): Supported versions are currently `v0.1`.
- `issuer` (string): Entity that granted the capability.
- `subject` (string): Entity allowed to exercise the capability.
- `intent` (string): High-level purpose of the frame.
- `allowedActions` (string[]): Whitelisted action names.
- `durationSeconds` (number): Lifetime after `issuedAt` when no explicit `expiresAt` is provided.
- `issuedAt` (ISO 8601 string): Time the frame becomes active.
- `expiresAt` (ISO 8601 string, optional): Absolute expiry time.
- `metadata` (object, optional): Arbitrary contextual data.
- `signature` (string, optional): Placeholder for external verification.

## Library usage

```ts
import { createRuntime, validateFrame, IBCFFrame } from 'ibcf-runtime';

const frame: IBCFFrame = {
  version: 'v0.1',
  issuer: 'example.com',
  subject: 'agent-123',
  intent: 'logging',
  allowedActions: ['log.message'],
  durationSeconds: 300,
  issuedAt: new Date().toISOString(),
};

const validation = validateFrame(frame);
if (!validation.valid) {
  throw new Error(validation.errors.join(', '));
}

const runtime = await createRuntime(frame, {
  'log.message': async (payload) => {
    console.log('log.message payload', payload);
    return { ok: true };
  },
});

const result = await runtime.run('log.message', { text: 'hello world' });
console.log(result);
```

## CLI usage

Validate a frame and surface any errors or warnings:

```bash
npx ibcf validate examples/simple.yaml
```

Explain a frame in human-readable form:

```bash
npx ibcf explain examples/simple.json
```

Exit codes:

- `0` on success
- `1` when validation fails
- `2` on parsing or unexpected errors

## Status

v0.1 and evolving. This library focuses on structural and temporal validation and on enforcing action lists. It does not implement cryptographic signature verification or full security hardening; integrate it alongside your own authentication, authorization, and threat-model controls.
