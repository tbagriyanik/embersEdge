
import React, { useState, useEffect } from 'react';
import { Entity, Language, Item } from '../types';
import { VILLAGER_DIALOGUE, TRANSLATIONS } from '../constants';

interface Props {
  entity: Entity;
  inventory: Item[];
  onClose: () => void;
  onTrade?: () => void;
  onGift?: (entityId: string) => boolean;
  language: Language;
  villageName?: string;
}

const NPC_NAMES: Record<string, string[]> = {
  en: ["Alaric", "Bryn", "Cael", "Dara", "Elias", "Ffion", "Garen", "Hilda"],
  tr: ["Alper", "Boran", "Cihan", "Defne", "Enes", "Funda", "Gökhan", "Hale"]
};

export const DialogueModal: React.FC<Props> = ({ entity, inventory, onClose, onTrade, onGift, language, villageName }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;
  const isShopkeeper = entity.type === 'shopkeeper';
  
  const nameParts = entity.id.split('-');
  const nameIndex = parseInt(nameParts[nameParts.length - 1] || '0') % NPC_NAMES[language].length;
  const npcName = NPC_NAMES[language][nameIndex] || NPC_NAMES[language][0];
  
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const lines = VILLAGER_DIALOGUE[language];
  const currentLine = isShopkeeper ? (language === 'en' ? "Welcome to my shop! Want to trade?" : "Dükkanıma hoş geldin! Ticaret yapmak ister misin?") : lines[dialogueIndex];

  useEffect(() => {
    if (!isShopkeeper) {
        setDialogueIndex(Math.floor(Math.random() * lines.length));
    }
  }, [lines.length, isShopkeeper]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const [hasGifted, setHasGifted] = useState(false);

  return (
    <div 
        className="fixed inset-0 z-[200] flex items-end justify-center p-8 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={handleBackdropClick}
        onMouseDown={handleBackdropClick}
    >
      <div 
        className="w-full max-w-4xl bg-stone-900/80 backdrop-blur-3xl border border-white/20 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col md:flex-row gap-8 p-10 relative overflow-hidden animate-in slide-in-from-bottom-12 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full blur-2xl pointer-events-none" />

        <div className="flex-shrink-0 w-32 h-32 md:w-48 md:h-48 bg-black/40 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-6xl md:text-8xl relative z-10 drop-shadow-2xl">
                {isShopkeeper ? '🧙‍♂️' : '🧑‍🌾'}
            </span>
        </div>

        <div className="flex-1 flex flex-col justify-between py-2">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <span className="text-amber-500 font-black tracking-widest text-[14px] uppercase">
                        {isShopkeeper ? t('shopkeeper') : t('villager')}
                        {villageName && <span className="text-white/30 ml-2">@ {villageName}</span>}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">{npcName}</h3>
                <p className="text-lg md:text-xl text-white/70 italic font-medium leading-relaxed mt-4 max-w-2xl">
                    "{hasGifted ? t('gift_thanks') : currentLine}"
                </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
                {isShopkeeper && onTrade && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onTrade(); }}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl uppercase tracking-widest text-[12px] shadow-[0_10px_30px_rgba(245,158,11,0.3)] transition-all active:scale-95"
                    >
                        💰 {t('buy')} / {t('sell')}
                    </button>
                )}
                {!isShopkeeper && onGift && (
                    <button 
                        disabled={hasGifted}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if(onGift(entity.id)) setHasGifted(true); 
                        }}
                        className={`px-8 py-4 ${hasGifted ? 'bg-emerald-500/50 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-400'} text-white font-black rounded-2xl uppercase tracking-widest text-[12px] shadow-[0_10px_30px_rgba(244,63,94,0.3)] transition-all active:scale-95`}
                    >
                        🎁 {hasGifted ? 'DONE!' : t('give_gift')}
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl uppercase tracking-widest text-[12px] border border-white/5 transition-all active:scale-95"
                >
                    {t('back')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
