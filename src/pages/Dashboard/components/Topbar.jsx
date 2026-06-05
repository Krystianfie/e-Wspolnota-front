import { getGreetingName, getInitials, getRoleLabel, getUserName } from '../../../utils/user';

function Topbar({ user }) {
  const userName = getUserName(user);
  const greetingName = getGreetingName(user);
  const initials = getInitials(user);
  const roleLabel = getRoleLabel(user);

  return (
    <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px' }}>
      <div className="welcome-message">
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
          Dzień dobry, {greetingName}! 👋
        </h1>
      </div>
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#fff', padding: '10px 20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0a3663', display: 'flex', alignItems: 'center', justifySelf: 'center', color: '#fff', justifyContent: 'center', fontWeight: 'bold' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{userName}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{roleLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;
