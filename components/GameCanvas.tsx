
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, WORLD_SIZE } from '../constants';
import { getTileType } from '../App';

interface Props {
  gameState: GameState;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const GameCanvas: React.FC<Props> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualScales = useRef<Map<string, number>>(new Map());
  const hitJolts = useRef<Map<string, number>>(new Map());
  const lastHealths = useRef<Map<string, number>>(new Map());
  const particles = useRef<Particle[]>([]);
  
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

  const spawnParticles = (x: number, y: number) => {
    const count = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed * 0.03,
        vy: Math.sin(angle) * speed * 0.03 - 0.03,
        life: 0.8,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#78350f' : '#451a03' 
      });
    }
  };

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

      const renderRange = 14;
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

          if (tile === 'water') {
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1 * zoom;
            const waveOffset = Math.sin((now / 1000) + (x * 0.5) + (y * 0.5)) * 4 * zoom;
            ctx.beginPath();
            ctx.moveTo(s.x + 10 * zoom, s.y + 30 * zoom + waveOffset);
            ctx.bezierCurveTo(
                s.x + 20 * zoom, s.y + 20 * zoom + waveOffset,
                s.x + 40 * zoom, s.y + 40 * zoom + waveOffset,
                s.x + 54 * zoom, s.y + 30 * zoom + waveOffset
            );
            ctx.stroke();
          }
        }
      }

      const entitiesToDraw = [...gameState.entities, { id: 'p', type: 'player', x: gameState.playerPos.x, y: gameState.playerPos.y, health: gameState.playerStats.health, maxHealth: gameState.playerStats.maxHealth } as any]
        .filter(ent => Math.sqrt((ent.x - gameState.playerPos.x)**2 + (ent.y - gameState.playerPos.y)**2) < renderRange + 2)
        .sort((a,b) => a.y - b.y);

      entitiesToDraw.forEach(ent => {
        const prevHealth = lastHealths.current.get(ent.id);
        if (prevHealth !== undefined && ent.health < prevHealth) {
          spawnParticles(ent.x, ent.y);
          hitJolts.current.set(ent.id, 0.4); 
        }
        lastHealths.current.set(ent.id, ent.health);

        const s = toScreen(ent.x, ent.y);
        const centerX = s.x + (TILE_WIDTH * zoom) / 2;
        const centerY = s.y + (TILE_HEIGHT * zoom) / 2;
        
        let targetScale = 1;
        
        let currentScale = visualScales.current.get(ent.id) ?? targetScale;
        currentScale += (targetScale - currentScale) * 0.1; 
        visualScales.current.set(ent.id, currentScale);

        let jolt = hitJolts.current.get(ent.id) ?? 0;
        jolt *= 0.85;
        if (jolt < 0.01) jolt = 0;
        hitJolts.current.set(ent.id, jolt);

        const finalScale = currentScale * (1 - jolt); 

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 18*zoom, 12*zoom * finalScale, 6*zoom * finalScale, 0, 0, Math.PI*2);
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
          const armSwing = walkCycle * 6 * zoom;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(finalScale, finalScale);

          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-8*zoom, 8*zoom + (isWalking ? walkCycle*4*zoom : 0), 6*zoom, 10*zoom);
          ctx.fillRect(2*zoom, 8*zoom + (isWalking ? -walkCycle*4*zoom : 0), 6*zoom, 10*zoom);

          ctx.fillStyle = stats.character.outfitColor;
          ctx.fillRect(-10*zoom, -10*zoom, 20*zoom, 20*zoom);

          ctx.fillStyle = '#fde68a';
          ctx.save();
          ctx.translate(-12*zoom, -6*zoom);
          if (isWalking) ctx.rotate(-armSwing * 0.1);
          ctx.fillRect(-2*zoom, 0, 4*zoom, 12*zoom);
          ctx.restore();

          ctx.save();
          ctx.translate(12*zoom, -6*zoom);
          if (isSwinging) ctx.rotate(-Math.PI/2 - swingPhase * 1.5);
          else if (isWalking) ctx.rotate(armSwing * 0.1);
          ctx.fillRect(-2*zoom, 0, 4*zoom, 12*zoom);
          
          if (hasAxe) {
            ctx.save();
            ctx.translate(0, 10 * zoom); // Eli tuttuğu yer
            
            // Ahşap Sap
            ctx.fillStyle = '#4e342e';
            ctx.fillRect(-1 * zoom, 0, 2 * zoom, 18 * zoom);
            
            // Demir Başlık (Savrulan Kısım)
            ctx.translate(0, 18 * zoom);
            // Savrulma ivmesi için vuruş anında başlığı hafifçe öne döndür
            ctx.rotate(isSwinging ? swingPhase * 0.7 : 0);
            
            // Ana Demir Kütlesi
            ctx.fillStyle = '#90a4ae';
            ctx.beginPath();
            ctx.moveTo(-1 * zoom, 0);
            ctx.lineTo(8 * zoom, -4 * zoom);
            ctx.lineTo(11 * zoom, 4 * zoom);
            ctx.lineTo(-1 * zoom, 8 * zoom);
            ctx.closePath();
            ctx.fill();
            
            // Keskin Kenar Parlaması
            ctx.strokeStyle = '#eceff1';
            ctx.lineWidth = 1 * zoom;
            ctx.beginPath();
            ctx.moveTo(8 * zoom, -4 * zoom);
            ctx.lineTo(11 * zoom, 4 * zoom);
            ctx.stroke();
            
            ctx.restore();
          }
          ctx.restore();

          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.arc(0, -20*zoom, 10*zoom, 0, Math.PI*2);
          ctx.fill();

          ctx.fillStyle = 'black';
          const eyeSize = 1.5 * zoom;
          let eyeOffsetX = 0, eyeOffsetY = 0;
          if (facing === 'se') { eyeOffsetX = 3*zoom; eyeOffsetY = 1*zoom; }
          else if (facing === 'sw') { eyeOffsetX = -3*zoom; eyeOffsetY = 1*zoom; }
          else if (facing === 'ne') { eyeOffsetX = 3*zoom; eyeOffsetY = -2*zoom; }
          else if (facing === 'nw') { eyeOffsetX = -3*zoom; eyeOffsetY = -2*zoom; }
          ctx.beginPath();
          ctx.arc(eyeOffsetX - 3*zoom, -21*zoom + eyeOffsetY, eyeSize, 0, Math.PI*2);
          ctx.arc(eyeOffsetX + 3*zoom, -21*zoom + eyeOffsetY, eyeSize, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();

        } else {
          const icons: any = { 
            tree_oak: '🌳', tree_pine: '🌲', tree_palm: '🌴',
            rock_standard: '🪨', rock_iron: '🌑',
            bush_berry: '🌿', bush_flower: '🌺', bush_dry: '🍂',
            well: '⛲', deer: '🦌', rabbit: '🐇', scorpion: '🦂', bear: '🐻',
            campfire: '🔥', tent: '⛺', hut: '🏠', workbench: '⚒️'
          };
          
          const isAnimal = ['deer', 'rabbit', 'scorpion', 'bear'].includes(ent.type);
          const bounce = isAnimal ? Math.abs(Math.sin(now / 150)) * 1 * zoom : 0; 
          const isFlipping = ent.targetX !== undefined && ent.targetX < ent.x;

          ctx.save();
          ctx.translate(centerX, centerY + 10*zoom - bounce);
          if (isFlipping) ctx.scale(-1, 1);
          ctx.scale(finalScale, finalScale);
          ctx.font = `${48*zoom}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'white'; 
          ctx.fillText(icons[ent.type] || '❓', 0, 0);
          ctx.restore();
        }
      });

      particles.current = particles.current.filter(p => {
        p.life -= 0.02;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.005;
        
        const ps = toScreen(p.x, p.y);
        const opacity = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.fillRect(ps.x, ps.y, p.size * zoom, p.size * zoom);
        ctx.globalAlpha = 1.0;

        return p.life > 0;
      });

      if (now % 2000 < 50) {
          const activeIds = new Set(entitiesToDraw.map(e => e.id));
          for (const key of visualScales.current.keys()) if (!activeIds.has(key)) visualScales.current.delete(key);
          for (const key of lastHealths.current.keys()) if (!activeIds.has(key)) lastHealths.current.delete(key);
          for (const key of hitJolts.current.keys()) if (!activeIds.has(key)) hitJolts.current.delete(key);
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
