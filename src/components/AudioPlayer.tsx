import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  label?: string;
}

export default function AudioPlayer({ src, label = "Play Instruction" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[var(--color-sky-blue)] text-white flex items-center justify-center shrink-0 hover:bg-sky-700 transition"
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[var(--color-slate-dark)] truncate">{label}</p>
        <div className="flex items-center gap-1 mt-1">
          <Volume2 className="w-3 h-3 text-slate-400" />
          <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full bg-[var(--color-sky-blue)] ${isPlaying ? 'animate-pulse w-full' : 'w-0'} transition-all`} />
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
}
