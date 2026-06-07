import { useEffect, useMemo, useState } from 'react';
import { apiJson, toArray } from '../../../api/client';
import { isAdminUser } from '../../../utils/user';

function Mieszkaniec({ user }) {
  const isAdmin = isAdminUser(user);
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResident, setNewResident] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    homeNumber: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);

  const fetchResidents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiJson('/api/user');
      const users = toArray(data, ['users']);
      const residentsList = users.filter(
        (candidate) => String(candidate?.role || '').toUpperCase() === 'RESIDENT'
      );
      setResidents(residentsList);
    } catch (fetchError) {
      console.error('Błąd pobierania mieszkańców:', fetchError);
      setError('Nie udało się pobrać mieszkańców. Spróbuj ponownie za chwilę.');
      setResidents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleAddClick = () => {
    setError(null);
    setFieldErrors({});
    setShowAddForm((prev) => !prev);
  };

  const handleCreateResident = async () => {
    setError(null);
    setFieldErrors({});

    if (
      !newResident.username.trim() ||
      !newResident.password.trim() ||
      !newResident.firstName.trim() ||
      !newResident.lastName.trim() ||
      !newResident.email.trim() ||
      !newResident.homeNumber.trim()
    ) {
      setError('Wypełnij wszystkie pola, aby utworzyć mieszkańca.');
      return;
    }

    try {
      await apiJson('/api/user/createUser', {
        method: 'POST',
        json: {
          username: newResident.username.trim(),
          password: newResident.password.trim(),
          firstName: newResident.firstName.trim(),
          lastName: newResident.lastName.trim(),
          email: newResident.email.trim(),
          homeNumber: newResident.homeNumber.trim(),
        },
      });

      setNewResident({ username: '', password: '', firstName: '', lastName: '', email: '', homeNumber: '' });
      setShowAddForm(false);
      await fetchResidents();
    } catch (createError) {
      console.error('Błąd tworzenia mieszkańca:', createError);

      if (createError?.response?.status === 400) {
        try {
          const errorData = await createError.response.json();
          const errors = {};

          if (Array.isArray(errorData?.msg)) {
            errorData.msg.forEach((err) => {
              if (err.path) {
                errors[err.path] = err.msg;
              }
            });
            setFieldErrors(errors);
          } else {
            setError(errorData?.msg || 'Nie udało się dodać mieszkańca.');
          }
        } catch (parseError) {
          setError('Nie udało się dodać mieszkańca. Sprawdź dane i spróbuj ponownie.');
        }
      } else {
        setError('Nie udało się dodać mieszkańca. Sprawdź dane i spróbuj ponownie.');
      }
    }
  };

  const handleDeleteResident = async (residentId) => {
    setError(null);

    if (!window.confirm('Czy na pewno usunąć tego mieszkańca?')) {
      return;
    }

    try {
      await apiJson(`/api/user/delete/${residentId}`, { method: 'DELETE' });
      setResidents((prev) => prev.filter((resident) => resident.userId !== residentId));
    } catch (firstDeleteError) {
      try {
        await apiJson(`/api/user/${residentId}`, { method: 'DELETE' });
        setResidents((prev) => prev.filter((resident) => resident.userId !== residentId));
      } catch (deleteError) {
        console.error('Błąd usuwania mieszkańca:', deleteError);
        setError('Nie udało się usunąć mieszkańca. Spróbuj ponownie.');
      }
    }
  };

  const residentCount = useMemo(() => residents.length, [residents]);

  return (
    <div className="subpage-container residents-page">
      <div className="subpage-header">
        <h1 style={{ fontWeight: 'bold' }}>Lista mieszkańców</h1>
        {isAdmin && (
          <button type="button" className="add-btn-blue" onClick={handleAddClick}>
            {showAddForm ? 'Anuluj' : 'Dodaj mieszkańca'}
          </button>
        )}
      </div>

      <div className="residents-panel">
        {error && <div className="resident-empty">{error}</div>}

        {isAdmin && showAddForm && (
          <div className="resident-form">
            <label>
              Nazwa użytkownika
              <input
                type="text"
                value={newResident.username}
                onChange={(e) => setNewResident({ ...newResident, username: e.target.value })}
                placeholder="np. nowakanna"
                style={fieldErrors.username ? { borderColor: '#dc2626' } : {}}
              />
              {fieldErrors.username && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.username}</span>}
            </label>
            <label>
              Hasło
              <input
                type="password"
                value={newResident.password}
                onChange={(e) => setNewResident({ ...newResident, password: e.target.value })}
                placeholder="Wprowadź hasło"
                style={fieldErrors.password ? { borderColor: '#dc2626' } : {}}
              />
              {fieldErrors.password && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.password}</span>}
              <span style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Wymogi: min. 8 znaków, duża litera, mała litera, cyfra, symbol
              </span>
            </label>
            <label>
              Imię
              <input
                type="text"
                value={newResident.firstName}
                onChange={(e) => setNewResident({ ...newResident, firstName: e.target.value })}
                placeholder="np. Anna"
                style={fieldErrors.firstName ? { borderColor: '#dc2626' } : {}}
              />
              {fieldErrors.firstName && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.firstName}</span>}
            </label>
            <label>
              Nazwisko
              <input
                type="text"
                value={newResident.lastName}
                onChange={(e) => setNewResident({ ...newResident, lastName: e.target.value })}
                placeholder="np. Nowak"
                style={fieldErrors.lastName ? { borderColor: '#dc2626' } : {}}
              />
              {fieldErrors.lastName && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.lastName}</span>}
            </label>
            <label>
              Email
              <input
                type="email"
                value={newResident.email}
                onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                placeholder="np. user@example.com"
                style={fieldErrors.email ? { borderColor: '#dc2626' } : {}}
              />
              {fieldErrors.email && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.email}</span>}
            </label>
            <label>
              Numer mieszkania
              <input
                type="text"
                value={newResident.homeNumber}
                onChange={(e) => setNewResident({ ...newResident, homeNumber: e.target.value })}
                placeholder="np. 12A"
                style={fieldErrors.homeNumber ? { borderColor: '#dc2626' } : {}}
              />
              {fieldErrors.homeNumber && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.homeNumber}</span>}
              <span style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Wymogi: 1-8 znaków
              </span>
            </label>
            <div className="resident-actions">
              <button type="button" className="resident-button primary" onClick={handleCreateResident}>
                Zapisz mieszkańca
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="resident-empty">Ładowanie mieszkańców...</div>
        ) : (
          <div className="resident-list">
            {residentCount > 0 ? (
              residents.map((resident) => (
                <div key={resident.userId} className="resident-card">
                  <div className="resident-meta">
                    <h3>{`${resident.firstName || ''} ${resident.lastName || ''}`.trim() || resident.username}</h3>
                    <span className="status-badge status-blue">{resident.homeNumber || 'Brak numeru'}</span>
                  </div>
                  <p>{resident.email || resident.username}</p>
                  {isAdmin && (
                    <button
                      type="button"
                      className="resident-button delete"
                      onClick={() => handleDeleteResident(resident.userId)}
                    >
                      Usuń mieszkańca
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="resident-empty">
                Brak mieszkańców do wyświetlenia.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Mieszkaniec;
