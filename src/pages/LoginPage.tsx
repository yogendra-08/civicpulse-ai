import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const user = await login(email, password);

      switch (user.role) {
        case 'citizen':
          navigate('/citizen');
          break;
        case 'officer':
          navigate('/officer');
          break;
        case 'admin':
          navigate('/admin');
          break;
      }
    } catch {
      // Error is already handled by auth context
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      alert(t('login.forgotEmailFirst'));
      return;
    }
    alert(t('login.resetLinkSent'));
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="relative lg:w-1/2 bg-navy-900 text-white p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gov-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-saffron-500/10 rounded-full blur-[100px]" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 text-navy-300 hover:text-white transition text-sm mb-12">
            <ArrowLeft className="h-4 w-4" /> {t('navigation.backToHome')}
          </Link>
          <Logo />
          <div className="mt-12 max-w-md">
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              {t('login.title')}
            </h1>
            <p className="mt-4 text-navy-200 text-lg leading-relaxed">
              {t('login.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <form onSubmit={handleSubmit} className="animate-fade-in">
            <h2 className="text-2xl font-extrabold text-navy-900 mb-1">{t('login.signIn')}</h2>
            <p className="text-slate-500 mb-6">{t('login.enterCredentials')}</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2.5 animate-fade-in-fast">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">{t('login.emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    placeholder={t('login.emailPlaceholder')}
                    className="input pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className="label">{t('login.passwordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    placeholder={t('login.passwordPlaceholder')}
                    className="input pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-600"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gov-600 hover:text-gov-700 font-medium"
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-3 text-base">
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>

            <div className="mt-6 text-center text-sm text-slate-500">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-gov-600 hover:text-gov-700 font-semibold">
                {t('login.registerCitizen')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
