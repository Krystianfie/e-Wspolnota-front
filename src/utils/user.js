export const getUserId = (user) => (
  user?.uuid ||
  user?.userId ||
  user?.userID ||
  user?.id ||
  ''
);

export const getUserName = (user) => {
  const firstName = user?.firstName?.trim() || '';
  const lastName = user?.lastName?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || user?.username || user?.name || 'Użytkownik';
};

export const getGreetingName = (user) => (
  user?.firstName?.trim() ||
  user?.username ||
  user?.name ||
  'Użytkowniku'
);

export const getInitials = (user) => {
  const firstName = user?.firstName?.trim() || '';
  const lastName = user?.lastName?.trim() || '';

  if (firstName || lastName) {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toLocaleUpperCase('pl-PL');
  }

  const nameParts = getUserName(user).split(/\s+/).filter(Boolean);
  const initials = nameParts.slice(0, 2).map((part) => part[0]).join('');

  return (initials || 'U').toLocaleUpperCase('pl-PL');
};

export const isAdminUser = (user) => {
  const role = String(user?.role || user?.status || user?.type || '').toUpperCase();

  return role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'ROLE_ADMIN';
};

export const getRoleLabel = (user) => (
  isAdminUser(user) ? 'administrator' : 'użytkownik'
);
