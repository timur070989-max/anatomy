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
    <div className="app wm-futuristic-theme">
      {/* Cyber-Medical Ambient Grid & Background Lighting */}
      <div className="cyber-ambient-grid" />
      <div className="cyber-ambient-glow" />

      {/* Corporate Futuristic World Medicine Header */}
      <header className="app-header wm-header">
        <div className="header-brand-group">
          <div className="wm-logo-wrap" onClick={() => setTab('atlas')} title="World Medicine - Главная">
            <img src={wmLogo} alt="World Medicine" className="wm-logo-img" />
          </div>
          <div className="wm-brand-divider" />
          <div className="wm-title-block">
            <span className="wm-app-title">3D DIGITAL MEDICAL ATLAS</span>
            <span className="wm-app-subtitle">Интерактивная био-анатомия и фармакотерапия WM</span>
          </div>
        </div>

        {/* Futuristic Live Bio-Telemetry Monitor */}
        <div className="wm-telemetry-hud">
          <div className="telemetry-item">
            <span className="telemetry-dot live-pulse" />
            <span className="telemetry-label">BIO-HUD:</span>
            <span className="telemetry-value">ONLINE</span>
          </div>
          <div className="telemetry-ecg-box">
            <svg className="ecg-wave-svg" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                className="ecg-path"
                d="M0,12 L20,12 L25,12 L28,4 L32,20 L36,8 L40,14 L44,12 L65,12 L68,4 L72,20 L76,8 L80,14 L84,12 L100,12"
              />
            </svg>
            <span className="ecg-rate">72 <sub>BPM</sub></span>
          </div>
        </div>

        <nav className="header-nav">
          <button className={`nav-btn ${tab === 'atlas' ? 'active' : ''}`} onClick={() => setTab('atlas')}>
            <span className="nav-btn-icon">🫀</span> Атлас
          </button>
          {user && (
            <>
              <button className={`nav-btn ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>
                <span className="nav-btn-icon">⚙️</span> Панель
              </button>
              <button className={`nav-btn ${tab === 'bodymap' ? 'active' : ''}`} onClick={() => setTab('bodymap')}>
                <span className="nav-btn-icon">🗺️</span> Карта тела
              </button>
              {user.role === 'admin' && (
                <button className={`nav-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
                  <span className="nav-btn-icon">👥</span> Доступ
                </button>
              )}
            </>
          )}
        </nav>

        {authChecked && (
          user ? (
            <div className="session-info">
              <span className="user-badge">{user.email} <strong className="role-tag">[{user.role}]</strong></span>
              <button className="logout-btn" onClick={logout}>Выйти</button>
            </div>
          ) : (
            <button className="login-link wm-btn-glow" onClick={() => setTab('login')}>
              <span className="login-icon">🔐</span> Войти
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
