#!/usr/bin/env node

/**
 * validate.mjs
 *
 * Script unificado que executa todas as validações de Harness do projeto.
 * Executa os scripts de validação de linhas por arquivo e por função.
 *
 * Uso:
 *   node scripts/validate.mjs
 *
 * Ou via npm script:
 *   npm run validate
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scripts = [
  { name: 'Linhas por arquivo', file: 'validate-file-lines.mjs' },
  { name: 'Linhas por função', file: 'validate-function-lines.mjs' },
];

let hasFailures = false;

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script.file);
  try {
    const output = execSync(`node "${scriptPath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    process.stdout.write(output);
  } catch (error) {
    process.stdout.write(error.stdout || '');
    hasFailures = true;
  }
}

if (hasFailures) {
  console.log('🚨 Uma ou mais validações falharam.\n');
  process.exit(1);
} else {
  console.log('🎉 Todas as validações passaram!\n');
  process.exit(0);
}
