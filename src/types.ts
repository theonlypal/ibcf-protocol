export interface IBCFConstraints {
  max_files?: number;
  max_runtime?: number; // seconds
  prohibited?: string[];
  notes?: string;
}

export interface IBCFFrame {
  IBCF: string; // e.g. "v0.1"
  issuer: string;
  subject: string;
  intent: string;
  allowed_actions: string[];
  constraints?: IBCFConstraints;
  duration: number; // seconds
  context_hash?: string;
  user_fingerprint?: string;
  issued_at: string; // ISO 8601
  signature: string;
}
