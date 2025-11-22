# IBCF Protocol Specification v0.1 (Draft)

**Name:** IBCF (Intent-Bound Capability Frames)  
**Version:** 0.1 (experimental)  
**Status:** Draft / Not for production security use

---

## 1. Introduction

IBCF defines an **AI-native authorization primitive** for delegating capabilities to agents in a bounded, intent-scoped, and time-limited manner.

Unlike traditional API keys and service accounts, which are:

- long-lived
- detached from specific tasks
- opaque to non-experts
- difficult to rotate and audit

IBCF frames are:

- **ephemeral** – short-lived and tied to a specific task or session
- **intent-bound** – explicitly encode what the agent is allowed to do
- **contextual** – bound to a domain or environment
- **constrained** – define limits like runtime, number of files, or prohibited actions
- **self-describing** – structured for both human and LLM consumption

IBCF is designed for environments where:

- AI models act as agents that execute code or perform side effects
- execution contexts (sandboxes, containers, browsers) are short-lived
- users should not manage static credentials or secrets
- security boundaries need to be transparent and auditable

---

## 2. Terminology

- **Frame** – An IBCF document representing a capability grant.
- **Issuer** – The runtime or authority that creates and signs the frame.
- **Subject** – The environment, process, or domain to which the frame applies.
- **Agent** – The AI or process that uses the frame to perform actions.
- **Context** – High-level description of the environment and purpose of the task.
- **Duration** – Maximum validity period (in seconds) from `issued_at`.
- **Constraints** – Additional limits on the granted capabilities.

---

## 3. Frame Structure

IBCF frames are JSON/YAML objects with the following top-level fields:

| Field            | Type      | Required | Description                                      |
|------------------|-----------|----------|--------------------------------------------------|
| `IBCF`           | string    | yes      | Protocol identifier and version (e.g. `v0.1`).   |
| `issuer`         | string    | yes      | Identifier for the issuing runtime or authority. |
| `subject`        | string    | yes      | Identifier for the environment or domain.        |
| `intent`         | string    | yes      | High-level description of allowed purpose.       |
| `allowed_actions`| string[]  | yes      | List of allowed action identifiers.              |
| `constraints`    | object    | no       | Limits like file count, runtime, prohibitions.   |
| `duration`       | number    | yes      | Validity in seconds from `issued_at`.            |
| `context_hash`   | string    | no       | Hash of context/task parameters.                 |
| `user_fingerprint`| string   | no       | Pseudonymous user identifier.                    |
| `issued_at`      | string    | yes      | ISO 8601 timestamp of issuance.                  |
| `signature`      | string    | yes*     | Cryptographic signature (required in production).|

### 3.1. `allowed_actions`

`allowed_actions` is a list of short, namespaced identifiers such as:

- `file.read`
- `file.write`
- `generate.html`
- `generate.css`
- `run.build`
- `data.transform`
- `network.request.internal`

These represent the set of primitive operations the agent is permitted to perform.

### 3.2. `constraints`

`constraints` is an object that can contain:

- `max_files` (number) – Maximum number of files the agent may create/modify.
- `max_runtime` (number, seconds) – Maximum total runtime for the task.
- `prohibited` (string[]) – List of disallowed actions (same namespace as `allowed_actions`).
- `notes` (string) – Optional human-readable explanation.

Example:

```yaml
constraints:
  max_files: 150
  max_runtime: 180
  prohibited:
    - network.external
  notes: "Permit only local static site generation."
```

### 3.3. `duration` and `issued_at`

`duration` is specified in seconds.  
`issued_at` is an ISO 8601 timestamp.

Validation must ensure that:

```text
now <= issued_at + duration
```

Frames that are expired MUST be treated as invalid.

---

## 4. Validation Requirements

An implementation of IBCF validation MUST:

1. Ensure `IBCF` matches a supported protocol version (e.g. `v0.1`).
2. Validate the presence and types of required fields.
3. Reject frames that are expired based on `issued_at + duration`.
4. Optionally, validate `issuer` against a known set of authorities.
5. Optionally, verify `signature` using the issuer's public key.
6. Provide clear error messages for invalid frames.

---

## 5. Example Frames

### 5.1. Minimal Frame

```yaml
IBCF: v0.1
issuer: "local-runtime"
subject: "local_project_env"
intent: "static_site_generation"
allowed_actions:
  - file.write
  - file.read
duration: 120
issued_at: "2025-11-21T12:00:00Z"
signature: "sig_stub"
```

### 5.2. Static Site Generation Example

```yaml
IBCF: v0.1
issuer: "chatgpt-runtime"
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

## 6. Security Considerations

### 6.1. Ephemerality

Frames MUST be short-lived to reduce blast radius.  
Long-lived frames reproduce the problems of API keys.

### 6.2. Principle of Least Privilege

`allowed_actions` and `constraints` SHOULD encode the minimum necessary capabilities for a given task.

### 6.3. Signature Verification

In production deployments:

- `signature` MUST be a cryptographic signature over the frame body.
- Validators MUST verify signatures using a trusted issuer public key set.

For prototyping and local experimentation, `signature` may be a stub.

---

## 7. Versioning

The `IBCF` field encodes the protocol version (`v0.1`, `v1.0`, etc.).

Validators SHOULD:

- Reject unsupported versions.
- Optionally support multiple versions via adapters.

---

## 8. Future Work

- Formal cryptographic signing spec
- Structured `intent` taxonomy
- Machine-readable registry of actions
- Delegation between agents (sub-frames)
- Cross-runtime interoperability tests
- Standardization via relevant bodies (e.g., IETF-style draft)
