import React from 'react';

interface CleanBoxProps {
  label: string;
  value: string | number;
  isHighlighted?: boolean;
}

export default function CleanBox({ label, value, isHighlighted = false }: CleanBoxProps) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isHighlighted 
        ? 'bg-emerald-50/50 border-[var(--color-emerald)]' 
        : 'bg-white border-slate-200'
    }`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-[var(--color-slate-dark)] leading-relaxed">
        {value || 'Not provided'}
      </p>
    </div>
  );
}
