function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: 'ogloszenia', label: 'Ogłoszenia', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> },
    { id: 'zgloszenia', label: 'Zgłoszenia', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
    { id: 'inicjatywy', label: 'Inicjatywy', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
    { id: 'platnosci', label: 'Płatności', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> },
    { id: 'wiadomosci', label: 'Wiadomości', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> },
    { id: 'dokumenty', label: 'Dokumenty', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    { id: 'mieszkancy', label: 'Lista mieszkańców', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
    { id: 'profil', label: 'Mój profil', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
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
              gap: '12px',
              transition: 'all 0.2s',
              color: activeTab === item.id ? '#ffffff' : '#cbd5e1'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', color: activeTab === item.id ? '#60a5fa' : '#94a3b8' }}>{item.icon}</span>
            <span style={{ fontWeight: activeTab === item.id ? '600' : '400', fontSize: '15px' }}>{item.label}</span>
          </div>
        ))}
      </nav>
      <div 
        onClick={onLogout}
        style={{ padding: '15px 25px', cursor: 'pointer', borderTop: '1px solid #134a7c', display: 'flex', alignItems: 'center', gap: '12px', color: '#f87171', transition: 'background-color 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></span>
        <span style={{ fontWeight: '500', fontSize: '15px' }}>Wyloguj się</span>
      </div>
    </div>
  );
}

export default Sidebar;
