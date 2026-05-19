export * from './types';
import { Injectable } from '@nestjs/common';
import { ASTNode, ExtractedGraph } from './types';

@Injectable()
export class EdgeExtractorService {
  extract(
    tree: { isMock?: boolean; code?: string; rootNode?: any },
    filePath: string,
  ): ExtractedGraph {
    if (tree.isMock && tree.code) {
      return this.extractMock(tree.code, filePath);
    }

    const graph: ExtractedGraph = {
      sagas: [],
      reducers: [],
      actions: [],
      imports: [],
      edges: { watches: [], dispatches: [], calls: [], selects: [] },
    };

    const rootNode = tree.rootNode as ASTNode;
    this.walkAST(rootNode, filePath, graph);
    return graph;
  }

  private checkImport(node: ASTNode, filePath: string, graph: ExtractedGraph) {
    if (node.type === 'import_statement') {
      const sourceNode = node.childForFieldName('source');
      if (sourceNode) {
        graph.imports.push({
          from: filePath,
          to: sourceNode.text.replace(/['"]/g, ''),
          loc: node.startPosition.row + 1,
        });
      }
    }
  }

  private checkSaga(node: ASTNode, filePath: string, graph: ExtractedGraph) {
    if (
      node.type === 'generator_function' ||
      node.type === 'generator_function_declaration'
    ) {
      const nameNode = node.childForFieldName('name');
      const sagaName = nameNode ? nameNode.text : 'anonymous_saga';

      graph.sagas.push({
        name: sagaName,
        file_path: filePath,
        loc: node.startPosition.row + 1,
        start_line: node.startPosition.row + 1,
        end_line: node.endPosition.row + 1,
      });

      this.extractSagaEffects(node, sagaName, filePath, graph);
    }
  }

  private checkReducer(node: ASTNode, filePath: string, graph: ExtractedGraph) {
    if (node.type === 'call_expression') {
      const functionNode = node.childForFieldName('function');
      if (functionNode && functionNode.text === 'createSlice') {
        graph.reducers.push({
          name: 'Slice',
          file_path: filePath,
          slice_name: 'Unknown',
        });
      }
    }
  }

  private walkAST(node: ASTNode, filePath: string, graph: ExtractedGraph) {
    this.checkImport(node, filePath, graph);
    this.checkSaga(node, filePath, graph);
    this.checkReducer(node, filePath, graph);

    for (const child of node.children) {
      this.walkAST(child, filePath, graph);
    }
  }

  private processWatcherEffect(
    funcName: string,
    args: ASTNode | null,
    sagaName: string,
    filePath: string,
    fileLine: number,
    graph: ExtractedGraph,
  ) {
    if (
      funcName === 'takeLatest' ||
      funcName === 'takeEvery' ||
      funcName === 'take'
    ) {
      const actionType =
        args?.children[1]?.text?.replace(/['"]/g, '') || 'UNKNOWN_ACTION';
      graph.edges.watches.push({
        saga: sagaName,
        action: actionType,
        watcher_type: funcName,
        file_line: fileLine,
      });
      if (!graph.actions.find((a) => a.type_string === actionType)) {
        graph.actions.push({
          type_string: actionType,
          file_path: filePath,
        });
      }
    }
  }

  private processDispatchEffect(
    funcName: string,
    sagaName: string,
    fileLine: number,
    graph: ExtractedGraph,
  ) {
    if (funcName === 'put') {
      graph.edges.dispatches.push({
        saga: sagaName,
        action: 'UNKNOWN_ACTION_FROM_PUT',
        file_line: fileLine,
      });
    }
  }

  private processCallEffect(
    funcName: string,
    args: ASTNode | null,
    sagaName: string,
    fileLine: number,
    graph: ExtractedGraph,
  ) {
    if (funcName === 'call' || funcName === 'fork') {
      const targetSaga = args?.children[1]?.text || 'unknown';
      graph.edges.calls.push({
        saga: sagaName,
        target_saga: targetSaga,
        via_effect: funcName,
        file_line: fileLine,
      });
    }
  }

  private processYieldCallExpression(
    callExp: ASTNode,
    sagaName: string,
    filePath: string,
    fileLine: number,
    graph: ExtractedGraph,
  ) {
    const funcName = callExp.childForFieldName('function')?.text;
    const args = callExp.childForFieldName('arguments');

    if (!funcName) return;

    this.processWatcherEffect(
      funcName,
      args,
      sagaName,
      filePath,
      fileLine,
      graph,
    );
    this.processDispatchEffect(funcName, sagaName, fileLine, graph);
    this.processCallEffect(funcName, args, sagaName, fileLine, graph);
  }

  private extractSagaEffects(
    node: ASTNode,
    sagaName: string,
    filePath: string,
    graph: ExtractedGraph,
  ) {
    const walk = (n: ASTNode) => {
      if (n.type === 'yield_expression') {
        const callExp = n.children.find((c) => c.type === 'call_expression');
        if (callExp) {
          this.processYieldCallExpression(
            callExp,
            sagaName,
            filePath,
            n.startPosition.row + 1,
            graph,
          );
        }
      }
      for (const child of n.children) {
        walk(child);
      }
    };
    walk(node);
  }

  private extractMockImports(
    code: string,
    filePath: string,
    graph: ExtractedGraph,
  ) {
    const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;
    let importMatch;
    while ((importMatch = importRegex.exec(code)) !== null) {
      graph.imports.push({
        from: filePath,
        to: importMatch[1],
        loc: 1,
      });
    }
  }

  private extractMockWatches(
    sagaName: string,
    sagaBlock: string,
    filePath: string,
    graph: ExtractedGraph,
  ) {
    const watchRegex = /takeLatest\(\s*['"](\w+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = watchRegex.exec(sagaBlock)) !== null) {
      const actionType = m[1];
      graph.edges.watches.push({
        saga: sagaName,
        action: actionType,
        watcher_type: 'takeLatest',
        file_line: 1,
      });
      if (!graph.actions.find((a) => a.type_string === actionType)) {
        graph.actions.push({ type_string: actionType, file_path: filePath });
      }
    }
  }

  private extractMockDispatches(
    sagaName: string,
    sagaBlock: string,
    filePath: string,
    graph: ExtractedGraph,
  ) {
    const dispRegex = /put\(\s*(\w+Success|\w+Error|\w+Request|\w+)\(/g;
    let m: RegExpExecArray | null;
    while ((m = dispRegex.exec(sagaBlock)) !== null) {
      const actionCreator = m[1];
      graph.edges.dispatches.push({
        saga: sagaName,
        action: actionCreator,
        file_line: 1,
      });
      if (!graph.actions.find((a) => a.type_string === actionCreator)) {
        graph.actions.push({ type_string: actionCreator, file_path: filePath });
      }
    }
  }

  private extractMockCalls(
    sagaName: string,
    sagaBlock: string,
    graph: ExtractedGraph,
  ) {
    const callRegex = /call\(\s*(\w+)/g;
    let m: RegExpExecArray | null;
    while ((m = callRegex.exec(sagaBlock)) !== null) {
      const targetSaga = m[1];
      graph.edges.calls.push({
        saga: sagaName,
        target_saga: targetSaga,
        via_effect: 'call',
        file_line: 1,
      });
    }
  }

  private extractMockSagas(
    code: string,
    filePath: string,
    graph: ExtractedGraph,
  ) {
    const sagaRegex = /function\*\s+(\w+)\s*\(/g;
    let sagaMatch;
    while ((sagaMatch = sagaRegex.exec(code)) !== null) {
      const sagaName = sagaMatch[1];
      graph.sagas.push({
        name: sagaName,
        file_path: filePath,
        loc: 1,
        start_line: 1,
        end_line: 10,
      });

      const sagaStartIndex = sagaMatch.index;
      const nextSagaMatch = sagaRegex.exec(code);
      sagaRegex.lastIndex = sagaStartIndex + sagaMatch[0].length;
      const sagaBlock = nextSagaMatch
        ? code.substring(sagaStartIndex, nextSagaMatch.index)
        : code.substring(sagaStartIndex);

      this.extractMockWatches(sagaName, sagaBlock, filePath, graph);
      this.extractMockDispatches(sagaName, sagaBlock, filePath, graph);
      this.extractMockCalls(sagaName, sagaBlock, graph);
    }
  }

  private extractMock(code: string, filePath: string): ExtractedGraph {
    const graph: ExtractedGraph = {
      sagas: [],
      reducers: [],
      actions: [],
      imports: [],
      edges: { watches: [], dispatches: [], calls: [], selects: [] },
    };

    this.extractMockImports(code, filePath, graph);
    this.extractMockSagas(code, filePath, graph);

    if (code.includes('createSlice')) {
      graph.reducers.push({
        name: 'Slice',
        file_path: filePath,
        slice_name: 'Unknown',
      });
    }

    return graph;
  }
}
