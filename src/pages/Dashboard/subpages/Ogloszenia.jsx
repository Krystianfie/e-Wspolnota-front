import { useState, useEffect } from 'react';
import { apiJson, toArray } from '../../../api/client';
import { getUserId } from '../../../utils/user';

export default function Ogloszenia() {
  const [activeFilter, setActiveFilter] = useState('Wszystkie');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Stany formularza dodawania (trzymamy w nich od razu wartości pod backend)
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('INFO'); // Domyślnie INFO
  const [isImportant, setIsImportant] = useState(false);

  const [ogloszeniaData, setOgloszeniaData] = useState([]);

  // 1. POBIERANIE OGŁOSZEŃ
  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await apiJson('/api/announcements');
      setOgloszeniaData(toArray(data, ['announcements']));
    } catch (error) {
      console.error('Błąd połączenia z serwerem:', error);
      setOgloszeniaData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await apiJson('/api/user/me');
        const userData = data?.user || data;
        setCurrentUser(userData);
      } catch (error) {
        console.error('Błąd pobierania danych aktualnego użytkownika:', error);
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
    fetchAnnouncements();
  }, []);

  const normalizeString = (value) => {
    if (value == null) return '';
    return String(value).trim();
  };

  const getAnnouncementOwnerId = (announcement) => {
    const ownerCandidates = [
      announcement?.announcerId,
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

  const canDeleteAnnouncement = (announcement) => {
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

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!announcementId) {
      alert('Nie można usunąć ogłoszenia bez identyfikatora.');
      return;
    }

    const confirmed = window.confirm('Czy na pewno chcesz usunąć to ogłoszenie?');
    if (!confirmed) return;

    try {
      await apiJson(`/api/announcements/delete/${announcementId}`, {
        method: 'DELETE',
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Błąd usuwania ogłoszenia:', error);
      alert('Nie udało się usunąć ogłoszenia.');
    }
  };

  // TWORZENIE OGŁOSZENIA Z ENUMAMI
  const handleSave = async () => {
    if (!newTitle || !newContent) {
      alert('Uzupełnij tytuł i treść!');
      return;
    }

    const payload = {
      title: newTitle,
      description: newContent,
      type: isImportant ? 'WARNING' : newCategory, 
      actionDate: new Date().toISOString().split('T')[0],
      isImportant: isImportant 
    };

    try {
      await apiJson('/api/announcements/create', {
        method: 'POST',
        json: payload,
      });

      await fetchAnnouncements();
      setNewTitle('');
      setNewContent('');
      setNewCategory('INFO');
      setIsImportant(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Błąd wysyłania:', error);
      alert('Brak połączenia z API przy zapisie.');
    }
  };

  const filtry = ['Wszystkie', 'WAŻNE', 'Informacje', 'Prace techniczne'];

  const safeDataToFilter = Array.isArray(ogloszeniaData) ? ogloszeniaData : [];
  
  const filteredData = safeDataToFilter.filter(item => {
    if (activeFilter === 'Wszystkie') return true;
    if (activeFilter === 'WAŻNE') return item.type === 'WARNING' || item.isImportant;
    if (activeFilter === 'Informacje') return item.type === 'INFO';
    if (activeFilter === 'Prace techniczne') return item.type === 'MAINTENANCE';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak daty';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDisplayLabel = (type) => {
    switch(type) {
      case 'WARNING': return 'WAŻNE';
      case 'MAINTENANCE': return 'Prace techniczne';
      case 'INFO': return 'Informacje';
      default: return 'Informacje';
    }
  };

  return (
    <div className="subpage-container">
      <div className="subpage-header">
        <h1 style={{ fontWeight: 'bold' }}>Ogłoszenia</h1>
        <button className="add-btn-blue" onClick={() => setIsModalOpen(true)}>
          + Dodaj ogłoszenie
        </button>
      </div>

      <div className="tabs-row">
        {filtry.map(f => {
          let tabClass = 'tab-pill ';
          if (activeFilter === f) {
            if (f === 'WAŻNE') tabClass += 'tab-red';
            else tabClass += 'tab-blue';
          } else {
            tabClass += 'tab-white';
          }

          return (
            <button 
              key={f}
              className={tabClass}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          );
        })}
      </div>

      <hr className="divider-line" />

      {isLoading ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Ładowanie z bazy...</p>
      ) : (
        <div className="announcements-list">
          {filteredData.map((item, index) => (
            <div key={item.uuid || item.id || index}>
              <div className="announcement-row">
                
                {/* Wyświetlanie etykiety na podstawie ENUMA z bazy */}
                <div className={`badge-pill ${item.type === 'WARNING' || item.isImportant ? 'badge-red' : 'badge-grey'}`} style={{ minWidth: '160px', textAlign: 'center', padding: '15px' }}>
                  {getDisplayLabel(item.type)}
                </div>
                
                <div className="announcement-content" style={{ padding: '0 20px' }}>
                  <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>{item.description}</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="announcement-date" style={{ minWidth: '130px', textAlign: 'right' }}>
                    {formatDate(item.actionDate || item.createdDate || item.createdAt)}
                  </div>
                  {canDeleteAnnouncement(item) && (
                    <button
                      type="button"
                      title="Usuń ogłoszenie"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '5px' }}
                      onClick={() => handleDeleteAnnouncement(item.uuid || item.id || item.announcementId)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  )}
                </div>
                
              </div>
              <hr className="divider-line" />
            </div>
          ))}
          {filteredData.length === 0 && (
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Brak ogłoszeń w tej kategorii.</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-label">Nazwa ogłoszenia</h3>
            <input 
              type="text" 
              className="modal-input" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <h3 className="modal-label">Treść ogłoszenia</h3>
            <textarea 
              className="modal-textarea" 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            ></textarea>

            <h3 className="modal-label">Kategoria</h3>
            <div className="modal-category-row">
              {/* Przyciski ustawiają teraz wartości ENUM pod maską */}
              <button 
                className={`category-btn ${newCategory === 'INFO' ? 'cat-active' : 'cat-inactive'}`}
                onClick={() => setNewCategory('INFO')}
              >
                Informacje
              </button>
              <button 
                className={`category-btn ${newCategory === 'MAINTENANCE' ? 'cat-active' : 'cat-inactive'}`}
                onClick={() => setNewCategory('MAINTENANCE')}
              >
                Prace techniczne
              </button>
            </div>

            <div className="modal-checkbox-row" onClick={() => setIsImportant(!isImportant)}>
              <span className="modal-label" style={{ margin: 0 }}>Ważne?</span>
              <div className="custom-checkbox">
                {isImportant && <span>✓</span>}
              </div>
            </div>

            <div className="modal-buttons">
              <button className="modal-btn-save" onClick={handleSave}>Zapisz</button>
              <button className="modal-btn-cancel" onClick={() => setIsModalOpen(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
