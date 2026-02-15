
import React, { useState, useRef } from 'react';
import { Item, Language } from '../types';
import { TRANSLATIONS, MAX_INVENTORY_SLOTS } from '../constants';

interface Props {
  items: Item[];
  equippedItemId: string | null;
  isNearWorkbench: boolean;
  onAction: (action: 'use' | 'reorder' | 'equip' | 'repair' | 'repair_all', data: any) => void;
  onClose: () => void;
  onSwitchToCrafting: () => void;
  language: Language;
}

export const Inventory: React.FC<Props> = ({ items, equippedItemId, isNearWorkbench, onAction, onClose, onSwitchToCrafting, language }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [isOverEquip, setIsOverEquip] = useState(false);
  const equipRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  const equipment = items.filter(i => i.type === 'tool' || i.type === 'weapon');
  const consumables = items.filter(i => i.type === 'food');
  const materials = items.filter(i => i.type !== 'tool' && i.type !== 'weapon' && i.type !== 'food');

  const handleStartDrag = (e: React.PointerEvent, index: number) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDraggedIndex(index);
    setDragPos({ x: e.clientX, y: e.clientY });
    setHoveredItem(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (draggedIndex === null) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    if (equipRef.current) {
      const rect = equipRef.current.getBoundingClientRect();
      const dragItem = items[draggedIndex];
      const canEquip = dragItem.type === 'tool' || dragItem.type === 'weapon';
      setIsOverEquip(canEquip && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedIndex === null) return;
    const dragItem = items[draggedIndex];
    if (isOverEquip && (dragItem.type === 'tool' || dragItem.type === 'weapon')) {
       onAction('equip', dragItem);
    } else {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const slotElement = elements.find(el => el.hasAttribute('data-slot-idx'));
      if (slotElement) {
        const targetIdx = parseInt(slotElement.getAttribute('data-slot-idx') || '-1');
        if (targetIdx !== -1 && targetIdx !== draggedIndex) onAction('reorder', { fromIdx: draggedIndex, toIdx: targetIdx });
      }
    }
    setDraggedIndex(null);
    setIsOverEquip(false);
  };

  const equippedItem = items.find(i => i.id === equippedItemId);

  const InventoryGrid = ({ itemsToDraw, title, icon }: { itemsToDraw: Item[], title: string, icon: string }) => (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-center justify-between px-1 border-b border-white/5 pb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{icon} {title}</span>
        <span className="text-[10px] font-mono text-white/10">{itemsToDraw.length}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {itemsToDraw.map((item) => {
           const globalIdx = items.findIndex(i => i === item);
           return (
              <div 
                key={`${item.id}-${globalIdx}`} 
                data-slot-idx={globalIdx} 
                onPointerDown={(e) => handleStartDrag(e, globalIdx)} 
                onPointerEnter={() => !draggedIndex && setHoveredItem(item)}
                onPointerLeave={() => setHoveredItem(null)}
                onClick={() => onAction('use', item)}
                className={`relative aspect-square rounded-xl border flex items-center justify-center text-3xl cursor-grab active:cursor-grabbing transition-all ${equippedItemId === item.id ? 'border-amber-500 bg-amber-500/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                {item.icon}
                {item.quantity > 1 && <span className="absolute bottom-1 right-2 text-[11px] font-black text-white/70">{item.quantity}</span>}
                {item.durability !== undefined && (
                  <div className="absolute bottom-1.5 left-2 right-2 h-1 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} />
                  </div>
                )}
              </div>
           );
        })}
        {itemsToDraw.length === 0 && <div className="aspect-square rounded-xl border border-dashed border-white/5 flex items-center justify-center opacity-10 text-xl">🕳️</div>}
      </div>
    </div>
  );

  const woodCount = items.find(i => i.id === 'wood')?.quantity || 0;
  const stoneCount = items.find(i => i.id === 'stone')?.quantity || 0;
  const canAffordRepairAll = woodCount >= 5 && stoneCount >= 5;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div className="w-full max-w-3xl bg-stone-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
               <span className="text-3xl">🎒</span> {t('inventory')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`h-1 w-24 bg-black/40 rounded-full overflow-hidden border border-white/5`}>
                  <div 
                    className={`h-full transition-all duration-500 ${items.length >= MAX_INVENTORY_SLOTS ? 'bg-red-500' : 'bg-amber-500'}`} 
                    style={{ width: `${(items.length / MAX_INVENTORY_SLOTS) * 100}%` }}
                  />
               </div>
               <span className={`text-[9px] font-black uppercase tracking-widest ${items.length >= MAX_INVENTORY_SLOTS ? 'text-red-400' : 'text-white/40'}`}>
                 {items.length} / {MAX_INVENTORY_SLOTS} {t('slots')}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onSwitchToCrafting} className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-900 font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_4px_14px_rgba(245,158,11,0.3)]">⚒️ {t('crafting')}</button>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-lg">✕</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row p-6 gap-8 overflow-hidden">
          <div className="sm:w-1/3 flex flex-col gap-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-white/40 text-center">Active Gear</span>
            <div 
              ref={equipRef} 
              onPointerEnter={() => !draggedIndex && equippedItem && setHoveredItem(equippedItem)}
              onPointerLeave={() => setHoveredItem(null)}
              className={`aspect-square relative rounded-3xl border-2 flex items-center justify-center text-7xl transition-all shadow-inner ${isOverEquip ? 'bg-amber-500/20 border-amber-500 scale-105' : 'bg-black/40 border-white/5'}`}
            >
               {equippedItem ? equippedItem.icon : <span className="opacity-10 text-6xl">⚔️</span>}
               {equippedItem && equippedItem.durability !== undefined && (
                 <div className="absolute bottom-6 left-6 right-6 h-2 bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(equippedItem.durability / (equippedItem.maxDurability || 1)) * 100}%` }} />
                 </div>
               )}
            </div>
            
            {isNearWorkbench && (
              <div className="p-4 bg-white/5 border border-amber-500/20 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest text-center">Repair Workbench</span>
                <button 
                  onClick={() => onAction('repair_all', null)}
                  disabled={!canAffordRepairAll}
                  className={`w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${canAffordRepairAll ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-95' : 'bg-white/5 text-white/20 border border-white/5'}`}
                >
                  <span>🛠️ Repair All Gear</span>
                  <span className="text-[8px] opacity-70">Cost: 5🪵 5🪨</span>
                </button>
                {!canAffordRepairAll && <p className="text-[8px] text-red-500/60 text-center font-black uppercase">{t('need_resources')}</p>}
              </div>
            )}

            {!isNearWorkbench && equippedItem && <div className="text-center animate-in fade-in slide-in-from-top-1 duration-300"><p className="text-[11px] font-bold text-white uppercase tracking-tight">{equippedItem.name}</p></div>}
            
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl mt-auto">
              <p className="text-[9px] text-white/30 text-center uppercase leading-relaxed font-black tracking-widest">Only Tools & Weapons can be placed here.</p>
            </div>
          </div>

          <div className="w-px bg-white/5 hidden sm:block" />

          <div className="flex-1 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
             <InventoryGrid itemsToDraw={equipment} title="Equipment & Tools" icon="⚔️" />
             <InventoryGrid itemsToDraw={consumables} title="Consumables" icon="🫐" />
             <InventoryGrid itemsToDraw={materials} title="Materials & Resources" icon="🪵" />
          </div>
        </div>
      </div>

      {hoveredItem && !draggedIndex && (
        <div 
          className="fixed pointer-events-none z-[300] bg-stone-950/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-3 max-w-[260px] animate-in fade-in zoom-in-95 duration-200"
          style={{ left: mousePos.x + 24, top: mousePos.y + 24 }}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col">
              <span className="text-amber-500 font-black text-[12px] uppercase tracking-wider">{hoveredItem.name}</span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{hoveredItem.type}</span>
            </div>
            {hoveredItem.durability !== undefined && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${hoveredItem.durability < 20 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40'}`}>
                {hoveredItem.durability}/{hoveredItem.maxDurability}
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed font-medium">{hoveredItem.description}</p>
          
          {hoveredItem.durability !== undefined && hoveredItem.durability < (hoveredItem.maxDurability || 1) && isNearWorkbench && (
            <div className="mt-1 flex flex-col gap-2 pointer-events-auto">
              <div className="h-px bg-white/10" />
              <button 
                onClick={(e) => { e.stopPropagation(); onAction('repair', hoveredItem); }} 
                className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-500 transition-all"
              >
                🛠️ Single Repair (2🪵, 2🪨)
              </button>
            </div>
          )}
        </div>
      )}

      {draggedIndex !== null && (
        <div 
          className="fixed pointer-events-none z-[200] w-20 h-20 bg-amber-500/40 border-2 border-amber-500/50 rounded-2xl flex items-center justify-center text-5xl shadow-[0_10px_40px_rgba(245,158,11,0.2)] backdrop-blur-sm" 
          style={{ left: dragPos.x - 40, top: dragPos.y - 40 }}
        >
          {items[draggedIndex].icon}
        </div>
      )}
    </div>
  );
};
