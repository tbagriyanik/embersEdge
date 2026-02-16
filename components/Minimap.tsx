
import React, { useRef, useEffect } from 'react';
import { GameState } from '../types';
import { CHUNK_SIZE, TRANSLATIONS } from '../constants';
import { calculateTileType } from '../App';

interface Props {
  gameState: GameState;
}

export const Minimap: React.FC<Props> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapSize = 160; 
  const viewRadius = 40;

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const render = () => {
      const { playerPos, entities, chunks, settings } = gameState;
      const t = (key: string) => TRANSLATIONS[settings.language][key] || key;
      const now = performance.now();

      // Clear with semi-transparent dark background
      ctx.clearRect(0, 0, mapSize, mapSize);
      ctx.fillStyle = 'rgba(12, 10, 9, 0.85)';
      ctx.beginPath();
      ctx.arc(mapSize / 2, mapSize / 2, mapSize / 2, 0, Math.PI * 2);
      ctx.fill();

      const scale = mapSize / (viewRadius * 2);
      const startX = Math.floor(playerPos.x - viewRadius);
      const endX = Math.ceil(playerPos.x + viewRadius);
      const startY = Math.floor(playerPos.y - viewRadius);
      const endY = Math.ceil(playerPos.y + viewRadius);

      ctx.save();
      // Clip drawing to the circular minimap
      ctx.beginPath();
      ctx.arc(mapSize / 2, mapSize / 2, mapSize / 2 - 2, 0, Math.PI * 2);
      ctx.clip();

      // 1. Draw Terrain
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const cx = Math.floor(x / CHUNK_SIZE);
          const cy = Math.floor(y / CHUNK_SIZE);
          const key = `${cx},${cy}`;
          const chunk = chunks[key];

          let tile;
          if (chunk) {
            const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            tile = chunk[lx][ly];
          } else {
            tile = calculateTileType(x, y);
          }

          let color = '#065f46'; // Forest green
          if (tile === 'water') color = '#1e40af';
          else if (tile === 'sand') color = '#d97706';
          else if (tile === 'snow_tile') color = '#e2e8f0';
          else if (tile === 'stone') color = '#44403c';
          
          const screenX = (x - (playerPos.x - viewRadius)) * scale;
          const screenY = (y - (playerPos.y - viewRadius)) * scale;
          
          ctx.fillStyle = color;
          ctx.fillRect(screenX, screenY, scale + 0.5, scale + 0.5);
        }
      }

      // 2. Scanline / Grid effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const scanOffset = (now / 50) % 8;
      for(let i = 0; i < mapSize; i += 8) {
        ctx.fillRect(0, i + scanOffset, mapSize, 1);
        ctx.fillRect(i + scanOffset, 0, 1, mapSize);
      }

      // 3. Draw Entities
      entities.forEach(ent => {
        const dist = Math.sqrt((ent.x - playerPos.x) ** 2 + (ent.y - playerPos.y) ** 2);
        if (dist > viewRadius) return;

        const screenX = (ent.x - (playerPos.x - viewRadius)) * scale;
        const screenY = (ent.y - (playerPos.y - viewRadius)) * scale;
        
        let color = '#fff';
        let size = 2;
        if (ent.type.includes('tree')) { color = '#34d399'; size = 1.2; }
        else if (ent.type === 'deer') { color = '#f87171'; size = 2.5; }
        else if (ent.type === 'rabbit') { color = '#fff'; size = 1.5; }
        else if (ent.type === 'flower') { color = '#f472b6'; size = 1.2; }
        else if (ent.type === 'iron_ore') { color = '#94a3b8'; size = 2; }
        else if (ent.type === 'workbench' || ent.type === 'tent' || ent.type === 'campfire') { color = '#fbbf24'; size = 3; }

        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Center Crosshair (Stable)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mapSize/2 - 6, mapSize/2);
      ctx.lineTo(mapSize/2 + 6, mapSize/2);
      ctx.moveTo(mapSize/2, mapSize/2 - 6);
      ctx.lineTo(mapSize/2, mapSize/2 + 6);
      ctx.stroke();

      // 5. Player Marker (Arrow)
      ctx.save();
      ctx.translate(mapSize/2, mapSize/2);
      // Optional: rotate arrow based on player facing direction if desired
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'white';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // Outer Ring Decor
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(mapSize/2, mapSize/2, mapSize/2 - 2, 0, Math.PI*2);
      ctx.stroke();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([15, 25]);
      ctx.beginPath();
      ctx.arc(mapSize/2, mapSize/2, mapSize/2 - 2, now / 2000, now / 2000 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  return (
    <div className="relative group">
      <div className="absolute -inset-2 bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      <canvas 
        ref={canvasRef} 
        width={mapSize} 
        height={mapSize} 
        className="rounded-full shadow-[0_0_40px_rgba(0,0,0,0.9)] border border-white/10" 
      />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-stone-900/95 px-3 py-1 border border-amber-500/40 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] shadow-xl backdrop-blur-md">
        RADAR
      </div>
    </div>
  );
};
