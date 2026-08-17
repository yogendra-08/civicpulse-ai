import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Mail, Lock, Phone, MapPin, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { realAuthService } from '@/services/realAuthService';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    ward: '',
    address: '',
  });

  const wards = [
    'Ward 01', 'Ward 02', 'Ward 03', 'Ward 04', 'Ward 05',
    'Ward 06', 'Ward 07', 'Ward 08', 'Ward 09', 'Ward 10',
    'Ward 11', 'Ward 12', 'Ward 13', 'Ward 14', 'Ward 15',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError(t('register.errors.fullNameRequired'));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t('register.errors.emailRequired'));
      return false;
    }
    if (!formData.email.includes('@')) {
      setError(t('register.errors.invalidEmail'));
      return false;
    }
    if (!formData.password) {
      setError(t('register.errors.passwordRequired'));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t('register.errors.passwordMinLength'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.errors.passwordMismatch'));
      return false;
    }
    if (!formData.ward) {
      setError(t('register.errors.wardRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: registerError } = await realAuthService.registerCitizen({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        ward: formData.ward,
        address: formData.address || undefined,
      });

      if (registerError) {
        setError(registerError);
        setLoading(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/citizen');
      }, 2000);
    } catch {
      setError(t('register.errors.registrationFailed'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">{t('register.successTitle')}</h2>
            <p className="text-slate-600 mb-4">{t('register.accountCreated')}</p>
            <p className="text-sm text-slate-500">{t('register.successMessage')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 transition">
            <ArrowLeft className="h-4 w-4" /> {t('register.backToLogin')}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-900 text-white mx-auto mb-4">
              <User className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">{t('register.citizenTitle')}</h1>
            <p className="text-slate-500 mt-2">{t('register.citizenDescription')}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('register.fullNameLabel')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={t('register.fullNamePlaceholder')}
                  className="input pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('register.emailLabel')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('register.emailPlaceholder')}
                  className="input pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('register.passwordLabel')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('register.passwordPlaceholder')}
                    className="input pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="label">{t('register.confirmPasswordLabel')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('register.confirmPasswordPlaceholder')}
                    className="input pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">{t('register.phoneLabelSimple')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('register.phonePlaceholder')}
                  className="input pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('register.wardLabelSimple')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  className="input pl-9"
                  disabled={loading}
                >
                  <option value="">{t('register.wardPlaceholder')}</option>
                  {wards.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t('register.addressLabel')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('register.addressPlaceholder')}
                  className="input pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? t('register.creatingAccount') : t('register.createAccount')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {t('register.alreadyAccount')}{' '}
            <Link to="/login" className="text-gov-600 hover:text-gov-700 font-semibold">
              {t('register.signIn')}
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <p>{t('register.agreement')}</p>
        </div>
      </div>
    </div>
  );
}
