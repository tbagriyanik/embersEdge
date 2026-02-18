
import React, { useState, useRef } from 'react';
import { Item, Language } from '../types';
import { TRANSLATIONS, MAX_INVENTORY_SLOTS } from '../constants';

interface Props {
  items: Item[];
  equippedItemId: string | null;
  isNearWorkbench: boolean;
  onAction: (action: 'use' | 'reorder' | 'equip' | 'repair' | 'repair_all' | 'place', data: any) => void;
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
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);
  
  const equipRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => TRANSLATIONS[language][key] || key;

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

    const slotElement = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.hasAttribute('data-slot-idx'));
    if (slotElement) {
        setHoveredSlotIdx(parseInt(slotElement.getAttribute('data-slot-idx') || '-1'));
    } else {
        setHoveredSlotIdx(null);
    }
  };

  const InventoryGrid = ({ itemsToDraw, title, icon }: { itemsToDraw: Item[], title: string, icon: string }) => (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex items-center justify-between px-2 border-b border-white/10 pb-2">
        <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-white/50">{icon} {title}</span>
        <span className="text-[10px] sm:text-[12px] font-mono text-white/30">{itemsToDraw.length}</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
        {itemsToDraw.map((item) => {
           const globalIdx = items.findIndex(i => i === item);
           const isDragged = draggedIndex === globalIdx;
           const isHoveredTarget = hoveredSlotIdx === globalIdx;

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
                onClick={() => {
                    if (draggedIndex === null) {
                        if (item.placeEntity) onAction('place', item);
                        else onAction('use', item);
                    }
                }}
                className={`relative aspect-square rounded-full border-2 flex items-center justify-center text-3xl sm:text-4xl transition-all cursor-pointer shadow-lg 
                  ${equippedItemId === item.id ? 'border-amber-400 bg-amber-500/40 scale-105' : 'border-white/10 bg-white/5 hover:bg-white/15'}
                  ${isDragged ? 'opacity-30' : 'opacity-100'}
                  ${isHoveredTarget ? 'scale-110 border-amber-300 bg-white/10' : ''}`}
              >
                {item.icon}
                {item.quantity > 1 && (
                  <span className="absolute bottom-0 right-0 text-[9px] sm:text-[11px] font-black text-white bg-amber-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border border-stone-900 shadow-sm">
                    {item.quantity}
                  </span>
                )}
                {item.durability !== undefined && (
                  <div className="absolute bottom-1.5 left-3 right-3 h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-400" style={{ width: `${(item.durability / (item.maxDurability || 1)) * 100}%` }} />
                  </div>
                )}
                {item.placeEntity && (
                   <span className="absolute -top-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border border-stone-900 animate-pulse"></span>
                )}
              </div>
           );
        })}
        {itemsToDraw.length === 0 && <div className="aspect-square rounded-full border-2 border-dashed border-white/5 flex items-center justify-center opacity-10 text-2xl">🕳️</div>}
      </div>
    </div>
  );

  const equipment = items.filter(i => i.type === 'tool' || i.type === 'weapon');
  const consumables = items.filter(i => i.type === 'food');
  const otherItems = items.filter(i => i.type === 'resource' || i.type === 'material' || i.type === 'structure');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none" 
         onPointerMove={handlePointerMove} 
         onPointerUp={(e) => {
            if (draggedIndex === null) return;
            const dragItem = items[draggedIndex];
            
            if (isOverEquip && (dragItem.type === 'tool' || dragItem.type === 'weapon')) {
                onAction('equip', dragItem);
            } else if (hoveredSlotIdx !== null && hoveredSlotIdx !== draggedIndex) {
                onAction('reorder', { fromIdx: draggedIndex, toIdx: hoveredSlotIdx });
            }
            
            setDraggedIndex(null);
            setIsOverEquip(false);
            setHoveredSlotIdx(null);
         }}>
      <div className="w-full max-w-5xl max-h-[90vh] bg-stone-900/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
               <span className="text-3xl">🎒</span> {t('inventory')}
            </h2>
            <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-white/30 mt-1">
              {items.length} / {MAX_INVENTORY_SLOTS} {t('slots')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onSwitchToCrafting} className="px-6 py-3 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] sm:text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">⚒️ {t('crafting')}</button>
            <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 text-2xl transition-colors">✕</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row p-6 sm:p-8 gap-8 sm:gap-12 overflow-hidden">
          {/* Portrait/Equip Area */}
          <div className="md:w-1/3 flex flex-row md:flex-col gap-6 items-center md:items-stretch">
            <div 
              ref={equipRef} 
              className={`w-32 h-32 md:w-full md:aspect-square relative rounded-full border-4 flex items-center justify-center text-6xl md:text-8xl transition-all shadow-2xl ${isOverEquip ? 'bg-amber-400/20 border-amber-400 scale-105 shadow-[0_0_40px_rgba(245,158,11,0.4)]' : 'bg-black/30 border-white/10'}`}
            >
               {items.find(i => i.id === equippedItemId)?.icon || <span className="opacity-10">⚔️</span>}
               <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-full" />
               {isOverEquip && <div className="absolute inset-0 border-4 border-amber-400 rounded-full animate-ping opacity-30" />}
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-white/30 md:text-center">{t('active_gear')}</span>
              {isNearWorkbench ? (
                <button onClick={() => onAction('repair_all', null)} className="w-full py-4 rounded-full font-black text-[10px] sm:text-[12px] uppercase bg-emerald-500 text-white shadow-xl hover:bg-emerald-400 transition-all active:scale-95">🛠️ Repair All</button>
              ) : (
                <div className="p-4 bg-black/20 rounded-3xl border border-white/5 hidden md:block">
                  <p className="text-[10px] sm:text-[12px] text-white/20 text-center uppercase font-black tracking-widest leading-relaxed">Equip tools and weapons by dragging them here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-px bg-white/10 hidden md:block" />

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar">
             <InventoryGrid itemsToDraw={equipment} title="Equipment" icon="⚔️" />
             <InventoryGrid itemsToDraw={consumables} title="Consumables" icon="🫐" />
             <InventoryGrid itemsToDraw={otherItems} title="Materials & Build" icon="🪵" />
          </div>
        </div>
      </div>

      {/* Drag Ghost */}
      {draggedIndex !== null && (
        <div 
          className="fixed pointer-events-none z-[400] text-5xl sm:text-6xl drop-shadow-2xl opacity-80"
          style={{ left: dragPos.x - 30, top: dragPos.y - 30 }}
        >
          {items[draggedIndex].icon}
        </div>
      )}

      {/* Tooltip */}
      {hoveredItem && !draggedIndex && (
        <div className="fixed pointer-events-none z-[300] bg-stone-900/95 backdrop-blur-3xl border border-white/30 p-5 rounded-2xl shadow-2xl flex flex-col gap-3 max-w-[240px] animate-in fade-in zoom-in-95 duration-200"
             style={{ left: mousePos.x + 24, top: mousePos.y + 24 }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{hoveredItem.icon}</span>
            <span className="text-amber-500 font-black text-[12px] sm:text-[14px] uppercase tracking-tight">{hoveredItem.name}</span>
          </div>
          <p className="text-[10px] sm:text-[12px] text-white/70 leading-relaxed font-medium">{hoveredItem.description}</p>
          {hoveredItem.placeEntity && <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">PLACEABLE</p>}
        </div>
      )}
    </div>
  );
};
