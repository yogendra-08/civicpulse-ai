import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { realAuthService } from '@/services/realAuthService';

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const citizenFields = user?.role === 'citizen' ? user : null;

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: citizenFields?.phone || '',
    ward: citizenFields?.ward || '',
    address: citizenFields?.address || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      const citizenInfo = user.role === 'citizen' ? user : null;
      setFormData({
        fullName: user.name || '',
        phone: citizenInfo?.phone || '',
        ward: citizenInfo?.ward || '',
        address: citizenInfo?.address || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await realAuthService.updateProfile({
        full_name: formData.fullName,
        phone: formData.phone || undefined,
        ward: formData.ward,
        address: formData.address || undefined,
      });

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(t('profile.failedUpdateProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError(t('profile.fillPasswordFields'));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('profile.newPasswordsMismatch'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await realAuthService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(t('profile.failedUpdatePassword'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {t('profile.backToDashboard')}
      </button>

      <h1 className="text-2xl font-extrabold text-navy-900 mb-1">{t('profile.myProfile')}</h1>
      <p className="text-slate-500 mb-6">{t('profile.description')}</p>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-sm text-emerald-700">{t('profile.profileUpdatedSuccess')}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900">{t('profile.profileInformation')}</h2>
              <p className="text-sm text-slate-500">{t('profile.updatePersonalDetails')}</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="label">{t('profile.emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input pl-9 bg-slate-50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{t('profile.emailCannotChange')}</p>
            </div>

            <div>
              <label className="label">{t('profile.fullName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">{t('profile.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">{t('profile.ward')}</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.ward}
                  disabled
                  className="input pl-9 bg-slate-50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{t('profile.wardCannotChange')}</p>
            </div>

            <div>
              <label className="label">{t('profile.address')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('register.addressPlaceholder')}
                  className="input pl-9"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? t('profile.saving') : <><Save className="h-4 w-4 inline mr-2" /> {t('profile.save')}</>}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900">{t('profile.changePassword')}</h2>
              <p className="text-sm text-slate-500">{t('profile.updateSecurityCredentials')}</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">{t('profile.currentPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder={t('profile.currentPasswordPlaceholder')}
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">{t('profile.newPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder={t('profile.newPasswordPlaceholder')}
                  className="input pl-9"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{t('profile.minEight')}</p>
            </div>

            <div>
              <label className="label">{t('profile.confirmNewPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder={t('profile.confirmNewPasswordPlaceholder')}
                  className="input pl-9"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? t('profile.updating') : t('profile.updatePassword')}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
