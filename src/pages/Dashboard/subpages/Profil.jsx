import { useState, useEffect } from 'react';
import { apiJson, getUserFromResponse } from '../../../api/client';
import { getRoleLabel, getUserId, isAdminUser } from '../../../utils/user';

const getProfileNote = (profile) => (
  profile && 'note' in profile ? profile.note :
  profile && 'notes' in profile ? profile.notes :
  profile && 'userNote' in profile ? profile.userNote :
  profile && 'description' in profile ? profile.description :
  ''
);

const getApiErrorMessage = async (error, fallbackMessage) => {
  const response = error?.response;
  if (!response) return fallbackMessage;

  try {
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (typeof payload === 'string') {
      return payload || fallbackMessage;
    }

    const fieldError = Array.isArray(payload?.errors)
      ? payload.errors.find(Boolean)
      : null;

    return (
      payload?.message ||
      payload?.error ||
      fieldError?.message ||
      fieldError ||
      fallbackMessage
    );
  } catch {
    return fallbackMessage;
  }
};

export default function Profil({ user }) {
  const [userData, setUserData] = useState(user || null);
  const [isLoading, setIsLoading] = useState(true);

  // Stany dla modala zmiany hasła
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEmailEditMode, setIsEmailEditMode] = useState(false);
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isNoteEditMode, setIsNoteEditMode] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const applyLoadedUser = (profile) => {
      setUserData(profile);
      setEditedEmail(profile?.email || '');
      setEmailPassword('');
      setEditedNote(getProfileNote(profile));
    };

    const fetchUserProfile = async () => {
      setIsLoading(true);
      const userId = getUserId(user);

      if (!userId) {
        if (isMounted) {
          applyLoadedUser(user || null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await apiJson(`/api/user/${userId}`);
        if (isMounted) {
          applyLoadedUser(getUserFromResponse(data) || user || null);
        }
      } catch (error) {
        console.error('Błąd połączenia z API profilu:', error);
        if (isMounted) applyLoadedUser(user || null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. ZMIANA HASŁA (POST)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return alert('Uzupełnij oba pola hasła!');

    setIsChangingPassword(true);
    const payload = { oldPassword, newPassword };

    try {
      await apiJson('/api/auth/changePassword', {
        method: 'POST',
        json: payload,
      });

      alert('Hasło zostało pomyślnie zmienione!');
      setOldPassword('');
      setNewPassword('');
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error('Błąd podczas zmiany hasła:', error);
      alert('Błąd: Nie udało się zmienić hasła.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    const nextEmail = editedEmail.trim();

    if (!nextEmail) return alert('Wprowadź adres e-mail.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return alert('Wprowadź poprawny adres e-mail.');
    }

    setIsSavingEmail(true);
    const userUuid = userData?.userId || userData?.uuid || userData?.id || user?.userId || user?.uuid || user?.id || getUserId(userData) || getUserId(user);

    try {
      let data;
      try {
      
        data = await apiJson(`/api/user/${userUuid}`, {
          method: 'PUT',
          json: { ...userData, email: nextEmail, password: emailPassword || undefined },
        });
      } catch (err1) {
        try {
         
          data = await apiJson('/api/user/updateEmail', {
            method: 'PATCH',
            json: { email: nextEmail, password: emailPassword || undefined, userId: userUuid, uuid: userUuid },
          });
        } catch (err2) {
  
          data = await apiJson('/api/user/updateEmail', {
            method: 'POST',
            json: { email: nextEmail, password: emailPassword || undefined, userId: userUuid, uuid: userUuid },
          });
        }
      }

      const updatedUser = getUserFromResponse(data) || { ...userData, email: nextEmail };
      setUserData(updatedUser);
      setEditedEmail(nextEmail);
      setEmailPassword('');
      setIsEmailEditMode(false);
      alert('E-mail został zaktualizowany.');
    } catch (error) {
      const message = await getApiErrorMessage(
        error,
        error?.status === 400
          ? 'Backend odrzucił dane. Sprawdź adres e-mail i aktualne hasło.'
          : 'Nie udało się zaktualizować e-maila.'
      );

      console.error('Błąd aktualizacji e-maila:', error, message);
      alert(message);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleCancelEmailEdit = () => {
    setIsEmailEditMode(false);
    setEditedEmail(userData?.email || user?.email || '');
    setEmailPassword('');
  };

  const handleSaveNote = async () => {
    const userUuid = userData?.userId || userData?.uuid || userData?.id || user?.userId || user?.uuid || user?.id || getUserId(userData) || getUserId(user);
    if (!userUuid) return alert('Nie można zapisać notatki bez identyfikatora użytkownika.');

    setIsSavingNote(true);

    try {
      let data;
      try {
      
        data = await apiJson(`/api/user/${userUuid}`, {
          method: 'PUT',
          json: { ...userData, note: editedNote },
        });
      } catch (err1) {
        try {
          
          data = await apiJson('/api/user/updateNote', {
            method: 'PATCH',
            json: { note: editedNote, uuid: userUuid, userId: userUuid },
          });
        } catch (err2) {
        
          data = await apiJson('/api/user/updateNote', {
            method: 'POST',
            json: { note: editedNote, uuid: userUuid, userId: userUuid },
          });
        }
      }

      const updatedUser = getUserFromResponse(data);
      setUserData((previousUser) => ({
        ...previousUser,
        ...(updatedUser || {}),
        note: getProfileNote(updatedUser) || editedNote,
      }));
      setIsNoteEditMode(false);
      alert('Notatka została zapisana.');
    } catch (error) {
      const message = await getApiErrorMessage(
        error,
        error?.status === 400
          ? 'Backend odrzucił notatkę. Sprawdź treść i identyfikator użytkownika.'
          : 'Nie udało się zapisać notatki.'
      );

      console.error('Błąd zapisu notatki:', error, message);
      alert(message);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelNoteEdit = () => {
    setIsNoteEditMode(false);
    setEditedNote(getProfileNote(userData));
  };

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '40px', color: '#718096' }}>Wczytywanie profilu użytkownika...</p>;
  }

  if (!userData) {
    return <p style={{ textAlign: 'center', marginTop: '40px', color: '#ef4444' }}>Nie znaleziono profilu użytkownika.</p>;
  }

  const isUserAdmin = isAdminUser(userData);
  const roleLabel = getRoleLabel(userData);
  const roleColor = isUserAdmin ? '#ef4444' : '#10b981';

  const cardStyle = {
    backgroundColor: '#f3f4f6', 
    borderRadius: '15px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)', 
    position: 'relative'
  };

  const inputCardStyle = {
    ...cardStyle,
    borderRadius: '10px',
    padding: '20px 25px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px'
  };

  const pencilIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  );

  return (
    <div className="subpage-container" style={{ padding: '30px', maxWidth: '1000px' }}>
      <h1 style={{ fontWeight: 'bold', fontSize: '24px', marginBottom: '30px', color: '#1a202c' }}>
        Mój profil
      </h1>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* LEWA KARTA: AWATAR I DANE */}
        <div style={{ ...cardStyle, flex: '1 1 45%', padding: '40px 30px', display: 'flex', alignItems: 'center', gap: '30px', minWidth: '350px' }}>
          <div style={{ width: '130px', height: '130px', backgroundColor: '#e2e8f0', borderRadius: '50%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ fill: '#4a5568', marginTop: '20px' }}>
              <circle cx="50" cy="35" r="20" fill="#f6ad55" />
              <path d="M20 90 Q 50 50 80 90 Z" fill="#2b6cb0" />
            </svg>
          </div>
          
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a202c', fontFamily: 'serif' }}>
              {userData.firstName} {userData.lastName}
            </h2>
            <p style={{ margin: '0 0 5px 0', color: roleColor, fontSize: '16px', fontWeight: 'bold' }}>
              {roleLabel}
            </p>
            <p style={{ margin: '0', color: '#4a5568', fontSize: '16px' }}>
              nr mieszkania: {userData.homeNumber || 'brak'}
            </p>
          </div>
        </div>

        {/* PRAWA KOLUMNA: LOGIN, HASŁO, E-MAIL */}
        <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '300px' }}>
          
          <div style={inputCardStyle}>
            <div>
              <span style={{ fontWeight: 'bold' }}>LOGIN: </span>
              <span>{userData.username}</span>
            </div>
          </div>

          <div style={inputCardStyle}>
            <div>
              <span style={{ fontWeight: 'bold' }}>HASŁO: </span>
              <span>*************</span>
            </div>
            <div onClick={() => setIsPasswordModalOpen(true)}>
              {pencilIcon}
            </div>
          </div>

          <div style={{ ...inputCardStyle, flexDirection: isEmailEditMode ? 'column' : 'row', alignItems: isEmailEditMode ? 'stretch' : 'center', gap: isEmailEditMode ? '16px' : '0' }}>
            <div style={{ width: '100%' }}>
              <span style={{ fontWeight: 'bold' }}>E-MAIL: </span>
              {isEmailEditMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    placeholder="Nowy adres e-mail"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#1a202c',
                    }}
                  />
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Aktualne hasło"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#1a202c',
                    }}
                  />
                </div>
              ) : (
                <span>{userData.email}</span>
              )}
            </div>
            {isEmailEditMode ? (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
                <button
                  type="button"
                  onClick={handleCancelEmailEdit}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'white',
                    color: '#4a5568',
                    cursor: 'pointer',
                  }}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={isSavingEmail}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#2b6cb0',
                    color: 'white',
                    cursor: isSavingEmail ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSavingEmail ? 'Zapisz...' : 'Zapisz'}
                </button>
              </div>
            ) : (
              <div onClick={() => setIsEmailEditMode(true)}>
                {pencilIcon}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ==================================================== */}
      {/* DOLNA SEKCJA: NOTATKI (POPRAWIONA INTERAKCJA)        */}
      {/* ==================================================== */}
      <div 
        style={{ 
          ...cardStyle, 
          marginTop: '30px', 
          padding: '25px', 
          minHeight: '250px',
          cursor: isNoteEditMode ? 'default' : 'pointer', // Pokazuje, że można w to kliknąć
          transition: 'background-color 0.2s ease'
        }}
        // KLIKNIĘCIE W CAŁE POLE AKTYWUJE EDYCJĘ:
        onClick={() => {
          if (!isNoteEditMode) {
            setEditedNote(getProfileNote(userData) || '');
            setIsNoteEditMode(true);
          }
        }}
        onMouseEnter={(e) => {
          if (!isNoteEditMode) e.currentTarget.style.backgroundColor = '#edf2f7';
        }}
        onMouseLeave={(e) => {
          if (!isNoteEditMode) e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1a202c' }}>Notatka</span>
            {isNoteEditMode ? (
              <textarea
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                onClick={(e) => e.stopPropagation()} // BLOKADA: Zapobiega bugowaniu po kliknięciu w środek pola tekstowego
                placeholder="Dodaj notatkę..."
                autoFocus // Kursor automatycznie ląduje w polu
                style={{
                  width: '100%',
                  minHeight: '160px',
                  marginTop: '16px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  color: '#1a202c',
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              />
            ) : (
              <p style={{
                margin: '16px 0 0',
                color: getProfileNote(userData) ? '#4a5568' : '#a0aec0',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}>
                {getProfileNote(userData) || 'Brak notatki. Kliknij tutaj, aby ją dodać...'}
              </p>
            )}
          </div>

          {!isNoteEditMode && (
            <div style={{ color: '#a0aec0' }}>
              {pencilIcon}
            </div>
          )}
        </div>

        {isNoteEditMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // BLOKADA
                handleCancelNoteEdit();
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'white',
                color: '#4a5568',
                cursor: 'pointer',
              }}
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // BLOKADA
                handleSaveNote();
              }}
              disabled={isSavingNote}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2b6cb0',
                color: 'white',
                cursor: isSavingNote ? 'not-allowed' : 'pointer',
              }}
            >
              {isSavingNote ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        )}
      </div>

      {/* ZMIANA HASŁA */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-box" style={{ width: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-label" style={{ fontSize: '18px', marginBottom: '20px' }}>Zmień hasło</h3>
            
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '5px', fontWeight: 'bold' }}>
                  Aktualne hasło *
                </label>
                <input 
                  type="password" 
                  className="modal-input" 
                  style={{ width: '100%', margin: 0 }}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#4a5568', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nowe hasło *
                </label>
                <input 
                  type="password" 
                  className="modal-input" 
                  style={{ width: '100%', margin: 0 }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="modal-buttons" style={{ marginTop: '20px' }}>
                <button 
                  type="submit" 
                  className="modal-btn-save" 
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button 
                  type="button" 
                  className="modal-btn-cancel" 
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}