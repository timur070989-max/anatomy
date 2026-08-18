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
        <div className="login-header">
          <h2>Вход в панель управления</h2>
          <p className="login-subtitle">World Medicine Anatomical Atlas</p>
        </div>

        {error && <p className="error">{error}</p>}

        <label>
          Email администратора
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@worldmedicine.com"
            required
            autoFocus
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit" className="login-submit-btn" disabled={busy}>
          {busy ? 'Проверка данных…' : 'Войти в панель'}
        </button>

        <div className="default-login-credentials">
          <span>Логин: <code>admin@worldmedicine.com</code></span>
          <span>Пароль: <code>admin123</code></span>
        </div>
      </form>
    </div>
  );
}
