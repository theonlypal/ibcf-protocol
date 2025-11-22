import { IBCFFrame } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const SUPPORTED_VERSIONS = new Set(['v0.1']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateFrame(frame: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(frame)) {
    return { valid: false, errors: ['Frame must be an object'], warnings };
  }

  const {
    version,
    issuer,
    subject,
    intent,
    allowedActions,
    durationSeconds,
    issuedAt,
    expiresAt,
    metadata,
    signature,
  } = frame as Partial<IBCFFrame>;

  if (typeof version !== 'string') {
    errors.push('version is required and must be a string');
  } else if (!SUPPORTED_VERSIONS.has(version)) {
    errors.push(`version ${version} is not supported`);
  }

  if (typeof issuer !== 'string' || issuer.trim() === '') {
    errors.push('issuer is required and must be a non-empty string');
  }

  if (typeof subject !== 'string' || subject.trim() === '') {
    errors.push('subject is required and must be a non-empty string');
  }

  if (typeof intent !== 'string' || intent.trim() === '') {
    errors.push('intent is required and must be a non-empty string');
  }

  if (!Array.isArray(allowedActions)) {
    errors.push('allowedActions is required and must be an array of strings');
  } else if (allowedActions.some((action) => typeof action !== 'string' || action.trim() === '')) {
    errors.push('allowedActions must only contain non-empty strings');
  } else if (allowedActions.length === 0) {
    warnings.push('allowedActions is empty; no actions can be executed');
  }

  if (typeof durationSeconds !== 'number' || Number.isNaN(durationSeconds)) {
    errors.push('durationSeconds is required and must be a number');
  } else if (durationSeconds <= 0) {
    errors.push('durationSeconds must be greater than zero');
  } else if (durationSeconds > 60 * 60 * 24 * 30) {
    warnings.push('durationSeconds exceeds 30 days; consider shortening the frame lifetime');
  }

  let issuedDate: Date | null = null;
  if (typeof issuedAt !== 'string') {
    errors.push('issuedAt is required and must be an ISO8601 string');
  } else {
    issuedDate = new Date(issuedAt);
    if (Number.isNaN(issuedDate.getTime())) {
      errors.push('issuedAt must be a valid ISO8601 date');
      issuedDate = null;
    }
  }

  if (expiresAt !== undefined) {
    if (typeof expiresAt !== 'string') {
      errors.push('expiresAt must be an ISO8601 string when provided');
    } else {
      const expiresDate = new Date(expiresAt);
      if (Number.isNaN(expiresDate.getTime())) {
        errors.push('expiresAt must be a valid ISO8601 date');
      } else if (issuedDate && expiresDate <= issuedDate) {
        errors.push('expiresAt must be later than issuedAt');
      }
    }
  }

  if (metadata !== undefined && !isRecord(metadata)) {
    errors.push('metadata, if provided, must be an object');
  }

  if (signature !== undefined && typeof signature !== 'string') {
    errors.push('signature, if provided, must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
