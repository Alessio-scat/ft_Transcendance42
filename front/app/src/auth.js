const API_BASE_URL = 'http://127.0.0.1:8001';

const user = {
  isAuthenticated: undefined,
  id: null,
  username: null,
  email: null,
  victories: 0,
  lost: 0,
  online: 0,
  local: 0,
  timeplay: 0,
  nbtotal: 0,
  friends: 0,
};

const setLocalUser = data => {
  user.isAuthenticated = true;
  user.id = data.id;
  user.email = data.email;
  user.username = data.username;

  user.victories = 183;
  user.lost = 13;
  user.online = 160;
  user.local = 27;
  user.timeplay = 130;
  user.nbtotal = 1;
  user.friends = 0;
};

const resetLocalUser = () => {
  user.isAuthenticated = false;
  user.id = null;
  user.email = null;
  user.username = null;
  user.victories = 0;
  user.lost = 0;
  user.online = 0;
  user.local = 0;
  user.timeplay = 0;
  user.nbtotal = 0;
  user.friends = 0;
};

const isAuthenticated = async () => {
  try {
    if (user.isAuthenticated === undefined) {
      resetLocalUser();
      const response = await fetch(`${API_BASE_URL}/accounts/is_user_logged_in/`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setLocalUser(data);
      } else {
        resetLocalUser();
      }
    }
  } catch (error) {
    console.error('Error:', error);
    resetLocalUser();
  }
  return user.isAuthenticated;
};

const getCSRFToken = () => {
  const csrfTokenCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
  if (csrfTokenCookie) {
    console.log('csrf find');
    return csrfTokenCookie.split('=')[1];
  }
  console.log('csrf not find');
  return null; // Retourne null si le cookie CSRF n'est pas trouvé
};

const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}/accounts/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': getCSRFToken(),
      },
    });
  } catch (error) {
    console.error('Error:', error);
  }

  resetLocalUser();
};

const getProfile = () => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstname: '',
    lastname: '',
    avatar: `https://i.pravatar.cc/300?u=6${user.id}`,
  };
};

export { user, isAuthenticated, getCSRFToken, logout, getProfile };
