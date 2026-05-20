import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmbeddingService } from './infra/llm/embedding.service';
import { QdrantService } from './infra/vector/qdrant.service';

interface SearchPayload {
  file_path?: string;
  chunk_type?: string;
  node_ids?: number[];
  start_line?: number;
  end_line?: number;
  content?: string;
}

interface SearchResultItem {
  id: string | number;
  score: number;
  payload?: Record<string, any> | null;
}

function printResults(searchResult: SearchResultItem[]) {
  console.log('\nResultados da Busca Semântica:');
  if (searchResult.length === 0) {
    console.log('Nenhum resultado encontrado.');
    return;
  }

  searchResult.forEach((match, index) => {
    const payload = match.payload as SearchPayload | null | undefined;

    // Extrair o nome da Saga/Reducer a partir do ID do chunk
    let entityName = 'Desconhecida';
    if (typeof match.id === 'string') {
      const parts = match.id.split('-');
      if (parts.length >= 3) {
        entityName = parts.slice(2, parts.length - 1).join('-');
      }
    }

    console.log(`\n[${index + 1}] Score: ${match.score}`);
    console.log(`   Entidade (Saga/Reducer): ${entityName}`);
    console.log(`   ID do Vetor: ${match.id}`);
    console.log(`   Arquivo: ${payload?.file_path}`);
    console.log(`   Tipo de Bloco: ${payload?.chunk_type}`);
    console.log(`   IDs no Neo4j: ${JSON.stringify(payload?.node_ids)}`);
    console.log(`   Linhas: ${payload?.start_line} - ${payload?.end_line}`);

    // Mostrar uma prévia do conteúdo
    const lines = payload?.content?.split('\n') || [];
    const preview = lines.slice(0, 3).join('\n');
    console.log(`   Prévia do código:\n${preview}\n   ...`);
  });
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const embeddingService = app.get(EmbeddingService);
  const qdrantService = app.get(QdrantService);

  const queryText = process.argv[2] || 'busca de usuário';
  console.log(`Buscando por: "${queryText}"...`);

  try {
    // 1. Gerar o embedding da query
    const embeddings = await embeddingService.generateEmbeddings([queryText]);
    const queryVector = embeddings[0];

    // 2. Realizar a busca de similaridade no Qdrant
    const searchResult = (await qdrantService
      .getClient()
      .search('code_chunks', {
        vector: queryVector,
        limit: 5,
        with_payload: true,
      })) as SearchResultItem[];

    printResults(searchResult);
  } catch (err) {
    console.error('Erro ao realizar a busca semântica:', err);
  } finally {
    await app.close();
  }
}

void bootstrap();
