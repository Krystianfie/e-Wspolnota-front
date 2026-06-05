import { useState } from 'react';
import { apiFetch, apiJson, getUserFromResponse, setAuthToken, toArray } from './api/client';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import './App.css';

const USER_STORAGE_KEY = 'estateapp.user';

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Błąd odczytu zapisanej sesji:', error);
    return null;
  }
};

const saveStoredUser = (user) => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

const getTokenFromResponse = (data) => (
  data?.token ||
  data?.accessToken ||
  data?.jwt ||
  data?.data?.token ||
  data?.data?.accessToken ||
  ''
);

const findUserByUsername = async (username) => {
  if (!username) {
    return null;
  }

  const data = await apiJson('/api/user');
  const users = toArray(data, ['users']);
  const normalizedUsername = username.toLowerCase();

  return users.find(
    (candidate) => candidate.username?.toLowerCase() === normalizedUsername
  ) || null;
};

function App() {
  const [user, setUser] = useState(() => readStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(user));

  const handleLogin = async (loginData, username) => {
    const token = getTokenFromResponse(loginData);
    setAuthToken(token);

    let loggedUser = getUserFromResponse(loginData);

    if (!loggedUser) {
      try {
        loggedUser = await findUserByUsername(username);
      } catch (error) {
        console.error('Błąd pobierania użytkownika po logowaniu:', error);
      }
    }

    const nextUser = loggedUser || { username };

    setUser(nextUser);
    saveStoredUser(nextUser);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout');
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    } finally {
      setAuthToken('');
      saveStoredUser(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <div className="app-container">
      {isAuthenticated ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
