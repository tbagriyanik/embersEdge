
import React from 'react';
import { PlayerStats, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { SoundManager } from './SoundManager';

interface Props {
  stats: PlayerStats;
  language: Language;
  onRetry: () => void;
}

export const DeathScreen: React.FC<Props> = ({ stats, language, onRetry }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-8">
        <div className="relative">
          <span className="text-8xl mb-4 block animate-bounce">💀</span>
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full -z-10 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase">
            {t('perished')}
          </h1>
          <p className="text-[12px] sm:text-[14px] font-black text-red-500 uppercase tracking-[0.3em] opacity-80">
            {t('danger')}
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <span className="text-[10px] sm:text-[12px] font-black text-white/40 uppercase tracking-widest">{t('level')}</span>
            <span className="text-2xl font-black text-amber-500">{stats.level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-[12px] font-black text-white/40 uppercase tracking-widest">XP</span>
            <span className="text-xl font-black text-white">{Math.floor(stats.xp)}</span>
          </div>
        </div>

        <button 
          onClick={() => { SoundManager.playUI('click'); onRetry(); }}
          className="group relative w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[12px] sm:text-[14px] transition-all active:scale-95 shadow-[0_20px_50px_rgba(220,38,38,0.3)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
          <span className="relative z-10">{t('retry')}</span>
        </button>
      </div>
    </div>
  );
};
