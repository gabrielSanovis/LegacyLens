#!/usr/bin/env node

/**
 * validate-function-lines.mjs
 *
 * Valida o número de linhas (excluindo brancas e comentários) de cada função
 * em arquivos .ts/.tsx nos diretórios backend/src e frontend/src.
 *
 * Usa contagem baseada em chaves (brace-counting) para detectar funções,
 * métodos de classe, arrow functions e componentes React.
 *
 * Limites:
 *   - Função / método geral:  30 linhas
 *   - Componente React:       50 linhas (JSX tende a ser mais verboso)
 *   - Hook customizado:       30 linhas
 *
 * Uso:
 *   node scripts/validate-function-lines.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ── Configuração ─────────────────────────────────────────────────────────────

const LIMITS = {
  function: 30,
  component: 50,
  hook: 30,
};

// ── Utilidades ───────────────────────────────────────────────────────────────

function isIgnoredDir(name) {
  return ['node_modules', 'dist', '.git', 'temp-clones'].includes(name);
}

function collectFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (isIgnoredDir(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// ── Detecção de Funções ──────────────────────────────────────────────────────

/**
 * Detecta declarações de funções via regex e retorna informações sobre
 * cada uma (nome, linha, tipo).
 *
 * Patterns detectados:
 *   - function nome(...)
 *   - function* nome(...)
 *   - async function nome(...)
 *   - const/let nome = (...) => ...
 *   - const/let nome = async (...) => ...
 *   - nome(...) { ... }  (métodos de classe)
 *   - async nome(...) { ... }  (métodos async de classe)
 *   - private/protected/public nome(...) (métodos TS)
 */

const FUNCTION_PATTERNS = [
  // function declarations: function nome() / async function nome()
  {
    regex: /^[ \t]*(?:export\s+)?(?:async\s+)?function\*?\s+(\w+)\s*\(/,
    nameGroup: 1,
    type: 'function',
  },
  // class methods: nome(...) { / async nome(...) { / private nome(...)
  {
    regex: /^[ \t]*(?:private|protected|public)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\S+\s*)?{/,
    nameGroup: 1,
    type: 'method',
  },
];

// Regex separado para arrow functions — requer `=>` na mesma linha
const ARROW_REGEX = /^[ \t]*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(?[^)]*\)?\s*(?::\s*[^=]+)?\s*=>/;

// Regex para arrow com parâmetros multi-linha (detecta na linha do `const`)
const ARROW_MULTILINE_REGEX = /^[ \t]*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/;

function isArrowFunctionMultiline(lines, startIndex) {
  // Procura `=>` nas próximas 5 linhas após a abertura do parêntese
  const maxLookahead = Math.min(startIndex + 5, lines.length);
  for (let j = startIndex; j < maxLookahead; j++) {
    if (lines[j].includes('=>')) return true;
    // Se encontrar `;` antes de `=>`, é uma atribuição normal
    if (lines[j].includes(';') && !lines[j].includes('=>')) return false;
  }
  return false;
}

const KEYWORDS_IGNORE = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return',
  'import', 'from', 'class', 'interface', 'type', 'enum',
  'new', 'throw', 'const', 'let', 'var', 'constructor',
]);

function detectFunctions(lines) {
  const functions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Ignorar comentários e linhas vazias
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }

    // 1. Tentar arrow function (single-line com =>)
    const arrowMatch = line.match(ARROW_REGEX);
    if (arrowMatch) {
      const name = arrowMatch[1];
      if (!KEYWORDS_IGNORE.has(name)) {
        functions.push({ name, startLine: i + 1, isMethod: false });
        continue;
      }
    }

    // 2. Tentar arrow function multi-linha (const nome = (...\n...) => ...)
    const arrowMultiMatch = line.match(ARROW_MULTILINE_REGEX);
    if (arrowMultiMatch && !arrowMatch) {
      const name = arrowMultiMatch[1];
      if (!KEYWORDS_IGNORE.has(name) && isArrowFunctionMultiline(lines, i)) {
        functions.push({ name, startLine: i + 1, isMethod: false });
        continue;
      }
    }

    // 3. Tentar function declarations e métodos de classe
    for (const pattern of FUNCTION_PATTERNS) {
      const match = line.match(pattern.regex);
      if (match) {
        const name = match[pattern.nameGroup];
        if (!KEYWORDS_IGNORE.has(name)) {
          functions.push({
            name,
            startLine: i + 1,
            isMethod: pattern.type === 'method',
          });
          break;
        }
      }
    }
  }

  return functions;
}


