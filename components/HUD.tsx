
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

  const StatBar = ({ label, value, max, color, icon, critical }: any) => (
    <div className={`flex flex-col gap-1 w-36 sm:w-48 ${critical ? 'animate-pulse' : ''}`}>
      <div className="flex justify-between items-end">
         <span className={`text-[11px] font-black uppercase tracking-wider ${critical ? 'text-red-400' : 'text-white/50'}`}>{icon} {label}</span>
         <span className="text-[11px] font-mono text-white/70">{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-md">
        <div className={`h-full ${critical ? 'bg-red-600' : color} shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );

  return (
    <div className="absolute inset-x-0 top-0 bottom-0 p-6 pointer-events-none select-none flex flex-col justify-between z-50">
      <div className="flex justify-start items-start">
        {/* Unified Status Panel */}
        <div className="p-5 bg-stone-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex flex-col gap-5 shadow-2xl pointer-events-auto">
          {/* Top Row: Time & Level */}
          <div className="flex items-center gap-6 px-1">
             <div className="flex flex-col">
               <span className="text-2xl font-black text-white leading-none tracking-tighter">
                 {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
               </span>
               <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mt-1">
                 {hours >= 6 && hours < 18 ? 'DAYTIME' : 'NIGHTTIME'}
               </span>
             </div>
             
             <div className="w-px h-8 bg-white/10" />
             
             <div className="flex flex-col items-center">
               <span className="text-amber-500 font-black text-[12px] tracking-tight">LV. {stats.level}</span>
               <div className="w-14 h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                 <div 
                   className="h-full bg-amber-500 transition-all duration-300" 
                   style={{ width: `${(stats.xp % (100 * stats.level)) / (stats.level)}%` }} 
                 />
               </div>
             </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Bottom Section: Health Bars */}
          <div className="flex flex-col gap-3.5 px-1">
            <StatBar label="HP" value={stats.health} max={stats.maxHealth} color="bg-red-500" icon="❤️" critical={stats.health < 25} />
            <StatBar label="FOOD" value={stats.hunger} max={stats.maxHunger} color="bg-orange-500" icon="🍖" critical={stats.hunger < 20} />
            <StatBar label="WATER" value={stats.thirst} max={stats.maxThirst} color="bg-blue-500" icon="💧" critical={stats.thirst < 20} />
          </div>
        </div>
      </div>

      {message && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 px-8 py-4 bg-amber-500 text-stone-950 font-black rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.4)] animate-in zoom-in-90 duration-300 border-2 border-white/20 uppercase tracking-tighter text-center text-[14px]">
          {message.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      {/* Quick Access Bar */}
      <div className="flex justify-center w-full mb-4 pointer-events-auto">
        <div className="flex gap-2 p-2.5 bg-stone-900/40 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] shadow-2xl">
          {[...Array(5)].map((_, i) => {
            const item = gameState.inventory[i];
            const isEquipped = item && item.id === stats.equippedItemId;
            return (
              <div 
                key={i} 
                onClick={() => item && onAction('use', item)}
                className={`relative w-14 h-14 rounded-xl border flex items-center justify-center transition-all cursor-pointer group hover:scale-105 ${isEquipped ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/5 opacity-90'}`}
              >
                {/* Shortcut Label */}
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-stone-800 border border-white/10 rounded-md text-[11px] flex items-center justify-center font-black text-white/50 group-hover:text-amber-500 transition-colors">{i + 1}</span>
                
                {item ? (
                  <>
                    <span className="text-2xl drop-shadow-md">{item.icon}</span>
                    {item.quantity > 1 && (
                      <span className="absolute bottom-1 right-2 text-[11px] font-black text-white/70">{item.quantity}</span>
                    )}
                  </>
                ) : (
                  <div className="w-2 h-2 bg-white/10 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
