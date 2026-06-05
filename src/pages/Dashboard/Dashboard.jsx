import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Subpages
import MainDashboardView from './subpages/MainDashboardView';
import Ogloszenia from './subpages/Ogloszenia';
import Zgloszenia from './subpages/Zgloszenia';
import Inicjatywy from './subpages/Inicjatywy';
import Platnosci from './subpages/Platnosci';
import Wiadomosci from './subpages/Wiadomosci';
import Dokumenty from './subpages/Dokumenty';
import Mieszkancy from './subpages/Mieszkańcy';
import Profil from './subpages/Profil';

import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderSubpage = () => {
    switch (activeTab) {
      case 'dashboard': return <MainDashboardView user={user} />;
      case 'ogloszenia': return <Ogloszenia />;
      case 'zgloszenia': return <Zgloszenia />;
      case 'inicjatywy': return <Inicjatywy />;
      case 'platnosci': return <Platnosci user={user} />;
      case 'wiadomosci': return <Wiadomosci user={user} />;
      case 'dokumenty': return <Dokumenty user={user} />;
      case 'mieszkancy': return <Mieszkancy user={user} />;
      case 'profil': return <Profil user={user} />;
      default: return <MainDashboardView user={user} />;
    }
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f4f6f9' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      <div className="main-content" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar user={user} />
        <div className="subpage-wrapper" style={{ marginTop: '20px', flex: 1 }}>
          {renderSubpage()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
