import { useState, useEffect } from 'react';
import { apiJson, getUserFromResponse } from '../../../api/client';
import { getRoleLabel, getUserId, isAdminUser } from '../../../utils/user';

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
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    setEditedEmail(userData?.email || user?.email || '');
  }, [userData?.email, user?.email]);

  // POBIERANIE DANYCH PROFILU
  const fetchUserProfile = async () => {
    setIsLoading(true);
    const userId = getUserId(user);

    if (!userId) {
      setUserData(user || null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiJson(`/api/user/${userId}`);
      setUserData(getUserFromResponse(data) || user || null);
    } catch (error) {
      console.error('Błąd połączenia z API profilu:', error);
      setUserData(user || null);
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!editedEmail) return alert('Wprowadź adres e-mail.');

    const userId = getUserId(user);
    if (!userId) return alert('Nie można zaktualizować adresu e-mail bez identyfikatora użytkownika.');

    setIsSavingEmail(true);

    try {
      const data = await apiJson(`/api/user/${userId}`, {
        method: 'PUT',
        json: { email: editedEmail },
      });

      const updatedUser = getUserFromResponse(data) || { ...userData, email: editedEmail };
      setUserData(updatedUser);
      setIsEmailEditMode(false);
      alert('E-mail został zaktualizowany.');
    } catch (error) {
      console.error('Błąd aktualizacji e-maila:', error);
      alert('Nie udało się zaktualizować e-maila.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleCancelEmailEdit = () => {
    setIsEmailEditMode(false);
    setEditedEmail(userData?.email || user?.email || '');
  };

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '40px', color: '#718096' }}>Wczytywanie profilu użytkownika...</p>;
  }

  if (!userData) {
    return <p style={{ textAlign: 'center', marginTop: '40px', color: '#ef4444' }}>Nie znaleziono profilu użytkownika.</p>;
  }

  const isUserAdmin = isAdminUser(userData);
  const roleLabel = getRoleLabel(userData);
  const roleColor = isUserAdmin ? '#ef4444' : '#10b981'; // Czerwony dla admina, zielony dla mieszkańca

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
            {/* Tutaj zastosowano dynamiczny kolor w zależności od uprawnień */}
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
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#1a202c',
                  }}
                />
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

      {/* DOLNA SEKCJA: NOTATKI */}
      <div style={{ ...cardStyle, marginTop: '30px', padding: '25px', minHeight: '250px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1a202c' }}>Dodaj notkę...</span>
          {pencilIcon}
        </div>
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
