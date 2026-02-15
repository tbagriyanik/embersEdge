
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

  // Filter items for split UI
  const usableItems = gameState.inventory.filter(i => ['tool', 'weapon', 'food'].includes(i.type));
  const resources = gameState.inventory.filter(i => ['resource', 'material'].includes(i.type));

  const StatBar = ({ label, value, max, color, icon, critical }: any) => (
    <div className={`flex flex-col gap-1 w-36 sm:w-48 ${critical ? 'animate-pulse' : ''}`}>
      <div className="flex justify-between items-end">
         <span className={`text-[10px] font-black uppercase tracking-wider ${critical ? 'text-red-400' : 'text-white/50'}`}>{icon} {label}</span>
         <span className="text-[10px] font-mono text-white/70">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-md">
        <div className={`h-full ${critical ? 'bg-red-600' : color} transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );

  return (
    <div className="absolute inset-x-0 top-0 bottom-0 p-6 pointer-events-none select-none flex flex-col justify-between z-50">
      <div className="flex justify-between items-start">
        {/* Top Left Stats Panel */}
        <div 
          onMouseDown={e => e.stopPropagation()} 
          className="p-4 bg-stone-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex flex-col gap-4 shadow-2xl pointer-events-auto"
        >
          <div className="flex items-center gap-6 px-1">
             <div className="flex flex-col">
               <span className="text-xl font-black text-white leading-none tracking-tighter">
                 {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
               </span>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                 {hours >= 6 && hours < 18 ? t('daytime') : t('nighttime')}
               </span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col items-center">
               <span className="text-amber-500 font-black text-[11px] tracking-tight">{t('level')} {stats.level}</span>
               <div className="w-12 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                 <div 
                   className="h-full bg-amber-500 transition-all duration-300" 
                   style={{ width: `${(stats.xp / (stats.level * 250)) * 100}%` }} 
                 />
               </div>
             </div>
          </div>
          <div className="w-full h-px bg-white/10" />
          <div className="flex flex-col gap-3 px-1">
            <StatBar label={t('hp')} value={stats.health} max={stats.maxHealth} color="bg-red-500" icon="❤️" critical={stats.health < 25} />
            <StatBar label={t('hunger')} value={stats.hunger} max={stats.maxHunger} color="bg-orange-500" icon="🍖" critical={stats.hunger < 20} />
            <StatBar label={t('thirst')} value={stats.thirst} max={stats.maxThirst} color="bg-blue-500" icon="💧" critical={stats.thirst < 20} />
          </div>
        </div>

        {/* Right Resource Panel */}
        <div 
          onMouseDown={e => e.stopPropagation()} 
          className="flex flex-col gap-2 p-3 bg-stone-950/40 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-2xl pointer-events-auto mt-[180px]"
        >
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest px-2 mb-1">Stock</span>
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
            {resources.length === 0 && <div className="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] opacity-20">🕳️</div>}
            {resources.map(item => (
              <div key={item.id} className="relative w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group hover:bg-white/10 transition-colors">
                <span className="text-xl">{item.icon}</span>
                <span className="absolute -bottom-1 -right-1 bg-stone-900 border border-white/20 rounded-md px-1 text-[9px] font-black text-white/80">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message Area */}
      {message && (
        <div className="fixed bottom-28 left-8 px-6 py-3 bg-stone-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none z-[100]">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="text-white font-black uppercase tracking-widest text-[11px]">
            {message}
          </span>
        </div>
      )}

      {/* Bottom Hotbar */}
      <div className="flex flex-col items-center w-full gap-3 pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
        <div className="flex gap-2 p-2 bg-stone-900/60 backdrop-blur-3xl border border-white/10 rounded-[1.8rem] shadow-2xl">
          {[...Array(5)].map((_, i) => {
            const item = usableItems[i];
            const isEquipped = item && item.id === stats.equippedItemId;
            return (
              <div 
                key={i} 
                onClick={() => item && onAction('use', item)}
                className={`relative w-14 h-14 rounded-2xl border flex items-center justify-center transition-all cursor-pointer group hover:scale-110 active:scale-95 ${isEquipped ? 'bg-amber-500 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-white/5 border-white/5 opacity-90'}`}
              >
                <span className={`absolute -top-2 -left-2 w-5 h-5 border rounded-md text-[9px] flex items-center justify-center font-black transition-colors ${isEquipped ? 'bg-amber-600 border-white text-white' : 'bg-stone-800 border-white/10 text-white/50'}`}>
                  {i + 1}
                </span>
                {item ? (
                  <>
                    <span className="text-2xl">{item.icon}</span>
                    {item.quantity > 1 && <span className={`absolute bottom-1 right-2 text-[10px] font-black ${isEquipped ? 'text-stone-900' : 'text-white/70'}`}>{item.quantity}</span>}
                    {item.durability !== undefined && (
                      <div className="absolute bottom-1 left-2 right-2 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isEquipped ? 'bg-stone-900' : 'bg-emerald-500'}`} 
                          style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} 
                        />
                      </div>
                    )}
                  </>
                ) : <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />}
                
                {/* Tooltip on hover */}
                {item && (
                   <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="bg-stone-900 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md border border-white/10 whitespace-nowrap shadow-xl">
                        {item.name} {item.durability !== undefined ? `(${item.durability})` : ''}
                      </div>
                      <div className="w-2 h-2 bg-stone-900 border-r border-b border-white/10 rotate-45 -mt-1" />
                   </div>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">{t('active_gear')}</span>
      </div>
    </div>
  );
};
