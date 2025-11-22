export interface IBCFFrame {
  version: string;
  issuer: string;
  subject: string;
  intent: string;
  allowedActions: string[];
  durationSeconds: number;
  issuedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  signature?: string;
}
