import React from 'react';
export default function MockQR({ value }: { value: string }) {
  // Generates a deterministic pseudo-random grid based on the string
  const cells = Array.from({ length: 225 }).map((_, i) => {
    const hash = (value.charCodeAt(i % value.length) * (i + 1)) % 2;
    return hash === 1;
  });
  return (
    <div className="w-64 h-64 bg-white p-4 rounded-2xl border-4 border-[var(--color-slate-dark)] grid grid-cols-15 gap-0.5">
      {cells.map((isBlack, i) => (
        <div key={i} className={`w-full h-full ${isBlack ? 'bg-[var(--color-slate-dark)]' : 'bg-white'}`} />
      ))}
    </div>
  );
}
