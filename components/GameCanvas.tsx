
import React, { useRef, useEffect, useState } from 'react';
import { GameState, TileType, Entity, EntityType, FloatingText } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, CHUNK_SIZE } from '../constants';

const ASSETS_SVG: Record<string, string> = {
  axe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M45 20 L75 10 L75 50 L45 40 Z" fill="#94a3b8"/><path d="M45 20 L25 10 L25 50 L45 40 Z" fill="#64748b"/></svg>`,
  pickaxe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M10 30 Q50 10 90 30 L90 45 Q50 25 10 45 Z" fill="#94a3b8"/></svg>`,
  sword_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="70" width="10" height="30" rx="2" fill="#451a03"/><rect x="25" y="70" width="50" height="8" rx="2" fill="#d97706"/><path d="M40 10 L60 10 L65 70 L35 70 Z" fill="#cbd5e1"/><path d="M50 5 L60 10 L40 10 Z" fill="#94a3b8"/></svg>`,
  tree_oak: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="80" width="10" height="30" fill="#451a03"/><circle cx="50" cy="50" r="40" fill="#15803d"/><circle cx="30" cy="60" r="25" fill="#166534"/><circle cx="70" cy="60" r="25" fill="#166534"/><circle cx="50" cy="30" r="25" fill="#14532d"/></svg>`,
  tree_pine: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="90" width="10" height="20" fill="#451a03"/><path d="M50 10 L10 100 L90 100 Z" fill="#064e3b"/><path d="M50 30 L20 90 L80 90 Z" fill="#065f46"/><path d="M50 50 L30 80 L70 80 Z" fill="#047857"/></svg>`,
  rock_standard: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 L30 30 L70 20 L90 80 Z" fill="#a1a1aa"/><path d="M30 30 L50 60 L70 20 Z" fill="#71717a"/><path d="M10 90 L30 30 L50 60 Z" fill="#d4d4d8"/></svg>`,
  bush_berry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#166534"/><circle cx="30" cy="40" r="8" fill="#1d4ed8"/><circle cx="70" cy="35" r="8" fill="#1d4ed8"/><circle cx="45" cy="70" r="8" fill="#1d4ed8"/></svg>`,
  deer: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="60" rx="30" ry="20" fill="#92400e"/><circle cx="70" cy="40" r="15" fill="#92400e"/><rect x="65" y="10" width="4" height="20" fill="#451a03"/><rect x="35" y="75" width="6" height="15" fill="#451a03"/></svg>`,
  rabbit: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="70" rx="20" ry="15" fill="#e5e5e5"/><circle cx="65" cy="60" r="10" fill="#e5e5e5"/><rect x="62" y="35" width="4" height="25" rx="2" fill="#e5e5e5"/><rect x="68" y="35" width="4" height="25" rx="2" fill="#e5e5e5"/></svg>`,
  workbench: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="40" width="80" height="15" fill="#78350f"/><rect x="20" y="55" width="10" height="35" fill="#451a03"/><rect x="70" y="55" width="10" height="35" fill="#451a03"/></svg>`,
  well: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="60" width="60" height="30" rx="5" fill="#57534e"/><circle cx="50" cy="70" r="20" fill="#1d4ed8"/></svg>`,
  tent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 10 L10 90 L90 90 Z" fill="#d97706"/><path d="M50 10 L40 90 L60 90 Z" fill="#451a03"/></svg>`,
  campfire: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="80" r="40" fill="rgba(0,0,0,0.1)"/><rect x="20" y="70" width="60" height="10" rx="5" fill="#451a03" transform="rotate(15 50 75)"/><rect x="20" y="70" width="60" height="10" rx="5" fill="#451a03" transform="rotate(-15 50 75)"/><circle cx="50" cy="45" r="25" fill="#ef4444"/><circle cx="50" cy="50" r="15" fill="#f59e0b"/></svg>`,
  chest: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="40" width="70" height="50" rx="5" fill="#78350f"/><rect x="45" y="48" width="10" height="10" fill="#f59e0b"/></svg>`,
  farm_plot_0: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="80" height="70" rx="10" fill="#573315"/></svg>`,
  farm_plot_3: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="80" height="70" rx="10" fill="#573315"/><circle cx="30" cy="25" r="8" fill="#1d4ed8"/></svg>`,
  arrow: `<svg viewBox="0 0 100 10" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="4" width="80" height="2" fill="#78350f"/><path d="M80 0 L100 5 L80 10 Z" fill="#cbd5e1"/></svg>`
};

