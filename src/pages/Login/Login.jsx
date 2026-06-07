import { useState } from 'react';
import { apiJson } from '../../api/client';
import './Login.css';

const getApiErrorMessage = async (error, fallbackMessage) => {
  const response = error?.response;
  if (!response) return fallbackMessage;

  try {
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    let extractedMessage = fallbackMessage;

    if (typeof payload === 'string') {
      extractedMessage = payload || fallbackMessage;
    } else {
      const fieldError = Array.isArray(payload?.errors)
        ? payload.errors.find(Boolean)
        : null;

      extractedMessage = (
        payload?.msg ||
        payload?.message ||
        payload?.error ||
        fieldError?.msg ||
        fieldError?.message ||
        fieldError ||
        fallbackMessage
      );
    }

    // Automatyczne tłumaczenie angielskich błędów z backendu na polski
    if (typeof extractedMessage === 'string') {
      const lowerMsg = extractedMessage.toLowerCase();
      if (lowerMsg.includes('bad credentials')) return 'Błędny login lub hasło.';
      if (lowerMsg.includes('invalid password')) return 'Nieprawidłowe hasło.';
      if (lowerMsg.includes('user not found')) return 'Nie znaleziono takiego użytkownika.';
      if (lowerMsg.includes('disabled')) return 'Konto zostało wyłączone.';
      if (lowerMsg.includes('locked')) return 'Konto jest zablokowane.';
      if (lowerMsg.includes('expired')) return 'Konto lub sesja wygasła.';
      if (lowerMsg.includes('unauthorized')) return 'Błędne dane logowania (Brak autoryzacji).';
    }

    return extractedMessage;
  } catch {
    return fallbackMessage;
  }
};

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
      const errorMessage = await getApiErrorMessage(err, err.status === 401 ? 'Błędny login lub hasło.' : 'Brak połączenia z serwerem API.');
      setError(errorMessage);
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
