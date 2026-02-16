
import React, { useRef, useEffect, useState } from 'react';
import { GameState, TileType, Entity, EntityType, FloatingText } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, CHUNK_SIZE } from '../constants';

const ASSETS_SVG: Record<string, string> = {
  axe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M45 20 L75 10 L75 50 L45 40 Z" fill="#94a3b8"/><path d="M45 20 L25 10 L25 50 L45 40 Z" fill="#64748b"/></svg>`,
  pickaxe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M10 30 Q50 10 90 30 L90 45 Q50 25 10 45 Z" fill="#94a3b8"/></svg>`,
  sword_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="70" width="10" height="30" rx="2" fill="#451a03"/><rect x="25" y="70" width="50" height="8" rx="2" fill="#d97706"/><path d="M40 10 L60 10 L65 70 L35 70 Z" fill="#cbd5e1"/><path d="M50 5 L60 10 L40 10 Z" fill="#94a3b8"/></svg>`,
  tree_oak: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="80" width="10" height="30" fill="#451a03"/><circle cx="50" cy="50" r="40" fill="#15803d"/><circle cx="30" cy="60" r="25" fill="#166534"/><circle cx="70" cy="60" r="25" fill="#166534"/><circle cx="50" cy="30" r="25" fill="#14532d"/></svg>`,
  rock_standard: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 L30 30 L70 20 L90 80 Z" fill="#a1a1aa"/><path d="M30 30 L50 60 L70 20 Z" fill="#71717a"/><path d="M10 90 L30 30 L50 60 Z" fill="#d4d4d8"/></svg>`,
  bush_berry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#166534"/><circle cx="30" cy="40" r="8" fill="#1d4ed8"/><circle cx="70" cy="35" r="8" fill="#1d4ed8"/><circle cx="45" cy="70" r="8" fill="#1d4ed8"/></svg>`,
  deer: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="60" rx="30" ry="20" fill="#92400e"/><circle cx="70" cy="40" r="15" fill="#92400e"/><rect x="65" y="10" width="4" height="20" fill="#451a03"/><rect x="35" y="75" width="6" height="15" fill="#451a03"/></svg>`,
  rabbit: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="70" rx="20" ry="15" fill="#e5e5e5"/><circle cx="65" cy="60" r="10" fill="#e5e5e5"/><rect x="62" y="35" width="4" height="25" rx="2" fill="#e5e5e5"/><rect x="68" y="35" width="4" height="25" rx="2" fill="#e5e5e5"/></svg>`,
  workbench: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="40" width="80" height="15" fill="#78350f"/><rect x="20" y="55" width="10" height="35" fill="#451a03"/><rect x="70" y="55" width="10" height="35" fill="#451a03"/></svg>`,
  well: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="60" width="60" height="30" rx="5" fill="#57534e"/><circle cx="50" cy="70" r="20" fill="#1d4ed8"/></svg>`,
  tent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 10 L10 90 L90 90 Z" fill="#d97706"/><path d="M50 10 L40 90 L60 90 Z" fill="#451a03"/></svg>`,
  campfire: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="80" r="40" fill="rgba(0,0,0,0.1)"/><rect x="20" y="70" width="60" height="10" rx="5" fill="#451a03" transform="rotate(15 50 75)"/><rect x="20" y="70" width="60" height="10" rx="5" fill="#451a03" transform="rotate(-15 50 75)"/><circle cx="50" cy="45" r="25" fill="#ef4444"/><circle cx="50" cy="50" r="15" fill="#f59e0b"/></svg>`,
  arrow: `<svg viewBox="0 0 100 10" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="4" width="80" height="2" fill="#78350f"/><path d="M80 0 L100 5 L80 10 Z" fill="#cbd5e1"/></svg>`
};

const ENTITY_ASSET_MAP: Record<EntityType, string> = {
  tree_oak: 'tree_oak', tree_pine: 'tree_oak', tree_palm: 'tree_oak', rock_standard: 'rock_standard', rock_iron: 'rock_standard',
  bush_berry: 'bush_berry', bush_flower: 'bush_berry', bush_dry: 'rock_standard', well: 'well', player: 'player', deer: 'deer', rabbit: 'rabbit',
  campfire: 'campfire', tent: 'tent', workbench: 'workbench', hut: 'tent', chest: 'campfire', loot_bag: 'campfire', farm_plot: 'tree_oak',
  scorpion: 'deer', bear: 'deer', crab: 'deer', bridge: 'workbench', road: 'rock_standard', stone_wall: 'rock_standard', watchtower: 'well',
  castle_gate: 'well', flower: 'bush_berry', iron_ore: 'rock_standard', axe_tool: 'axe_tool', pickaxe_tool: 'pickaxe_tool', sword_tool: 'sword_tool'
};

export const GameCanvas: React.FC<{ gameState: GameState, canvasRef: React.RefObject<HTMLCanvasElement>, placingEntityType: EntityType | null }> = ({ gameState, canvasRef, placingEntityType }) => {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const loaded: Record<string, HTMLImageElement> = {}; let count = 0; const total = Object.keys(ASSETS_SVG).length;
    Object.entries(ASSETS_SVG).forEach(([k, s]) => {
      const img = new Image(); const blob = new Blob([s], { type: 'image/svg+xml;charset=utf-8' });
      img.onload = () => { count++; if (count === total) setAssetsLoaded(true); };
      img.src = URL.createObjectURL(blob); loaded[k] = img;
    }); setImages(loaded);
  }, []);

  useEffect(() => {
    if (!assetsLoaded) return;
    let frame: number;
    const render = () => {
      const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const { zoom, cameraOffsetX, cameraOffsetY } = gameState.viewConfig;
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save(); ctx.translate(canvas.width / 2 - gameState.playerPos.x * TILE_WIDTH * zoom + cameraOffsetX, canvas.height / 2 - gameState.playerPos.y * TILE_HEIGHT * zoom + cameraOffsetY);

      const sX = Math.floor(gameState.playerPos.x - 20), eX = sX + 40, sY = Math.floor(gameState.playerPos.y - 20), eY = sY + 40;
      for (let x = sX; x <= eX; x++) for (let y = sY; y <= eY; y++) {
          const cx = Math.floor(x / CHUNK_SIZE), cy = Math.floor(y / CHUNK_SIZE);
          const chunk = gameState.chunks[`${cx},${cy}`];
          if (chunk) {
              const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE, ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
              drawTile(ctx, chunk[lx][ly], x, y, zoom);
          }
      }

      const sorted = [...gameState.entities].sort((a, b) => a.y - b.y);
      sorted.forEach(ent => { if (ent.y < gameState.playerPos.y) drawEntity(ctx, ent, zoom, gameState.hoveredEntityId === ent.id); });
      drawPlayer(ctx, gameState, zoom);
      sorted.forEach(ent => { if (ent.y >= gameState.playerPos.y) drawEntity(ctx, ent, zoom, gameState.hoveredEntityId === ent.id); });

      gameState.projectiles.forEach(p => {
          const img = images[p.type]; if (img) { ctx.save(); ctx.translate(p.x * TILE_WIDTH * zoom, p.y * TILE_HEIGHT * zoom); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.drawImage(img, -20*zoom, -2.5*zoom, 40*zoom, 5*zoom); ctx.restore(); }
      });
      gameState.particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife; ctx.beginPath(); ctx.arc(p.x * TILE_WIDTH * zoom, p.y * TILE_HEIGHT * zoom, p.size * zoom, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });
      gameState.floatingTexts.forEach(ft => { ctx.fillStyle = ft.color; ctx.globalAlpha = ft.life; ctx.font = `bold ${14 * zoom}px Inter`; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x * TILE_WIDTH * zoom, (ft.y - 0.5) * TILE_HEIGHT * zoom); ctx.globalAlpha = 1; });
      ctx.restore(); frame = requestAnimationFrame(render);
    }; render(); return () => cancelAnimationFrame(frame);
  }, [gameState, assetsLoaded, images]);

  const drawTile = (ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, zoom: number) => {
      const px = x * TILE_WIDTH * zoom, py = y * TILE_HEIGHT * zoom, size = TILE_WIDTH * zoom;
      ctx.fillStyle = tile === 'water' ? '#1d4ed8' : tile === 'sand' ? '#fbbf24' : tile === 'stone' ? '#57534e' : '#15803d';
      ctx.fillRect(px, py, size + 1, size + 1);
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, ent: Entity, zoom: number, hovered: boolean) => {
    const img = images[ENTITY_ASSET_MAP[ent.type]]; if (!img) return;
    const x = ent.x * TILE_WIDTH * zoom, y = ent.y * TILE_HEIGHT * zoom, size = TILE_WIDTH * 1.5 * zoom;
    const isAnimal = ent.type === 'deer' || ent.type === 'rabbit';
    const wobble = isAnimal && ent.aiState === 'grazing' ? Math.abs(Math.sin(performance.now() / 200)) * 5 * zoom : 0;
    ctx.save(); ctx.translate(x + TILE_WIDTH*zoom/2, y + TILE_HEIGHT*zoom - wobble);
    if (hovered) { ctx.shadowBlur = 10 * zoom; ctx.shadowColor = 'white'; }
    if (ent.facing === 'right') ctx.scale(-1, 1);
    ctx.drawImage(img, -size / 2, -size, size, size); ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, engine: GameState, zoom: number) => {
    const px = engine.playerPos.x * TILE_WIDTH * zoom, py = engine.playerPos.y * TILE_HEIGHT * zoom, size = TILE_WIDTH * 1.2 * zoom;
    const isWalking = engine.playerStats.isWalking, time = performance.now() / 150;
    const bounce = isWalking ? Math.abs(Math.sin(time)) * 4 * zoom : 0;
    const { character } = engine.playerStats;

    ctx.save(); ctx.translate(px + TILE_WIDTH*zoom/2, py + TILE_HEIGHT*zoom);
    // Legs
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-size*0.15, -size*0.2 + (isWalking ? Math.sin(time)*size*0.05 : 0), size*0.1, size*0.2);
    ctx.fillRect(size*0.05, -size*0.2 + (isWalking ? Math.sin(time + Math.PI)*size*0.05 : 0), size*0.1, size*0.2);
    // Body
    ctx.fillStyle = character.outfitColor; ctx.beginPath(); ctx.roundRect(-size*0.25, -size*0.65 - bounce, size*0.5, size*0.5, size*0.1); ctx.fill();
    // Head
    ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(0, -size*0.8 - bounce, size*0.18, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#000'; const eyeX = engine.playerStats.facing.includes('e') ? 2 : -2;
    ctx.beginPath(); ctx.arc(eyeX * zoom, -size*0.82 - bounce, size*0.02, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc((eyeX + 6) * zoom, -size*0.82 - bounce, size*0.02, 0, Math.PI*2); ctx.fill();
    // Arms & Tool
    ctx.fillStyle = '#fde68a'; const swing = isWalking ? Math.sin(time) * 15 : 0;
    ctx.save(); ctx.translate(-size*0.3, -size*0.55 - bounce); ctx.rotate(-swing * Math.PI / 180); ctx.fillRect(-size*0.05, 0, size*0.1, size*0.25); ctx.restore();
    ctx.save(); ctx.translate(size*0.3, -size*0.55 - bounce); ctx.rotate(swing * Math.PI / 180);
    const interaction = engine.playerStats.interactionAnim > 0 ? (1 - engine.playerStats.interactionAnim/0.3) * Math.PI : 0;
    ctx.rotate(-interaction); ctx.fillRect(-size*0.05, 0, size*0.1, size*0.25);
    const eqId = engine.playerStats.equippedItemId;
    if (eqId) {
        let toolKey = eqId === 'axe' ? 'axe_tool' : eqId === 'pickaxe' ? 'pickaxe_tool' : eqId.includes('sword') ? 'sword_tool' : eqId === 'bow' ? 'bow' : '';
        const tImg = images[toolKey];
        if (tImg) {
            // Adjust draw to hold by bottom of handle
            ctx.drawImage(tImg, -size*0.1, size*0.1, size*0.5, size*0.5);
        }
    }
    ctx.restore(); ctx.restore();
  }; return <canvas ref={canvasRef} />;
};
