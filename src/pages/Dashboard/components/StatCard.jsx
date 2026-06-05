import React from 'react';

function StatCard({ title, value, subtext, type }) {
  const getIconAndColor = () => {
    switch(type) {
      case 'payment': return { icon: '💵', bg: '#e8f5e9', color: '#2e7d32' };
      case 'reports': return { icon: '❗', bg: '#ffebee', color: '#c62828' };
      case 'messages': return { icon: '✉️', bg: '#e3f2fd', color: '#1565c0' };
      case 'initiatives': return { icon: '👥', bg: '#fff3e0', color: '#ef6c00' };
      default: return { icon: '📌', bg: '#f5f5f5', color: '#333' };
    }
  };

  const config = getIconAndColor();

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '2px' }}>{value}</div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{subtext}</div>
      </div>
      <div style={{ width: '45px', height: '45px', borderRadius: '12px', backgroundColor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
        {config.icon}
      </div>
    </div>
  );
}

export default StatCard;