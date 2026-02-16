
import React from 'react';
import { Item, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  containerItems: Item[];
  playerItems: Item[];
  onTransfer: (from: 'container' | 'player', item: Item) => void;
  onTakeAll: () => void;
  onClose: () => void;
  language: Language;
}

export const Container: React.FC<Props> = ({ containerItems, playerItems, onTransfer, onTakeAll, onClose, language }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-stone-900/90 border border-white/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
             <span className="text-3xl">📦</span> {t('storage')}
          </h2>
          <div className="flex gap-4">
            <button onClick={onTakeAll} className="px-4 py-2 bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-colors">{t('take_all')}</button>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 text-xl">✕</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row h-[60vh]">
          {/* Container Side */}
          <div className="flex-1 p-6 bg-black/20 overflow-y-auto custom-scrollbar border-r border-white/5">
            <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block mb-4">Container Content</span>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {containerItems.map((item, idx) => (
                <button 
                  key={`c-${idx}`}
                  onClick={() => onTransfer('container', item)}
                  className="aspect-square rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-2xl relative group"
                >
                  {item.icon}
                  <span className="absolute bottom-1 right-1 text-[10px] font-black bg-stone-800 px-1.5 rounded-full">{item.quantity}</span>
                </button>
              ))}
              {containerItems.length === 0 && <div className="col-span-full text-center text-white/20 text-sm italic py-10">{t('empty')}</div>}
            </div>
          </div>

          {/* Player Side */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block mb-4">Your Inventory</span>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
               {playerItems.map((item, idx) => (
                <button 
                  key={`p-${idx}`}
                  onClick={() => onTransfer('player', item)}
                  className="aspect-square rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-2xl relative"
                >
                  {item.icon}
                  <span className="absolute bottom-1 right-1 text-[10px] font-black bg-stone-800 px-1.5 rounded-full">{item.quantity}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};
