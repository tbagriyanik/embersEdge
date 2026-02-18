
import React from 'react';
import { Item, Recipe } from '../types';
import { RECIPES, TRANSLATIONS } from '../constants';

interface Props {
  inventory: Item[];
  playerLevel: number;
  workbenchLevel: number;
  isNearWorkbench: boolean;
  onCraft: (recipeId: string) => void;
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
      const hasWorkbenchLevel = recipe.workbenchLevelRequired === undefined || workbenchLevel >= recipe.workbenchLevelRequired;
      return hasIngredients && hasWorkbenchLevel;
  };

  const tradeRecipes = RECIPES.filter(r => r.category === 'trade');
  const buyRecipes = tradeRecipes.filter(r => r.id.startsWith('buy'));
  const sellRecipes = tradeRecipes.filter(r => r.id.startsWith('sell'));

  const renderRecipeCard = (recipe: Recipe) => {
    const canCraft = checkIngredients(recipe);
    const isSelling = recipe.id.startsWith('sell');
    const needsWorkbenchUpgrade = recipe.workbenchLevelRequired !== undefined && workbenchLevel < recipe.workbenchLevelRequired;

    return (
      <div key={recipe.id} className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${canCraft ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-black/40 border-white/5 opacity-60'}`}>
        <div className="flex gap-4 mb-3">
          <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center text-2xl shadow-inner relative">
            {recipe.output.icon}
            {recipe.output.quantity > 1 && <span className="absolute -bottom-1 -right-1 bg-amber-500 text-[9px] font-black px-1.5 rounded-full border border-stone-900 text-stone-950">x{recipe.output.quantity}</span>}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="text-[13px] font-black text-white uppercase truncate tracking-tight">{recipe.name}</h3>
            <p className="text-[11px] text-white/40 leading-tight mt-0.5 line-clamp-1 italic">{recipe.output.description}</p>
            {needsWorkbenchUpgrade && <p className="text-[9px] text-red-400 font-bold uppercase mt-1">{t('needs_upgrade')} (Lvl {recipe.workbenchLevelRequired})</p>}
          </div>
        </div>
        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 mb-3 flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(recipe.ingredients).map(([id, qty]) => {
            const has = inventory.find(i => i.id === id)?.quantity || 0;
            return (
              <div key={id} className="flex gap-1.5 items-center text-[11px] font-black uppercase tracking-tight">
                <span className="text-white/30">{t(id)}</span>
                <span className={has >= (qty as number) ? 'text-emerald-400' : 'text-red-500'}>{has}/{qty}</span>
              </div>
            );
          })}
        </div>
        <button disabled={!canCraft} onClick={() => onCraft(recipe.id)} className={`w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${canCraft ? (isSelling ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-stone-950') : 'bg-white/5 text-white/20'}`}>
          {shopMode ? t(isSelling ? 'sell' : 'buy') : 'CRAFT'}
        </button>
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
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                <span className="text-xl">🪙</span>
                <span className="text-[14px] font-black text-amber-500">{goldCoins}</span>
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
              {/* BUY COLUMN */}
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-black text-sky-400 uppercase tracking-[0.2em] border-l-4 border-sky-500 pl-4 bg-white/5 py-3 rounded-r-xl">
                  {t('buy')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {buyRecipes.map(renderRecipeCard)}
                </div>
              </div>
              
              {/* SELL COLUMN */}
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
