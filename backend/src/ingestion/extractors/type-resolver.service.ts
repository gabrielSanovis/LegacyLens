import { Injectable, Logger } from '@nestjs/common';
import * as ts from 'typescript';
import { ExtractedGraph } from './types';

@Injectable()
export class TypeResolverService {
  private readonly logger = new Logger(TypeResolverService.name);

  resolveTypes(
    program: ts.Program,
    filesToParse: string[],
    graph: ExtractedGraph,
  ) {
    const typeChecker = program.getTypeChecker();

    for (const sourceFile of program.getSourceFiles()) {
      if (
        !sourceFile.isDeclarationFile &&
        filesToParse.includes(sourceFile.fileName)
      ) {
        this.visit(sourceFile, typeChecker, sourceFile.fileName, graph);
      }
    }
  }

  private visit(
    node: ts.Node,
    checker: ts.TypeChecker,
    filePath: string,
    graph: ExtractedGraph,
  ) {
    this.resolveActionPayload(node, checker, graph);
    this.resolveSelectorReturnType(node, checker, graph);

    ts.forEachChild(node, (child) =>
      this.visit(child, checker, filePath, graph),
    );
  }

  private resolveActionPayload(
    node: ts.Node,
    checker: ts.TypeChecker,
    graph: ExtractedGraph,
  ) {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      const name = node.name.text;
      const existingAction = graph.actions.find((a) => a.type_string === name);
      if (existingAction) {
        const type = checker.getTypeAtLocation(node);
        const properties = checker.getPropertiesOfType(type);
        const payloadProp = properties.find((p) => p.name === 'payload');
        if (payloadProp) {
          const payloadType = checker.getTypeOfSymbolAtLocation(
            payloadProp,
            node,
          );
          existingAction.payload_shape = checker.typeToString(payloadType);
        }
      }
    }
  }

  private resolveSelectorReturnType(
    node: ts.Node,
    checker: ts.TypeChecker,
    graph: ExtractedGraph,
  ) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isArrowFunction(node.initializer)
    ) {
      const name = node.name.getText();
      const existingSelector = graph.selectors?.find((s) => s.name === name);
      if (existingSelector) {
        const signature = checker.getSignatureFromDeclaration(node.initializer);
        if (signature) {
          const returnType = checker.getReturnTypeOfSignature(signature);
          existingSelector.return_type = checker.typeToString(returnType);
        }
      }
    }
  }
}
