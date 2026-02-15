
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

  const InventoryGrid = ({ itemsToDraw, title, icon }: { itemsToDraw: Item[], title: string, icon: string }) => (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center justify-between px-1 border-b border-white/5 pb-1">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">{icon} {title}</span>
        <span className="text-[9px] font-mono text-white/20">{itemsToDraw.length}</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
        {itemsToDraw.map((item) => {
           const globalIdx = items.findIndex(i => i === item);
           return (
              <div 
                key={`${item.id}-${globalIdx}`} 
                data-slot-idx={globalIdx} 
                onPointerDown={(e) => {
                  (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                  setDraggedIndex(globalIdx);
                  setDragPos({ x: e.clientX, y: e.clientY });
                  setHoveredItem(null);
                }} 
                onPointerEnter={() => !draggedIndex && setHoveredItem(item)}
                onPointerLeave={() => setHoveredItem(null)}
                onClick={() => onAction('use', item)}
                className={`relative aspect-square rounded-lg sm:rounded-xl border flex items-center justify-center text-2xl sm:text-3xl transition-all ${equippedItemId === item.id ? 'border-amber-400 bg-amber-500/30' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                {item.icon}
                {item.quantity > 1 && <span className="absolute bottom-0.5 right-1 text-[10px] font-black text-white/80">{item.quantity}</span>}
                {item.durability !== undefined && (
                  <div className="absolute bottom-1 left-1.5 right-1.5 h-0.5 sm:h-1 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} />
                  </div>
                )}
              </div>
           );
        })}
        {itemsToDraw.length === 0 && <div className="aspect-square rounded-lg border border-dashed border-white/10 flex items-center justify-center opacity-10 text-xl">🕳️</div>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm select-none" 
         onPointerMove={handlePointerMove} 
         onPointerUp={(e) => {
            if (draggedIndex === null) return;
            const dragItem = items[draggedIndex];
            if (isOverEquip && (dragItem.type === 'tool' || dragItem.type === 'weapon')) onAction('equip', dragItem);
            else {
              const slotElement = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.hasAttribute('data-slot-idx'));
              if (slotElement) {
                const targetIdx = parseInt(slotElement.getAttribute('data-slot-idx') || '-1');
                if (targetIdx !== -1 && targetIdx !== draggedIndex) onAction('reorder', { fromIdx: draggedIndex, toIdx: targetIdx });
              }
            }
            setDraggedIndex(null);
            setIsOverEquip(false);
         }}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
               <span className="text-2xl sm:text-3xl">🎒</span> {t('inventory')}
            </h2>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-0.5">
              {items.length} / {MAX_INVENTORY_SLOTS} {t('slots')}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onSwitchToCrafting} className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-500 text-stone-900 font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:scale-105 transition-transform">⚒️ {t('crafting')}</button>
            <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 text-lg">✕</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row p-4 sm:p-6 gap-4 sm:gap-8 overflow-hidden">
          <div className="md:w-1/3 flex flex-row md:flex-col gap-4 items-center md:items-stretch">
            <div 
              ref={equipRef} 
              className={`w-24 h-24 md:w-full md:aspect-square relative rounded-2xl md:rounded-3xl border-2 flex items-center justify-center text-5xl md:text-7xl transition-all ${isOverEquip ? 'bg-amber-400/20 border-amber-400' : 'bg-black/20 border-white/10'}`}
            >
               {items.find(i => i.id === equippedItemId)?.icon || <span className="opacity-10">⚔️</span>}
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 md:text-center">Active Gear</span>
              {isNearWorkbench ? (
                <button onClick={() => onAction('repair_all', null)} className="w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase bg-emerald-500/80 text-white shadow-lg">🛠️ Repair All</button>
              ) : (
                <div className="p-3 bg-black/20 rounded-xl border border-white/5 hidden md:block">
                  <p className="text-[9px] text-white/30 text-center uppercase font-black tracking-widest">Equip tools and weapons here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-px bg-white/10 hidden md:block" />

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             <InventoryGrid itemsToDraw={equipment} title="Equipment" icon="⚔️" />
             <InventoryGrid itemsToDraw={consumables} title="Consumables" icon="🫐" />
             <InventoryGrid itemsToDraw={materials} title="Materials" icon="🪵" />
          </div>
        </div>
      </div>

      {/* Tooltip & Drag Proxy (Simplified for brevity) */}
      {hoveredItem && !draggedIndex && (
        <div className="fixed pointer-events-none z-[300] bg-stone-900/90 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-2xl flex flex-col gap-2 max-w-[200px]"
             style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}>
          <span className="text-amber-400 font-black text-xs uppercase">{hoveredItem.name}</span>
          <p className="text-[10px] text-white/60 leading-tight">{hoveredItem.description}</p>
        </div>
      )}
    </div>
  );
};
