#!/usr/bin/env node

/**
 * validate-file-lines.mjs
 *
 * Valida o número de linhas (excluindo brancas e comentários) de cada arquivo
 * .ts/.tsx nos diretórios backend/src e frontend/src.
 *
 * Limites:
 *   - Arquivo geral:                300 linhas
 *   - Componente React (pages/components): 150 linhas
 *   - Hook customizado (use*.ts/tsx):      100 linhas
 *
 * Uso:
 *   node scripts/validate-file-lines.mjs [--fix-suggestions]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ── Configuração de Limites ──────────────────────────────────────────────────

const LIMITS = {
  general: 300,
  component: 150,
  hook: 100,
};

// ── Utilidades ───────────────────────────────────────────────────────────────

function isIgnoredDir(name) {
  return ['node_modules', 'dist', '.git', 'temp-clones'].includes(name);
}

function isTargetFile(filePath) {
  return /\.(ts|tsx)$/.test(filePath);
}

function collectFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (isIgnoredDir(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, files);
    } else if (isTargetFile(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// ── Contagem de Linhas ───────────────────────────────────────────────────────

function isBlankOrComment(line) {
  const trimmed = line.trim();
  if (trimmed === '') return true;
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('*')) return true;
  if (trimmed.startsWith('/*')) return true;
  return false;
}

function countEffectiveLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let count = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      continue;
    }
    if (!isBlankOrComment(line)) count++;
  }
  return { effective: count, total: lines.length };
}

// ── Classificação de Arquivo ─────────────────────────────────────────────────

function classifyFile(filePath) {
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const basename = path.basename(filePath);

  if (/^use[A-Z]/.test(basename)) return 'hook';

  const isInComponents = relativePath.includes('/components/');
  const isInPages = relativePath.includes('/pages/');
  const isTsx = basename.endsWith('.tsx');

  if (isTsx && (isInComponents || isInPages)) return 'component';

  return 'general';
}

function getLimitForType(type) {
  return LIMITS[type] ?? LIMITS.general;
}

function getLabelForType(type) {
  const labels = {
    general: 'Arquivo',
    component: 'Componente',
    hook: 'Hook',
  };
  return labels[type] ?? 'Arquivo';
}

// ── Validação ────────────────────────────────────────────────────────────────

function validateFiles(dirs) {
  const violations = [];
  const stats = { total: 0, passed: 0, failed: 0 };

  for (const dir of dirs) {
    const files = collectFiles(dir);
    for (const filePath of files) {
      stats.total++;
      const type = classifyFile(filePath);
      const limit = getLimitForType(type);
      const { effective, total } = countEffectiveLines(filePath);

      if (effective > limit) {
        stats.failed++;
        const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');
        violations.push({
          file: relative,
          type,
          effective,
          total,
          limit,
          excess: effective - limit,
        });
      } else {
        stats.passed++;
      }
    }
  }

  return { violations, stats };
}

// ── Relatório ────────────────────────────────────────────────────────────────

function printReport(violations, stats) {
  console.log('\n📏 Validação de Linhas por Arquivo');
  console.log('═'.repeat(60));
  console.log(`  Limites: Arquivo=${LIMITS.general}  Componente=${LIMITS.component}  Hook=${LIMITS.hook}`);
  console.log('─'.repeat(60));

  if (violations.length === 0) {
    console.log('\n  ✅ Todos os arquivos estão dentro dos limites!\n');
  } else {
    console.log(`\n  ❌ ${violations.length} violação(ões) encontrada(s):\n`);
    for (const v of violations) {
      const label = getLabelForType(v.type);
      console.log(`  ${label}: ${v.file}`);
      console.log(`    → ${v.effective} linhas efetivas (limite: ${v.limit}, excesso: +${v.excess})`);
      console.log('');
    }
  }

  console.log('─'.repeat(60));
  console.log(`  Total: ${stats.total}  ✅ ${stats.passed}  ❌ ${stats.failed}`);
  console.log('═'.repeat(60));
  console.log('');
}

// ── Main ─────────────────────────────────────────────────────────────────────

const dirs = [
  path.join(ROOT, 'backend', 'src'),
  path.join(ROOT, 'frontend', 'src'),
];

const { violations, stats } = validateFiles(dirs);
printReport(violations, stats);

process.exit(violations.length > 0 ? 1 : 0);
