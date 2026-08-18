import { useEffect, useState } from 'react';
import AtlasView from './AtlasView';
import AdminView from './AdminView';
import BodyMapAdmin from './BodyMapAdmin';
import UsersAdmin from './UsersAdmin';
import Login from './Login';
import ErrorBoundary from './ErrorBoundary';
import { api, getToken, setToken } from './api';
import wmLogo from './wm-logo.svg';
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
    <div className="app wm-minimal-theme">
      {/* Clean Minimalist Corporate Header */}
      <header className="app-header wm-header">
        <div className="header-brand-group">
          <div className="wm-logo-wrap" onClick={() => setTab('atlas')} title="World Medicine">
            <img src={wmLogo} alt="World Medicine" className="wm-logo-img" />
          </div>
          <div className="wm-brand-divider" />
          <div className="wm-title-block">
            <span className="wm-app-title">Анатомический атлас</span>
            <span className="wm-app-subtitle">World Medicine</span>
          </div>
        </div>

        {user && (
          <nav className="header-nav">
            <button className={`nav-btn ${tab === 'atlas' ? 'active' : ''}`} onClick={() => setTab('atlas')}>
              Атлас
            </button>
            <button className={`nav-btn ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>
              Админ-панель
            </button>
            <button className={`nav-btn ${tab === 'bodymap' ? 'active' : ''}`} onClick={() => setTab('bodymap')}>
              Карта тела
            </button>
            {user.role === 'admin' && (
              <button className={`nav-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
                Пользователи
              </button>
            )}
          </nav>
        )}

        {authChecked && (
          user ? (
            <div className="session-info">
              <span className="user-badge">{user.email}</span>
              <button className="logout-btn" onClick={logout}>Выйти</button>
            </div>
          ) : (
            <button className="login-link" onClick={() => setTab('login')}>
              Войти
            </button>
          )
        )}
      </header>

      <ErrorBoundary>
        {tab === 'atlas' && <AtlasView />}
        {tab === 'login' && !user && <Login onLoggedIn={(u) => { setUser(u); setTab('admin'); }} />}
        {tab === 'admin' && user && <AdminView />}
        {tab === 'bodymap' && user && <BodyMapAdmin />}
        {tab === 'users' && user?.role === 'admin' && <UsersAdmin currentUser={user} />}
      </ErrorBoundary>
    </div>
  );
}
