
import React, { useRef, useEffect, useMemo } from 'react';
import { GameState, FacingDirection, Entity } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, WORLD_SIZE, ITEMS } from '../constants';
import { getTileType } from '../App';

interface Props {
  gameState: GameState & { 
    birds: {x: number, y: number, vx: number, vy: number, flap: number}[],
    ripples: {x: number, y: number, startTime: number}[],
    particles: {id: string, x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, type?: string}[],
    shake: number,
    isRecentlyAttackedByAnimal: boolean
  };
  gameStateRef: React.RefObject<any>;
  mouseTargetRef: React.RefObject<{ x: number, y: number } | null>;
}

export const GameCanvas: React.FC<Props> = ({ gameStateRef, mouseTargetRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const stars = useMemo(() => {
    return [...Array(120)].map(() => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      twinkleSpeed: Math.random() * 0.05 + 0.01,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  const weatherParticles = useMemo(() => {
    return [...Array(60)].map(() => ({ 
      x: Math.random(),
      y: Math.random(),
      v: 1 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 0.5,
      size: 1 + Math.random() * 2
    }));
  }, []);

  const getTransformedCoords = (wx: number, wy: number, rotation: number) => {
    if (rotation === 90) return { tx: wy, ty: WORLD_SIZE - 1 - wx };
    if (rotation === 180) return { tx: WORLD_SIZE - 1 - wx, ty: WORLD_SIZE - 1 - wy };
    if (rotation === 270) return { tx: WORLD_SIZE - 1 - wy, ty: wx };
    return { tx: wx, ty: wy };
  };

  const toScreen = (x: number, y: number, zoom: number, rotation: number) => {
    const { tx, ty } = getTransformedCoords(x, y, rotation);
    const tw = TILE_WIDTH * zoom;
    const th = TILE_HEIGHT * zoom;
    return { x: tx * tw, y: ty * th };
  };

  const drawWeather = (ctx: CanvasRenderingContext2D, type: string, intensity: number, now: number, width: number, height: number) => {
    if (intensity <= 0) return;
    ctx.save();
    ctx.globalAlpha = intensity;
    
    if (type === 'rain') {
      ctx.strokeStyle = 'rgba(150, 180, 255, 0.4)';
      ctx.lineWidth = 1;
      weatherParticles.forEach(p => {
        const py = ((p.y + (now / 200) * p.v) % 1) * height;
        const px = ((p.x + (now / 1000) * p.drift) % 1) * width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + p.drift * 20, py + 20);
        ctx.stroke();
      });
    } else if (type === 'snow') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      weatherParticles.forEach(p => {
        const py = ((p.y + (now / 1000) * p.v) % 1) * height;
        const px = ((p.x + (now / 2000) * Math.sin(now / 500 + p.x * 10)) % 1) * width;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (type === 'fog') {
      const fogGrad = ctx.createLinearGradient(0, 0, width, height);
      fogGrad.addColorStop(0, `rgba(200, 200, 210, ${0.4 * intensity})`);
      fogGrad.addColorStop(0.5, `rgba(180, 180, 190, ${0.2 * intensity})`);
      fogGrad.addColorStop(1, `rgba(200, 200, 210, ${0.4 * intensity})`);
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, zoom: number, stats: any, now: number) => {
    const isWalking = stats.isWalking;
    const facing: FacingDirection = stats.facing;
    const gender = stats.character.gender;
    const outfitColor = stats.character.outfitColor || '#451a03';
    const skinColor = '#fde68a';
    const hairColor = '#27272a';
    const equippedItemId = stats.equippedItemId;
    const lastInteract = stats.lastInteractTime || 0;
    const isInteracting = (now - lastInteract) < 400;

    const timeSinceCombatHit = now - (stats.lastCombatDamageTime || 0);
    const isRecentlyCombatHit = timeSinceCombatHit < 800;
    
    const swing = isWalking ? Math.sin(now / 100) * 0.4 : 0;
    const bob = isWalking ? Math.abs(Math.sin(now / 100)) * 2 * zoom : 0;

    ctx.save();
    ctx.translate(x, y - bob);

    const currentBodyColor = isRecentlyCombatHit && Math.sin(now / 50) > 0 ? '#b91c1c' : outfitColor;
    
    ctx.fillStyle = currentBodyColor;
    if (gender === 'male') {
      ctx.beginPath();
      ctx.roundRect(-12 * zoom, -20 * zoom, 24 * zoom, 28 * zoom, 4 * zoom);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-10 * zoom, -20 * zoom);
      ctx.lineTo(10 * zoom, -20 * zoom);
      ctx.lineTo(12 * zoom, 8 * zoom);
      ctx.lineTo(-12 * zoom, 8 * zoom);
      ctx.closePath();
      ctx.fill();
    }

    const drawArm = (side: number, angle: number, hasTool: boolean) => {
      ctx.save();
      ctx.translate(side * 12 * zoom, -16 * zoom);
      const interactProgress = isInteracting && hasTool ? Math.min(1, (now - lastInteract) / 400) : 0;
      const interactSwing = interactProgress > 0 ? Math.sin(interactProgress * Math.PI) * 1.8 : 0;
      ctx.rotate(angle + interactSwing);
      ctx.fillStyle = currentBodyColor;
      ctx.fillRect(-3 * zoom, 0, 6 * zoom, 16 * zoom);
      ctx.fillStyle = skinColor;
      ctx.beginPath(); ctx.arc(0, 16 * zoom, 4 * zoom, 0, Math.PI * 2); ctx.fill();

      if (hasTool && equippedItemId) {
        const item = ITEMS[equippedItemId];
        if (item) {
          ctx.save();
          ctx.translate(0, 18 * zoom);
          ctx.rotate(-Math.PI / 2 + interactSwing * 0.5);
          ctx.font = `${28 * zoom}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.icon, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    };

    drawArm(-1, swing, false);
    drawArm(1, -swing, equippedItemId !== null);
    ctx.fillStyle = skinColor; ctx.beginPath(); ctx.arc(0, -28 * zoom, 10 * zoom, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hairColor; ctx.beginPath(); ctx.arc(0, -32 * zoom, 11 * zoom, Math.PI, 0); ctx.fill();
    if (gender === 'female') { ctx.beginPath(); const ponytailSwing = isWalking ? Math.sin(now / 200) * 5 * zoom : 0; ctx.arc(-8 * zoom + ponytailSwing, -25 * zoom, 6 * zoom, 0, Math.PI * 2); ctx.fill(); }
    const showFace = facing === 'se' || facing === 'sw';
    if (showFace) { ctx.fillStyle = '#000'; const eyeOffset = facing === 'se' ? 2 * zoom : -2 * zoom; ctx.beginPath(); ctx.arc(eyeOffset - 3 * zoom, -28 * zoom, 1.5 * zoom, 0, Math.PI * 2); ctx.arc(eyeOffset + 3 * zoom, -28 * zoom, 1.5 * zoom, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  };

  const drawSky = (ctx: CanvasRenderingContext2D, time: number, now: number, width: number, height: number) => {
    const isNight = time < 500 || time > 1900;
    if (!isNight) return;
    let nightOpacity = 0;
    if (time < 500) nightOpacity = 1 - (time / 500);
    else if (time > 1900) nightOpacity = (time - 1900) / 500;
    ctx.save();
    ctx.globalAlpha = nightOpacity;
    stars.forEach(s => {
      const twinkle = Math.sin(now * s.twinkleSpeed + s.phase) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
      ctx.beginPath(); ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let frameId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();

    const render = () => {
      const state = gameStateRef.current;
      if (!state) { frameId = requestAnimationFrame(render); return; }
      const now = performance.now();
      const time = state.time;
      const zoom = state.viewConfig.zoom;
      const rotation = state.viewConfig.rotation;
      const cameraOffsetX = state.viewConfig.cameraOffsetX;
      const cameraOffsetY = state.viewConfig.cameraOffsetY;
      const weather = state.weather;

      const cycle = time / 2400; 
      let bgColor = '#166534';
      let overlayAlpha = 0;
      let overlayColor = '0, 0, 0';

      if (cycle < 0.2 || cycle > 0.85) { bgColor = '#020617'; overlayAlpha = 0.65; overlayColor = '0, 0, 10'; }
      else if (cycle >= 0.2 && cycle < 0.35) { const p = (cycle - 0.2) / 0.15; bgColor = '#2d1b0d'; overlayAlpha = 0.65 * (1 - p); overlayColor = '251, 146, 60'; }
      else if (cycle >= 0.35 && cycle < 0.7) { bgColor = '#166534'; overlayAlpha = 0; }
      else if (cycle >= 0.7 && cycle < 0.85) { const p = (cycle - 0.7) / 0.15; bgColor = '#1e1b4b'; overlayAlpha = 0.65 * p; overlayColor = '107, 33, 168'; }

      if (weather.type === 'rain') { overlayAlpha = Math.max(overlayAlpha, 0.3 * weather.intensity); overlayColor = '30, 40, 60'; }
      if (weather.type === 'fog') { overlayAlpha = Math.max(overlayAlpha, 0.5 * weather.intensity); overlayColor = '150, 150, 160'; }
      if (weather.type === 'snow') { overlayAlpha = Math.max(overlayAlpha, 0.2 * weather.intensity); overlayColor = '200, 220, 255'; }

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawSky(ctx, time, now, canvas.width, canvas.height);

      const pS = toScreen(state.playerPos.x, state.playerPos.y, zoom, rotation);
      
      ctx.save();
      ctx.translate(
        canvas.width / 2 - (pS.x + (TILE_WIDTH * zoom) / 2) + cameraOffsetX, 
        canvas.height / 2 - (pS.y + (TILE_HEIGHT * zoom) / 2) + cameraOffsetY
      );

      const renderRange = 16 / zoom; 
      const startX = Math.max(0, Math.floor(state.playerPos.x - renderRange));
      const endX = Math.min(WORLD_SIZE, Math.ceil(state.playerPos.x + renderRange));
      const startY = Math.max(0, Math.floor(state.playerPos.y - renderRange));
      const endY = Math.min(WORLD_SIZE, Math.ceil(state.playerPos.y + renderRange));

      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          const s = toScreen(x, y, zoom, rotation);
          const tile = getTileType(x, y, state.playerStats.level);
          let color = '#166534';
          if (tile === 'sand') color = '#ca8a04';
          else if (tile === 'water') color = '#1e3a8a';
          
          if (weather.type === 'snow') {
            color = tile === 'water' ? '#3b82f6' : '#e2e8f0';
          }
          
          ctx.fillStyle = color;
          ctx.fillRect(s.x, s.y, TILE_WIDTH * zoom + 0.5, TILE_HEIGHT * zoom + 0.5);
        }
      }

      state.particles.forEach((p: any) => {
        const s = toScreen(p.x, p.y, zoom, rotation);
        const centerX = s.x + (TILE_WIDTH * zoom) / 2;
        const centerY = s.y + (TILE_HEIGHT * zoom) / 2;
        const isSmoke = p.type === 'smoke';
        
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = isSmoke ? Math.min(0.5, p.life * 0.4) : Math.min(1, p.life * 1.5);
        ctx.beginPath();
        ctx.arc(centerX, centerY, p.size * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      state.projectiles.forEach((proj: any) => {
        const s = toScreen(proj.x, proj.y, zoom, rotation);
        const centerX = s.x + (TILE_WIDTH * zoom) / 2;
        const centerY = s.y + (TILE_HEIGHT * zoom) / 2;
        
        const angle = Math.atan2(proj.vy, proj.vx);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(-15 * zoom, 0);
        ctx.lineTo(15 * zoom, 0);
        ctx.strokeStyle = '#5d4037'; 
        ctx.lineWidth = 2.5 * zoom;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15 * zoom, 0);
        ctx.lineTo(10 * zoom, -4 * zoom);
        ctx.lineTo(10 * zoom, 4 * zoom);
        ctx.closePath();
        ctx.fillStyle = '#b0bec5'; 
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-15 * zoom, 0);
        ctx.lineTo(-20 * zoom, -5 * zoom);
        ctx.lineTo(-12 * zoom, 0);
        ctx.lineTo(-20 * zoom, 5 * zoom);
        ctx.closePath();
        ctx.fillStyle = '#cfd8dc';
        ctx.fill();
        
        ctx.restore();
      });

      const entitiesToDraw = [...state.entities, { id: 'p', type: 'player', x: state.playerPos.x, y: state.playerPos.y, health: state.playerStats.health } as any]
        .filter(ent => Math.abs(ent.x - state.playerPos.x) < renderRange + 2 && Math.abs(ent.y - state.playerPos.y) < renderRange + 2)
        .sort((a,b) => a.y - b.y);

      entitiesToDraw.forEach(ent => {
        const s = toScreen(ent.x, ent.y, zoom, rotation);
        const centerX = s.x + (TILE_WIDTH * zoom) / 2;
        const centerY = s.y + (TILE_HEIGHT * zoom) / 2;
        ctx.save();
        
        const isBuilding = ['tent', 'hut', 'workbench', 'watchtower', 'castle_gate'].includes(ent.type);
        const isStatic = isBuilding || ['tree_oak', 'tree_pine', 'tree_palm', 'rock_standard', 'rock_iron', 'bush_berry', 'bush_flower', 'bush_dry', 'well', 'campfire', 'road', 'bridge', 'stone_wall'].includes(ent.type);
        
        // Çok daha koyu ve belirgin gölgeler
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; 
        let shadowW = isStatic ? 8 * zoom : 14 * zoom;
        let shadowH = isStatic ? 4 * zoom : 7 * zoom;
        if (isBuilding) { shadowW *= 1.8; shadowH *= 1.8; }
        ctx.beginPath(); ctx.ellipse(centerX, centerY + 18 * zoom, shadowW, shadowH, 0, 0, Math.PI * 2); ctx.fill();
        
        if (ent.type === 'player') {
          drawPlayer(ctx, centerX, centerY, zoom, state.playerStats, now);
        } else {
          const icons: any = { tree_oak: '🌳', tree_pine: '🌲', tree_palm: '🌴', rock_standard: '🪨', rock_iron: '⛓️', bush_berry: '🌿', bush_flower: '🌺', bush_dry: '🌾', deer: '🦌', rabbit: '🐇', bear: '🐻', scorpion: '🦂', crab: '🦀', campfire: '🔥', tent: '⛺', workbench: '⚒️', hut: '🏠', watchtower: '🏰' };
          const bounce = ['deer', 'rabbit', 'bear', 'scorpion', 'crab'].includes(ent.type) ? Math.abs(Math.sin(now / 150)) * 2 * zoom : 0;
          let entityFontSize = 42;
          if (ent.type === 'tent') entityFontSize = 64;
          if (ent.type === 'hut') entityFontSize = 80;
          if (ent.type === 'watchtower') entityFontSize = 90;
          if (ent.type === 'workbench') entityFontSize = 54;
          
          ctx.save();
          ctx.translate(centerX, centerY + 10 * zoom - bounce);
          
          // Tam Opaklık Sabitlendi
          ctx.globalAlpha = 1.0; 
          
          ctx.font = `${entityFontSize * zoom}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(icons[ent.type] || '❓', 0, 0);
          
          if (ent.health < ent.maxHealth) {
             const barW = 32 * zoom; const barH = 5 * zoom;
             ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-barW/2, 6*zoom, barW, barH);
             ctx.fillStyle = '#22c55e'; ctx.fillRect(-barW/2, 6*zoom, barW * (ent.health / ent.maxHealth), barH);
          }
          ctx.restore();
        }
        ctx.restore();
      });
      ctx.restore();

      if (overlayAlpha > 0) {
        ctx.save();
        const screenCenterX = canvas.width / 2 + cameraOffsetX;
        const screenCenterY = canvas.height / 2 + cameraOffsetY;
        const nightGrad = ctx.createRadialGradient(screenCenterX, screenCenterY, 120 * zoom, screenCenterX, screenCenterY, 450 * zoom);
        nightGrad.addColorStop(0, `rgba(${overlayColor}, 0)`); nightGrad.addColorStop(1, `rgba(${overlayColor}, ${overlayAlpha})`);
        ctx.fillStyle = nightGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      drawWeather(ctx, weather.type, weather.intensity, now, canvas.width, canvas.height);

      const timeSinceCombatHit = now - (state.playerStats.lastCombatDamageTime || 0);
      if (timeSinceCombatHit < 500) {
        const pulse = 0.5 * (1 - timeSinceCombatHit / 500);
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/4, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, `rgba(153, 27, 27, ${pulse})`);
        ctx.fillStyle = grad; ctx.fillRect(0,0, canvas.width, canvas.height);
      }

      frameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frameId); };
  }, [stars, weatherParticles]); 

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};
