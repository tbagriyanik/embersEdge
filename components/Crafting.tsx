
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-tighter flex items-center gap-2">
               <span className="text-2xl">⚒️</span> {t('crafting')}
            </h2>
            <span className="text-[9px] uppercase font-black tracking-widest text-white/30">
              {isNearWorkbench ? t('at_workbench') : t('basic_crafting')}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onSwitchToInventory} className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-500 text-stone-900 font-black text-[10px] sm:text-[11px] uppercase tracking-widest">🎒 {t('inventory')}</button>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50">✕</button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPES.map(recipe => {
            const levelLocked = recipe.levelRequired > playerLevel;
            const workbenchLocked = recipe.requiresWorkbench && !isNearWorkbench;
            const canCraft = !levelLocked && !workbenchLocked && checkIngredients(recipe);

            return (
              <div 
                key={recipe.id} 
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${canCraft ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-black/30 border-white/5 opacity-50'}`}
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center text-2xl">{recipe.output.icon}</div>
                  <div className="overflow-hidden">
                    <h3 className="text-[10px] font-black text-white uppercase truncate">{recipe.name}</h3>
                    <p className="text-[8px] text-white/40 leading-tight mt-0.5 line-clamp-1 italic">{recipe.output.description}</p>
                  </div>
                </div>

                <div className="bg-black/20 p-2 rounded-lg border border-white/5 mb-3 flex flex-wrap gap-2">
                  {Object.entries(recipe.ingredients).map(([id, qty]) => {
                    const inv = inventory.find(i => i.id === id);
                    const has = inv ? inv.quantity : 0;
                    return (
                      <div key={id} className="flex gap-1 items-center text-[8px] font-bold uppercase">
                        <span className="text-white/20">{t(id)}</span>
                        <span className={has >= (qty as number) ? 'text-emerald-400' : 'text-red-400'}>{has}/{qty}</span>
                      </div>
                    );
                  })}
                </div>

                <button 
                  disabled={!canCraft} 
                  onClick={() => onCraft(recipe.id)}
                  className={`w-full py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${canCraft ? 'bg-amber-500 text-stone-950 shadow-lg' : 'bg-white/5 text-white/20'}`}
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
