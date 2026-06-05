function InitiativeWidget({ title, description, percentage }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h4 style={{ fontWeight: '600', fontSize: '15px' }}>{title}</h4>
      <p style={{ fontSize: '13px', color: '#6b7280' }}>{description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
        <div style={{ flex: 1, height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '5px' }}></div>
        </div>
        <div style={{ minWidth: '80px', fontSize: '14px' }}>
          <span style={{ fontWeight: 'bold' }}>{percentage}%</span>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Oddanych głosów</div>
        </div>
      </div>
    </div>
  );
}

export default InitiativeWidget;
