import { IBCFFrame } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate basic structure and temporal validity of an IBCF frame.
 * NOTE: Cryptographic signature verification is intentionally out-of-scope
 * for this reference implementation and should be added in production.
 */
export function validateIBCFFrame(frame: any, now: Date = new Date()): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic shape checks
  if (!frame || typeof frame !== 'object') {
    return { valid: false, errors: ['Frame is not an object'], warnings };
  }

  const requiredFields: (keyof IBCFFrame)[] = [
    'IBCF',
    'issuer',
    'subject',
    'intent',
    'allowed_actions',
    'duration',
    'issued_at',
    'signature',
  ];

  for (const field of requiredFields) {
    if (frame[field] === undefined || frame[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof frame.IBCF !== 'string') {
    errors.push('IBCF must be a string (e.g. "v0.1")');
  } else if (!frame.IBCF.startsWith('v0.')) {
    warnings.push(`Unsupported or unknown IBCF version: ${frame.IBCF}`);
  }

  if (!Array.isArray(frame.allowed_actions)) {
    errors.push('allowed_actions must be an array of strings');
  }

  if (typeof frame.duration !== 'number' || frame.duration <= 0) {
    errors.push('duration must be a positive number (seconds)');
  }

  // Time validity
  if (typeof frame.issued_at === 'string') {
    const issued = new Date(frame.issued_at);
    if (isNaN(issued.getTime())) {
      errors.push('issued_at must be a valid ISO 8601 timestamp');
    } else {
      const expires = new Date(issued.getTime() + frame.duration * 1000);
      if (now > expires) {
        errors.push('Frame is expired');
      }
    }
  }

  // Constraints sanity checks
  if (frame.constraints) {
    const c = frame.constraints;
    if (c.max_files !== undefined && (typeof c.max_files !== 'number' || c.max_files <= 0)) {
      errors.push('constraints.max_files must be a positive number if provided');
    }
    if (c.max_runtime !== undefined && (typeof c.max_runtime !== 'number' || c.max_runtime <= 0)) {
      errors.push('constraints.max_runtime must be a positive number if provided');
    }
    if (c.prohibited && !Array.isArray(c.prohibited)) {
      errors.push('constraints.prohibited must be an array of strings if provided');
    }
  }

  // Signature sanity check (placeholder)
  if (typeof frame.signature !== 'string' || frame.signature.length === 0) {
    errors.push('signature must be a non-empty string');
  } else {
    warnings.push('Signature is not cryptographically verified in this reference implementation');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
