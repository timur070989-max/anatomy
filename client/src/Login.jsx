import { useState } from 'react';
import { api, setToken } from './api';

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-form" onSubmit={onSubmit}>
        <h2>Вход в админку</h2>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Пароль
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
        <p className="login-hint">
          Первого администратора создаёт человек с доступом к серверу:
          <code>node scripts/create-admin.js email password</code>
        </p>
      </form>
    </div>
  );
}
