
import React from 'react';
import { Item, Recipe } from '../types';
import { RECIPES, TRANSLATIONS } from '../constants';

interface Props {
  inventory: Item[];
  playerLevel: number;
  isNearWorkbench: boolean;
  onCraft: (recipeId: string) => void;
  onClose: () => void;
  onSwitchToInventory: () => void;
  language: 'en' | 'tr';
}

export const Crafting: React.FC<Props> = ({ inventory, playerLevel, isNearWorkbench, onCraft, onClose, onSwitchToInventory, language }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;
  const checkIngredients = (recipe: Recipe) => Object.entries(recipe.ingredients).every(([id, qty]) => {
      const item = inventory.find(i => i.id === id);
      return item && item.quantity >= (qty as number);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-stone-900 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-2">
               <span className="text-2xl">⚒️</span> {t('crafting')}
            </h2>
            <span className="text-[9px] uppercase font-black tracking-widest text-white/30 mt-0.5">
              {isNearWorkbench ? t('at_workbench') : t('basic_crafting')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onSwitchToInventory} 
              className="px-4 py-2 rounded-xl bg-amber-500 text-stone-900 font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-transform"
            >
              🎒 {t('inventory')}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-sm">✕</button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[75vh] grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map(recipe => {
            const levelLocked = recipe.levelRequired > playerLevel;
            const workbenchLocked = recipe.requiresWorkbench && !isNearWorkbench;
            const canCraft = !levelLocked && !workbenchLocked && checkIngredients(recipe);

            return (
              <div 
                key={recipe.id} 
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${canCraft ? 'bg-white/5 border-amber-500/20 hover:border-amber-500/40' : 'bg-black/20 border-white/5 opacity-60'}`}
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 min-w-[40px] bg-black/40 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                    {recipe.output.icon}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{recipe.name}</h3>
                    <p className="text-[9px] text-white/40 leading-tight mt-0.5 font-medium line-clamp-1 italic">{recipe.output.description}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-3 bg-black/20 p-2 rounded-lg border border-white/5">
                  {Object.entries(recipe.ingredients).map(([id, qty]) => {
                    const inv = inventory.find(i => i.id === id);
                    const has = inv ? inv.quantity : 0;
                    return (
                      <div key={id} className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-white/30 truncate mr-2">{t(id)}</span>
                        <span className={has >= (qty as number) ? 'text-emerald-500' : 'text-red-500/80'}>{has}/{qty}</span>
                      </div>
                    );
                  })}
                </div>

                <button 
                  disabled={!canCraft} 
                  onClick={() => onCraft(recipe.id)}
                  className={`w-full py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${canCraft ? 'bg-amber-500 text-stone-950 shadow-md active:scale-95' : 'bg-white/5 text-white/20'}`}
                >
                  {levelLocked ? `LV. ${recipe.levelRequired}` : workbenchLocked ? 'BENCH' : t('crafted').replace('!', '')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
