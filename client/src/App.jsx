import { useEffect, useState } from 'react';
import AtlasView from './AtlasView';
import AdminView from './AdminView';
import BodyMapAdmin from './BodyMapAdmin';
import UsersAdmin from './UsersAdmin';
import Login from './Login';
import { api, getToken, setToken } from './api';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('atlas');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setAuthChecked(true);
      return;
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setAuthChecked(true));
  }, []);

  function logout() {
    setToken(null);
    setUser(null);
    setTab('atlas');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Анатомия — атлас</h1>
        <nav>
          <button className={tab === 'atlas' ? 'active' : ''} onClick={() => setTab('atlas')}>
            Атлас
          </button>
          {user && (
            <>
              <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>
                Админ
              </button>
              <button className={tab === 'bodymap' ? 'active' : ''} onClick={() => setTab('bodymap')}>
                Карта тела
              </button>
              {user.role === 'admin' && (
                <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
                  Пользователи
                </button>
              )}
            </>
          )}
        </nav>
        {authChecked && (
          user ? (
            <div className="session-info">
              <span>{user.email} ({user.role})</span>
              <button onClick={logout}>Выйти</button>
            </div>
          ) : (
            <button className="login-link" onClick={() => setTab('login')}>Войти</button>
          )
        )}
      </header>

      {tab === 'atlas' && <AtlasView />}
      {tab === 'login' && !user && <Login onLoggedIn={(u) => { setUser(u); setTab('admin'); }} />}
      {tab === 'admin' && user && <AdminView />}
      {tab === 'bodymap' && user && <BodyMapAdmin />}
      {tab === 'users' && user?.role === 'admin' && <UsersAdmin currentUser={user} />}
    </div>
  );
}
