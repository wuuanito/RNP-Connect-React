export interface User {
    id: number;
    email: string;
    role: 'admin' | 'user';
  }
  
  export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    token: string | null;
  }