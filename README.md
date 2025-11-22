# IBCF Protocol (Intent-Bound Capability Frames)

**Version:** v0.1 (experimental)  
**Status:** Draft  
**Author:** Rayan Pal (concept), AI-assisted drafting

---

## Overview

IBCF (Intent-Bound Capability Frames) is an **AI-native authorization primitive** designed to replace static API keys, long-lived tokens, and service accounts in AI-executed workflows.

Instead of authenticating *requests* with static secrets, IBCF binds **intent and capability** to a short-lived, self-describing capability frame that:

- Specifies **what** an agent can do
- Defines **where** it can act (environment / domain)
- Constrains **how long** it can act
- Encodes **limits** (e.g., max files, runtime, prohibitions)
- Is **ephemeral**, **verifiable**, and **portable** across AI runtimes

This repository contains:

- A human-readable specification (`spec/ibcf-v0.1.md`)
- A reference JSON/YAML format (`spec/examples`)
- A minimal TypeScript validator + CLI (`src/`)
- Examples of how an AI runtime or tool could issue and validate IBCF frames

> ⚠️ IBCF v0.1 is an experimental draft intended for discussion, prototyping, and iteration. It is **not** ready for production security use without audit and refinement.

---

## Motivation

Traditional web auth is built around:

- **Static API keys**
- **Long-lived OAuth tokens**
- **Service accounts**
- **Bearer tokens (JWTs)**

These assume:

1. A human developer configures credentials.
2. A long-running application sends predictable HTTP requests.
3. The boundary between "client" and "server" is stable.

In an AI-native world:

- Tasks are delegated dynamically to LLMs and agents.
- Execution environments (code sandboxes, browsers, containers) are ephemeral.
- Authorization should be **per-task**, **per-intent**, and **time-bounded**.
- Users do not want to manage secrets, credentials, or cloud APIs.

Static API keys are insecure, brittle, and poorly matched to this execution model.

IBCF aims to provide a **protocol-level primitive** that:

- Is easy to reason about for humans *and* models.
- Encodes **intent, scope, limits, and duration** in one object.
- Can be issued and validated by runtimes without exposing long-lived secrets.
- Scales across tools, platforms, and agent frameworks.

---

## IBCF in One Paragraph

An IBCF (Intent-Bound Capability Frame) is a short-lived, signed document that grants an agent the ability to perform a specific set of actions within a defined context for a limited duration.

It is closer to a **capability ticket** than an API key:

- It describes allowed actions (e.g., `file.write`, `generate.html`, `run.build`).
- It encodes constraints (e.g., max files, runtime, no external network).
- It binds the capability to a context (e.g., `local_project_env`).
- It carries a cryptographic signature from the issuing runtime.
- It expires automatically and cannot be reused globally as a secret.

---

## Repository Structure

```text
ibcf-protocol/
  README.md                  # This file
  spec/
    ibcf-v0.1.md             # Human-readable protocol spec
    examples/
      simple-frame.yaml      # Minimal example frame
      static-site-frame.yaml # Example for static site generation
  src/
    types.ts                 # TypeScript types for IBCF
    validate.ts              # Core validation logic
    cli.ts                   # CLI for validating frames
    index.ts                 # Library entrypoint
  package.json
  tsconfig.json
  .gitignore
  LICENSE
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Build the project

```bash
npm run build
```

### 3. Validate an example IBCF frame

```bash
npm run validate spec/examples/simple-frame.yaml
```

You should see a validation report printed to stdout.

---

## Example IBCF Frame (YAML)

```yaml
IBCF: v0.1
issuer: chatgpt-runtime
subject: "local_project_env"
intent: "static_site_generation"
allowed_actions:
  - file.write
  - file.read
  - generate.html
  - generate.css
  - run.build
constraints:
  max_files: 150
  max_runtime: 180
  prohibited:
    - network.external
duration: 300
context_hash: "82e1a94bd..."
user_fingerprint: "u_19f8d1..."
issued_at: "2025-11-21T12:00:00Z"
signature: "sig_da7fa2f..."
```

---

## CLI Usage

The minimal CLI lets you validate a frame file:

```bash
# Validate a YAML or JSON frame
npm run validate path/to/frame.yaml
```

The CLI will:

- Parse the frame
- Validate required fields and types
- Check that `duration` and `issued_at` imply the frame is still valid
- Print human-readable results

---

## Roadmap

- [ ] Refine the core spec with community feedback
- [ ] Add cryptographic signing & verification (currently stubbed)
- [ ] Define a registry of standard `intent` and `allowed_actions` values
- [ ] Implement multi-issuer support
- [ ] Provide SDKs for Node, Python, Go
- [ ] Propose an IETF-style draft for standardization

---

## License

MIT
