import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  FilePlus,
  Loader2,
  MapPin,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { aiService } from '@/services/aiService';
import { realComplaintService } from '@/services/realComplaintService';
import { wards } from '@/data/mockData';
import type { AIAnalysis } from '@/types';

type Phase = 'form' | 'analyzing' | 'result';

export function ReportComplaintPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('form');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [ward, setWard] = useState(user?.role === 'citizen' ? user.ward : wards[0]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const canSubmit = title.trim().length > 3 && description.trim().length > 10 && location.trim().length > 3;

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPhase('analyzing');
    const result = await aiService.analyze(title, description);
    setAnalysis(result);
    setPhase('result');
  }

  async function handleConfirm() {
    if (!analysis || !user || user.role !== 'citizen') return;

    const { complaint, error } = await realComplaintService.createComplaint(user.id, {
      title: title.trim(),
      description: description.trim(),
      location: `${location.trim()}, ${ward}`,
      ward,
      imageUrl,
    });

    if (error || !complaint) {
      alert(error || t('complaints.failedCreate'));
      return;
    }

    setCreatedId(complaint.complaint_number ?? complaint.id);
  }

  function handleReset() {
    setPhase('form');
    setAnalysis(null);
    setCreatedId(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setImageUrl(undefined);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }


  return (
    <DashboardLayout>
      <button
        onClick={() => navigate('/citizen')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {t('common.back')} {t('navigation.dashboard')}
      </button>

      <h1 className="text-2xl font-extrabold text-navy-900 mb-1">{t('complaints.reportComplaint')}</h1>
      <p className="text-slate-500 mb-6">{t('complaints.formDescription')}</p>

      {phase === 'form' && (
        <form onSubmit={handleAnalyze} className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 space-y-4">
              <div>
                <label className="label">{t('complaints.title')} <span className="text-red-500">*</span></label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('complaints.titleExample')}
                  className="input"
                />
              </div>
              <div>
                <label className="label">{t('complaints.description')} <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('complaints.descriptionDetailedPlaceholder')}
                  rows={5}
                  className="input resize-none"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  {t('complaints.aiTip')}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('complaints.locationLandmark')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('complaints.locationExample')}
                      className="input pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">{t('complaints.ward')}</label>
                  <select value={ward} onChange={(e) => setWard(e.target.value)} className="input">
                    {wards.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <label className="label">{t('complaints.uploadImageOptional')}</label>
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={imageUrl} alt={t('complaints.image')} className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(undefined)}
                    className="absolute top-2 right-2 bg-navy-900/80 text-white rounded-lg p-1.5 hover:bg-navy-900 transition"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl py-10 cursor-pointer hover:border-gov-400 hover:bg-gov-50/30 transition">
                  <Camera className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-navy-700">{t('complaints.clickUploadPhoto')}</span>
                  <span className="text-xs text-slate-400 mt-0.5">{t('complaints.fileHint')}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <button type="submit" disabled={!canSubmit} className="btn-primary w-full py-3 text-base">
              {t('complaints.submitComplaint')}
            </button>
          </div>
        </form>
      )}

      {phase === 'analyzing' && (
        <div className="card p-12 flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-gov-600 mb-4" />
          <h3 className="text-xl font-bold text-navy-900">{t('complaints.processing')}</h3>
          <p className="mt-2 text-slate-500 text-sm">{t('complaints.analyzingRouting')}</p>
        </div>
      )}

      {phase === 'result' && analysis && (
        <div className="max-w-2xl mx-auto animate-fade-in">
          {createdId ? (
            <div className="card p-8 flex flex-col items-center text-center bg-emerald-50/50 border-emerald-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-navy-900">{t('complaints.filedSuccessfully')}</h3>
              <p className="mt-2 text-slate-600">
                {t('complaints.complaintIdIs')} <span className="font-mono font-bold text-gov-700">{createdId}</span>
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => navigate('/citizen')} className="btn-primary">
                  {t('complaints.viewMyComplaints')}
                </button>
                <button onClick={handleReset} className="btn-outline">
                  <FilePlus className="h-4 w-4" /> {t('complaints.reportAnother')}
                </button>
              </div>
              <div className="mt-6 w-full rounded-xl border border-slate-200 bg-white p-4 text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('complaints.details.expectedResolution')}
                </div>
                <div className="mt-1 text-sm font-medium text-navy-800">
                  {analysis.category === 'Sanitation' ? '1-2 days' : analysis.category === 'Road Issue' ? '3-5 days' : analysis.category === 'Water Leakage' ? '2-3 days' : '2-4 days'}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="card p-5">
                <h3 className="font-bold text-navy-900 mb-3">{t('complaints.summary')}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">{t('complaints.title')}</div>
                    <div className="text-sm font-medium text-navy-800">{title}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">{t('complaints.description')}</div>
                    <div className="text-sm text-navy-700 bg-slate-50 rounded-lg p-3 border border-slate-100">{description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase text-slate-400">{t('complaints.location')}</div>
                      <div className="text-sm font-medium text-navy-800">{location}, {ward}</div>
                    </div>
                    {imageUrl && (
                      <div>
                        <div className="text-xs font-semibold uppercase text-slate-400">{t('complaints.image')}</div>
                        <img src={imageUrl} alt={t('complaints.image')} className="h-16 w-full object-cover rounded-lg border border-slate-200" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={handleConfirm} className="btn-accent w-full py-3 text-base">
                <Send className="h-5 w-5" /> {t('complaints.confirmSubmit')}
              </button>
              <button onClick={() => setPhase('form')} className="btn-ghost w-full">
                <ArrowLeft className="h-4 w-4" /> {t('complaints.editDetails')}
              </button>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
