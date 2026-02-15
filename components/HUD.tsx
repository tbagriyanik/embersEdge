
import React from 'react';
import { PlayerStats, GameState, Language, Item } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  stats: PlayerStats;
  time: number;
  message: string;
  gameState: GameState;
  onAction: (action: 'use' | 'reorder' | 'equip', data: any) => void;
  onZoom: (delta: number) => void;
  onRotate: (delta: number) => void;
  onOpenSettings: () => void;
}

export const HUD: React.FC<Props> = ({ stats, time, message, gameState, onAction, onZoom, onRotate, onOpenSettings }) => {
  const hours = Math.floor((time / 2400) * 24);
  const minutes = Math.floor(((time / 2400) * 24 * 60) % 60);
  const t = (key: string) => TRANSLATIONS[gameState.settings.language][key] || key;

  const usableItems = gameState.inventory.filter(i => ['tool', 'weapon', 'food'].includes(i.type));
  const resources = gameState.inventory.filter(i => ['resource', 'material'].includes(i.type));

  const weatherIcons: Record<string, string> = {
    clear: '☀️',
    rain: '🌧️',
    fog: '🌫️',
    snow: '❄️'
  };

  const StatBar = ({ label, value, max, color, icon, critical, glowColor }: any) => {
    const percentage = (value / max) * 100;
    return (
      <div className={`flex flex-col gap-1 w-40 sm:w-52 group transition-all duration-300 ${critical ? 'scale-105' : ''}`}>
        <div className="flex justify-between items-end px-1">
           <div className="flex items-center gap-1.5">
              <span className={`text-base ${critical ? 'animate-bounce' : 'group-hover:scale-125 transition-transform'}`}>{icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${critical ? 'text-red-400' : 'text-white/60'}`}>{label}</span>
           </div>
           <span className={`text-[10px] font-black font-mono ${critical ? 'text-red-400' : 'text-white/80'}`}>{Math.round(value)}%</span>
        </div>
        <div className={`h-2.5 w-full bg-black/40 rounded-full p-0.5 border border-white/10 backdrop-blur-md shadow-inner overflow-hidden`}>
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out relative ${critical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : color}`} 
            style={{ width: `${percentage}%` }}
          >
            <div className={`absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer`} />
          </div>
        </div>
        {critical && (
          <span className="text-[8px] font-black text-red-500/80 uppercase tracking-tighter text-center animate-pulse mt-0.5">
            {t('danger')}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-x-0 top-0 bottom-0 p-6 pointer-events-none select-none flex flex-col justify-between z-50">
      <div className="flex justify-between items-start">
        <div 
          onMouseDown={e => e.stopPropagation()} 
          className="p-5 bg-stone-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex flex-col gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          <div className="flex items-center gap-6 px-1">
             <div className="flex flex-col">
               <span className="text-2xl font-black text-white leading-none tracking-tighter drop-shadow-md">
                 {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
               </span>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                 {hours >= 6 && hours < 18 ? t('daytime') : t('nighttime')}
               </span>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex flex-col items-center">
                <span className="text-white text-xl">{weatherIcons[gameState.weather.type] || '☀️'}</span>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">{t(gameState.weather.type)}</span>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex flex-col items-center">
               <span className="text-amber-500 font-black text-[12px] tracking-tight uppercase">{t('level')} {stats.level}</span>
               <div className="w-16 h-1.5 bg-black/40 rounded-full mt-1.5 overflow-hidden border border-white/5">
                 <div 
                   className="h-full bg-amber-500 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                   style={{ width: `${(stats.xp / (stats.level * 250)) * 100}%` }} 
                 />
               </div>
             </div>
          </div>
          
          <div className="w-full h-px bg-white/5" />
          
          <div className="flex flex-col gap-4 px-1">
            <StatBar label={t('health')} value={stats.health} max={stats.maxHealth} color="bg-red-500" icon="❤️" critical={stats.health < 25} />
            <StatBar label={t('hunger')} value={stats.hunger} max={stats.maxHunger} color="bg-orange-500" icon="🍖" critical={stats.hunger < 20} />
            <StatBar label={t('thirst')} value={stats.thirst} max={stats.maxThirst} color="bg-sky-500" icon="💧" critical={stats.thirst < 20} />
          </div>
        </div>

        <div 
          onMouseDown={e => e.stopPropagation()} 
          className="flex flex-col gap-2 p-3 bg-stone-950/60 backdrop-blur-2xl border border-white/10 rounded-[1.8rem] shadow-2xl pointer-events-auto mt-[220px]"
        >
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest px-2 mb-1">Stock</span>
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
            {resources.length === 0 && <div className="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] opacity-20">🕳️</div>}
            {resources.map(item => (
              <div key={item.id} className="relative w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group hover:bg-white/10 transition-colors shadow-lg">
                <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="absolute -bottom-1 -right-1 bg-stone-900 border border-white/20 rounded-md px-1.5 py-0.5 text-[9px] font-black text-white/90 shadow-md">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div className="fixed bottom-28 left-8 px-6 py-4 bg-stone-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex items-center gap-4 animate-in fade-in slide-in-from-left-6 duration-300 pointer-events-none z-[100]">
          <div className="relative">
            <span className="block w-3 h-3 bg-amber-500 rounded-full animate-ping absolute opacity-75" />
            <span className="block w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,1)]" />
          </div>
          <span className="text-white font-black uppercase tracking-[0.2em] text-[12px] drop-shadow-sm">
            {message}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center w-full gap-4 pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
        <div className="flex gap-3 p-3 bg-stone-900/70 backdrop-blur-3xl border border-white/10 rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {[...Array(5)].map((_, i) => {
            const item = usableItems[i];
            const isEquipped = item && item.id === stats.equippedItemId;
            return (
              <div 
                key={i} 
                onClick={() => item && onAction('use', item)}
                className={`relative w-16 h-16 rounded-[1.2rem] border flex items-center justify-center transition-all cursor-pointer group hover:scale-110 active:scale-95 ${isEquipped ? 'bg-amber-500 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-105' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <span className={`absolute -top-2 -left-2 w-6 h-6 border rounded-lg text-[10px] flex items-center justify-center font-black transition-all ${isEquipped ? 'bg-amber-600 border-white text-white rotate-12' : 'bg-stone-800 border-white/10 text-white/40'}`}>
                  {i + 1}
                </span>
                {item ? (
                  <>
                    <span className="text-3xl drop-shadow-lg">{item.icon}</span>
                    {item.quantity > 1 && <span className={`absolute bottom-1 right-2.5 text-[11px] font-black ${isEquipped ? 'text-stone-950' : 'text-white/80'}`}>{item.quantity}</span>}
                    {item.durability !== undefined && (
                      <div className="absolute bottom-1.5 left-2.5 right-2.5 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full transition-all duration-300 ${isEquipped ? 'bg-stone-950' : (item.durability < 20 ? 'bg-red-500' : 'bg-emerald-500')}`} style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} />
                      </div>
                    )}
                  </>
                ) : <div className="w-2 h-2 bg-white/10 rounded-full" />}
                {item && (
                   <div className="absolute bottom-full mb-4 hidden group-hover:flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="bg-stone-900/95 backdrop-blur-xl text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap shadow-2xl">
                        {item.name} {item.durability !== undefined ? `(${item.durability}/${item.maxDurability})` : ''}
                      </div>
                      <div className="w-3 h-3 bg-stone-900 border-r border-b border-white/10 rotate-45 -mt-1.5" />
                   </div>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-2">{t('active_gear')}</span>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2.5s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};
