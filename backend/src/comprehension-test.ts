import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { AppModule } from './app.module';
import { AgentService } from './comprehension/agent.service';

async function bootstrap() {
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule);
  const agentService = app.get<AgentService>(AgentService);

  const query =
    'Explique como funciona a Saga de Comentarios e quais as actions disparadas.';

  console.log(`\n\n--- INICIANDO TESTE DO AGENTE DE COMPREENSÃO ---`);
  console.log(`Query: "${query}"\n`);

  try {
    const result = await agentService.run(query);
    console.log(`### Resultado (Confidence: ${result.confidence}) ###\n`);
    result.docs.forEach((doc: string, idx: number) => {
      console.log(`Documento ${idx + 1}:\n${doc}\n`);
    });
  } catch (err) {
    console.error('Erro na execução do agente:', err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

void bootstrap();
