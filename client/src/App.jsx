import { useState } from 'react';
import AtlasView from './AtlasView';
import AdminView from './AdminView';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('atlas');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Анатомия — атлас</h1>
        <nav>
          <button className={tab === 'atlas' ? 'active' : ''} onClick={() => setTab('atlas')}>
            Атлас
          </button>
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>
            Админ
          </button>
        </nav>
      </header>
      {tab === 'atlas' ? <AtlasView /> : <AdminView />}
    </div>
  );
}
