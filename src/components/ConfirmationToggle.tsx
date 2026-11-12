import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface ConfirmationToggleProps {
  isConfirmed: boolean;
  onToggle: () => void;
  label?: string;
}

export default function ConfirmationToggle({ isConfirmed, onToggle, label = "Tick to confirm accuracy" }: ConfirmationToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 min-h-12 px-3 rounded-lg border transition-all w-full justify-start ${
        isConfirmed 
          ? 'bg-[var(--color-emerald)]/10 border-[var(--color-emerald)] text-[var(--color-emerald)]' 
          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
      }`}
    >
      {isConfirmed ? (
        <CheckCircle2 className="w-5 h-5 shrink-0" />
      ) : (
        <Circle className="w-5 h-5 shrink-0" />
      )}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
