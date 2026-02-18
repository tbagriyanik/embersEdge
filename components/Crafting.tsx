
import React from 'react';
import { Item, Recipe } from '../types';
import { RECIPES, TRANSLATIONS } from '../constants';
import { formatAbbreviatedNumber } from './HUD';

interface Props {
  inventory: Item[];
  playerLevel: number;
  workbenchLevel: number;
  isNearWorkbench: boolean;
  onCraft: (recipeId: string, multiple?: number) => void;
  onClose: () => void;
  onSwitchToInventory: () => void;
  onSwitchToCrafting?: () => void;
  onSwitchToShop?: () => void;
  activeTab: 'inventory' | 'crafting' | 'shop';
  language: 'en' | 'tr';
  shopMode?: boolean;
}

export const Crafting: React.FC<Props> = ({ inventory, playerLevel, workbenchLevel, isNearWorkbench, onCraft, onClose, onSwitchToInventory, onSwitchToCrafting, onSwitchToShop, activeTab, language, shopMode = false }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;
  
  const goldCoins = inventory
    .filter(i => i.id === 'gold_coin')
    .reduce((sum, i) => sum + i.quantity, 0);

  const checkIngredients = (recipe: Recipe) => {
      const hasIngredients = Object.entries(recipe.ingredients).every(([id, qty]) => {
          const item = inventory.find(i => i.id === id);
          return item && item.quantity >= (qty as number);
      });
      const needsWorkbench = recipe.workbenchLevelRequired !== undefined;
      const hasWorkbenchLevel = !needsWorkbench || (isNearWorkbench && workbenchLevel >= (recipe.workbenchLevelRequired || 0));
      return hasIngredients && hasWorkbenchLevel && playerLevel >= recipe.levelRequired;
  };

  const calculateMaxMultiple = (recipe: Recipe) => {
      const multiples = Object.entries(recipe.ingredients).map(([id, qty]) => {
          const item = inventory.find(i => i.id === id);
          if (!item) return 0;
          return Math.floor(item.quantity / (qty as number));
      });
      return Math.min(...multiples);
  };

  const tradeRecipes = RECIPES.filter(r => r.category === 'trade');
  const buyRecipes = tradeRecipes.filter(r => r.id.startsWith('buy'));
  const sellRecipes = tradeRecipes.filter(r => r.id.startsWith('sell'));

  const renderRecipeCard = (recipe: Recipe) => {
    const canCraft = checkIngredients(recipe);
    const isSelling = recipe.id.startsWith('sell');
    const needsWorkbench = recipe.workbenchLevelRequired !== undefined;
    const workbenchRequirementMet = isNearWorkbench && workbenchLevel >= (recipe.workbenchLevelRequired || 0);
    const needsHigherWorkbench = needsWorkbench && (!isNearWorkbench || (isNearWorkbench && workbenchLevel < (recipe.workbenchLevelRequired || 0)));
    const maxMultiple = calculateMaxMultiple(recipe);
    const hasIngredients = Object.entries(recipe.ingredients).every(([id, qty]) => {
        const item = inventory.find(i => i.id === id);
        return item && item.quantity >= (qty as number);
    });

    return (
      <div key={recipe.id} className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${canCraft ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-black/40 border-white/5 opacity-70'}`}>
        <div className="flex gap-4 mb-3">
          <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center text-2xl shadow-inner relative">
            {recipe.output.icon}
            {recipe.output.quantity >= 1 && <span className="absolute -bottom-1 -right-1 bg-amber-500 text-[9px] font-black px-1.5 rounded-full border border-stone-900 text-stone-950">x{recipe.output.id === 'gold_coin' ? formatAbbreviatedNumber(recipe.output.quantity) : recipe.output.quantity}</span>}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-[13px] font-black text-white uppercase truncate tracking-tight">{recipe.name}</h3>
            <p className="text-[11px] text-white/40 leading-tight mt-0.5 line-clamp-1 italic">{recipe.output.description}</p>
            {needsHigherWorkbench ? (
               <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] text-red-400 font-black uppercase tracking-tighter px-2 py-0.5 bg-red-400/10 rounded-full border border-red-400/20">
                    ⚠️ {t('workbench_level')} {recipe.workbenchLevelRequired}
                  </span>
               </div>
            ) : needsWorkbench && (
               <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter px-2 py-0.5 bg-emerald-400/10 rounded-full border border-emerald-400/20">
                    ⚒️ {t('requires_workbench')}
                  </span>
               </div>
            )}
            {playerLevel < recipe.levelRequired && (
                <div className="flex items-center gap-1.5 mt-1">
                   <span className="text-[9px] text-amber-500 font-black uppercase tracking-tighter">🔒 LV {recipe.levelRequired}</span>
                </div>
            )}
          </div>
        </div>
        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 mb-3 flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(recipe.ingredients).map(([id, qty]) => {
            const has = inventory.find(i => i.id === id)?.quantity || 0;
            return (
              <div key={id} className="flex gap-1.5 items-center text-[10px] font-black uppercase tracking-tight">
                <span className="text-white/30">{t(id)}</span>
                <span className={has >= (qty as number) ? 'text-emerald-400' : 'text-red-500'}>
                  {id === 'gold_coin' ? formatAbbreviatedNumber(has) : has}/{id === 'gold_coin' ? formatAbbreviatedNumber(qty as number) : qty}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
            <button disabled={!canCraft} onClick={() => onCraft(recipe.id, 1)} className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${canCraft ? (isSelling ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-stone-950') : 'bg-white/5 text-white/20'}`}>
              {shopMode ? t(isSelling ? 'sell' : 'buy') : 'CRAFT'}
            </button>
            {shopMode && isSelling && maxMultiple > 1 && (
                <button onClick={() => onCraft(recipe.id, maxMultiple)} className="px-3 py-3 bg-white/10 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-tighter transition-all">
                    {t('sell_all')} ({maxMultiple})
                </button>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-6xl max-h-[90vh] bg-stone-900/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
               <span className="text-3xl">{shopMode ? '🪙' : '⚒️'}</span> {shopMode ? t('shop') : t('crafting')}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[12px] uppercase font-black tracking-widest text-white/30">
                {shopMode ? t('trade_with_villagers') : isNearWorkbench ? `${t('at_workbench')} (Lvl ${workbenchLevel})` : t('basic_crafting')}
              </span>
              <div className="h-4 w-px bg-white/10" />
              {isNearWorkbench && !shopMode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-stone-950 rounded-full font-black text-[10px] uppercase shadow-lg shadow-amber-500/20 animate-pulse">
                  Level {workbenchLevel} active
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                <span className="text-xl">🪙</span>
                <span className="text-[14px] font-black text-amber-500">{formatAbbreviatedNumber(goldCoins)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex bg-black/30 p-1 rounded-2xl border border-white/10">
              <button onClick={onSwitchToInventory} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'inventory' ? 'bg-amber-500 text-stone-950' : 'text-white/40 hover:text-white/60'}`}>🎒 {t('inventory')}</button>
              <button onClick={onSwitchToCrafting || (() => {})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'crafting' ? 'bg-amber-500 text-stone-950' : 'text-white/40 hover:text-white/60'}`}>⚒️ {t('crafting')}</button>
              <button onClick={onSwitchToShop || (() => {})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'shop' ? 'bg-amber-500 text-stone-950' : 'text-white/40 hover:text-white/60'}`}>🪙 {t('shop')}</button>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 text-2xl">✕</button>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
          {shopMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full">
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-black text-sky-400 uppercase tracking-[0.2em] border-l-4 border-sky-500 pl-4 bg-white/5 py-3 rounded-r-xl">
                  {t('buy')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {buyRecipes.map(renderRecipeCard)}
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-black text-emerald-400 uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-4 bg-white/5 py-3 rounded-r-xl">
                  {t('sell')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sellRecipes.map(renderRecipeCard)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
               {['tools', 'buildings', 'survival'].map(cat => {
                 const catRecipes = RECIPES.filter(r => r.category === cat);
                 if (catRecipes.length === 0) return null;
                 return (
                   <div key={cat} className="flex flex-col gap-6">
                      <h3 className="text-lg font-black text-amber-500/60 uppercase tracking-[0.2em] border-l-4 border-amber-500 pl-4 bg-white/5 py-2 rounded-r-xl">{t('categories')[cat]}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {catRecipes.map(renderRecipeCard)}
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
