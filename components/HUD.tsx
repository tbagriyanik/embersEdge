
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

  const StatBar = ({ label, value, max, color, icon, critical }: any) => {
    const percentage = (value / max) * 100;
    return (
      <div className={`flex flex-col gap-0.5 w-32 sm:w-44 transition-all duration-300 ${critical ? 'scale-105' : ''}`}>
        <div className="flex justify-between items-center px-1">
           <div className="flex items-center gap-1">
              <span className={`text-xs ${critical ? 'animate-bounce' : ''}`}>{icon}</span>
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-widest ${critical ? 'text-red-400' : 'text-white/60'}`}>{label}</span>
           </div>
           <span className={`text-[8px] font-mono font-bold ${critical ? 'text-red-400' : 'text-white/80'}`}>{Math.round(value)}%</span>
        </div>
        <div className="h-1.5 sm:h-2 w-full bg-black/30 rounded-full p-[1px] border border-white/10 backdrop-blur-sm overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out relative ${critical ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : color}`} 
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-x-0 top-0 bottom-0 p-3 sm:p-6 pointer-events-none select-none flex flex-col justify-between z-50">
      <div className="flex justify-between items-start">
        {/* Top Left Stats - Glass Effect */}
        <div 
          onMouseDown={e => e.stopPropagation()} 
          className="p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-[2rem] flex flex-col gap-3 sm:gap-4 shadow-xl pointer-events-auto"
        >
          <div className="flex items-center gap-3 sm:gap-5 px-1">
             <div className="flex flex-col">
               <span className="text-lg sm:text-xl font-black text-white leading-none tracking-tighter drop-shadow-md">
                 {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
               </span>
               <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                 {hours >= 6 && hours < 18 ? t('daytime') : t('nighttime')}
               </span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col items-center">
                <span className="text-white text-base sm:text-lg">{weatherIcons[gameState.weather.type] || '☀️'}</span>
                <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter mt-0.5">{t(gameState.weather.type)}</span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col items-center">
               <span className="text-amber-400 font-black text-[10px] sm:text-[11px] tracking-tight uppercase">LV {stats.level}</span>
               <div className="w-12 h-1 bg-black/40 rounded-full mt-1 overflow-hidden border border-white/5">
                 <div 
                   className="h-full bg-amber-400 transition-all duration-500" 
                   style={{ width: `${(stats.xp / (stats.level * 250)) * 100}%` }} 
                 />
               </div>
             </div>
          </div>
          
          <div className="flex flex-col gap-2 sm:gap-3 px-1">
            <StatBar label={t('health')} value={stats.health} max={stats.maxHealth} color="bg-red-500" icon="❤️" critical={stats.health < 25} />
            <StatBar label={t('hunger')} value={stats.hunger} max={stats.maxHunger} color="bg-orange-500" icon="🍖" critical={stats.hunger < 20} />
            <StatBar label={t('thirst')} value={stats.thirst} max={stats.maxThirst} color="bg-sky-500" icon="💧" critical={stats.thirst < 20} />
          </div>
        </div>

        {/* Resources Panel - Glass Effect */}
        <div 
          onMouseDown={e => e.stopPropagation()} 
          className="flex flex-col gap-1.5 p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl pointer-events-auto mt-0"
        >
          <span className="text-[7px] font-black text-white/30 uppercase tracking-widest px-1">Stock</span>
          <div className="flex flex-col gap-1.5 max-h-[30vh] overflow-y-auto pr-0.5 custom-scrollbar">
            {resources.map(item => (
              <div key={item.id} className="relative w-9 h-9 sm:w-10 sm:h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center group">
                <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="absolute -bottom-0.5 -right-0.5 bg-black/60 border border-white/20 rounded px-1 text-[8px] font-black text-white">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message Notifications - Glass Effect */}
      {message && (
        <div className="fixed bottom-24 sm:bottom-28 left-4 sm:left-8 px-4 sm:px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-left-6 duration-300 pointer-events-none z-[100]">
          <span className="block w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping shadow-[0_0_10px_rgba(245,158,11,1)]" />
          <span className="text-white font-black uppercase tracking-widest text-[10px] sm:text-[11px]">
            {message}
          </span>
        </div>
      )}

      {/* Quick Slots - Glass Effect */}
      <div className="flex flex-col items-center w-full gap-2 pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
        <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.2rem] shadow-2xl">
          {[...Array(5)].map((_, i) => {
            const item = usableItems[i];
            const isEquipped = item && item.id === stats.equippedItemId;
            return (
              <div 
                key={i} 
                onClick={() => item && onAction('use', item)}
                className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.2rem] border flex items-center justify-center transition-all cursor-pointer group ${isEquipped ? 'bg-amber-500/80 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <span className={`absolute -top-1.5 -left-1.5 w-4 h-4 sm:w-5 sm:h-5 border rounded-md text-[8px] sm:text-[9px] flex items-center justify-center font-black ${isEquipped ? 'bg-amber-600 border-white text-white' : 'bg-stone-800 border-white/10 text-white/40'}`}>
                  {i + 1}
                </span>
                {item ? (
                  <>
                    <span className="text-2xl sm:text-3xl">{item.icon}</span>
                    {item.durability !== undefined && (
                      <div className="absolute bottom-1.5 left-2 right-2 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${isEquipped ? 'bg-white' : 'bg-emerald-400'}`} style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} />
                      </div>
                    )}
                  </>
                ) : <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />}
              </div>
            );
          })}
        </div>
        <span className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{t('active_gear')}</span>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
};