const ENTITY_ASSET_MAP: Record<EntityType, string> = {
  tree_oak: 'tree_oak', tree_pine: 'tree_pine', tree_palm: 'tree_oak', rock_standard: 'rock_standard', rock_iron: 'rock_standard',
  bush_berry: 'bush_berry', bush_flower: 'bush_berry', bush_dry: 'rock_standard', well: 'well', player: 'player', deer: 'deer', rabbit: 'rabbit',
  campfire: 'campfire', tent: 'tent', workbench: 'workbench', hut: 'tent', chest: 'chest', loot_bag: 'chest', farm_plot: 'farm_plot_0',
  scorpion: 'deer', bear: 'deer', crab: 'deer', bridge: 'workbench', road: 'rock_standard', stone_wall: 'rock_standard', watchtower: 'well',
  castle_gate: 'well', flower: 'bush_berry', iron_ore: 'rock_standard', axe_tool: 'axe_tool', pickaxe_tool: 'pickaxe_tool', sword_tool: 'sword_tool'
};

interface Props {
  gameState: GameState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  placingEntityType: EntityType | null;
}

export const GameCanvas: React.FC<Props> = ({ gameState, canvasRef, placingEntityType }) => {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const loadedImages: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    const totalAssets = Object.keys(ASSETS_SVG).length;
    Object.entries(ASSETS_SVG).forEach(([key, svg]) => {
      const img = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => { loadedCount++; if (loadedCount === totalAssets) setAssetsLoaded(true); };
      img.src = url; loadedImages[key] = img;
    });
    setImages(loadedImages);
  }, []);

  useEffect(() => {
    if (!assetsLoaded) return;
    let animationFrameId: number;
    const render = () => {
      const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const engine = gameState, { zoom, cameraOffsetX, cameraOffsetY } = engine.viewConfig;
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2, centerY = canvas.height / 2;
      const playerScreenX = engine.playerPos.x * TILE_WIDTH * zoom, playerScreenY = engine.playerPos.y * TILE_HEIGHT * zoom;
      ctx.save(); ctx.translate(centerX - playerScreenX + cameraOffsetX, centerY - playerScreenY + cameraOffsetY);

      const vX = Math.ceil(canvas.width / (TILE_WIDTH * zoom)) + 2, vY = Math.ceil(canvas.height / (TILE_HEIGHT * zoom)) + 2;
      const sX = Math.floor(engine.playerPos.x - vX / 2), eX = sX + vX, sY = Math.floor(engine.playerPos.y - vY / 2), eY = sY + vY;

      for (let x = sX; x <= eX; x++) for (let y = sY; y <= eY; y++) {
          const cx = Math.floor(x / CHUNK_SIZE), cy = Math.floor(y / CHUNK_SIZE);
          const chunk = engine.chunks[`${cx},${cy}`];
          if (chunk) drawTile(ctx, chunk[((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE][((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE], x, y, zoom);
      }

      const sortedEntities = [...engine.entities].sort((a, b) => a.y - b.y);
      sortedEntities.forEach(ent => { if (ent.y < engine.playerPos.y) drawEntity(ctx, ent, zoom, engine.hoveredEntityId === ent.id); });
      drawPlayer(ctx, engine, zoom);
      sortedEntities.forEach(ent => { if (ent.y >= engine.playerPos.y) drawEntity(ctx, ent, zoom, engine.hoveredEntityId === ent.id); });

      // Projectiles
      engine.projectiles.forEach(p => {
          const img = images[p.type]; if (!img) return;
          ctx.save();
          ctx.translate(p.x * TILE_WIDTH * zoom, p.y * TILE_HEIGHT * zoom);
          ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.drawImage(img, -20*zoom, -2.5*zoom, 40*zoom, 5*zoom);
          ctx.restore();
      });

      // Ghost Placement
      if (placingEntityType) {
          ctx.globalAlpha = 0.5;
          const facing = engine.playerStats.facing;
          let ox = 0, oy = 0;
          if (facing === 'nw') { ox = -1.2; oy = -1.2; } else if (facing === 'ne') { ox = 1.2; oy = -1.2; } else if (facing === 'sw') { ox = -1.2; oy = 1.2; } else { ox = 1.2; oy = 1.2; }
          drawEntity(ctx, { id: 'ghost', x: engine.playerPos.x + ox, y: engine.playerPos.y + oy, type: placingEntityType, health: 100, maxHealth: 100 }, zoom, false);
          ctx.globalAlpha = 1;
      }

      engine.particles.forEach(p => { 
        ctx.fillStyle = p.color; 
        ctx.globalAlpha = p.life / p.maxLife; 
        ctx.beginPath(); 
        ctx.arc(p.x * TILE_WIDTH * zoom, p.y * TILE_HEIGHT * zoom, p.size * zoom, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.globalAlpha = 1; 
      });

      engine.floatingTexts.forEach(ft => { 
        ctx.fillStyle = ft.color; 
        ctx.globalAlpha = ft.life; 
        ctx.font = `bold ${14 * zoom}px Inter`; 
        ctx.textAlign = 'center'; 
        ctx.fillText(ft.text, ft.x * TILE_WIDTH * zoom, (ft.y - 0.5) * TILE_HEIGHT * zoom); 
        ctx.globalAlpha = 1; 
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };
    render(); return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, canvasRef, assetsLoaded, images, placingEntityType]);

  const drawTile = (ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, zoom: number) => {
      const px = x * TILE_WIDTH * zoom, py = y * TILE_HEIGHT * zoom, size = TILE_WIDTH * zoom;
      ctx.fillStyle = tile === 'water' ? '#1d4ed8' : tile === 'sand' ? '#fbbf24' : tile === 'stone' ? '#57534e' : tile === 'snow_tile' ? '#f8fafc' : '#15803d';
      ctx.fillRect(px, py, size + 1, size + 1);
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, ent: Entity, zoom: number, isHovered: boolean) => {
    let assetKey = ENTITY_ASSET_MAP[ent.type];
    if (ent.type === 'farm_plot' && ent.growthStage !== undefined) assetKey = `farm_plot_${ent.growthStage}`;
    const img = images[assetKey]; if (!img) return;
    const x = ent.x * TILE_WIDTH * zoom, y = ent.y * TILE_HEIGHT * zoom, size = TILE_WIDTH * 1.5 * zoom;
    
    const isAnimal = ent.type === 'deer' || ent.type === 'rabbit';
    const isRoaming = isAnimal && ent.aiState === 'grazing';
    const bounce = isRoaming ? Math.abs(Math.sin(performance.now() / 200)) * 5 * zoom : 0;

    ctx.save(); 
    ctx.translate(x + (TILE_WIDTH * zoom) / 2, y + TILE_HEIGHT * zoom - bounce);
    
    if (isHovered) { ctx.shadowBlur = 10 * zoom; ctx.shadowColor = 'white'; }
    if (ent.facing === 'right') { ctx.scale(-1, 1); }

    ctx.drawImage(img, -size / 2, -size, size, size);
    ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, engine: GameState, zoom: number) => {
    const px = engine.playerPos.x * TILE_WIDTH * zoom, py = engine.playerPos.y * TILE_HEIGHT * zoom, size = TILE_WIDTH * 1.2 * zoom;
    const isWalking = engine.playerStats.isWalking, time = performance.now() / 150;
    const bounce = isWalking ? Math.abs(Math.sin(time)) * 4 * zoom : 0;
    const config = engine.playerStats.character;

    ctx.save();
    ctx.translate(px + (TILE_WIDTH * zoom) / 2, py + TILE_HEIGHT * zoom);

    // Legs
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-size*0.15, -size*0.2 + (isWalking ? Math.sin(time)*size*0.05 : 0), size*0.1, size*0.2); // Left leg
    ctx.fillRect(size*0.05, -size*0.2 + (isWalking ? Math.sin(time + Math.PI)*size*0.05 : 0), size*0.1, size*0.2); // Right leg

    // Body
    ctx.fillStyle = config.outfitColor;
    ctx.beginPath();
    ctx.roundRect(-size*0.25, -size*0.65 - bounce, size*0.5, size*0.5, size*0.1);
    ctx.fill();

    // Arms
    ctx.fillStyle = '#fde68a'; // Skin
    const armSwing = isWalking ? Math.sin(time) * 15 : 0;
    // Left Arm
    ctx.save(); ctx.translate(-size*0.3, -size*0.55 - bounce); ctx.rotate(-armSwing * Math.PI / 180); ctx.fillRect(-size*0.05, 0, size*0.1, size*0.25); ctx.restore();
    // Right Arm (Weapon/Tool Hand)
    ctx.save(); ctx.translate(size*0.3, -size*0.55 - bounce); ctx.rotate(armSwing * Math.PI / 180); 
    const interaction = engine.playerStats.interactionAnim > 0 ? (1 - engine.playerStats.interactionAnim / 0.3) * Math.PI : 0;
    ctx.rotate(-interaction);
    ctx.fillRect(-size*0.05, 0, size*0.1, size*0.25); 

    // Equipped Item
    const eqId = engine.playerStats.equippedItemId;
    if (eqId) {
        let toolKey = eqId === 'axe' ? 'axe_tool' : eqId === 'pickaxe' ? 'pickaxe_tool' : eqId.includes('sword') ? 'sword_tool' : eqId === 'bow' ? 'bow' : '';
        const tImg = images[toolKey];
        if (tImg) ctx.drawImage(tImg, -size*0.1, size*0.1, size*0.5, size*0.5);
    }
    ctx.restore();

    // Head
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -size*0.8 - bounce, size*0.18, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    const eyeOffset = engine.playerStats.facing.includes('e') ? 2 : -2;
    ctx.beginPath(); ctx.arc(eyeOffset * zoom, -size*0.82 - bounce, size*0.02, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc((eyeOffset + 6) * zoom, -size*0.82 - bounce, size*0.02, 0, Math.PI*2); ctx.fill();

    // Hair/Hat
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.arc(0, -size*0.88 - bounce, size*0.18, Math.PI, Math.PI*2); ctx.fill();

    ctx.restore();
  };

  return <canvas ref={canvasRef} />;
};
