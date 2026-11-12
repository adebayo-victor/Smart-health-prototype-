import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Stethoscope, AlertCircle } from 'lucide-react';

export interface WorkerLoginProps {
  onBack?: () => void;
  onLogin?: (workerId: string) => void;
}

export default function WorkerLogin({
  onBack,
  onLogin,
}: WorkerLoginProps) {
  const [workerId, setWorkerId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = workerId.trim();
    if (!trimmed) {
      setError('Please enter your Worker ID to proceed.');
      return;
    }
    setError(null);
    onLogin?.(trimmed);
  };

  const handleDemoFill = (sampleId: string) => {
    setWorkerId(sampleId);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-[var(--color-surface-light)] text-[var(--color-slate-dark)] flex flex-col justify-between items-center px-4 py-6 sm:px-6 sm:py-10 select-none">
      {/* 1. Header with Back Button & Navigation */}
      <div className="w-full max-w-sm">
        <header className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Back to mode selection"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.25]" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-emerald)]" />
            <span>Authorized Personnel</span>
          </div>
        </header>

        {/* Title & Subtitle */}
        <div className="text-left mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100/70 text-[var(--color-emerald)] mb-4">
            <Stethoscope className="w-6 h-6 stroke-[2.25]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-slate-dark)] leading-tight">
            Health Worker Login
          </h1>
          <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
            Please enter your credentials to access the clinical tool.
          </p>
        </div>

        {/* 2. Worker ID Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col text-left">
            <label
              htmlFor="workerIdInput"
              className="block text-sm font-bold text-[var(--color-slate-dark)] mb-2"
            >
              Worker ID
            </label>
            <div className="relative">
              <input
                id="workerIdInput"
                type="text"
                value={workerId}
                onChange={(e) => {
                  setWorkerId(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., CHEW-4092"
                autoComplete="off"
                spellCheck="false"
                className="w-full min-h-12 px-4 py-3 text-base font-semibold text-[var(--color-slate-dark)] bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 placeholder:font-normal shadow-xs transition-colors focus:outline-none focus:border-[var(--color-emerald)] focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            {/* Helper Tip */}
            <p className="mt-2 text-xs text-slate-500 italic">
              Your ID is issued by your center.
            </p>

            {/* Validation Error Message */}
            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Badges for field convenience / testing */}
            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                Sample Center IDs for quick test:
              </span>
              <div className="flex flex-wrap gap-2">
                {['CHEW-4092', 'CHO-1088', 'CHW-7731'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleDemoFill(sample)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Action Button: Proceed */}
          <button
            type="submit"
            className="group w-full max-w-sm min-h-14 px-6 py-4 rounded-xl bg-[var(--color-emerald)] hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-md shadow-emerald-700/25 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40"
          >
            <span>Proceed</span>
            <ArrowRight
              className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform stroke-[2.25]"
              aria-hidden="true"
            />
          </button>
        </form>
      </div>

      {/* Footer support note */}
      <footer className="w-full max-w-sm text-center pt-6 pb-2">
        <p className="text-xs text-slate-500 font-medium">
          Need an assigned ID? Contact your Primary Healthcare Center (PHC) supervisor.
        </p>
      </footer>
    </div>
  );
}
