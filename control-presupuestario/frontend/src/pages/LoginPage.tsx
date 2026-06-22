import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      await instance.loginPopup(loginRequest);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.errorCode !== 'user_cancelled') {
        setError('No se pudo iniciar sesión. Verifica tu cuenta @celaque.com e intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo – identidad */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#003366] flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF6600] flex items-center justify-center text-lg font-bold">
            C
          </div>
          <span className="font-semibold text-lg">Inversiones Celaque</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-snug">
            Control<br />
            Presupuestario
          </h1>
          <p className="mt-4 text-white/60 text-base max-w-sm">
            Planificación y seguimiento de presupuesto por edificio, con visibilidad en tiempo real
            de lo ejecutado vs. lo planificado.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Presupuesto dividido por edificio',
              'Cuentas y subcuentas jerárquicas',
              'Seguimiento de gastos reales',
              'Reportes y comparativos mensuales',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6600]/20 border border-[#FF6600]/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#FF6600]" />
                </div>
                <span className="text-sm text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">© {new Date().getFullYear()} Inversiones Celaque S.A.</p>
      </div>

      {/* Panel derecho – formulario */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="font-semibold text-gray-800">Celaque · Presupuesto</span>
          </div>

          <Building2 size={32} className="text-[#003366] mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-gray-500">
            Usa tu cuenta corporativa <span className="font-medium text-gray-700">@celaque.com</span>
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-8 w-full flex items-center justify-between bg-[#003366] hover:bg-[#004080] text-white px-5 py-3.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 group"
          >
            <div className="flex items-center gap-3">
              {/* Microsoft logo SVG */}
              <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
                <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
                <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
                <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
              </svg>
              {loading ? 'Conectando...' : 'Continuar con Microsoft'}
            </div>
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            }
          </button>

          <p className="mt-6 text-xs text-center text-gray-400">
            Solo cuentas autorizadas del directorio de Celaque
          </p>
        </div>
      </div>
    </div>
  );
}
