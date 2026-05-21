/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../../../infra/graph/neo4j.service';

import { Record } from 'neo4j-driver';

export interface StatItem {
  type: string;
  count: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  filePath?: string;
  loc?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly neo4jService: Neo4jService) {}

  async getStats(_projectId?: string): Promise<StatItem[]> {
    const session = this.neo4jService.getDriver().session();
    try {
      const query = `
        MATCH (n)
        WHERE n:Saga OR n:Reducer OR n:Action OR n:Selector
        RETURN labels(n)[0] AS type, count(n) AS count
      `;
      const result = await session.run(query);
      return result.records.map((rec) => ({
        type: rec.get('type') as string,
        count: (rec.get('count') as { toNumber: () => number }).toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  async getActionGraph(
    _projectId?: string,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const session = this.neo4jService.getDriver().session();
    try {
      const { nodes, edges } = await this.queryActionEdges(session);
      return { nodes, edges };
    } finally {
      await session.close();
    }
  }

  async getSagaGraph(
    _projectId?: string,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const session = this.neo4jService.getDriver().session();
    try {
      const { nodes, edges } = await this.querySagaEdges(session);
      return { nodes, edges };
    } finally {
      await session.close();
    }
  }

  async getDeadCode(_projectId?: string): Promise<GraphNode[]> {
    const session = this.neo4jService.getDriver().session();
    try {
      const query = `
        MATCH (n)
        WHERE (n:Saga OR n:Reducer OR n:Action OR n:Selector)
          AND NOT (n)--()
        RETURN id(n) AS id, n.name AS name,
               labels(n)[0] AS type, n.file_path AS filePath
        LIMIT 100
      `;
      const result = await session.run(query);
      return result.records.map((rec) => ({
        id: String(rec.get('id')),
        name: (rec.get('name') as string) || 'Unknown',
        type: rec.get('type') as string,
        filePath: rec.get('filePath') as string | undefined,
      }));
    } finally {
      await session.close();
    }
  }

  private async queryActionEdges(
    session: ReturnType<typeof this.neo4jService.getDriver.prototype.session>,
  ) {
    const query = `
      MATCH (source)-[r]->(target)
      WHERE (source:Saga OR source:Reducer OR source:Action OR source:Selector)
        AND (target:Saga OR target:Reducer OR target:Action OR target:Selector)
      RETURN id(source) AS sourceId, source.name AS sourceName,
             labels(source)[0] AS sourceType, source.file_path AS sourceFile,
             type(r) AS relation,
             id(target) AS targetId, target.name AS targetName,
             labels(target)[0] AS targetType, target.file_path AS targetFile
      LIMIT 200
    `;
    const result = await session.run(query);
    return this.parseGraphRecords(result.records);
  }

  private async querySagaEdges(
    session: ReturnType<typeof this.neo4jService.getDriver.prototype.session>,
  ) {
    const query = `
      MATCH (s1:Saga)-[r:CALLS]->(s2:Saga)
      RETURN id(s1) AS sourceId, s1.name AS sourceName,
             labels(s1)[0] AS sourceType, s1.file_path AS sourceFile,
             type(r) AS relation,
             id(s2) AS targetId, s2.name AS targetName,
             labels(s2)[0] AS targetType, s2.file_path AS targetFile
      LIMIT 200
    `;
    const result = await session.run(query);
    return this.parseGraphRecords(result.records);
  }

  private parseGraphRecords(records: Record[]) {
    const nodesMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    for (const rec of records) {
      const sId = String(rec.get('sourceId'));
      const tId = String(rec.get('targetId'));
      this.addNodeToMap(nodesMap, sId, rec, 'source');
      this.addNodeToMap(nodesMap, tId, rec, 'target');
      edges.push({
        source: sId,
        target: tId,
        relation: rec.get('relation') as string,
      });
    }

    return { nodes: Array.from(nodesMap.values()), edges };
  }

  private addNodeToMap(
    map: Map<string, GraphNode>,
    id: string,
    rec: Record,
    prefix: 'source' | 'target',
  ) {
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: (rec.get(`${prefix}Name`) as string) || 'Unknown',
        type: rec.get(`${prefix}Type`) as string,
        filePath: rec.get(`${prefix}File`) as string | undefined,
      });
    }
  }
}
