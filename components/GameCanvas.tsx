
import React, { useRef, useEffect, useState } from 'react';
import { GameState, TileType, Entity, EntityType, FloatingText } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, CHUNK_SIZE } from '../constants';

const ASSETS_SVG: Record<string, string> = {
  axe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M45 20 L75 10 L75 50 L45 40 Z" fill="#94a3b8"/><path d="M45 20 L25 10 L25 50 L45 40 Z" fill="#64748b"/></svg>`,
  pickaxe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M10 30 Q50 10 90 30 L90 45 Q50 25 10 45 Z" fill="#94a3b8"/></svg>`,
  hoe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="8" height="60" rx="4" fill="#78350f"/><rect x="20" y="35" width="40" height="12" rx="4" fill="#94a3b8"/></svg>`,
  seed_item: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="60" r="15" fill="#8b5cf6"/><path d="M50 45 Q60 30 50 10 Q40 30 50 45" fill="#15803d"/></svg>`,
  tree_oak: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="80" width="10" height="30" fill="#451a03"/><circle cx="50" cy="50" r="40" fill="#15803d"/><circle cx="30" cy="60" r="25" fill="#166534"/><circle cx="70" cy="60" r="25" fill="#166534"/><circle cx="50" cy="30" r="25" fill="#14532d"/></svg>`,
  rock_standard: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 L30 30 L70 20 L90 80 Z" fill="#a1a1aa"/><path d="M30 30 L50 60 L70 20 Z" fill="#71717a"/><path d="M10 90 L30 30 L50 60 Z" fill="#d4d4d8"/></svg>`,
  bush_berry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#166534"/><circle cx="30" cy="40" r="8" fill="#1d4ed8"/><circle cx="70" cy="35" r="8" fill="#1d4ed8"/><circle cx="45" cy="70" r="8" fill="#1d4ed8"/></svg>`,
  farm_empty: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" fill="#451a03" stroke="#29160a" stroke-width="2"/><rect x="15" y="15" width="70" height="70" fill="#422006"/></svg>`,
  farm_growing: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" fill="#451a03"/><path d="M50 80 L50 40" stroke="#15803d" stroke-width="5"/><circle cx="50" cy="40" r="10" fill="#22c55e"/></svg>`,
  farm_ripe: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" fill="#451a03"/><path d="M50 80 L50 30" stroke="#15803d" stroke-width="5"/><circle cx="50" cy="30" r="12" fill="#ef4444"/><circle cx="40" cy="45" r="8" fill="#ef4444"/><circle cx="60" cy="45" r="8" fill="#ef4444"/></svg>`,
  deer: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="60" rx="30" ry="20" fill="#92400e"/><circle cx="70" cy="40" r="15" fill="#92400e"/><rect x="65" y="10" width="4" height="20" fill="#451a03"/><rect x="35" y="75" width="6" height="15" fill="#451a03"/></svg>`,
  rabbit: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="70" rx="20" ry="15" fill="#e5e5e5"/><circle cx="65" cy="60" r="10" fill="#e5e5e5"/><rect x="62" y="35" width="4" height="25" rx="2" fill="#e5e5e5"/><rect x="68" y="35" width="4" height="25" rx="2" fill="#e5e5e5"/></svg>`,
  workbench: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="40" width="80" height="15" fill="#78350f"/><rect x="20" y="55" width="10" height="35" fill="#451a03"/><rect x="70" y="55" width="10" height="35" fill="#451a03"/></svg>`,
  well: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="60" width="60" height="30" rx="5" fill="#57534e"/><circle cx="50" cy="70" r="20" fill="#1d4ed8"/></svg>`,
  tent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 10 L10 90 L90 90 Z" fill="#d97706"/><path d="M50 10 L40 90 L60 90 Z" fill="#451a03"/></svg>`,
  hut: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="40" width="80" height="50" fill="#78350f"/><path d="M0 45 L50 0 L100 45 Z" fill="#451a03"/><rect x="40" y="60" width="20" height="30" fill="#29160a"/></svg>`,
  campfire: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="80" r="40" fill="rgba(0,0,0,0.1)"/><rect x="20" y="70" width="60" height="10" rx="5" fill="#451a03" transform="rotate(15 50 75)"/><rect x="20" y="70" width="60" height="10" rx="5" fill="#451a03" transform="rotate(-15 50 75)"/><circle cx="50" cy="45" r="25" fill="#ef4444"/><circle cx="50" cy="50" r="15" fill="#f59e0b"/></svg>`,
  arrow: `<svg viewBox="0 0 100 10" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="4" width="80" height="2" fill="#78350f"/><path d="M80 0 L100 5 L80 10 Z" fill="#cbd5e1"/></svg>`,
  flower: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="48" y="60" width="4" height="30" fill="#166534"/><circle cx="50" cy="50" r="15" fill="#f472b6"/><circle cx="50" cy="50" r="5" fill="#fcd34d"/></svg>`,
  grass_clump: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M30 90 Q40 40 10 10" fill="none" stroke="#166534" stroke-width="5"/><path d="M50 90 Q50 30 50 0" fill="none" stroke="#15803d" stroke-width="5"/><path d="M70 90 Q60 40 90 10" fill="none" stroke="#166534" stroke-width="5"/></svg>`,
  villager: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="40" y="80" width="20" height="30" fill="#1c1917"/><rect x="30" y="40" width="40" height="40" rx="10" fill="#3b82f6"/><circle cx="50" cy="25" r="20" fill="#fde68a"/><circle cx="42" cy="22" r="3" fill="#000"/><circle cx="58" cy="22" r="3" fill="#000"/></svg>`,
  shopkeeper: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="40" y="80" width="20" height="30" fill="#1c1917"/><rect x="30" y="40" width="40" height="40" rx="10" fill="#8b5cf6"/><circle cx="50" cy="25" r="20" fill="#fde68a"/><path d="M30 15 L70 15 L50 0 Z" fill="#451a03"/></svg>`,
  house_village: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="40" width="80" height="50" fill="#a16207"/><path d="M0 45 L50 0 L100 45 Z" fill="#78350f"/><rect x="40" y="65" width="20" height="25" fill="#29160a"/><rect x="20" y="55" width="10" height="10" fill="#bae6fd"/><rect x="70" y="55" width="10" height="10" fill="#bae6fd"/></svg>`,
  loot_bag: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 90 Q20 30 50 30 Q80 30 80 90 Z" fill="#78350f"/><rect x="35" y="25" width="30" height="10" rx="5" fill="#451a03"/><path d="M50 30 L50 20" stroke="#451a03" stroke-width="5"/></svg>`
};

