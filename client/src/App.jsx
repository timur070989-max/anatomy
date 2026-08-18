import { useState } from 'react';
import AtlasView from './AtlasView';
import AdminView from './AdminView';
import BodyMapAdmin from './BodyMapAdmin';
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
          <button className={tab === 'bodymap' ? 'active' : ''} onClick={() => setTab('bodymap')}>
            Карта тела
          </button>
        </nav>
      </header>
      {tab === 'atlas' && <AtlasView />}
      {tab === 'admin' && <AdminView />}
      {tab === 'bodymap' && <BodyMapAdmin />}
    </div>
  );
}
