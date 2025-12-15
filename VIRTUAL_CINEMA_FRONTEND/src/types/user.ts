export interface User {
  id: string;
  username?: string;
  name?: string;
  email: string;
  avatar?: string;
  photoURL?: string;
  role?: 'USER' | 'HOST' | 'ADMIN';
  premium?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
