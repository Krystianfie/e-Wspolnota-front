import { useState, useEffect } from 'react';
import { apiJson, toArray } from '../../../api/client';
import { isAdminUser } from '../../../utils/user';

export default function Inicjatywy() {
  const [activeFilter, setActiveFilter] = useState('Wszystkie');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [voteModalTarget, setVoteModalTarget] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState('');

  const [inicjatywyData, setInicjatywyData] = useState([]);
  
  const [totalUsers, setTotalUsers] = useState(1); 

  // Ładujemy inicjatywy i użytkowników
  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const data = await apiJson('/api/user/me');
        if (isMounted) setCurrentUser(data?.user || data);
      } catch (error) {
        console.error('Błąd pobierania danych aktualnego użytkownika:', error);
        if (isMounted) setCurrentUser(null);
      }
    };

    const loadUsers = async () => {
      try {
        const data = await apiJson('/api/user');
        const users = toArray(data, ['users']);
        if (isMounted) setTotalUsers(users.length > 0 ? users.length : 1);
      } catch (error) {
        console.error('Błąd pobierania listy użytkowników:', error);
      }
    };

    const loadInitiatives = async () => {
      try {
        const data = await apiJson('/api/initiatives');
        if (isMounted) setInicjatywyData(toArray(data, ['initiatives']));
      } catch (error) {
        console.error('Błąd połączenia z serwerem:', error);
        if (isMounted) setInicjatywyData([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrentUser();
    loadUsers();
    loadInitiatives();

    return () => {
      isMounted = false;
    };
  }, []);

  //POBIERANIE INICJATYW
  const fetchInitiatives = async () => {
    setIsLoading(true);
    try {
      const data = await apiJson('/api/initiatives');
      setInicjatywyData(toArray(data, ['initiatives']));
    } catch (error) {
      console.error('Błąd połączenia z serwerem:', error);
      setInicjatywyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  //TWORZENIE INICJATYWY
  const handleSaveInitiative = async () => {
    if (!newTitle || !newContent || !newDate) return alert('Uzupełnij wszystkie pola!');

    const payload = {
      title: newTitle,
      description: newContent,
      deadline: new Date(newDate).toISOString()
    };

    try {
      await apiJson('/api/initiatives/create', {
        method: 'POST',
        json: payload,
      });

      await fetchInitiatives();
      setNewTitle('');
      setNewContent('');
      setNewDate('');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Błąd wysyłania:', error);
      alert('Brak połączenia z API.');
    }
  };

  //ODDANIE GŁOSU
  const handleVote = async (voteValue) => {
    if (!voteModalTarget) return;

    const payload = {
      initiativeId: voteModalTarget, 
      vote: voteValue 
    };

    try {
      await apiJson('/api/initiatives/vote/cast', {
        method: 'POST',
        json: payload,
      });

      await fetchInitiatives(); // Przeładuj świeże dane z nowym procentem głosów
      setVoteModalTarget(null); 
    } catch (error) {
      console.error('Błąd podczas głosowania:', error);
      alert('Brak połączenia z API.');
    }
  };

  const handleDeleteInitiative = async (initiativeId) => {
    if (!initiativeId) {
      alert('Nie można usunąć inicjatywy bez identyfikatora.');
      return;
    }

    if (!isAdminUser(currentUser)) {
      alert('Brak uprawnień do usunięcia inicjatywy.');
      return;
    }

    const confirmed = window.confirm('Czy na pewno chcesz usunąć tę inicjatywę?');
    if (!confirmed) return;

    try {
      await apiJson(`/api/initiatives/delete/${initiativeId}`, {
        method: 'DELETE',
      });
      await fetchInitiatives();
    } catch (error) {
      console.error('Błąd usuwania inicjatywy:', error);
      alert('Nie udało się usunąć inicjatywy.');
    }
  };

  const getInitiativeId = (initiative) => (
    initiative?.initiativeId || initiative?.uuid || initiative?.id || initiative?._id
  );

  const getVoteCount = (initiative, keys) => {
    for (const key of keys) {
      const value = initiative?.[key];
      if (value !== undefined && value !== null && value !== '') {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : 0;
      }
    }

    return 0;
  };

  const getDeadlineDate = (deadline) => {
    if (!deadline) return null;

    const date = new Date(deadline);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isInitiativeExpired = (initiative) => {
    const deadlineDate = getDeadlineDate(initiative?.deadline);
    const isPastDeadline = deadlineDate ? deadlineDate < new Date() : false;
    
    const upvotes = getVoteCount(initiative, ['upvotes', 'upVotes', 'votesFor', 'forVotes', 'yesVotes']);
    const downvotes = getVoteCount(initiative, ['downvotes', 'downVotes', 'votesAgainst', 'againstVotes', 'noVotes']);
    const isFullyVoted = totalUsers > 0 && (upvotes + downvotes) >= totalUsers;

    return isPastDeadline || isFullyVoted;
  };

  const filtry = ['Wszystkie', 'Aktywne', 'Wygasłe'];

  const safeDataToFilter = Array.isArray(inicjatywyData) ? inicjatywyData : [];
  
  const filteredData = safeDataToFilter.filter(item => {
    if (activeFilter === 'Wszystkie') return true;
    
    const isExpired = isInitiativeExpired(item);

    if (activeFilter === 'Aktywne') return !isExpired;
    if (activeFilter === 'Wygasłe') return isExpired;
    
    return true;
  });

  const isAdmin = isAdminUser(currentUser);

  return (
    <div className="subpage-container">
      <div className="subpage-header">
        <h1 style={{ fontWeight: 'bold' }}>Inicjatywy</h1>
        <button className="add-btn-blue" onClick={() => setIsAddModalOpen(true)}>
          + Dodaj inicjatywę
        </button>
      </div>

      <div className="tabs-row">
        {filtry.map(f => {
          let tabClass = 'tab-pill ';
          if (activeFilter === f) {
            if (f === 'Wszystkie') tabClass += 'tab-blue';
            else if (f === 'Aktywne') tabClass += 'tab-green';
            else if (f === 'Wygasłe') tabClass += 'tab-red';
          } else {
            tabClass += 'tab-white';
          }

          return (
            <button key={f} className={tabClass} onClick={() => setActiveFilter(f)}>
              {f}
            </button>
          );
        })}
      </div>

      <hr className="divider-line" />

      {isLoading ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Ładowanie inicjatyw z bazy...</p>
      ) : (
        <div className="initiatives-list">
          {filteredData.map((item, index) => {
    
            const currentId = getInitiativeId(item);
            
            // Obliczanie frekwencji: (głosy za + głosy przeciw) / wszyscy użytkownicy
            const upvotes = getVoteCount(item, ['upvotes', 'upVotes', 'votesFor', 'forVotes', 'yesVotes']);
            const downvotes = getVoteCount(item, ['downvotes', 'downVotes', 'votesAgainst', 'againstVotes', 'noVotes']);
            const totalVotes = upvotes + downvotes;
            const displayPercent = totalUsers > 0
              ? Math.min(100, Math.round((totalVotes / totalUsers) * 100))
              : 0;
            const deadlineDate = getDeadlineDate(item.deadline);
            const isExpired = isInitiativeExpired(item);

            const formattedDeadline = deadlineDate
              ? deadlineDate.toLocaleDateString('pl-PL') 
              : 'Brak daty';

            return (
              <div key={currentId || index}>
                <div className="initiative-row">
                  <div className="initiative-left">
                    <h3>{item.title}</h3>
                    <p className="initiative-desc">{item.description}</p>
                    <div className="progress-section">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${displayPercent}%` }}></div>
                      </div>
                      <div className="progress-stats">
                        <strong>{displayPercent}%</strong><br/>
                        Oddanych głosów
                      </div>
                    </div>
                    {isExpired && (
                      <div className="vote-results">
                        <span className="vote-result vote-result-yes">
                          Za: <strong>{upvotes}</strong>
                        </span>
                        <span className="vote-result vote-result-no">
                          Przeciw: <strong>{downvotes}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="initiative-right">
                    <div className="end-date">
                      <span style={{ fontSize: '11px', color: '#a0aec0' }}>Koniec głosowania:</span><br/>
                      {formattedDeadline}
                    </div>
                    <div className="action-area">
                      {isExpired ? (
                        <button type="button" className="vote-btn vote-btn-ended" disabled>
                          Zakończone
                        </button>
                      ) : item.hasVoted ? (
                        <div className="voted-icon" title="Już oddałeś głos!">✅</div>
                      ) : (
                        <button 
                          className="vote-btn" 
                          onClick={() => {
                            if (!currentId) {
                              alert('Błąd: Serwer nie zwrócił ID tej inicjatywy! Zajrzyj do konsoli (F12).');
                              return;
                            }
                            setVoteModalTarget(currentId);
                          }}
                        >
                          Zagłosuj
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          className="initiative-delete-btn"
                          onClick={() => handleDeleteInitiative(currentId)}
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <hr className="divider-line" />
              </div>
            );
          })}
          {filteredData.length === 0 && (
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Brak inicjatyw do wyświetlenia.</p>
          )}
        </div>
      )}

      {/*DODANIE INICJATYWY */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-label">Tytuł inicjatywy</h3>
            <input 
              type="text" 
              className="modal-input" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <h3 className="modal-label">Treść inicjatywy</h3>
            <textarea 
              className="modal-textarea" 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            ></textarea>

            <h3 className="modal-label">Data zakończenia</h3>
            <input 
              type="date" 
              className="modal-input" 
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />

            <div className="modal-buttons" style={{ marginTop: '30px' }}>
              <button className="modal-btn-save" onClick={handleSaveInitiative}>Zapisz</button>
              <button className="modal-btn-cancel" onClick={() => setIsAddModalOpen(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {/*MODAL GŁOSOWANIA */}
      {voteModalTarget && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: '300px', alignItems: 'center' }}>
            <h3 style={{ marginTop: '0', color: '#718096' }}>Głosowanie</h3>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px', width: '100%' }}>
              <button className="vote-btn-za" onClick={() => handleVote(true)}>Jestem ZA</button>
              <button className="vote-btn-przeciw" onClick={() => handleVote(false)}>Jestem PRZECIW</button>
            </div>
            <button 
              style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', marginTop: '20px' }}
              onClick={() => setVoteModalTarget(null)}
            >
              Anuluj głosowanie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
