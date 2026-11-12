import React from 'react';

interface WaveformProps {
  isRecording: boolean;
}

export default function Waveform({ isRecording }: WaveformProps) {
  return (
    <div className="w-full h-16 bg-slate-900 rounded-xl px-4 flex items-center justify-center gap-1.5 shadow-inner overflow-hidden border border-slate-800">
      {Array.from({ length: 20 }).map((_, index) => (
        <span
          key={index}
          className={`w-1.5 rounded-full transition-all duration-100 ${
            isRecording ? 'bg-[var(--color-crimson)] animate-pulse' : 'bg-slate-700'
          }`}
          style={{
            height: isRecording 
              ? `${Math.max(20, Math.random() * 80)}%` 
              : '20%',
            animationDelay: `${index * 50}ms`
          }}
        />
      ))}
    </div>
  );
}
