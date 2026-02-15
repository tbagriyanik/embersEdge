
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

  const getUniqueItems = (types: string[]) => {
    const items = gameState.inventory.filter(i => types.includes(i.type));
    const uniqueMap = new Map<string, { item: Item, total: number, hasOverflow: boolean, maxStack: number }>();
    
    items.forEach(i => {
      const existing = uniqueMap.get(i.id);
      if (!existing) {
        uniqueMap.set(i.id, { 
          item: i, 
          total: i.quantity, 
          hasOverflow: false,
          maxStack: i.maxStack || 99
        });
      } else {
        const updatedTotal = (existing.total || 0) + i.quantity;
        uniqueMap.set(i.id, { 
          ...existing, 
          total: updatedTotal, 
          hasOverflow: updatedTotal > (existing.maxStack || 99) 
        });
      }
    });
    return Array.from(uniqueMap.values());
  };

  const usableItems = getUniqueItems(['tool', 'weapon', 'food']);
  const resources = getUniqueItems(['resource', 'material']);

  const weatherIcons: Record<string, string> = {
    clear: '☀️',
    rain: '🌧️',
    fog: '🌫️',
    snow: '❄️'
  };

  const formatQuantity = (total: number, maxStack: number) => {
    if (total > 99) return '99+';
    if (total > 50 && maxStack <= 50) return '50+';
    return total.toString();
  };

  const StatBar = ({ label, value, max, color, icon, critical }: any) => {
    const percentage = (value / max) * 100;
    return (
      <div className={`flex flex-col gap-1 w-32 sm:w-48 transition-all duration-300 ${critical ? 'scale-105' : ''}`}>
        <div className="flex justify-between items-center px-1">
           <div className="flex items-center gap-1.5">
              <span className={`text-[12px] sm:text-[14px] ${critical ? 'animate-bounce' : ''}`}>{icon}</span>
              <span className={`text-[9px] sm:text-[12px] font-black uppercase tracking-tight ${critical ? 'text-red-400' : 'text-white/60'}`}>{label}</span>
           </div>
           <span className={`text-[9px] sm:text-[12px] font-mono font-bold ${critical ? 'text-red-400' : 'text-white/80'}`}>{Math.round(value)}%</span>
        </div>
        <div className="h-1.5 sm:h-2 w-full bg-black/40 rounded-full p-[1px] border border-white/10 backdrop-blur-sm overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out relative ${critical ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : color}`} 
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-x-0 top-0 bottom-0 p-4 sm:p-6 pointer-events-none select-none flex flex-col justify-between z-50">
      <div className="flex justify-between items-start">
        <div 
          onMouseDown={e => e.stopPropagation()} 
          className="p-4 bg-black/30 backdrop-blur-2xl border border-white/20 rounded-[2rem] flex flex-col gap-3 shadow-2xl pointer-events-auto"
        >
          <div className="flex items-center gap-4 px-1 mb-1 border-b border-white/10 pb-3">
             <div className="flex flex-col">
               <span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tighter">
                 {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
               </span>
               <span className="text-[9px] sm:text-[12px] font-bold text-white/40 uppercase tracking-widest mt-1">
                 {hours >= 6 && hours < 18 ? t('daytime') : t('nighttime')}
               </span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col">
               <span className="text-amber-400 font-black text-[9px] sm:text-[12px] uppercase">LV {stats.level}</span>
               <div className="w-14 h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden border border-white/5">
                 <div 
                   className="h-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                   style={{ width: `${(stats.xp / (stats.level * 250)) * 100}%` }} 
                 />
               </div>
             </div>
          </div>
          
          <div className="flex flex-col gap-2 px-1">
            <StatBar label={t('health')} value={stats.health} max={stats.maxHealth} color="bg-red-500" icon="❤️" critical={stats.health < 25} />
            <StatBar label={t('hunger')} value={stats.hunger} max={stats.maxHunger} color="bg-orange-500" icon="🍖" critical={stats.hunger < 20} />
            <StatBar label={t('thirst')} value={stats.thirst} max={stats.maxThirst} color="bg-sky-500" icon="💧" critical={stats.thirst < 20} />
          </div>

          <div className="mt-1 px-2 flex items-center gap-3 bg-white/5 py-2 rounded-xl border border-white/5 backdrop-blur-md">
             <span className="text-xl">{weatherIcons[gameState.weather.type] || '☀️'}</span>
             <span className="text-[9px] sm:text-[12px] font-black text-white/60 uppercase tracking-widest">{t(gameState.weather.type)}</span>
          </div>
        </div>
      </div>

      <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto">
        <div className="p-3 sm:p-4 bg-black/30 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] flex flex-col gap-3 shadow-2xl max-h-[60vh] overflow-hidden">
          <span className="text-[9px] sm:text-[12px] font-black text-white/40 uppercase tracking-[0.2em] text-center mb-1">Stock</span>
          <div className="flex flex-col gap-2.5 overflow-y-auto pr-1.5 custom-scrollbar">
            {resources.length > 0 ? resources.map(({item, total, maxStack}) => (
              <div key={item.id} className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group hover:bg-white/15 transition-all shadow-lg">
                <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="absolute -bottom-1 -right-1 bg-amber-500 border border-stone-900 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-stone-950 shadow-xl leading-none">
                  {formatQuantity(total, maxStack)}
                </span>
              </div>
            )) : (
              <div className="w-12 h-12 border border-white/10 border-dashed rounded-full flex items-center justify-center opacity-30 text-[9px] text-center px-1 font-bold text-white uppercase">Empty</div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="fixed bottom-32 left-6 px-6 py-4 bg-white/15 backdrop-blur-3xl border border-white/30 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-in fade-in slide-in-from-left-8 duration-500 pointer-events-none z-[100]">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
          <span className="text-white font-black uppercase tracking-[0.2em] text-[9px] sm:text-[12px] drop-shadow-md">
            {message}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center w-full gap-3 pointer-events-auto mb-4" onMouseDown={e => e.stopPropagation()}>
        <div className="flex gap-1.5 sm:gap-2 p-2 bg-black/40 backdrop-blur-3xl border border-white/20 rounded-full shadow-2xl overflow-x-auto max-w-[95vw] no-scrollbar">
          {[...Array(9)].map((_, i) => {
            const data = usableItems[i];
            const item = data?.item;
            const isEquipped = item && item.id === stats.equippedItemId;
            return (
              <div 
                key={i} 
                onClick={() => item && onAction('use', item)}
                className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${isEquipped ? 'bg-amber-500/80 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-110 z-10' : 'bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/20'}`}
              >
                <span className={`absolute -top-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[8px] sm:text-[10px] flex items-center justify-center font-black shadow-lg ${isEquipped ? 'bg-white text-stone-950' : 'bg-stone-800 border border-white/10 text-white/60'}`}>
                  {i + 1}
                </span>
                {item ? (
                  <>
                    <span className="text-xl sm:text-2xl drop-shadow-md">{item.icon}</span>
                    {(data.total > 1 || data.hasOverflow) && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[8px] sm:text-[10px] font-black rounded-full border border-stone-900 shadow-md leading-none">
                        {formatQuantity(data.total, data.maxStack)}
                      </span>
                    )}
                    {item.durability !== undefined && (
                      <div className="absolute bottom-2 left-3 right-3 h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full transition-all duration-300 ${isEquipped ? 'bg-white' : 'bg-emerald-400'}`} style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} />
                      </div>
                    )}
                  </>
                ) : <div className="w-1 h-1 bg-white/20 rounded-full" />}
              </div>
            );
          })}
        </div>
        <span className="text-[9px] sm:text-[12px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">{t('active_gear')}</span>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2.5s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
