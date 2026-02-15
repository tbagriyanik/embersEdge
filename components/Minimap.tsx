
import React, { useRef, useEffect } from 'react';
import { Entity, PlayerStats, TileType, Language } from '../types';
import { WORLD_SIZE, TRANSLATIONS } from '../constants';
import { getTileType } from '../App';

interface Props {
  playerPos: { x: number; y: number };
  entities: Entity[];
  playerStats: PlayerStats;
  language: Language;
}

export const Minimap: React.FC<Props> = ({ playerPos, entities, playerStats, language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapSize = 140; 
  const viewRadius = 35; // Görüş çapı büyütüldü
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(0, 0, mapSize, mapSize);

    const scale = mapSize / (viewRadius * 2);
    const startX = Math.floor(playerPos.x - viewRadius);
    const endX = Math.ceil(playerPos.x + viewRadius);
    const startY = Math.floor(playerPos.y - viewRadius);
    const endY = Math.ceil(playerPos.y + viewRadius);

    // Dairesel maskeleme
    ctx.save();
    ctx.beginPath();
    ctx.arc(mapSize / 2, mapSize / 2, mapSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // 1. Draw Terrain
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) continue;

        const tile = getTileType(x, y, playerStats.level);
        let color = '#166534'; // grass
        if (tile === 'water') color = '#1e3a8a';
        else if (tile === 'sand') color = '#ca8a04';
        
        const screenX = (x - (playerPos.x - viewRadius)) * scale;
        const screenY = (y - (playerPos.y - viewRadius)) * scale;
        
        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, scale + 0.5, scale + 0.5);
      }
    }

    // 2. Draw Entities
    entities.forEach(ent => {
      const dist = Math.sqrt((ent.x - playerPos.x) ** 2 + (ent.y - playerPos.y) ** 2);
      if (dist > viewRadius) return;

      const screenX = (ent.x - (playerPos.x - viewRadius)) * scale;
      const screenY = (ent.y - (playerPos.y - viewRadius)) * scale;

      let color = '#ffffff';
      let size = 2;

      if (ent.type.includes('tree')) {
        color = '#4ade80';
        size = 1.5;
      } else if (ent.type.includes('rock')) {
        color = '#94a3b8';
        size = 1.5;
      } else if (['deer', 'rabbit', 'bear', 'scorpion', 'crab'].includes(ent.type)) {
        color = '#f87171';
        size = 2;
      } else if (['tent', 'hut', 'workbench', 'watchtower', 'campfire'].includes(ent.type)) {
        color = '#fbbf24';
        size = 3;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw Player (Center)
    const centerX = mapSize / 2;
    const centerY = mapSize / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    const rotations: Record<string, number> = { 'se': Math.PI * 0.25, 'sw': Math.PI * 0.75, 'nw': Math.PI * 1.25, 'ne': Math.PI * 1.75 };
    ctx.rotate(rotations[playerStats.facing] || 0);
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore(); 

    // 4. Border Overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mapSize / 2, mapSize / 2, (mapSize / 2) - 2, 0, Math.PI * 2);
    ctx.stroke();

  }, [playerPos, entities, playerStats]);

  return (
    <div className="relative group pointer-events-auto">
      <div className="absolute -inset-2 bg-amber-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
      <div className="relative p-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={mapSize} 
          height={mapSize} 
          className="rounded-full"
        />
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[7px] font-black text-white/70 uppercase tracking-widest shadow-lg">
        {t('radar')}
      </div>
    </div>
  );
};
