import { useState, useEffect } from 'react';
import { apiFetch, apiJson, toArray } from '../../../api/client';
import { isAdminUser } from '../../../utils/user';

export default function Zgloszenia({ user }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const isAdmin = isAdminUser(currentUser);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Stany formularza dodawania
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Stany wyszukiwania i filtrowania
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [ticketsData, setTicketsData] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiJson('/api/user/me');
        setCurrentUser(data?.user || data);
      } catch (error) {
        console.error('Błąd pobierania danych aktualnego użytkownika:', error);
      }
    };

    if (!user) {
      fetchUser();
    }

    fetchReports();
  }, [user]);

  // POBIERANIE ZGŁOSZEŃ
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await apiJson('/api/reports');
      setTicketsData(toArray(data, ['reports']));
    } catch (error) {
      console.error('Błąd połączenia z serwerem:', error);
      setTicketsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // TWORZENIE ZGŁOSZENIA
  const handleSaveTicket = async () => {
    if (!newTitle || !newContent) return alert('Podaj tytuł i treść zgłoszenia!');
    
    const payload = {
      title: newTitle,
      description: newContent
    };

    try {
      await apiJson('/api/reports/create', {
        method: 'POST',
        json: payload,
      });

      await fetchReports();
      setNewTitle('');
      setNewContent('');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Błąd wysyłania:', error);
      alert('Brak połączenia z API.');
    }
  };

  // USUWANIE ZGŁOSZENIA
  const handleDeleteTicket = async (reportId) => {
    if (!reportId) {
      alert('Nie można usunąć zgłoszenia bez identyfikatora z backendu.');
      return;
    }

    const potwierdzenie = window.confirm('Czy na pewno chcesz usunąć to zgłoszenie?');
    if (!potwierdzenie) return;

    try {
      const response = await apiFetch(`/api/reports/delete/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReports();
      } else if (response.status === 401 || response.status === 403) {
        alert('Brak uprawnień! Tylko administrator może usuwać zgłoszenia.');
      } else {
        alert('Nie udało się usunąć zgłoszenia (Błąd serwera).');
      }
    } catch (error) {
      console.error('Błąd usuwania:', error);
      alert('Brak połączenia z API.');
    }
  };

  // ZMIANA STATUSU ZGŁOSZENIA
  const handleUpdateStatus = async (reportId, newStatus) => {
    if (!reportId) return;
    try {
      try {
        await apiJson(`/api/reports/update/${reportId}`, {
          method: 'PATCH',
          json: { status: newStatus }
        });
      } catch (err1) {
        await apiJson(`/api/reports/update/${reportId}`, {
          method: 'PUT',
          json: { status: newStatus }
        });
      }
      await fetchReports();
    } catch (error) {
      console.error('Błąd zmiany statusu:', error);
      alert('Nie udało się zaktualizować statusu zgłoszenia.');
    }
  };

  // PRZENIESIONE FUNKCJE POMOCNICZE 
  const getBadgeClass = (status) => {
    if (status === 'W trakcie' || status === 'IN_PROGRESS') return 'badge-orange';
    if (status === 'Nowe' || status === 'NEW' || status === 'OPEN') return 'badge-blue';
    if (status === 'Zakończone' || status === 'RESOLVED' || status === 'CLOSED') return 'badge-green';
    return 'badge-grey';
  };

  const getStatusLabel = (status) => {
    if (status === 'IN_PROGRESS') return 'W trakcie';
    if (status === 'NEW' || status === 'OPEN') return 'Nowe';
    if (status === 'RESOLVED' || status === 'CLOSED') return 'Zakończone';
    return status || 'Nieznany';
  };

  const getNormalizedStatusValue = (status) => {
    if (status === 'Nowe' || status === 'OPEN') return 'NEW';
    if (status === 'W trakcie') return 'IN_PROGRESS';
    if (status === 'Zakończone' || status === 'RESOLVED') return 'CLOSED';
    return status || 'NEW';
  };

  // FILTROWANIE DANYCH 
  const safeDataToFilter = Array.isArray(ticketsData) ? ticketsData : [];
  const filteredTickets = safeDataToFilter.filter(ticket => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(ticket.reportNumber || ticket.reportId).includes(searchTerm);
    const ticketPolishStatus = getStatusLabel(ticket.status);
    const matchesStatus = filterStatus ? ticketPolishStatus === filterStatus : true;
    
    let matchesDate = true;
    if (filterDate) {
      const dateString = ticket.createdDate || ticket.createdAt || ticket.date;
      if (dateString) {
        const ticketDateObj = new Date(dateString);
        if (!isNaN(ticketDateObj.getTime())) {
          const year = ticketDateObj.getFullYear();
          const month = String(ticketDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(ticketDateObj.getDate()).padStart(2, '0');
          matchesDate = `${year}-${month}-${day}` === filterDate;
        } else {
          matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="subpage-container">
      {/* NAGŁÓWEK */}
      <div className="subpage-header">
        <h1 style={{ fontWeight: 'bold' }}>Zgłoszenia</h1>

        <div className="header-actions">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Szukaj..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={() => setIsFilterModalOpen(true)}>
            <span style={{ fontSize: '18px' }}>Y</span>
          </button>
          
          <button className="add-btn-blue" onClick={() => setIsAddModalOpen(true)}>
            + Dodaj zgłoszenie
          </button>
        </div>
      </div>

      {/* TABELA ZGŁOSZEŃ */}
      {isLoading ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Ładowanie zgłoszeń z bazy...</p>
      ) : (
        <div className="tickets-table-container">
          <div className="table-header-row">
            <div className="col-id" style={{ width: '10%' }}>ID</div>
            <div className="col-title" style={{ width: '45%' }}>Tytuł</div>
            <div className="col-date" style={{ width: '20%' }}>Data Zgłoszenia</div>
            <div className="col-status" style={{ width: '15%' }}>Status</div>
            <div className="col-actions" style={{ width: '10%', textAlign: 'center' }}>Akcje</div>
          </div>
          
          <div className="table-body">
            {filteredTickets.map((ticket, index) => (
              <div key={ticket.uuid || ticket.reportId || ticket.id || index}>
                <div className="table-row">
                  <div className="col-id font-bold" style={{ width: '10%' }}>
                    #{ticket.reportNumber || ticket.reportId || ticket.id || ticket.uuid}
                  </div>
                  
                  <div className="col-title" style={{ width: '45%' }}>{ticket.title || 'Brak tytułu'}</div>
                  
                  <div className="col-date" style={{ width: '20%' }}>
                    {(ticket.createdDate || ticket.createdAt || ticket.date) ? (
                      new Date(ticket.createdDate || ticket.createdAt || ticket.date).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    ) : 'Brak daty'}
                  </div>
                  
                  <div className="col-status" style={{ width: '15%' }}>
                    {isAdmin ? (
                      <select
                        className={`badge-pill ${getBadgeClass(ticket.status)}`}
                        value={getNormalizedStatusValue(ticket.status)}
                        onChange={(e) => handleUpdateStatus(ticket.uuid || ticket.reportId || ticket.id, e.target.value)}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          outline: 'none',
                          fontWeight: 'bold',
                          fontFamily: 'inherit',
                          padding: '6px 10px'
                        }}
                        title="Zmień status zgłoszenia"
                      >
                        <option value="NEW" style={{color: '#1a202c', background: '#fff'}}>Nowe</option>
                        <option value="IN_PROGRESS" style={{color: '#1a202c', background: '#fff'}}>W trakcie</option>
                        <option value="CLOSED" style={{color: '#1a202c', background: '#fff'}}>Zakończone</option>
                      </select>
                    ) : (
                      <span className={`badge-pill ${getBadgeClass(ticket.status)}`} style={{ display: 'inline-block' }}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    )}
                  </div>
                  
                  <div className="col-actions" style={{ width: '10%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {isAdmin && (
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '5px' }}
                        title="Usuń zgłoszenie"
                        onClick={() => handleDeleteTicket(ticket.uuid || ticket.reportId || ticket.id)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    )}
                  </div>

                </div>
                <hr className="divider-line" />
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Brak wyników do wyświetlenia.</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DODAJ ZGŁOSZENIE */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-label">Tytuł zgłoszenia</h3>
            <input 
              type="text" 
              className="modal-input" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <h3 className="modal-label">Treść zgłoszenia</h3>
            <textarea 
              className="modal-textarea" 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            ></textarea>

            <div className="modal-buttons">
              <button className="modal-btn-save" onClick={handleSaveTicket}>Zapisz</button>
              <button className="modal-btn-cancel" onClick={() => setIsAddModalOpen(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FILTRUJ ZGŁOSZENIA */}
      {isFilterModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-label">Data zgłoszenia</h3>
            <input 
              type="date" 
              className="modal-input" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />

            <h3 className="modal-label">Status zgłoszenia</h3>
            <div className="modal-category-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
              {['Zakończone', 'Nowe', 'W trakcie'].map(status => (
                <button 
                  key={status}
                  className={`category-btn ${filterStatus === status ? getBadgeClass(status) : 'cat-inactive'}`}
                  onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="modal-buttons" style={{ marginTop: '40px' }}>
              <button className="modal-btn-save" onClick={() => setIsFilterModalOpen(false)}>Aplikuj</button>
              <button className="modal-btn-cancel" onClick={() => { setFilterStatus(''); setFilterDate(''); setIsFilterModalOpen(false); }}>Wyczyść</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
