import { IBCFFrame } from './types';
import { validateFrame } from './validate';

type ActionHandler = (payload: unknown) => Promise<unknown>;
export type ActionHandlers = Record<string, ActionHandler>;

export interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function createRuntime(frame: IBCFFrame, handlers: ActionHandlers) {
  const validation = validateFrame(frame);
  if (!validation.valid) {
    throw new Error(`Invalid frame: ${validation.errors.join('; ')}`);
  }

  const issued = new Date(frame.issuedAt);
  const now = new Date();
  if (Number.isNaN(issued.getTime())) {
    throw new Error('issuedAt is not a valid date');
  }

  const expires = frame.expiresAt ? new Date(frame.expiresAt) : new Date(issued.getTime() + frame.durationSeconds * 1000);
  if (Number.isNaN(expires.getTime())) {
    throw new Error('expiresAt is not a valid date');
  }

  if (now < issued) {
    throw new Error('Frame is not yet active');
  }

  if (now > expires) {
    throw new Error('Frame is expired');
  }

  async function run(action: string, payload: unknown): Promise<ExecutionResult> {
    if (!frame.allowedActions.includes(action)) {
      return { success: false, error: 'Action not allowed' };
    }

    const handler = handlers[action];
    if (!handler) {
      return { success: false, error: 'No handler registered' };
    }

    const nowTime = new Date();
    if (nowTime < issued) {
      return { success: false, error: 'Frame is not yet active' };
    }
    if (nowTime > expires) {
      return { success: false, error: 'Frame is expired' };
    }

    try {
      const data = await handler(payload);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  return { frame, run };
}

export type { ActionHandler };
