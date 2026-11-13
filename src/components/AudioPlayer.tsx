import React, { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
export default function AudioPlayer({ src, label = "Play Audio" }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <button type="button" onClick={() => { audioRef.current?.[isPlaying ? 'pause' : 'play'](); setIsPlaying(!isPlaying); }} className="w-10 h-10 rounded-full bg-[var(--color-sky-blue)] text-white flex items-center justify-center shrink-0">
        {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
      </button>
      <p className="text-xs font-bold text-[var(--color-slate-dark)] truncate flex-1">{label}</p>
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
}