// ── Contagem de Linhas de Função via Brace Counting ──────────────────────────

function findFunctionEnd(lines, startIndex) {
  let braceDepth = 0;
  let foundOpening = false;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === '{') {
        braceDepth++;
        foundOpening = true;
      } else if (char === '}') {
        braceDepth--;
        if (foundOpening && braceDepth === 0) {
          return i + 1; // 1-indexed end line
        }
      }
    }
  }

  return startIndex + 1; // fallback: single-line
}

function countEffectiveFunctionLines(lines, start, end) {
  let count = 0;
  let inBlockComment = false;

  for (let i = start; i < end && i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      continue;
    }
    if (trimmed === '' || trimmed.startsWith('//')) continue;
    count++;
  }

  return count;
}

// ── Classificação de Função ──────────────────────────────────────────────────

function classifyFunction(funcName, filePath) {
  // Hooks: use + PascalCase
  if (/^use[A-Z]/.test(funcName)) return 'hook';

  // Componentes React: PascalCase em .tsx
  if (filePath.endsWith('.tsx') && /^[A-Z]/.test(funcName)) {
    return 'component';
  }

  return 'function';
}

function getLimitForType(type) {
  return LIMITS[type] ?? LIMITS.function;
}

function getLabelForType(type) {
  const labels = {
    function: 'Função',
    component: 'Componente',
    hook: 'Hook',
  };
  return labels[type] ?? 'Função';
}

// ── Validação ────────────────────────────────────────────────────────────────

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];
  const functions = detectFunctions(lines);

  for (const func of functions) {
    const startIndex = func.startLine - 1;
    const endLine = findFunctionEnd(lines, startIndex);
    const effective = countEffectiveFunctionLines(lines, startIndex, endLine);
    const type = classifyFunction(func.name, filePath);
    const limit = getLimitForType(type);

    if (effective > limit) {
      violations.push({
        name: func.name,
        type,
        startLine: func.startLine,
        endLine,
        effective,
        limit,
        excess: effective - limit,
      });
    }
  }

  return violations;
}

function validateAllFiles(dirs) {
  const allViolations = [];
  const stats = { totalFiles: 0, totalFunctions: 0, passed: 0, failed: 0 };

  for (const dir of dirs) {
    const files = collectFiles(dir);
    for (const filePath of files) {
      stats.totalFiles++;
      const violations = validateFile(filePath);
      const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');

      for (const v of violations) {
        stats.totalFunctions++;
        stats.failed++;
        allViolations.push({ file: relative, ...v });
      }
    }
  }

  return { violations: allViolations, stats };
}

// ── Relatório ────────────────────────────────────────────────────────────────

function printReport(violations, stats) {
  console.log('\n📐 Validação de Linhas por Função');
  console.log('═'.repeat(60));
  console.log(`  Limites: Função=${LIMITS.function}  Componente=${LIMITS.component}  Hook=${LIMITS.hook}`);
  console.log('─'.repeat(60));

  if (violations.length === 0) {
    console.log('\n  ✅ Todas as funções estão dentro dos limites!\n');
  } else {
    console.log(`\n  ❌ ${violations.length} violação(ões) encontrada(s):\n`);

    // Agrupar por arquivo
    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, fileViolations] of Object.entries(byFile)) {
      console.log(`  📄 ${file}`);
      for (const v of fileViolations) {
        const label = getLabelForType(v.type);
        console.log(`    → ${label} "${v.name}" (L${v.startLine}-${v.endLine}): ${v.effective} linhas (limite: ${v.limit}, excesso: +${v.excess})`);
      }
      console.log('');
    }
  }

  console.log('─'.repeat(60));
  console.log(`  Arquivos analisados: ${stats.totalFiles}  Violações: ${stats.failed}`);
  console.log('═'.repeat(60));
  console.log('');
}

// ── Main ─────────────────────────────────────────────────────────────────────

const dirs = [
  path.join(ROOT, 'backend', 'src'),
  path.join(ROOT, 'frontend', 'src'),
];

const { violations, stats } = validateAllFiles(dirs);
printReport(violations, stats);

process.exit(violations.length > 0 ? 1 : 0);
