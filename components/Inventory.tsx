
import React, { useState } from 'react';
import { Item, Language } from '../types';
import { TRANSLATIONS, MAX_INVENTORY_SLOTS } from '../constants';
import { formatAbbreviatedNumber } from './HUD';

interface Props {
  items: Item[];
  quickSlots: (string | null)[];
  equippedItemId: string | null;
  isNearWorkbench: boolean;
  onAction: (action: 'use' | 'reorder' | 'equip' | 'assign_quickslot' | 'place', data: any) => void;
  onClose: () => void;
  onSwitchToCrafting: () => void;
  onSwitchToShop?: () => void;
  activeTab: 'inventory' | 'crafting' | 'shop';
  language: Language;
}

export const Inventory: React.FC<Props> = ({ items, quickSlots, equippedItemId, isNearWorkbench, onAction, onClose, onSwitchToCrafting, onSwitchToShop, activeTab, language }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  const goldCoins = items
    .filter(i => i.id === 'gold_coin')
    .reduce((sum, i) => sum + i.quantity, 0);

  const physicalItemsCount = items.filter(i => i.type !== 'currency').length;

  const handlePointerMove = (e: React.PointerEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleDragStart = (e: React.DragEvent, item: Item) => {
    e.dataTransfer.setData('itemUniqueId', item.uniqueId);
  };

  const handleDropToQuickSlot = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    const uniqueId = e.dataTransfer.getData('itemUniqueId');
    if (uniqueId) {
      onAction('assign_quickslot', { uniqueId, slotIdx });
    }
  };

  const InventoryGrid = ({ itemsToDraw, title, icon }: { itemsToDraw: Item[], title: string, icon: string }) => (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center justify-between px-2 border-b border-white/5 pb-1">
        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{icon} {title}</span>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {itemsToDraw.map((item) => {
           return (
              <div 
                key={item.uniqueId} 
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => { if (item.placeEntity) onAction('place', item); else onAction('use', item); }}
                onPointerEnter={() => setHoveredItem(item)}
                onPointerLeave={() => setHoveredItem(null)}
                className={`relative aspect-square rounded-xl border-2 flex items-center justify-center text-2xl sm:text-3xl transition-all cursor-pointer shadow-md 
                  ${equippedItemId === item.id ? 'border-amber-400 bg-amber-500/30' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                {item.icon}
                {item.quantity > 1 && (
                  <span className="absolute bottom-0 right-0 text-[8px] font-black text-white bg-amber-600 px-1 rounded-full border border-stone-900 shadow-sm">
                    {item.quantity}
                  </span>
                )}
                {item.durability !== undefined && (
                  <div className="absolute bottom-1 left-2 right-2 h-0.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} />
                  </div>
                )}
              </div>
           );
        })}
      </div>
    </div>
  );

  const equipment = items.filter(i => i.type === 'tool' || i.type === 'weapon');
  const consumables = items.filter(i => i.type === 'food');
  // Money is excluded from Resources
  const otherItems = items.filter(i => i.type !== 'tool' && i.type !== 'weapon' && i.type !== 'food' && i.type !== 'currency');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none" onPointerMove={handlePointerMove}>
      <div className="w-full max-w-5xl max-h-[95vh] bg-stone-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-7 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
               <span className="text-2xl">🎒</span> {t('inventory')}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                {physicalItemsCount} / {MAX_INVENTORY_SLOTS} {t('slots')}
              </span>
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                <span className="text-lg">🪙</span>
                <span className="text-[13px] font-black text-amber-500">{formatAbbreviatedNumber(goldCoins)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex bg-black/20 p-1 rounded-xl border border-white/5">
              <button onClick={() => {}} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'inventory' ? 'bg-amber-500 text-stone-950' : 'text-white/40 hover:text-white/60'}`}>{t('inventory')}</button>
              <button onClick={onSwitchToCrafting} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'crafting' ? 'bg-amber-500 text-stone-950' : 'text-white/40 hover:text-white/60'}`}>{t('crafting')}</button>
              {onSwitchToShop && <button onClick={onSwitchToShop} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'shop' ? 'bg-amber-500 text-stone-950' : 'text-white/40 hover:text-white/60'}`}>{t('shop')}</button>}
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/30 text-xl transition-colors">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1">
           <InventoryGrid itemsToDraw={equipment} title="Equipment" icon="⚔️" />
           <InventoryGrid itemsToDraw={consumables} title="Consumables" icon="🫐" />
           <InventoryGrid itemsToDraw={otherItems} title="Resources" icon="🪵" />
        </div>

        {/* Hand Slots / Hotbar assignment area */}
        <div className="p-5 sm:p-7 bg-black/40 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
             <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">{t('hand_slots')}</span>
             <p className="text-[9px] text-white/20 italic">Drag items here to assign hotkeys</p>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2">
            {quickSlots.map((uniqueId, i) => {
              const item = items.find(invItem => invItem.uniqueId === uniqueId);
              return (
                <div 
                  key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropToQuickSlot(e, i)}
                  className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-dashed flex items-center justify-center text-2xl transition-all relative
                    ${item ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                  <span className="absolute top-0.5 left-1 text-[8px] font-black text-white/20">{i + 1}</span>
                  {item ? item.icon : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredItem && (
        <div className="fixed pointer-events-none z-[300] bg-stone-900/95 backdrop-blur-3xl border border-white/20 p-4 rounded-xl shadow-2xl flex flex-col gap-2 max-w-[200px]" style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{hoveredItem.icon}</span>
            <span className="text-amber-500 font-black text-[12px] uppercase tracking-tight">{hoveredItem.name}</span>
          </div>
          <p className="text-[10px] text-white/60 italic leading-tight">{hoveredItem.description}</p>
        </div>
      )}
    </div>
  );
};
