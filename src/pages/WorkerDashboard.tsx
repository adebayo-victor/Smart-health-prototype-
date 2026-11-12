import React, { useState } from 'react';
import {
  Languages,
  Stethoscope,
  Activity,
  QrCode,
  Download,
  ChevronRight,
  Wifi,
  WifiOff,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface EncounterItem {
  id: string;
  patientNumber: string;
  patientName: string;
  tier: 'Tier 1 Self-Care' | 'Tier 2 Moderate' | 'Tier 3 Referred';
  tierColor: string;
  badgeBgClass: string;
  symptoms: string;
  timestamp: string;
}

export interface WorkerDashboardProps {
  workerName?: string;
  workerId?: string;
  centerName?: string;
  onNavigate?: (screen: string) => void;
  onEncounterClick?: (encounterId: string) => void;
  onInstallApp?: () => void;
}

const mockEncounters: EncounterItem[] = [
  {
    id: 'enc-8821',
    patientNumber: 'Patient #8821',
    patientName: 'Khadijah Musa',
    tier: 'Tier 1 Self-Care',
    tierColor: 'emerald',
    badgeBgClass: 'bg-[var(--color-emerald)]',
    symptoms: 'Mild fever, Headache',
    timestamp: '18 mins ago',
  },
  {
    id: 'enc-8822',
    patientNumber: 'Patient #8822',
    patientName: 'Zainab Ibrahim',
    tier: 'Tier 3 Referred',
    tierColor: 'crimson',
    badgeBgClass: 'bg-[var(--color-crimson)]',
    symptoms: 'Acute obstetric bleeding',
    timestamp: '42 mins ago',
  },
  {
    id: 'enc-8820',
    patientNumber: 'Patient #8820',
    patientName: 'Fatima Abdullahi',
    tier: 'Tier 2 Moderate',
    tierColor: 'amber',
    badgeBgClass: 'bg-[var(--color-amber)]',
    symptoms: 'High fever 38.9°C',
    timestamp: '2 hours ago',
  },
  {
    id: 'enc-8818',
    patientNumber: 'Patient #8818',
    patientName: 'Garba Usman',
    tier: 'Tier 1 Self-Care',
    tierColor: 'emerald',
    badgeBgClass: 'bg-[var(--color-emerald)]',
    symptoms: 'Routine malaria follow-up',
    timestamp: '4 hours ago',
  },
];

export default function WorkerDashboard({
  workerName = 'CHEW Amina Bello',
  workerId = '4092',
  centerName = 'Odeda Primary Healthcare Centre',
  onNavigate,
  onEncounterClick,
  onInstallApp,
}: WorkerDashboardProps) {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [installedToast, setInstalledToast] = useState<boolean>(false);

  const handleInstallClick = () => {
    if (onInstallApp) {
      onInstallApp();
    } else {
      setInstalledToast(true);
      setTimeout(() => setInstalledToast(false), 3000);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[var(--color-surface-light)] text-[var(--color-slate-dark)] flex flex-col items-center select-none overflow-y-auto">
      {/* Top Banner / Toast when app install is triggered */}
      {installedToast && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>PWA installer prompt initialized for offline field use!</span>
          </div>
          <button
            type="button"
            onClick={() => setInstalledToast(false)}
            className="text-slate-400 hover:text-white ml-2 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Container with comfortable bottom padding */}
      <div className="w-full max-w-md mx-auto px-4 pt-5 pb-12 space-y-6">
        {/* 1. Header Section */}
        <header className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--color-slate-dark)]">
                Welcome, {workerName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                  ID: {workerId}
                </span>
                <span>•</span>
                <span className="text-slate-600 line-clamp-1">{centerName}</span>
              </div>
            </div>

            {/* Install App Button */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 active:scale-95 transition-all shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Install for offline home-screen access"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Install App</span>
            </button>
          </div>

          {/* Network Status Pill (clickable to toggle offline/online demo state) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer active:scale-95 bg-slate-50 border-slate-200 hover:bg-slate-100"
              title="Click to toggle sync simulation"
            >
              {isOnline ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-sky-blue)] shadow-xs" />
                  <span className="font-semibold text-[var(--color-sky-blue)]">
                    Online | Synced
                  </span>
                  <Wifi className="w-3.5 h-3.5 text-[var(--color-sky-blue)] ml-1" />
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-semibold text-slate-700">
                    Offline | Queue: 8 Pending
                  </span>
                  <WifiOff className="w-3.5 h-3.5 text-slate-500 ml-1" />
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400">Tap pill to toggle sync</span>
          </div>
        </header>

        {/* 2. Quick Actions Grid (2 columns) */}
        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="text-sm font-bold text-[var(--color-slate-dark)] mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Medical Translator */}
            <button
              type="button"
              onClick={() => onNavigate?.('translator')}
              className="group flex flex-col justify-between text-left p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-300 hover:shadow-sm active:scale-[0.98] transition-all min-h-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[var(--color-emerald)] flex items-center justify-center mb-2 group-hover:bg-[var(--color-emerald)] group-hover:text-white transition-colors">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-[var(--color-slate-dark)] group-hover:text-emerald-800">
                  Medical Translator
                </span>
                <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                  Translate patient speech
                </span>
              </div>
            </button>

            {/* Card 2: Diagnosis */}
            <button
              type="button"
              onClick={() => onNavigate?.('diagnosis')}
              className="group flex flex-col justify-between text-left p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-300 hover:shadow-sm active:scale-[0.98] transition-all min-h-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-[var(--color-sky-blue)] flex items-center justify-center mb-2 group-hover:bg-[var(--color-sky-blue)] group-hover:text-white transition-colors">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-[var(--color-slate-dark)] group-hover:text-sky-800">
                  Diagnosis
                </span>
                <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                  Run clinical diagnosis
                </span>
              </div>
            </button>

            {/* Card 3: Offline Triage Settler */}
            <button
              type="button"
              onClick={() => onNavigate?.('triage-settler')}
              className="group flex flex-col justify-between text-left p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-300 hover:shadow-sm active:scale-[0.98] transition-all min-h-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-[var(--color-amber)] flex items-center justify-center mb-2 group-hover:bg-[var(--color-amber)] group-hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-[var(--color-slate-dark)] group-hover:text-amber-800">
                  Offline Triage Settler
                </span>
                <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                  Check vitals thresholds
                </span>
              </div>
            </button>

            {/* Card 4: Referral Pass */}
            <button
              type="button"
              onClick={() => onNavigate?.('referral-pass')}
              className="group flex flex-col justify-between text-left p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-emerald-300 hover:shadow-sm active:scale-[0.98] transition-all min-h-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 text-[var(--color-crimson)] flex items-center justify-center mb-2 group-hover:bg-[var(--color-crimson)] group-hover:text-white transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-[var(--color-slate-dark)] group-hover:text-red-800">
                  Referral Pass
                </span>
                <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                  Generate referral QR
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* 3. Previous Encounters Section */}
        <section aria-labelledby="previous-encounters-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="previous-encounters-heading" className="text-sm font-bold text-[var(--color-slate-dark)]">
              Recent field encounters
            </h2>
            <button
              type="button"
              onClick={() => onNavigate?.('all-encounters')}
              className="text-xs font-semibold text-[var(--color-emerald)] hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {mockEncounters.map((encounter) => (
              <div
                key={encounter.id}
                role="button"
                tabIndex={0}
                onClick={() => onEncounterClick?.(encounter.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEncounterClick?.(encounter.id);
                  }
                }}
                className="group w-full min-h-12 bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm active:scale-[0.99] transition-all flex items-start justify-between gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-[var(--color-slate-dark)]">
                      {encounter.patientNumber}
                    </span>
                    {/* Tier badge */}
                    <span
                      className={`${encounter.badgeBgClass} text-white text-xs font-semibold px-2 py-0.5 rounded shadow-2xs`}
                    >
                      {encounter.tier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed truncate">
                    <span className="font-semibold text-slate-800">{encounter.patientName}</span>
                    <span className="mx-1.5">•</span>
                    <span>{encounter.symptoms}</span>
                  </p>

                  <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{encounter.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center self-center pl-1 text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <ChevronRight className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
