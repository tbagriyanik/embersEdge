
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-5xl max-h-[90vh] bg-stone-900/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
               <span className="text-3xl">⚒️</span> {t('crafting')}
            </h2>
            <span className="text-[12px] uppercase font-black tracking-widest text-white/30 mt-1">
              {isNearWorkbench ? t('at_workbench') : t('basic_crafting')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onSwitchToInventory} className="px-6 py-3 rounded-2xl bg-amber-500 text-stone-950 font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">🎒 {t('inventory')}</button>
            <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 text-2xl">✕</button>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map(recipe => {
            const levelLocked = recipe.levelRequired > playerLevel;
            const workbenchLocked = recipe.requiresWorkbench && !isNearWorkbench;
            const canCraft = !levelLocked && !workbenchLocked && checkIngredients(recipe);

            return (
              <div 
                key={recipe.id} 
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${canCraft ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-black/40 border-white/5 opacity-60'}`}
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center text-3xl shadow-inner">{recipe.output.icon}</div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-[14px] font-black text-white uppercase truncate tracking-tight">{recipe.name}</h3>
                    <p className="text-[12px] text-white/50 leading-tight mt-1 line-clamp-2 italic font-medium">{recipe.output.description}</p>
                  </div>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-white/5 mb-4 flex flex-wrap gap-x-4 gap-y-2">
                  {Object.entries(recipe.ingredients).map(([id, qty]) => {
                    const inv = inventory.find(i => i.id === id);
                    const has = inv ? inv.quantity : 0;
                    return (
                      <div key={id} className="flex gap-2 items-center text-[12px] font-black uppercase tracking-tight">
                        <span className="text-white/30">{t(id)}</span>
                        <span className={has >= (qty as number) ? 'text-emerald-400' : 'text-red-500'}>{has}/{qty}</span>
                      </div>
                    );
                  })}
                </div>

                <button 
                  disabled={!canCraft} 
                  onClick={() => onCraft(recipe.id)}
                  className={`w-full py-3.5 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all shadow-xl ${canCraft ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 active:scale-95' : 'bg-white/5 text-white/20'}`}
                >
                  {levelLocked ? `LV. ${recipe.levelRequired}` : workbenchLocked ? 'NEED BENCH' : 'CRAFT'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
