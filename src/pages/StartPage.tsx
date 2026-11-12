import React from 'react';
import { HeartPulse, Stethoscope, User, ChevronRight, ShieldCheck, WifiOff } from 'lucide-react';

export interface StartPageProps {
  onProceedAsWorker?: () => void;
  onProceedAsPatient?: () => void;
}

export default function StartPage({
  onProceedAsWorker,
  onProceedAsPatient,
}: StartPageProps) {
  return (
    <div className="relative min-h-screen w-full bg-[var(--color-surface-light)] text-[var(--color-slate-dark)] flex flex-col justify-between items-center px-4 py-8 sm:px-6 sm:py-12 select-none">
      {/* Top ambient status bar / offline banner indicator */}
      <header className="w-full max-w-sm flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/70 border border-slate-300/60 shadow-xs">
          <WifiOff className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
          <span>Offline Ready</span>
        </div>
        <div className="inline-flex items-center gap-1 text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-emerald)]" aria-hidden="true" />
          <span>Verified Care</span>
        </div>
      </header>

      {/* Main Content: Centered Branding & Mode Selectors */}
      <main className="w-full max-w-sm flex-1 flex flex-col items-center justify-center py-8">
        {/* 1. Centered Branding */}
        <div className="flex flex-col items-center text-center">
          {/* Logo container with high outdoor contrast and subtle emerald glow */}
          <div className="relative mb-6 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-[var(--color-emerald)]/15 blur-xl scale-125"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-emerald-950/5">
              <HeartPulse
                className="w-14 h-14 sm:w-16 sm:h-16 text-[var(--color-emerald)] stroke-[2.25]"
                aria-label="SmartHealth AI Logo"
              />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-slate-dark)] leading-tight">
            SmartHealth AI
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-base sm:text-lg font-medium text-slate-700 leading-relaxed max-w-xs sm:max-w-sm">
            Bridging the gap between rural communities and quality healthcare.
            Select your mode to begin.
          </p>
        </div>

        {/* 2. Action Buttons */}
        <section
          aria-label="Mode Selection"
          className="w-full mt-10 space-y-3.5 flex flex-col items-stretch"
        >
          {/* Button 1: Health Worker */}
          <button
            type="button"
            onClick={onProceedAsWorker}
            className="group relative w-full min-h-14 px-5 py-4 rounded-xl bg-[var(--color-emerald)] hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold shadow-md shadow-emerald-700/25 transition-all duration-150 flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-xs">
                <Stethoscope className="w-5 h-5 text-white stroke-[2.25]" aria-hidden="true" />
              </div>
              <div className="text-left">
                <span className="block text-base font-bold leading-snug">
                  Proceed as Health Worker
                </span>
                <span className="block text-xs font-normal text-emerald-100">
                  Triage, diagnostics & patient records
                </span>
              </div>
            </div>
            <ChevronRight
              className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </button>

          {/* Button 2: Patient */}
          <button
            type="button"
            onClick={onProceedAsPatient}
            className="group relative w-full min-h-14 px-5 py-4 rounded-xl bg-[var(--color-sky-blue)] hover:bg-sky-700 active:scale-[0.98] text-white font-semibold shadow-md shadow-sky-700/25 transition-all duration-150 flex items-center justify-between cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-xs">
                <User className="w-5 h-5 text-white stroke-[2.25]" aria-hidden="true" />
              </div>
              <div className="text-left">
                <span className="block text-base font-bold leading-snug">
                  Proceed as Patient
                </span>
                <span className="block text-xs font-normal text-sky-100">
                  Symptom check & multilingual chat
                </span>
              </div>
            </div>
            <ChevronRight
              className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </button>
        </section>
      </main>

      {/* 3. Footer Note */}
      <footer className="w-full max-w-sm text-center pt-4">
        <p className="text-xs text-slate-500 font-medium">
          Offline-first clinical support for Nigerian communities.
        </p>
      </footer>
    </div>
  );
}
