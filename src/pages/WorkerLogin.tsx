import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface WorkerLoginProps {
  onBack: () => void;
  onLogin: (workerId: string) => void;
}

export default function WorkerLogin({ onBack, onLogin }: WorkerLoginProps) {
  const [workerId, setWorkerId] = useState('');

  return (
    <div className="min-h-screen bg-[var(--color-surface-light)] flex flex-col p-6">
      <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-slate-500 mb-8">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[var(--color-slate-dark)]">Health Worker Login</h1>
          <p className="text-sm text-slate-500">Enter your credentials to access the clinical tool.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase">Worker ID</label>
          <input
            type="text"
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            placeholder="e.g., CHEW-4092"
            className="w-full min-h-14 px-4 rounded-xl border border-slate-200 bg-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-emerald)]"
          />
          <p className="text-xs text-slate-400 italic pl-1">Your ID is issued by your center.</p>
        </div>

        <button
          onClick={() => workerId && onLogin(workerId)}
          disabled={!workerId}
          className="w-full min-h-14 bg-[var(--color-emerald)] hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md mt-4"
        >
          Proceed <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
