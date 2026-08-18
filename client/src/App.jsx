import { useEffect, useState } from 'react';
import AtlasView from './AtlasView';
import AdminView from './AdminView';
import BodyMapAdmin from './BodyMapAdmin';
import UsersAdmin from './UsersAdmin';
import Login from './Login';
import ErrorBoundary from './ErrorBoundary';
import { api, getToken, setToken } from './api';
import { translations } from './i18n';
import wmLogo from './wm-logo.svg';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('atlas');
  const [lang, setLang] = useState('ru');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const t = translations[lang] || translations.ru;

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
            <span className="wm-app-title">{t.appTitle}</span>
            <span className="wm-app-subtitle">{t.appSubtitle}</span>
          </div>
        </div>

        {user && (
          <nav className="header-nav">
            <button className={`nav-btn ${tab === 'atlas' ? 'active' : ''}`} onClick={() => setTab('atlas')}>
              {t.atlas}
            </button>
            <button className={`nav-btn ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>
              {t.adminPanel}
            </button>
            <button className={`nav-btn ${tab === 'bodymap' ? 'active' : ''}`} onClick={() => setTab('bodymap')}>
              {t.bodyMapTab}
            </button>
            {user.role === 'admin' && (
              <button className={`nav-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
                {t.usersTab}
              </button>
            )}
          </nav>
        )}

        <div className="header-right-group">
          {/* 2D Clean Language Switcher (RU / UZ) */}
          <div className="wm-lang-switcher">
            <button
              className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
              onClick={() => setLang('ru')}
              title="Русский язык"
            >
              RU
            </button>
            <button
              className={`lang-btn ${lang === 'uz' ? 'active' : ''}`}
              onClick={() => setLang('uz')}
              title="O'zbek tili"
            >
              UZ
            </button>
          </div>

          {authChecked && (
            user ? (
              <div className="session-info">
                <span className="user-badge">{user.email}</span>
                <button className="logout-btn" onClick={logout}>{t.logout}</button>
              </div>
            ) : (
              <button className="login-link" onClick={() => setTab('login')}>
                {t.login}
              </button>
            )
          )}
        </div>
      </header>

      <ErrorBoundary>
        {tab === 'atlas' && <AtlasView lang={lang} />}
        {tab === 'login' && !user && <Login lang={lang} onLoggedIn={(u) => { setUser(u); setTab('admin'); }} />}
        {tab === 'admin' && user && <AdminView lang={lang} />}
        {tab === 'bodymap' && user && <BodyMapAdmin lang={lang} />}
        {tab === 'users' && user?.role === 'admin' && <UsersAdmin lang={lang} currentUser={user} />}
      </ErrorBoundary>
    </div>
  );
}
