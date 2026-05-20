import { Injectable, OnModuleInit } from '@nestjs/common';
import Parser, { Language } from 'web-tree-sitter';
import * as path from 'path';

@Injectable()
export class ParserService implements OnModuleInit {
  private parser: Parser;
  private jsLanguage: Language;
  private tsLanguage: Language;

  async onModuleInit() {
    await Parser.init();
    this.parser = new Parser();

    const wasmsDir = path.dirname(
      require.resolve('tree-sitter-wasms/package.json'),
    );
    const jsWasmPath = path.join(
      wasmsDir,
      'out',
      'tree-sitter-javascript.wasm',
    );
    const tsWasmPath = path.join(
      wasmsDir,
      'out',
      'tree-sitter-typescript.wasm',
    );

    try {
      this.jsLanguage = await Language.load(jsWasmPath);
      this.tsLanguage = await Language.load(tsWasmPath);
    } catch (e) {
      console.warn(
        'Could not load tree-sitter wasm. Parser will run in mock mode.',
        (e as Error).message,
      );
    }
  }

  parse(code: string, language: 'javascript' | 'typescript'): any {
    const lang = language === 'javascript' ? this.jsLanguage : this.tsLanguage;
    if (!lang) {
      console.warn(
        'WASM Language not loaded. Returning empty tree with original code.',
      );
      return {
        isMock: true,
        code,
        rootNode: { type: 'program', children: [] },
      };
    }
    this.parser.setLanguage(lang);
    return this.parser.parse(code);
  }
}
