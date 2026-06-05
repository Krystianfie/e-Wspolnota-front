function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ogloszenia', label: 'Ogłoszenia', icon: '📢' },
    { id: 'zgloszenia', label: 'Zgłoszenia', icon: '⚠️' },
    { id: 'inicjatywy', label: 'Inicjatywy', icon: '👥' },
    { id: 'platnosci', label: 'Płatności', icon: '💳' },
    { id: 'wiadomosci', label: 'Wiadomości', icon: '✉️' },
    { id: 'dokumenty', label: 'Dokumenty', icon: '📄' },
    { id: 'mieszkancy', label: 'Lista mieszkańców', icon: '👥' },
    { id: 'profil', label: 'Mój profil', icon: '👤' },
  ];

  return (
    <div className="sidebar" style={{ width: '250px', backgroundColor: '#0a3663', color: '#fff', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
      <div className="logo" style={{ padding: '0 20px', marginBottom: '30px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>e-Wspólnota</h2>
      </div>
      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              padding: '12px 25px',
              cursor: 'pointer',
              backgroundColor: activeTab === item.id ? '#134a7c' : 'transparent',
              borderLeft: activeTab === item.id ? '4px solid #3b82f6' : '4px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div 
        onClick={onLogout}
        style={{ padding: '15px 25px', cursor: 'pointer', borderTop: '1px solid #134a7c', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <span>🚪</span>
        <span>Wyloguj się</span>
      </div>
    </div>
  );
}

export default Sidebar;
