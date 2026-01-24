
import React from 'react';
import { Item, Recipe } from '../types';
import { RECIPES, TRANSLATIONS } from '../constants';

interface Props {
  inventory: Item[];
  playerLevel: number;
  isNearWorkbench: boolean;
  onCraft: (recipeId: string) => void;
  onClose: () => void;
  language: 'en' | 'tr';
}

export const Crafting: React.FC<Props> = ({ inventory, playerLevel, isNearWorkbench, onCraft, onClose, language }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;
  const checkIngredients = (recipe: Recipe) => Object.entries(recipe.ingredients).every(([id, qty]) => {
      const item = inventory.find(i => i.id === id);
      return item && item.quantity >= (qty as number);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-stone-900 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
               <span className="text-3xl">⚒️</span> {t('crafting')}
            </h2>
            <span className="text-[10px] uppercase font-black tracking-widest text-white/30">{isNearWorkbench ? 'USING WORKBENCH' : 'BASIC CRAFTING'}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] grid gap-4 grid-cols-1 sm:grid-cols-2">
          {RECIPES.map(recipe => {
            const levelLocked = recipe.levelRequired > playerLevel;
            const workbenchLocked = recipe.requiresWorkbench && !isNearWorkbench;
            const canCraft = !levelLocked && !workbenchLocked && checkIngredients(recipe);

            return (
              <div key={recipe.id} className={`p-4 rounded-3xl border transition-all ${canCraft ? 'bg-white/5 border-amber-500/30' : 'bg-black/20 border-white/5 opacity-50'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center text-4xl shadow-inner">{recipe.output.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-white uppercase">{recipe.name}</h3>
                    <p className="text-[10px] text-white/40 leading-tight">{recipe.output.description}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {Object.entries(recipe.ingredients).map(([id, qty]) => {
                    const inv = inventory.find(i => i.id === id);
                    const has = inv ? inv.quantity : 0;
                    return (
                      <div key={id} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-white/40">{id}</span>
                        <span className={has >= (qty as number) ? 'text-emerald-500' : 'text-red-500'}>{has}/{qty}</span>
                      </div>
                    );
                  })}
                </div>

                <button 
                  disabled={!canCraft} onClick={() => onCraft(recipe.id)}
                  className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${canCraft ? 'bg-amber-500 text-stone-900 shadow-lg active:scale-95' : 'bg-white/5 text-white/20'}`}
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
