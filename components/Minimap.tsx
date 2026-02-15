
import React, { useRef, useEffect } from 'react';
import { Entity, PlayerStats, TileType } from '../types';
import { WORLD_SIZE } from '../constants';
import { getTileType } from '../App';

interface Props {
  playerPos: { x: number; y: number };
  entities: Entity[];
  playerStats: PlayerStats;
}

export const Minimap: React.FC<Props> = ({ playerPos, entities, playerStats }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapSize = 160;
  const viewRadius = 25; // How many tiles to show from center

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(0, 0, mapSize, mapSize);

    const scale = mapSize / (viewRadius * 2);
    const startX = Math.floor(playerPos.x - viewRadius);
    const endX = Math.ceil(playerPos.x + viewRadius);
    const startY = Math.floor(playerPos.y - viewRadius);
    const endY = Math.ceil(playerPos.y + viewRadius);

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
      } else if (['deer', 'rabbit', 'bear', 'scorpion'].includes(ent.type)) {
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
    
    // Direction indicator
    ctx.save();
    ctx.translate(centerX, centerY);
    const rotations: Record<string, number> = { 'se': Math.PI * 0.25, 'sw': Math.PI * 0.75, 'nw': Math.PI * 1.25, 'ne': Math.PI * 1.75 };
    ctx.rotate(rotations[playerStats.facing] || 0);
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Draw Border Overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, mapSize - 2, mapSize - 2);

  }, [playerPos, entities, playerStats]);

  return (
    <div className="relative group pointer-events-auto">
      <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
      <canvas 
        ref={canvasRef} 
        width={mapSize} 
        height={mapSize} 
        className="relative bg-stone-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      />
      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded border border-white/5 text-[8px] font-black text-white/50 uppercase tracking-widest">
        Local Radar
      </div>
    </div>
  );
};
