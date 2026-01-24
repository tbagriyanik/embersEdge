
import React, { useState, useRef, useEffect } from 'react';
import { Item, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  items: Item[];
  equippedItemId: string | null;
  onAction: (action: 'use' | 'reorder' | 'equip', data: any) => void;
  onClose: () => void;
  language: Language;
}

export const Inventory: React.FC<Props> = ({ items, equippedItemId, onAction, onClose, language }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [isOverEquip, setIsOverEquip] = useState(false);
  const equipRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => TRANSLATIONS[language][key] || key;

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
      setIsOverEquip(e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedIndex === null) return;
    const dragItem = items[draggedIndex];
    if (isOverEquip && dragItem.type === 'tool') onAction('equip', dragItem);
    else {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div className="w-full max-w-2xl bg-stone-900 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-3">
             <span className="text-3xl">🎒</span> {t('inventory')}
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-lg">✕</button>
        </div>

        <div className="flex flex-col sm:flex-row p-6 gap-8 h-[60vh] sm:h-auto">
          {/* Active Equipment */}
          <div className="sm:w-1/3 flex flex-col gap-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-white/40 text-center">Active Gear</span>
            <div 
              ref={equipRef} 
              onPointerEnter={() => !draggedIndex && equippedItem && setHoveredItem(equippedItem)}
              onPointerLeave={() => setHoveredItem(null)}
              className={`aspect-square rounded-3xl border-2 flex items-center justify-center text-7xl transition-all ${isOverEquip ? 'bg-amber-500/20 border-amber-500 scale-105' : 'bg-black/40 border-white/5'}`}
            >
               {equippedItem ? equippedItem.icon : <span className="opacity-10 text-6xl">🛡️</span>}
            </div>
            {equippedItem && <div className="text-center"><p className="text-[11px] font-bold text-white uppercase tracking-tight">{equippedItem.name}</p></div>}
          </div>

          <div className="w-px bg-white/5 hidden sm:block" />

          {/* Grid */}
          <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-y-auto pr-2">
            {items.map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`} 
                data-slot-idx={idx} 
                onPointerDown={(e) => handleStartDrag(e, idx)} 
                onPointerEnter={() => !draggedIndex && setHoveredItem(item)}
                onPointerLeave={() => setHoveredItem(null)}
                onClick={() => onAction('use', item)}
                className={`relative aspect-square rounded-2xl border flex items-center justify-center text-3xl cursor-grab active:cursor-grabbing transition-all ${equippedItemId === item.id ? 'border-amber-500 bg-amber-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                {item.icon}
                <span className="absolute bottom-1 right-2 text-[11px] font-black text-white/70">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredItem && !draggedIndex && (
        <div 
          className="fixed pointer-events-none z-[300] bg-stone-950/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-1.5 max-w-[220px]"
          style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
        >
          <span className="text-amber-500 font-black text-[11px] uppercase tracking-wider">{hoveredItem.name}</span>
          <p className="text-[11px] text-white/70 leading-relaxed font-medium">{hoveredItem.description}</p>
        </div>
      )}

      {draggedIndex !== null && (
        <div className="fixed pointer-events-none z-[200] w-20 h-20 bg-amber-500/30 border-2 border-amber-500 rounded-2xl flex items-center justify-center text-4xl shadow-xl" style={{ left: dragPos.x - 40, top: dragPos.y - 40 }}>
          {items[draggedIndex].icon}
        </div>
      )}
    </div>
  );
};
