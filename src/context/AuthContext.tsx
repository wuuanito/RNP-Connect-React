import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { User, AuthContextType } from '../types/auth';

axios.defaults.baseURL = 'http://localhost:3002';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/login', { email, password });

      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);

      setUser({
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
      });

      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Error en la autenticación');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const checkAuth = async () => {
    if (token) {
      try {
        const response = await axios.get('api/verify-token', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, [token]);

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          color: "white",
          fontSize: "18px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            border: "8px solid #f3f3f3",
            borderTop: "8px solid #3498db",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            animation: "spin 2s linear infinite",
            marginBottom: "20px",
          }}
        ></div>
        <p style={{ marginTop: "20px", fontSize: "16px" }}>
          ¡Estamos preparando algo especial para ti! Por favor, espera un momento...
        </p>
  
        {/* Animación en estilos en línea */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ user, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
