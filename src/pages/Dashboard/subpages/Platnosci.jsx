import { useState, useEffect } from 'react';
import { apiJson, toArray } from '../../../api/client';
import { getUserId, isAdminUser } from '../../../utils/user';

export default function Platnosci({ user }) {
  const isAdmin = isAdminUser(user);
  const userId = getUserId(user);
  
  const [paymentsData, setPaymentsData] = useState([]);
  const [users, setUsers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [userSearchTerm, setUserSearchTerm] = useState(''); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [newPayerId, setNewPayerId] = useState(''); 
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPeriod, setNewPeriod] = useState(''); 
  const [newDeadline, setNewDeadline] = useState(''); 

  useEffect(() => {
    fetchPayments();
    if (isAdmin) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [isAdmin, userId]);

  const fetchPayments = async () => {
    setIsLoading(true);

    if (!isAdmin && !userId) {
      setPaymentsData([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiJson('/api/payments', {
        query: isAdmin ? {} : { payerId: userId },
      });
      setPaymentsData(toArray(data, ['paymentRequests', 'payments']));
    } catch (error) {
      console.error('Błąd połączenia z API:', error);
      setPaymentsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiJson('/api/user');
      setUsers(toArray(data, ['users']));
    } catch (error) {
      console.error('Błąd pobierania użytkowników:', error);
      setUsers([]);
    }
  };

  const handleSavePayment = async () => {
    if (!newPayerId) {
      alert('Błąd: Nie wybrano mieszkańca! Musisz kliknąć jego nazwisko na liście.');
      return;
    }
    if (!newTitle || !newAmount || !newPeriod || !newDeadline) {
      alert('Uzupełnij wszystkie wymagane pola formularza (Tytuł, Kwota, Okres, Termin)!');
      return;
    }

    const payload = {
      payerId: newPayerId,                     
      title: newTitle,                         
      description: newDescription,             
      amount: Number(newAmount),               
      period: newPeriod,                       
      deadline: new Date(newDeadline).toISOString() 
    };

    try {
      await apiJson('/api/payments/create', {
        method: 'POST',
        json: payload,
      });

      alert('Nowe żądanie płatności zostało pomyślnie utworzone!');
      await fetchPayments();

      setNewPayerId('');
      setUserSearchTerm('');
      setNewTitle('');
      setNewDescription('');
      setNewAmount('');
      setNewPeriod('');
      setNewDeadline('');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Błąd wysyłania nowej płatności:', error);
      alert('Brak połączenia z API.');
    }
  };

  const handleUpdateStatus = async (uuid, newStatus) => {
    if (!uuid) {
      alert('Nie można zmienić statusu płatności bez identyfikatora z backendu.');
      return;
    }

    try {
      await apiJson(`/api/payments/updateStatus/${uuid}`, {
        method: 'PATCH',
        json: { status: newStatus },
      });

      if (newStatus === 'PENDING') alert('Płatność została zgłoszona do weryfikacji.');
      if (newStatus === 'ACCEPTED') alert('Płatność została pomyślnie zaakceptowana!');
      if (newStatus === 'REJECTED') alert('Płatność została odrzucona.');
      await fetchPayments();
    } catch (error) {
      console.error('Błąd aktualizacji płatności:', error);
      alert('Wystąpił błąd podczas zmiany statusu.');
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'NEW': return 'Do zapłaty';
      case 'PENDING': return 'Weryfikacja';
      case 'ACCEPTED': return 'Opłacone';
      case 'REJECTED': return 'Odrzucone';
      default: return status || 'Nieznany';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'NEW': return 'badge-orange';
      case 'PENDING': return 'badge-blue';
      case 'ACCEPTED': return 'badge-green';
      case 'REJECTED': return 'badge-red';
      default: return 'badge-grey';
    }
  };

  return (
    <div className="subpage-container" onClick={() => setIsDropdownOpen(false)}>
      <div className="subpage-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontWeight: 'bold' }}>Płatności</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#e2e8f0', padding: '8px 15px', borderRadius: '10px', fontSize: '13px' }}>
            <span style={{ fontWeight: 'bold' }}>Widok: {isAdmin ? 'administrator' : 'użytkownik'}</span>
          </div>

          {isAdmin && (
            <button className="add-btn-blue" onClick={(e) => { e.stopPropagation(); setIsAddModalOpen(true); }}>
              + Dodaj płatność
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Ładowanie historii płatności...</p>
      ) : (
        <div className="tickets-table-container">
          <div className="table-header-row shadow-header">
            <div className="col-okres">Okres</div>
            <div className="col-tytul">Tytuł</div>
            <div className="col-kwota">Kwota</div>
            <div className="col-status">Status</div>
            <div className="col-akcje">Akcje</div>
          </div>
          
          <div className="table-body">
            {paymentsData.map((payment, index) => {
              // Zaktualizowano identyfikator o paymentRequestId z JSON-a
              const currentUuid = payment.paymentRequestId || payment.uuid || payment.paymentId || payment.id;
              const currentStatus = payment.status;

              return (
                <div key={currentUuid || `payment-${index}`}>
                  <div className="table-row">
                    <div className="col-okres font-bold" style={{ color: '#4a5568' }}>
                      {payment.period || '---'}
                    </div>
                    <div className="col-tytul font-bold">
                      {payment.title}
                    </div>
                    <div className="col-kwota font-bold">
                      {payment.amount} zł
                    </div>
                    
                    <div className="col-status">
                      <span className={`badge-pill ${getStatusBadge(currentStatus)}`}>
                        {getStatusLabel(currentStatus)}
                      </span>
                    </div>
                    
                    <div className="col-akcje">
                      {isAdmin ? (
                        currentStatus === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              className="register-btn" 
                              style={{ backgroundColor: '#10b981', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)' }}
                              onClick={() => handleUpdateStatus(currentUuid, 'ACCEPTED')}
                            >
                              Akceptuj
                            </button>
                            <button 
                              className="register-btn" 
                              style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)', padding: '10px 15px' }}
                              onClick={() => {
                                if(window.confirm('Czy na pewno chcesz odrzucić tę wpłatę?')) {
                                  handleUpdateStatus(currentUuid, 'REJECTED');
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : currentStatus === 'ACCEPTED' ? (
                          <div className="success-icon"><span style={{ fontSize: '24px' }}>🛡️</span></div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#a0aec0', fontWeight: 'bold' }}>Brak akcji</span>
                        )
                      ) : (
                        currentStatus === 'NEW' ? (
                          <button 
                            className="register-btn"
                            onClick={() => handleUpdateStatus(currentUuid, 'PENDING')}
                          >
                            Zarejestruj
                          </button>
                        ) : currentStatus === 'ACCEPTED' ? (
                          <div className="success-icon"><span style={{ fontSize: '24px' }}>🛡️</span></div>
                        ) : currentStatus === 'REJECTED' ? (
                          <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>Odrzucona</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>Weryfikacja...</span>
                        )
                      )}
                    </div>
                  </div>
                  <hr className="divider-line" />
                </div>
              );
            })}
            {paymentsData.length === 0 && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#718096' }}>Brak zarejestrowanych płatności w bazie.</p>
            )}
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-box" style={{ width: '380px' }} onClick={(e) => e.stopPropagation()}>
            
            <h3 className="modal-label">Wybierz Mieszkańca *</h3>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text" 
                className="modal-input" 
                placeholder="Wyszukaj po imieniu i nazwisku..."
                value={userSearchTerm}
                onChange={(e) => {
                  setUserSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (!e.target.value) setNewPayerId(''); 
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
              
              {isDropdownOpen && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  backgroundColor: 'white', 
                  border: '1px solid #cbd5e0', 
                  borderRadius: '8px', 
                  maxHeight: '160px', 
                  overflowY: 'auto', 
                  zIndex: 999,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                  {users
                    .filter(u => {
                      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                      return fullName.includes(userSearchTerm.toLowerCase());
                    })
                    .map((u, i) => {
                      const currentUserId = u.userId || u.userID || u.id || u.uuid;
                      
                      return (
                        <div 
                          key={currentUserId || `user-drop-${i}`} 
                          style={{ 
                            padding: '10px 15px', 
                            cursor: 'pointer', 
                            borderBottom: '1px solid #edf2f7',
                            fontSize: '13px',
                            color: '#2d3748',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          onClick={() => {
                            setNewPayerId(currentUserId); 
                            
                            setUserSearchTerm(`${u.firstName || ''} ${u.lastName || ''} ${u.homeNumber ? `| lok. ${u.homeNumber}` : ''}`);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <strong>{u.firstName} {u.lastName}</strong> {u.homeNumber ? `(lok. ${u.homeNumber})` : ''}
                        </div>
                      );
                    })
                  }
                  {users.filter(u => `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 && (
                    <div style={{ padding: '10px 15px', color: '#a0aec0', fontSize: '13px', textAlign: 'center' }}>
                      Nie znaleziono użytkownika
                    </div>
                  )}
                </div>
              )}
            </div>

            <h3 className="modal-label" style={{ marginTop: '15px' }}>Tytuł obciążenia *</h3>
            <input 
              type="text" 
              className="modal-input" 
              placeholder="np. Czynsz administracyjny"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <h3 className="modal-label">Opis dodatkowy</h3>
            <textarea 
              className="modal-textarea" 
              placeholder="np. Opłata zawiera zaliczkę na ogrzewanie"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            ></textarea>

            <h3 className="modal-label">Kwota (zł) *</h3>
            <input 
              type="number" 
              className="modal-input" 
              placeholder="np. 1500"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />

            <h3 className="modal-label">Okres rozliczeniowy (YYYY-MM) *</h3>
            <input 
              type="text" 
              className="modal-input" 
              placeholder="np. 2026-06"
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
            />

            <h3 className="modal-label">Termin płatności *</h3>
            <input 
              type="date" 
              className="modal-input" 
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />

            <div className="modal-buttons" style={{ marginTop: '30px' }}>
              <button className="modal-btn-save" onClick={handleSavePayment}>Utwórz</button>
              <button className="modal-btn-cancel" onClick={() => {
                setIsAddModalOpen(false);
                setIsDropdownOpen(false);
              }}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
