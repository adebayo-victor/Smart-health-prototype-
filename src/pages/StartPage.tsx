import React from 'react';
import { HeartPulse, Stethoscope, User, Mail, Chrome } from 'lucide-react';

interface StartPageProps {
  onProceedAsWorker: () => void;
  onProceedAsUser: () => void;
}

export default function StartPage({ onProceedAsWorker, onProceedAsUser }: StartPageProps) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-[var(--color-emerald)] rounded-2xl flex items-center justify-center shadow-lg">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--color-slate-dark)] tracking-tight">SmartHealth PWA</h1>
          <p className="text-sm text-slate-500">Select your mode to begin</p>
        </div>

        {/* Worker Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Health Worker</h2>
          <button
            onClick={onProceedAsWorker}
            className="w-full min-h-14 bg-[var(--color-emerald)] hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md"
          >
            <Stethoscope className="w-5 h-5" />
            Proceed as Health Worker
          </button>
        </div>

        {/* User Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Patient / User</h2>
          <button
            onClick={onProceedAsUser}
            className="w-full min-h-14 bg-white border border-slate-200 hover:bg-slate-50 text-[var(--color-slate-dark)] rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Mail className="w-5 h-5 text-slate-500" />
            Continue with Email
          </button>
          <button
            onClick={onProceedAsUser}
            className="w-full min-h-14 bg-white border border-slate-200 hover:bg-slate-50 text-[var(--color-slate-dark)] rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            Continue with Google
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-8">
          Offline-first clinical support for Nigerian communities.
        </p>
      </div>
    </div>
  );
}
