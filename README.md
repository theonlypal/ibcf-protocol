# IBCF Runtime

`ibcf-runtime` provides a small, focused runtime and CLI for **Intent-Bound Capability Frames (IBCF)**. Frames describe *who* issued a capability, *who* may use it, *what* intent it covers, and *which* actions are allowed inside a controlled time window. This library keeps enforcement logic separate from any particular environment, so you can wire in your own handlers for filesystem, network, or other actions.

## Installation

```bash
npm install ibcf-runtime
```

The package also ships with a CLI. You can run it directly once installed or with `npx`:

```bash
npx ibcf validate examples/simple.yaml
npx ibcf explain examples/simple.json
```

## Library usage

```ts
import { validateFrame, createRuntime, IBCFFrame } from 'ibcf-runtime';

const frame: IBCFFrame = {
  version: 'v0.1',
  issuer: 'example.com',
  subject: 'demo-user',
  intent: 'demo-intent',
  allowedActions: ['echo.message'],
  durationSeconds: 3600,
  issuedAt: new Date().toISOString(),
};

const validation = validateFrame(frame);
if (!validation.valid) {
  throw new Error(`Invalid frame: ${validation.errors.join(', ')}`);
}

const runtime = await createRuntime(frame, {
  'echo.message': async (payload) => ({ echoed: payload }),
});

const result = await runtime.run('echo.message', { text: 'hello' });
console.log(result);
```

## CLI usage

Validate a frame file (JSON or YAML) and view errors/warnings:

```bash
npx ibcf validate examples/simple.yaml
```

Explain a frame in human-readable form:

```bash
npx ibcf explain examples/simple.json
```

Exit codes:
- `0` on success (valid frame for `validate`, successful explain for `explain`)
- `1` when validation fails
- `2` on parsing or unexpected errors

## Examples

Sample frames live in [`examples/`](examples/):
- [`simple.json`](examples/simple.json)
- [`simple.yaml`](examples/simple.yaml)

You can validate them after building with:

```bash
npm run validate:examples
```

## Notes

This runtime is an early draft focused on structural validation and policy enforcement. It does **not** yet perform cryptographic verification of `signature` fields or invoke any real side effects. Wire the provided action handlers to your own environment to connect capabilities to real operations.
