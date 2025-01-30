import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Cargar email guardado
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Cargar estado de bloqueo
    const blockedUntil = localStorage.getItem('loginBlockedUntil');
    if (blockedUntil && Number(blockedUntil) > Date.now()) {
      setIsBlocked(true);
      setBlockTimer(Math.ceil((Number(blockedUntil) - Date.now()) / 1000));
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (blockTimer > 0) {
      interval = setInterval(() => {
        setBlockTimer(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            localStorage.removeItem('loginBlockedUntil');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [blockTimer]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

 

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    // Validaciones
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un email válido');
      return;
    }

    

    if (isBlocked) {
      setError(`Intenta nuevamente en ${blockTimer} segundos`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      
      // Guardar email si recordarme está activo
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }
      
      setLoginAttempts(0);
      navigate('/dashboard');
    } catch (error) {
      setLoginAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= 3) {
          const blockUntil = Date.now() + (30 * 1000); // 30 segundos de bloqueo
          localStorage.setItem('loginBlockedUntil', blockUntil.toString());
          setIsBlocked(true);
          setBlockTimer(30);
        }
        return newAttempts;
      });
      
      setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
      console.error('Error de login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/api/placeholder/800/600')] opacity-10 mix-blend-overlay" />
        <div className="relative w-full flex flex-col items-center justify-center p-12 text-white">
          <div className="animate-float">
            <Leaf className="h-20 w-20 mb-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4 animate-fadeIn">RNP CONNECT</h1>
          <h2 className="text-2xl mb-6 animate-fadeIn delay-200">Rioja Nature Pharma</h2>
          <p className="text-lg text-center max-w-md opacity-90 animate-fadeIn delay-300">
            Conectando la naturaleza con el bienestar, innovando para un futuro más saludable.
          </p>
          
          {/* Animated Decoration */}
          <div className="absolute bottom-0 left-0 w-full h-64 opacity-20">
            <div className="absolute bottom-0 left-1/4 w-16 h-16 border-2 border-white rounded-full animate-float delay-100" />
            <div className="absolute bottom-20 left-1/2 w-24 h-24 border-2 border-white rounded-full animate-float delay-300" />
            <div className="absolute bottom-40 left-3/4 w-12 h-12 border-2 border-white rounded-full animate-float delay-500" />
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 animate-slideRight">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
            <p className="text-gray-600">Ingresa a tu cuenta de RNP Connect</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg space-y-6 transition-all duration-300 hover:shadow-xl">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isBlocked && (
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                Cuenta bloqueada temporalmente. Intenta nuevamente en {blockTimer} segundos.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-green-600 transition-all duration-300 group-hover:scale-110" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300"
                    placeholder="nombre@riojapharma.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-green-600 transition-all duration-300 group-hover:scale-110" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? 
                      <EyeOff className="h-5 w-5" /> : 
                      <Eye className="h-5 w-5" />
                    }
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                    Recordarme
                  </span>
                </label>
                <div className="relative">
                  <a 
                    href="#" 
                    className="text-sm text-green-600 hover:text-green-800 transition-colors"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTooltip(true);
                      setTimeout(() => setShowTooltip(false), 3000);
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                  {showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-fadeIn">
                      Consulta con Informatica (#163,#197,#183)
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isBlocked}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  </div>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <style>{`
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
              100% { transform: translateY(0px); }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideRight {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
            }
            .animate-float {
              animation: float 6s ease-in-out infinite;
            }
            .animate-fadeIn {
              animation: fadeIn 1s ease-out forwards;
            }
            .animate-slideRight {
              animation: slideRight 0.8s ease-out forwards;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}