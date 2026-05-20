import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import styles from './Settings.module.css';

export function Settings() {
  const navigate = useNavigate();
  const [llmProvider, setLlmProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch<{ id?: string; llmProvider?: string; apiKey?: string; modelName?: string }>('/settings')
      .then((data) => {
        if (data && data.id) {
          setLlmProvider(data.llmProvider || 'openrouter');
          setApiKey(data.apiKey || '');
          setModelName(data.modelName || '');
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify({ llmProvider, apiKey, modelName }),
      });
      setMessage('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Configurações do Sistema</h1>
        <button className={styles.backBtn} onClick={() => navigate('/projects')}>
          Voltar para Projetos
        </button>
      </header>

      <main className={styles.content}>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="llmProvider">Provedor de LLM</label>
            <select
              id="llmProvider"
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
            >
              <option value="openrouter">OpenRouter</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="apiKey">Chave de API (API Key)</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Sua chave de API..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="modelName">Nome do Modelo</label>
            <input
              type="text"
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="ex: anthropic/claude-3.5-sonnet"
            />
          </div>

          <button type="submit" disabled={loading} className={styles.saveBtn}>
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>

          {message && <p className={styles.message}>{message}</p>}
        </form>
      </main>
    </div>
  );
}
