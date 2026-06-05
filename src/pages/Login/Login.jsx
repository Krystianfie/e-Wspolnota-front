import { useState } from 'react';
import { apiJson } from '../../api/client';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Stan do wyświetlania błędów
  const [isLoading, setIsLoading] = useState(false); // Stan ładowania

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Podstawowa walidacja po stronie frontendu
    if (!username || !password) {
      setError('Proszę wpisać login i hasło.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiJson('/api/auth/login', {
        method: 'POST',
        json: {
          username,
          password,
        },
      });

      await onLogin(data, username);
    } catch (err) {
      console.error('Błąd połączenia z serwerem:', err);
      setError(err.status === 401 ? 'Błędny login lub hasło.' : 'Brak połączenia z serwerem API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <div className="logo-placeholder">
            <h1>e-Wspólnota</h1>
          </div>
        </div>
        <div className="login-right">
          <h2>LOGOWANIE</h2>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>NAZWA UŻYTKOWNIKA</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            <div className="input-group">
              <label>HASŁO</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            
            {/* Wyświetlanie błędu nad przyciskiem */}
            {error && <p style={{ color: 'red', fontSize: '12px', textAlign: 'center', margin: '10px 0' }}>{error}</p>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'LOGOWANIE...' : 'ZALOGUJ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
