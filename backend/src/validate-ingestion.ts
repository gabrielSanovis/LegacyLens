import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PipelineService } from './ingestion/pipeline.service';
import { Neo4jService } from './infra/graph/neo4j.service';
import { Node, Integer } from 'neo4j-driver';

async function validateGraph(neo4j: Neo4jService, projectId: string) {
  const session = neo4j.getDriver().session();

  const result = await session.run(
    `MATCH (n) WHERE n.project_id = $projectId RETURN labels(n) as labels, n`,
    { projectId },
  );
  console.log(`Found ${result.records.length} nodes for project:`);
  result.records.forEach((r) => {
    const node = r.get('n') as Node;
    console.log(r.get('labels') as string[], node.properties);
  });

  const edges = await session.run(
    `MATCH ()-[r]->() RETURN type(r) as type, count(r) as count`,
  );
  console.log('Edges summary:');
  edges.records.forEach((r) => {
    const countVal = r.get('count') as Integer;
    console.log(r.get('type') as string, countVal.toNumber());
  });

  await session.close();
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pipeline = app.get(PipelineService);
  const neo4j = app.get(Neo4jService);

  try {
    const projectId = 'self-analysis-project';
    const directoryPath = './src';

    console.log('Running pipeline...');
    await pipeline.runPipeline(projectId, directoryPath);

    console.log('Validating Neo4j Graph...');
    await validateGraph(neo4j, projectId);
  } catch (err) {
    console.error('Error during validation', (err as Error).stack);
  } finally {
    await app.close();
  }
}

void bootstrap();
