import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { ActionGraph, type GraphNode, type GraphEdge } from '../components/ActionGraph';
import styles from './Dashboard.module.css';

interface StatItem {
  type: string;
  count: number;
}

export function Dashboard() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatItem[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [deadCode, setDeadCode] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const data = await apiFetch<StatItem[]>(`/projects/${projectId}/dashboard/stats`);
      setStats(data);
    }

    async function fetchGraph() {
      const data = await apiFetch<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
        `/projects/${projectId}/dashboard/graph/actions`
      );
      setNodes(data.nodes);
      setEdges(data.edges);
    }

    async function fetchDeadCode() {
      const data = await apiFetch<GraphNode[]>(`/projects/${projectId}/dashboard/dead-code`);
      setDeadCode(data);
    }

    async function loadData() {
      try {
        await Promise.all([
          fetchStats(),
          fetchGraph(),
          fetchDeadCode()
        ]);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  if (loading) {
    return <div className={styles.loading}>Carregando Dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => navigate(`/projects/${projectId}`)} className={styles.backButton}>
          ← Voltar
        </button>
        <h1 className={styles.title}>Dashboard do Projeto</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.statsSection}>
          {stats.map((s) => (
            <div key={s.type} className={styles.statCard}>
              <div className={styles.statLabel}>{s.type}s</div>
              <div className={styles.statValue}>{s.count}</div>
            </div>
          ))}
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.graphSection}>
            <h2 className={styles.sectionTitle}>Fluxo de Actions (Saga → Action → Reducer)</h2>
            <div className={styles.graphWrapper}>
              <ActionGraph nodes={nodes} edges={edges} />
            </div>
          </section>

          <div className={styles.sideColumn}>
            <section className={styles.deadCodeSection}>
              <h2 className={styles.sectionTitle}>Código Morto / Sagas Órfãs</h2>
              <div className={styles.tableWrapper}>
                {deadCode.length === 0 ? (
                  <p className={styles.emptyMsg}>Nenhum código morto detectado!</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deadCode.map((item) => (
                        <tr key={item.id}>
                          <td className={styles.nameCell} title={item.filePath}>{item.name}</td>
                          <td>
                            <span className={`${styles.typeBadge} ${styles[item.type.toLowerCase()]}`}>
                              {item.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
