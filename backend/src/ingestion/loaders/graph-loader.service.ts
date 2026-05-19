import { Injectable, Logger } from '@nestjs/common';
import { Session } from 'neo4j-driver';
import { Neo4jService } from '../../infra/graph/neo4j.service';
import {
  ExtractedGraph,
  ExtractedSaga,
  ExtractedReducer,
  ExtractedAction,
  ExtractedWatch,
  ExtractedImport,
} from '../extractors/edge-extractor.service';

@Injectable()
export class GraphLoaderService {
  private readonly logger = new Logger(GraphLoaderService.name);

  constructor(private neo4jService: Neo4jService) {}

  private async loadSagas(
    session: Session,
    projectId: string,
    sagas: ExtractedSaga[],
  ) {
    for (const saga of sagas) {
      await session.run(
        `
        MERGE (m:Module {project_id: $projectId, file_path: $filePath})
        MERGE (s:Saga {project_id: $projectId, file_path: $filePath, name: $name})
        MERGE (m)-[:DEFINES]->(s)
        SET s.start_line = $startLine, s.end_line = $endLine, s.loc = $loc
      `,
        {
          projectId,
          filePath: saga.file_path,
          name: saga.name,
          startLine: saga.start_line,
          endLine: saga.end_line,
          loc: saga.loc,
        },
      );
    }
  }

  private async loadReducers(
    session: Session,
    projectId: string,
    reducers: ExtractedReducer[],
  ) {
    for (const reducer of reducers) {
      await session.run(
        `
        MERGE (m:Module {project_id: $projectId, file_path: $filePath})
        MERGE (r:Reducer {project_id: $projectId, file_path: $filePath, name: $name})
        MERGE (m)-[:DEFINES]->(r)
        SET r.slice_name = $sliceName
      `,
        {
          projectId,
          filePath: reducer.file_path,
          name: reducer.name,
          sliceName: reducer.slice_name,
        },
      );
    }
  }

  private async loadActions(
    session: Session,
    projectId: string,
    actions: ExtractedAction[],
  ) {
    for (const action of actions) {
      await session.run(
        `
        MERGE (a:Action {project_id: $projectId, type_string: $typeString})
        SET a.file_path = $filePath
      `,
        {
          projectId,
          typeString: action.type_string,
          filePath: action.file_path,
        },
      );
    }
  }

  private async loadWatches(
    session: Session,
    projectId: string,
    watches: ExtractedWatch[],
  ) {
    for (const watch of watches) {
      await session.run(
        `
        MATCH (s:Saga {project_id: $projectId, name: $sagaName})
        MATCH (a:Action {project_id: $projectId, type_string: $actionType})
        MERGE (s)-[w:WATCHES {watcher_type: $watcherType}]->(a)
        SET w.file_line = $fileLine
       `,
        {
          projectId,
          sagaName: watch.saga,
          actionType: watch.action,
          watcherType: watch.watcher_type,
          fileLine: watch.file_line,
        },
      );
    }
  }

  private async loadImports(
    session: Session,
    projectId: string,
    imports: ExtractedImport[],
  ) {
    for (const imp of imports) {
      await session.run(
        `
        MERGE (m1:Module {project_id: $projectId, file_path: $from})
        MERGE (m2:Module {project_id: $projectId, file_path: $to})
        MERGE (m1)-[i:IMPORTS]->(m2)
        SET i.file_line = $fileLine
       `,
        {
          projectId,
          from: imp.from,
          to: imp.to,
          fileLine: imp.loc,
        },
      );
    }
  }

  async loadGraph(projectId: string, graph: ExtractedGraph) {
    const session = this.neo4jService.getDriver().session();
    try {
      this.logger.log(`Loading graph for project ${projectId} into Neo4j`);

      await this.loadSagas(session, projectId, graph.sagas);
      await this.loadReducers(session, projectId, graph.reducers);
      await this.loadActions(session, projectId, graph.actions);
      await this.loadWatches(session, projectId, graph.edges.watches);
      await this.loadImports(session, projectId, graph.imports);

      this.logger.log(`Graph loaded successfully for project ${projectId}`);
    } catch (error) {
      this.logger.error(
        `Error loading graph to Neo4j: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      await session.close();
    }
  }
}
