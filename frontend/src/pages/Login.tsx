import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const data = await apiFetch<{ access_token: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.access_token);
      navigate('/projects');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>LegacyLens</h1>
        <p className={styles.subtitle}>
          {isRegister ? 'Criar conta' : 'Entrar'}
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className={styles.input}
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className={styles.button} type="submit">
          {isRegister ? 'Registrar' : 'Login'}
        </button>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? 'Já tem conta? Entre'
            : 'Não tem conta? Registre-se'}
        </button>
      </form>
    </div>
  );
}
