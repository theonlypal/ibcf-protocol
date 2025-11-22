import fs from 'fs';
import path from 'path';
import { createRuntime, validateFrame, IBCFFrame } from './index';

async function main() {
  const framePath = path.join(__dirname, '..', 'examples', 'simple.json');
  const raw = fs.readFileSync(framePath, 'utf8');
  const frame = JSON.parse(raw) as IBCFFrame;

  const validation = validateFrame(frame);
  console.log('Validation result:', validation);
  if (!validation.valid) {
    throw new Error('Demo frame is invalid');
  }

  const handlers = {
    'echo.message': async (payload: unknown) => ({ echoed: payload }),
  };

  const runtime = await createRuntime(frame, handlers);
  const result = await runtime.run('echo.message', { text: 'Hello IBCF' });
  console.log('Runtime result:', result);
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
