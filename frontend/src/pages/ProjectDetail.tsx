import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import styles from './ProjectDetail.module.css';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('LOADING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    async function checkStatus() {
      try {
        const res = await apiFetch<{ status: string }>(`/projects/${id}/ingest/status`);
        setStatus(res.status);

        if (res.status === 'QUEUED' || res.status === 'RUNNING') {
          timeoutId = setTimeout(checkStatus, 3000); // long polling every 3s
        }
      } catch (err) {
        setError((err as Error).message || 'Erro ao verificar status');
      }
    }

    checkStatus();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [id]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => navigate('/projects')} className={styles.backButton}>
          &larr; Voltar
        </button>
        <h1 className={styles.title}>Detalhes do Projeto</h1>
      </header>

      <section className={styles.content}>
        <h2>Status da Ingestão</h2>
        {error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <div className={styles.statusBox}>
            <span className={`${styles.badge} ${styles[status]}`}>
              {status}
            </span>
            {status === 'QUEUED' && <p>O projeto está na fila de processamento...</p>}
            {status === 'RUNNING' && <p>Analisando arquivos e montando o Knowledge Graph...</p>}
            {status === 'COMPLETED' && (
              <>
                <p>A ingestão foi concluída. O grafo está disponível no Neo4j.</p>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate(`/projects/${id}/chat`)}
                  >
                    🗨️ Abrir Chat
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate(`/projects/${id}/dashboard`)}
                  >
                    📊 Ver Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
