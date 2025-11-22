#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { validateFrame } from './validate';
import { IBCFFrame } from './types';

function loadFrame(filePath: string): IBCFFrame {
  const raw = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();

  let parsed: unknown;
  if (ext === '.yaml' || ext === '.yml') {
    parsed = yaml.load(raw);
  } else if (ext === '.json') {
    parsed = JSON.parse(raw);
  } else {
    throw new Error(`Unsupported file extension: ${ext || '(none)'}`);
  }

  const result = validateFrame(parsed);
  if (!result.valid) {
    const message = ['Invalid frame:', ...result.errors].join('\n- ');
    throw new Error(message);
  }

  return parsed as IBCFFrame;
}

function printValidationOutcome(framePath: string, validation: ReturnType<typeof validateFrame>) {
  const status = validation.valid ? 'VALID' : 'INVALID';
  console.log(status);

  if (validation.errors.length) {
    console.log('Errors:');
    validation.errors.forEach((err) => console.log(`- ${err}`));
  }

  if (validation.warnings.length) {
    console.log('Warnings:');
    validation.warnings.forEach((warning) => console.log(`- ${warning}`));
  }
}

function describeFrame(frame: IBCFFrame) {
  console.log(`Issuer: ${frame.issuer}`);
  console.log(`Subject: ${frame.subject}`);
  console.log(`Intent: ${frame.intent}`);
  console.log(`Allowed actions: ${frame.allowedActions.join(', ') || '(none)'}`);
  console.log(`Issued at: ${frame.issuedAt}`);
  const expires = frame.expiresAt || `+${frame.durationSeconds}s after issuance`;
  console.log(`Expires at: ${expires}`);

  const risks: string[] = [];
  if (frame.allowedActions.length > 5) {
    risks.push('Frame allows many actions; review necessity.');
  }
  if (frame.durationSeconds > 60 * 60 * 24 * 7) {
    risks.push('Duration exceeds 7 days; consider shortening.');
  }
  if (!frame.expiresAt) {
    risks.push('No explicit expiresAt; relying solely on durationSeconds.');
  }

  if (risks.length) {
    console.log('Risks / Notes:');
    risks.forEach((risk) => console.log(`- ${risk}`));
  }
}

yargs(hideBin(process.argv))
  .scriptName('ibcf')
  .command(
    'validate <framePath>',
    'Validate an IBCF frame file',
    (y) => y.positional('framePath', { type: 'string', demandOption: true, describe: 'Path to frame JSON or YAML file' }),
    (args) => {
      try {
        const raw = fs.readFileSync(args.framePath as string, 'utf8');
        const ext = path.extname(args.framePath as string).toLowerCase();
        if (ext !== '.yaml' && ext !== '.yml' && ext !== '.json') {
          throw new Error(`Unsupported file extension: ${ext || '(none)'}`);
        }

        const parsed = ext === '.yaml' || ext === '.yml' ? yaml.load(raw) : JSON.parse(raw);
        const validation = validateFrame(parsed);
        printValidationOutcome(args.framePath as string, validation);
        process.exit(validation.valid ? 0 : 1);
      } catch (error) {
        console.error('Parsing or validation failed:', (error as Error).message);
        process.exit(2);
      }
    },
  )
  .command(
    'explain <framePath>',
    'Explain an IBCF frame in human-readable form',
    (y) => y.positional('framePath', { type: 'string', demandOption: true, describe: 'Path to frame JSON or YAML file' }),
    (args) => {
      try {
        const frame = loadFrame(args.framePath as string);
        describeFrame(frame);
        process.exit(0);
      } catch (error) {
        console.error('Failed to explain frame:', (error as Error).message);
        process.exit(2);
      }
    },
  )
  .demandCommand(1)
  .strict()
  .help()
  .parse();