const ENTITY_ASSET_MAP: Record<string, string> = {
  tree_oak: 'tree_oak', tree_pine: 'tree_oak', tree_palm: 'tree_oak', rock_standard: 'rock_standard', rock_iron: 'rock_standard',
  bush_berry: 'bush_berry', bush_flower: 'bush_berry', bush_dry: 'rock_standard', well: 'well', player: 'player', deer: 'deer', rabbit: 'rabbit',
  campfire: 'campfire', tent: 'tent', hut: 'hut', workbench: 'workbench', chest: 'campfire', loot_bag: 'loot_bag', farm_plot: 'farm_empty',
  flower: 'flower', grass_clump: 'grass_clump', villager: 'villager', shopkeeper: 'shopkeeper', house_village: 'house_village'
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
      
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save(); ctx.translate(canvas.width / 2 - gameState.playerPos.x * TILE_WIDTH * zoom + cameraOffsetX, canvas.height / 2 - gameState.playerPos.y * TILE_HEIGHT * zoom + cameraOffsetY);

      const sX = Math.floor(gameState.playerPos.x - 20), eX = sX + 40, sY = Math.floor(gameState.playerPos.y - 20), eY = sY + 40;
      for (let x = sX; x <= eX; x++) for (let y = sY; y <= eY; y++) {
          const cx = Math.floor(x / CHUNK_SIZE), cy = Math.floor(y / CHUNK_SIZE);
          const chunk = gameState.chunks[`${cx},${cy}`];
          if (chunk) {
              const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE, ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
              drawTile(ctx, chunk[lx][ly], x, y, zoom);
          } else {
              drawTile(ctx, 'grass', x, y, zoom);
          }
      }

      const sorted = [...gameState.entities].sort((a, b) => a.y - b.y);
      sorted.forEach(ent => { drawEntity(ctx, ent, zoom, gameState.hoveredEntityId === ent.id); });
      drawPlayer(ctx, gameState, zoom);

      ctx.restore(); frame = requestAnimationFrame(render);
    }; render(); return () => cancelAnimationFrame(frame);
  }, [gameState, assetsLoaded, images]);

  const drawTile = (ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, zoom: number) => {
      const px = x * TILE_WIDTH * zoom, py = y * TILE_HEIGHT * zoom, size = TILE_WIDTH * zoom;
      ctx.fillStyle = tile === 'water' ? '#1d4ed8' : tile === 'sand' ? '#fbbf24' : tile === 'stone' ? '#57534e' : '#15803d';
      ctx.fillRect(px, py, size + 1, size + 1);
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, ent: Entity, zoom: number, hovered: boolean) => {
    let assetKey = ENTITY_ASSET_MAP[ent.type] || 'rock_standard';
    if (ent.type === 'farm_plot') {
      if (ent.growthStage === 1) assetKey = 'farm_empty';
      else if (ent.growthStage === 2) assetKey = 'farm_growing';
      else if (ent.growthStage === 3) assetKey = 'farm_ripe';
    }
    
    const img = images[assetKey]; if (!img) return;
    const x = ent.x * TILE_WIDTH * zoom, y = ent.y * TILE_HEIGHT * zoom, size = TILE_WIDTH * 1.5 * zoom;
    ctx.save(); ctx.translate(x + TILE_WIDTH*zoom/2, y + TILE_HEIGHT*zoom);
    if (hovered) { ctx.shadowBlur = 10 * zoom; ctx.shadowColor = 'white'; }
    if (ent.facing === 'right') ctx.scale(-1, 1);
    ctx.drawImage(img, -size / 2, -size, size, size); ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, engine: GameState, zoom: number) => {
    const px = engine.playerPos.x * TILE_WIDTH * zoom, py = engine.playerPos.y * TILE_HEIGHT * zoom, size = TILE_WIDTH * 1.2 * zoom;
    const bounce = engine.playerStats.isWalking ? Math.abs(Math.sin(performance.now()/150)) * 4 * zoom : 0;
    ctx.save(); ctx.translate(px + TILE_WIDTH*zoom/2, py + TILE_HEIGHT*zoom);
    ctx.fillStyle = engine.playerStats.character.outfitColor; ctx.beginPath(); ctx.roundRect(-size*0.25, -size*0.65 - bounce, size*0.5, size*0.5, size*0.1); ctx.fill();
    ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(0, -size*0.8 - bounce, size*0.18, 0, Math.PI * 2); ctx.fill();
    
    const eqId = engine.playerStats.equippedItemId;
    if (eqId) {
      const toolKey = eqId === 'axe' ? 'axe_tool' : eqId === 'pickaxe' ? 'pickaxe_tool' : eqId === 'hoe' ? 'hoe_tool' : eqId === 'berry_seed' ? 'seed_item' : '';
      const tImg = images[toolKey];
      if (tImg) ctx.drawImage(tImg, size*0.2, -size*0.6, size*0.5, size*0.5);
    }
    ctx.restore();
  }; return <canvas ref={canvasRef} />;
};
