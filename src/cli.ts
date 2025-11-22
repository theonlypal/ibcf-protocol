#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { validateIBCFFrame } from './validate';

function loadFrame(filePath: string): any {
  const raw = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') {
    return yaml.load(raw);
  }
  if (ext === '.json') {
    return JSON.parse(raw);
  }
  throw new Error(`Unsupported file extension: ${ext}. Use .yaml, .yml, or .json`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: npm run validate <path-to-frame.(yaml|yml|json)>');
    process.exit(1);
  }

  const filePath = args[0];

  try {
    const frame = loadFrame(filePath);
    const result = validateIBCFFrame(frame);
    console.log(`Valid: ${result.valid}`);
    if (result.errors.length) {
      console.log('\nErrors:');
      for (const e of result.errors) {
        console.log(`  - ${e}`);
      }
    }
    if (result.warnings.length) {
      console.log('\nWarnings:');
      for (const w of result.warnings) {
        console.log(`  - ${w}`);
      }
    }
    process.exit(result.valid ? 0 : 1);
  } catch (err: any) {
    console.error('Failed to validate frame:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
