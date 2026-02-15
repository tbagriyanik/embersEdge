
import React, { useState, useEffect } from 'react';
import { GameSettings, PlayerStats, Language, Gender } from '../types';
import { TRANSLATIONS } from '../constants';
import { SoundManager } from './SoundManager';

interface Props {
  onStart: () => void;
  onContinue?: () => void;
  hasActiveSession?: boolean;
  settings: GameSettings;
  onUpdateSettings: (s: GameSettings) => void;
  playerStats: PlayerStats;
  onUpdatePlayerStats: (p: PlayerStats) => void;
}

export const MainMenu: React.FC<Props> = ({ onStart, onContinue, hasActiveSession, settings, onUpdateSettings, playerStats, onUpdatePlayerStats }) => {
  const [showSettings, setShowSettings] = useState(false);
  const t = (key: string) => TRANSLATIONS[settings.language][key] || key;

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 flex flex-col items-center justify-center p-8 overflow-hidden text-white font-inter">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-900/5 to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(245,158,11,0.05)_0%,transparent_70%)] animate-pulse" />
        
        {/* Ember Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-1 h-1 bg-amber-500 rounded-full blur-[1px] animate-float-ember"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                opacity: Math.random()
              }}
            />
          ))}
        </div>
      </div>

      {/* Control Summary Table */}
      <div className="absolute bottom-8 right-8 z-30 hidden lg:flex flex-col gap-6 p-8 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] animate-in fade-in slide-in-from-right-8 duration-1000 delay-500 shadow-2xl max-w-sm">
         <h3 className="text-[14px] font-black tracking-[0.3em] text-amber-500 uppercase mb-2 border-b border-white/10 pb-3">{t('controls')}</h3>
         
         <div className="space-y-5">
            <div>
              <span className="text-[12px] font-black text-white/40 uppercase tracking-[0.1em] block mb-3">{t('keyboard')}</span>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center gap-4">
                   <kbd className="px-3 py-1.5 bg-white/10 rounded-lg text-[12px] font-black border border-white/10 min-w-[44px] text-center shadow-md">WASD</kbd>
                   <span className="text-[12px] font-bold text-white/60 uppercase tracking-tight">{t('move')}</span>
                </div>
                <div className="flex items-center gap-4">
                   <kbd className="px-3 py-1.5 bg-white/10 rounded-lg text-[12px] font-black border border-white/10 min-w-[44px] text-center shadow-md">E</kbd>
                   <span className="text-[12px] font-bold text-white/60 uppercase tracking-tight">{t('interact')}</span>
                </div>
                <div className="flex items-center gap-4">
                   <kbd className="px-3 py-1.5 bg-white/10 rounded-lg text-[12px] font-black border border-white/10 min-w-[44px] text-center shadow-md">F</kbd>
                   <span className="text-[12px] font-bold text-white/60 uppercase tracking-tight">{t('inventory')}</span>
                </div>
                <div className="flex items-center gap-4">
                   <kbd className="px-3 py-1.5 bg-white/10 rounded-lg text-[12px] font-black border border-white/10 min-w-[44px] text-center shadow-md">C</kbd>
                   <span className="text-[12px] font-bold text-white/60 uppercase tracking-tight">{t('crafting')}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[12px] font-black text-white/40 uppercase tracking-[0.1em] block mb-3">{t('mouse')}</span>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-6 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center"><div className="w-2 h-3 bg-amber-500 rounded-full mr-4" /></div>
                   <span className="text-[12px] font-bold text-white/60 uppercase tracking-tight">{t('move')}</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-6 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center"><div className="w-2 h-3 bg-blue-400 rounded-full ml-4" /></div>
                   <span className="text-[12px] font-bold text-white/60 uppercase tracking-tight">{t('pan')}</span>
                </div>
              </div>
            </div>
         </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-lg">
        {!showSettings ? (
          <>
            <div className="flex flex-col items-center text-center">
              <span className="text-amber-500 font-black tracking-[0.6em] text-[14px] mb-4 opacity-70 animate-in slide-in-from-top-6 duration-700 uppercase drop-shadow-lg">Survive the Wilderness</span>
              <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_60px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-1000">
                EMBER'S <span className="text-amber-500 text-glow">EDGE</span>
              </h1>
            </div>

            <div className="flex flex-col gap-4 w-full px-8 animate-in slide-in-from-bottom-12 duration-700 delay-300">
              {hasActiveSession && onContinue && (
                <button 
                  onClick={() => { SoundManager.playUI('click'); onContinue(); }}
                  onMouseEnter={() => SoundManager.playUI('hover')}
                  className="group relative overflow-hidden py-6 bg-amber-600 rounded-2xl font-black text-white text-2xl tracking-tighter uppercase transition-all hover:scale-105 active:scale-95 shadow-2xl border border-white/20"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                  <span className="relative z-10">{t('continue')}</span>
                </button>
              )}

              <button 
                onClick={() => { SoundManager.playUI('click'); onStart(); }}
                onMouseEnter={() => SoundManager.playUI('hover')}
                className="group relative overflow-hidden py-6 bg-amber-500 rounded-2xl font-black text-stone-950 text-2xl tracking-tighter uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_15px_40px_rgba(245,158,11,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <span className="relative z-10">{t('new_game')}</span>
              </button>
              
              <button 
                onClick={() => { SoundManager.playUI('click'); setShowSettings(true); }}
                onMouseEnter={() => SoundManager.playUI('hover')}
                className="py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-white/80 uppercase tracking-widest text-[12px] hover:bg-white/10 transition-all active:scale-95 shadow-lg"
              >
                {t('settings')}
              </button>
            </div>
          </>
        ) : (
          <div className="w-full bg-stone-900/50 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/20 animate-in zoom-in-95 duration-500 shadow-2xl">
             <h2 className="text-4xl font-black mb-10 tracking-tighter text-amber-500 uppercase">{t('settings')}</h2>
             <div className="space-y-8">
                <div className="flex flex-col gap-4">
                   <span className="text-[12px] font-black tracking-[0.2em] text-white/40 uppercase">{t('language')}</span>
                   <div className="grid grid-cols-2 gap-4">
                      {(['en', 'tr'] as Language[]).map(l => (
                        <button 
                          key={l} 
                          onClick={() => onUpdateSettings({...settings, language: l})} 
                          className={`py-4 rounded-xl font-black text-[12px] uppercase border transition-all shadow-md ${settings.language === l ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                        >
                          {l === 'en' ? 'English' : 'Türkçe'}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="flex flex-col gap-4">
                   <span className="text-[12px] font-black tracking-[0.2em] text-white/40 uppercase">{t('gender')}</span>
                   <div className="grid grid-cols-2 gap-4">
                      {(['male', 'female'] as Gender[]).map(g => (
                        <button key={g} onClick={() => onUpdatePlayerStats({...playerStats, character: {...playerStats.character, gender: g}})} className={`py-4 rounded-xl font-black text-[12px] uppercase border transition-all shadow-md ${playerStats.character.gender === g ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>{t(g)}</button>
                      ))}
                   </div>
                </div>
                <div className="flex flex-col gap-4">
                   <span className="text-[12px] font-black tracking-[0.2em] text-white/40 uppercase">{t('outfit')}</span>
                   <div className="flex gap-6 items-center">
                      <div className="w-16 h-16 rounded-2xl border-4 border-white/20 shadow-2xl" style={{ backgroundColor: playerStats.character.outfitColor }} />
                      <input type="color" value={playerStats.character.outfitColor} onChange={e => onUpdatePlayerStats({...playerStats, character: {...playerStats.character, outfitColor: e.target.value}})} className="flex-1 h-14 bg-transparent cursor-pointer rounded-2xl overflow-hidden border border-white/10 shadow-inner" />
                   </div>
                </div>
             </div>
             <button onClick={() => setShowSettings(false)} className="w-full py-5 mt-12 bg-white text-stone-950 font-black rounded-2xl uppercase tracking-[0.2em] text-[12px] hover:bg-amber-500 transition-all shadow-2xl active:scale-95">{t('back')}</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float-ember {
          0% { transform: translateY(0) rotate(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-200px) rotate(360deg); opacity: 0; }
        }
        .animate-float-ember {
          animation: float-ember 12s linear infinite;
        }
        .text-glow {
          text-shadow: 0 0 30px rgba(245, 158, 11, 0.6);
        }
      `}</style>
    </div>
  );
};
