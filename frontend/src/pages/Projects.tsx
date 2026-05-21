import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import styles from './Projects.module.css';

interface Project {
  id: string;
  name: string;
  repoUrl: string | null;
  status: string;
  createdAt: string;
}

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await apiFetch<Project[]>('/projects');
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, repoUrl: repoUrl || undefined }),
    });
    setName('');
    setRepoUrl('');
    loadProjects();
  }

  async function handleDelete(id: string) {
    await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    loadProjects();
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  async function handleIngest(id: string) {
    await apiFetch(`/projects/${id}/ingest`, { method: 'POST' });
    navigate(`/projects/${id}`);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>LegacyLens</h1>
        <div className={styles.headerActions}>
          <button className={styles.settingsBtn} onClick={() => navigate('/settings')}>
            Configurações
          </button>
          <button className={styles.logout} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <section className={styles.createSection}>
        <h2>Novo Projeto</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <input
            className={styles.input}
            placeholder="Nome do projeto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="URL do repositório (opcional)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <button className={styles.button} type="submit">
            Criar
          </button>
        </form>
      </section>

      <section className={styles.listSection}>
        <h2>Projetos</h2>
        {loading ? (
          <p className={styles.empty}>Carregando...</p>
        ) : projects.length === 0 ? (
          <p className={styles.empty}>Nenhum projeto cadastrado.</p>
        ) : (
          <ul className={styles.list}>
            {projects.map((p) => (
              <li key={p.id} className={styles.card}>
                <div>
                  <strong>{p.name}</strong>
                  <span className={styles.status}>{p.status}</span>
                </div>
                {p.repoUrl && (
                  <p className={styles.repo}>{p.repoUrl}</p>
                )}
                <div className={styles.actions}>
                  <button
                    className={styles.detailsBtn}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    Ver Detalhes
                  </button>
                  <button
                    className={styles.ingestBtn}
                    onClick={() => handleIngest(p.id)}
                  >
                    {p.status === 'COMPLETED' ? 'Re-ingestar' : 'Iniciar Ingestão'}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(p.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
