import { getUserId } from '../../../utils/user';

const getReportStatusLabel = (status) => {
  if (status === 'IN_PROGRESS') return 'W trakcie';
  if (status === 'NEW' || status === 'OPEN') return 'Nowe';
  if (status === 'RESOLVED' || status === 'CLOSED' || status === 'COMPLETED') return 'Zakończone';
  return status || 'Nieznany';
};

const getReportStatusColors = (status) => {
  const label = getReportStatusLabel(status);

  if (label === 'W trakcie') {
    return { backgroundColor: '#fff3e0', color: '#ef6c00' };
  }

  if (label === 'Nowe') {
    return { backgroundColor: '#e3f2fd', color: '#1565c0' };
  }

  return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
};

const formatDate = (value) => {
  if (!value) {
    return 'Brak daty';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pl-PL');
};

const normalizeString = (value) => {
  if (value == null) return '';
  return String(value).trim();
};

const getAnnouncementOwnerId = (announcement) => {
  const ownerCandidates = [
    announcement?.ownerId,
    announcement?.creatorId,
    announcement?.createdBy,
    announcement?.createdById,
    announcement?.createdByID,
    announcement?.authorId,
    announcement?.userId,
    announcement?.createdByUserId,
    announcement?.creator?.userId,
    announcement?.creator?.id,
    announcement?.creator?.uuid,
    announcement?.createdBy?.userId,
    announcement?.createdBy?.id,
    announcement?.createdBy?.uuid,
    announcement?.author?.userId,
    announcement?.author?.id,
    announcement?.author?.uuid,
    announcement?.user?.userId,
    announcement?.user?.id,
    announcement?.user?.uuid,
    announcement?.owner?.userId,
    announcement?.owner?.id,
    announcement?.owner?.uuid,
  ];

  for (const candidate of ownerCandidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return normalizeString(candidate);
    }

    if (typeof candidate === 'object') {
      const nestedId = normalizeString(
        candidate?.userId ||
        candidate?.id ||
        candidate?.uuid ||
        candidate?.user?.userId ||
        candidate?.user?.id ||
        candidate?.user?.uuid
      );
      if (nestedId) return nestedId;
    }
  }

  return '';
};

const getAnnouncementOwnerEmail = (announcement) => {
  const emailCandidates = [
    announcement?.creatorEmail,
    announcement?.createdByEmail,
    announcement?.authorEmail,
    announcement?.email,
    announcement?.user?.email,
    announcement?.creator?.email,
    announcement?.createdBy?.email,
    announcement?.author?.email,
    announcement?.owner?.email,
  ];

  for (const candidate of emailCandidates) {
    if (candidate) return normalizeString(candidate).toLowerCase();
  }

  return '';
};

const getAnnouncementOwnerUsername = (announcement) => {
  const usernameCandidates = [
    announcement?.creatorUsername,
    announcement?.createdByUsername,
    announcement?.authorUsername,
    announcement?.username,
    announcement?.user?.username,
    announcement?.creator?.username,
    announcement?.createdBy?.username,
    announcement?.author?.username,
    announcement?.owner?.username,
    announcement?.user?.name,
    announcement?.creator?.name,
    announcement?.author?.name,
    announcement?.owner?.name,
  ];

  for (const candidate of usernameCandidates) {
    if (candidate) return normalizeString(candidate).toLowerCase();
  }

  return '';
};

const isAdminUser = (user) => {
  const role = String(user?.role || '').toUpperCase();
  return role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'ROLE_ADMIN';
};

const canDeleteAnnouncement = (announcement, currentUser) => {
  if (!currentUser) return false;
  const currentUserId = normalizeString(getUserId(currentUser));
  const ownerId = normalizeString(getAnnouncementOwnerId(announcement));
  const ownerEmail = getAnnouncementOwnerEmail(announcement);
  const ownerUsername = getAnnouncementOwnerUsername(announcement);

  if (isAdminUser(currentUser)) return true;
  if (ownerId && currentUserId && ownerId === currentUserId) return true;
  if (ownerEmail && currentUser?.email && ownerEmail === normalizeString(currentUser.email).toLowerCase()) return true;
  if (ownerUsername && currentUser?.username && ownerUsername === normalizeString(currentUser.username).toLowerCase()) return true;
  return false;
};

function WidgetList({ items, type, currentUser, onDeleteAnnouncement }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
        <div style={{ fontSize: '14px' }}>Brak danych</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {items.map((item, index) => {
        const statusColors = getReportStatusColors(item.status);

        return (
          <div key={item.uuid || item.id || index} style={{ paddingBottom: '10px', borderBottom: index !== items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ fontWeight: '600', fontSize: '15px' }}>{item.title}</h4>
              {type === 'announcements' && item.isImportant && (
                <span style={{ backgroundColor: '#ffebee', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '5px' }}>WAŻNE</span>
              )}
              {type === 'announcements' && onDeleteAnnouncement && canDeleteAnnouncement(item, currentUser) && (
                <button
                  type="button"
                  onClick={() => onDeleteAnnouncement(item.uuid || item.id || item.announcementId)}
                  style={{
                    fontSize: '12px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Usuń
                </button>
              )}
              {type === 'reports' && (
                <span style={{
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  ...statusColors,
                }}>
                  {getReportStatusLabel(item.status)}
                </span>
              )}
            </div>
            {type === 'announcements' && <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{item.description}</p>}
            {type === 'reports' && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Zgłoszono: {formatDate(item.createdDate || item.createdAt || item.date)}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default WidgetList;
