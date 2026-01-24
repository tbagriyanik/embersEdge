
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, WORLD_SIZE } from '../constants';
import { getTileType } from '../App';

interface Props {
  gameState: GameState;
}

export const GameCanvas: React.FC<Props> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualScales = useRef<Map<string, number>>(new Map());
  
  const zoom = gameState.viewConfig.zoom;
  const rotation = gameState.viewConfig.rotation;
  const cameraOffsetX = gameState.viewConfig.cameraOffsetX;
  const cameraOffsetY = gameState.viewConfig.cameraOffsetY;

  const getTransformedCoords = useCallback((wx: number, wy: number) => {
    if (rotation === 90) return { tx: wy, ty: WORLD_SIZE - 1 - wx };
    if (rotation === 180) return { tx: WORLD_SIZE - 1 - wx, ty: WORLD_SIZE - 1 - wy };
    if (rotation === 270) return { tx: WORLD_SIZE - 1 - wy, ty: wx };
    return { tx: wx, ty: wy };
  }, [rotation]);

  const toScreen = useCallback((x: number, y: number) => {
    const { tx, ty } = getTransformedCoords(x, y);
    const tw = TILE_WIDTH * zoom;
    const th = TILE_HEIGHT * zoom;
    return { x: tx * tw, y: ty * th };
  }, [zoom, getTransformedCoords]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frameId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const now = Date.now();
      const timeOfDay = gameState.time;
      let ambientAlpha = timeOfDay < 400 || timeOfDay > 2100 ? 0.95 : (timeOfDay < 700 ? 0.95 * (1 - (timeOfDay - 400)/300) : (timeOfDay > 1800 ? 0.95 * ((timeOfDay - 1800)/300) : 0));
      
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const pS = toScreen(gameState.playerPos.x, gameState.playerPos.y);
      ctx.save();
      ctx.translate(
        canvas.width / 2 - (pS.x + (TILE_WIDTH * zoom) / 2) + cameraOffsetX, 
        canvas.height / 2 - (pS.y + (TILE_HEIGHT * zoom) / 2) + cameraOffsetY
      );

      const renderRange = 12;
      const startX = Math.max(0, Math.floor(gameState.playerPos.x - renderRange));
      const endX = Math.min(WORLD_SIZE, Math.ceil(gameState.playerPos.x + renderRange));
      const startY = Math.max(0, Math.floor(gameState.playerPos.y - renderRange));
      const endY = Math.min(WORLD_SIZE, Math.ceil(gameState.playerPos.y + renderRange));

      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          const s = toScreen(x, y);
          const tile = getTileType(x, y, gameState.playerStats.level);
          ctx.fillStyle = tile === 'grass' ? '#166534' : (tile === 'sand' ? '#eab308' : (tile === 'water' ? '#1e40af' : (tile === 'snow_tile' ? '#f8fafc' : '#b45309')));
          ctx.fillRect(s.x, s.y, TILE_WIDTH * zoom + 0.5, TILE_HEIGHT * zoom + 0.5);
        }
      }

      const sorted = [...gameState.entities, { id: 'p', type: 'player', x: gameState.playerPos.x, y: gameState.playerPos.y, health: gameState.playerStats.health, maxHealth: gameState.playerStats.maxHealth } as any]
        .filter(ent => Math.sqrt((ent.x - gameState.playerPos.x)**2 + (ent.y - gameState.playerPos.y)**2) < renderRange + 2)
        .sort((a,b) => a.y - b.y);

      sorted.forEach(ent => {
        const s = toScreen(ent.x, ent.y);
        const centerX = s.x + (TILE_WIDTH * zoom) / 2;
        const centerY = s.y + (TILE_HEIGHT * zoom) / 2;
        
        let targetScale = (ent.type === 'player' || ent.type === 'well' || ent.type === 'workbench' || ent.type === 'campfire') 
          ? 1 
          : Math.max(0.2, ent.health / ent.maxHealth);
        
        let currentScale = visualScales.current.get(ent.id) ?? targetScale;
        currentScale += (targetScale - currentScale) * 0.15; 
        visualScales.current.set(ent.id, currentScale);

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 18*zoom, 12*zoom * currentScale, 6*zoom * currentScale, 0, 0, Math.PI*2);
        ctx.fill();

        if (ent.type === 'player') {
          const stats = gameState.playerStats;
          const isWalking = stats.isWalking;
          const facing = stats.facing;
          const hasAxe = stats.equippedItemId === 'axe';
          const interactAge = now - stats.lastInteractTime;
          const isSwinging = interactAge < 300;
          const swingPhase = isSwinging ? Math.sin((interactAge / 300) * Math.PI) : 0;

          const walkCycle = isWalking ? Math.sin(now / 100) : 0;
          const legSwing = walkCycle * 8 * zoom;
          const armSwing = walkCycle * 6 * zoom;

          // Drawing Legs
          ctx.fillStyle = '#1c1917'; // Leg color (pants/dark)
          ctx.fillRect(centerX - 8*zoom, centerY + 8*zoom + (isWalking ? walkCycle*4*zoom : 0), 6*zoom, 10*zoom); // Left leg
          ctx.fillRect(centerX + 2*zoom, centerY + 8*zoom + (isWalking ? -walkCycle*4*zoom : 0), 6*zoom, 10*zoom); // Right leg

          // Drawing Body
          ctx.fillStyle = stats.character.outfitColor;
          ctx.fillRect(centerX - 10*zoom, centerY - 10*zoom, 20*zoom, 20*zoom);

          // Drawing Arms
          ctx.fillStyle = '#fde68a'; // Skin color
          // Left Arm
          ctx.save();
          ctx.translate(centerX - 12*zoom, centerY - 6*zoom);
          if (isWalking) ctx.rotate(-armSwing * 0.1);
          ctx.fillRect(-2*zoom, 0, 4*zoom, 12*zoom);
          ctx.restore();

          // Right Arm (Tool Arm)
          ctx.save();
          ctx.translate(centerX + 12*zoom, centerY - 6*zoom);
          if (isSwinging) {
            ctx.rotate(-Math.PI/2 - swingPhase * 1.5);
          } else if (isWalking) {
            ctx.rotate(armSwing * 0.1);
          }
          ctx.fillRect(-2*zoom, 0, 4*zoom, 12*zoom);

          // Draw Axe in sync with arm
          if (hasAxe) {
            ctx.save();
            ctx.translate(0, 10*zoom);
            ctx.font = `${24*zoom}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🪓', 4*zoom, 4*zoom);
            ctx.restore();
          }
          ctx.restore();

          // Drawing Head
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.arc(centerX, centerY - 20*zoom, 10*zoom, 0, Math.PI*2);
          ctx.fill();

          // Eyes based on facing
          ctx.fillStyle = 'black';
          const eyeSize = 1.5 * zoom;
          let eyeOffsetX = 0, eyeOffsetY = 0;
          if (facing === 'se') { eyeOffsetX = 3*zoom; eyeOffsetY = 1*zoom; }
          else if (facing === 'sw') { eyeOffsetX = -3*zoom; eyeOffsetY = 1*zoom; }
          else if (facing === 'ne') { eyeOffsetX = 3*zoom; eyeOffsetY = -2*zoom; }
          else if (facing === 'nw') { eyeOffsetX = -3*zoom; eyeOffsetY = -2*zoom; }

          ctx.beginPath();
          ctx.arc(centerX + eyeOffsetX - 3*zoom, centerY - 21*zoom + eyeOffsetY, eyeSize, 0, Math.PI*2);
          ctx.arc(centerX + eyeOffsetX + 3*zoom, centerY - 21*zoom + eyeOffsetY, eyeSize, 0, Math.PI*2);
          ctx.fill();

        } else {
          const icons: any = { 
            tree: '🌲', rock: '🪨', bush: '🌿', well: '⛲', 
            deer: '🦌', rabbit: '🐇', scorpion: '🦂', bear: '🐻',
            campfire: '🔥', tent: '⛺', hut: '🏠', workbench: '⚒️'
          };
          
          const isAnimal = ['deer', 'rabbit', 'scorpion', 'bear'].includes(ent.type);
          const bounce = isAnimal ? Math.abs(Math.sin(now / 150)) * 1 * zoom : 0; 
          const isFlipping = ent.targetX !== undefined && ent.targetX < ent.x;

          ctx.save();
          ctx.translate(centerX, centerY + 10*zoom - bounce);
          if (isFlipping) ctx.scale(-1, 1);
          ctx.scale(currentScale, currentScale);
          ctx.font = `${48*zoom}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'white'; 
          ctx.fillText(icons[ent.type] || '❓', 0, 0);
          ctx.restore();
        }
      });

      if (now % 1000 < 20) {
          const activeIds = new Set(sorted.map(e => e.id));
          for (const key of visualScales.current.keys()) {
              if (!activeIds.has(key)) visualScales.current.delete(key);
          }
      }

      ctx.restore();

      const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, canvas.width*0.9);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${0.5 + ambientAlpha*0.4})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0,0, canvas.width, canvas.height);

      frameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frameId); };
  }, [gameState, zoom, rotation, toScreen, cameraOffsetX, cameraOffsetY]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};
