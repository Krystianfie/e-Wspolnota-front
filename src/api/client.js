export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ketyo.online';

export class ApiError extends Error {
  constructor(response, message = 'Błąd połączenia z API') {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    this.status = response.status;
  }
}

const AUTH_TOKEN_KEY = 'estateapp.authToken';

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

export const apiUrl = (path, query = {}) => {
  const url = new URL(path, API_BASE_URL);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

export const apiFetch = (path, options = {}) => {
  const { json, query, headers, ...fetchOptions } = options;
  const requestHeaders = new Headers(headers || {});
  const token = getAuthToken();

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (json !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return fetch(apiUrl(path, query), {
    credentials: 'include',
    ...fetchOptions,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : fetchOptions.body,
  });
};

export const apiJson = async (path, options = {}) => {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    throw new ApiError(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const toArray = (data, keys = []) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const candidates = [
    ...keys.map((key) => data[key]),
    data.data,
    data.items,
    data.results,
  ];

  return candidates.find(Array.isArray) || [];
};

export const getUserFromResponse = (data) => {
  const candidates = [
    data?.user,
    data?.data?.user,
    data?.profile,
    data,
  ];

  return candidates.find((candidate) => {
    if (!candidate || typeof candidate !== 'object') {
      return false;
    }

    return [
      'uuid',
      'id',
      'userId',
      'firstName',
      'lastName',
      'username',
      'name',
      'email',
      'role',
    ].some((key) => key in candidate);
  }) || null;
};
