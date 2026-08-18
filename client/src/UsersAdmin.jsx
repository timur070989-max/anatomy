import { useEffect, useState } from 'react';
import { api } from './api';

export default function UsersAdmin({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('editor');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  function refresh() {
    api.listUsers().then(setUsers).catch((e) => setError(e.message));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      await api.createUser(email, password, role);
      setEmail('');
      setPassword('');
      setStatus('Пользователь добавлен');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.deleteUser(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="users-admin">
      <h2>Пользователи</h2>
      <p className="section-dek">Управление доступом к админке — только для роли admin.</p>

      {error && <p className="error">{error}</p>}
      {status && <p className="status">{status}</p>}

      <form className="user-form" onSubmit={onCreate}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit">Добавить</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Роль</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td className="row-actions">
                {u.id !== currentUser.id && (
                  <button onClick={() => onDelete(u.id)}>Удалить</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
