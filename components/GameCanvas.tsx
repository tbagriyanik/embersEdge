
import React, { useRef, useEffect, useState } from 'react';
import { GameState, TileType, Entity, EntityType, FloatingText, Particle } from '../types';
import { TILE_WIDTH, TILE_HEIGHT, CHUNK_SIZE } from '../constants';
import { calculateTileType } from '../App';

interface Props {
  gameState: GameState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  placingEntityType: EntityType | null;
}

const ASSETS_SVG: Record<string, string> = {
  axe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M45 20 L75 10 L75 50 L45 40 Z" fill="#94a3b8"/><path d="M45 20 L25 10 L25 50 L45 40 Z" fill="#64748b"/></svg>`,
  pickaxe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="10" height="60" rx="5" fill="#78350f"/><path d="M10 30 Q50 10 90 30 L90 45 Q50 25 10 45 Z" fill="#94a3b8"/></svg>`,
  hoe_tool: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="40" width="8" height="60" rx="4" fill="#78350f"/><rect x="20" y="35" width="40" height="12" rx="4" fill="#94a3b8"/></svg>`,
  tree_oak: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="80" width="10" height="30" fill="#451a03"/><circle cx="50" cy="50" r="40" fill="#15803d"/><circle cx="30" cy="60" r="25" fill="#166534"/><circle cx="70" cy="60" r="25" fill="#166534"/><circle cx="50" cy="30" r="25" fill="#166534"/></svg>`,
  tree_pine: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="80" width="10" height="40" fill="#451a03"/><path d="M50 10 L85 80 L15 80 Z" fill="#065f46"/><path d="M50 30 L75 70 L25 70 Z" fill="#064e3b"/><path d="M50 50 L65 60 L35 60 Z" fill="#022c22"/></svg>`,
  rock_standard: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 80 L30 30 L70 20 L90 80 Z" fill="#44403c"/><path d="M30 30 L50 60 L70 20 Z" fill="#57534e"/></svg>`,
  bush_berry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="60" r="30" fill="#166534"/><circle cx="40" cy="50" r="6" fill="#7c3aed"/><circle cx="60" cy="55" r="6" fill="#7c3aed"/><circle cx="50" cy="40" r="6" fill="#7c3aed"/></svg>`,
  deer: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="40" width="40" height="30" rx="10" fill="#a16207"/><rect x="60" y="20" width="10" height="30" rx="5" fill="#a16207"/><circle cx="65" cy="20" r="8" fill="#a16207"/><rect x="35" y="70" width="6" height="15" fill="#78350f"/><rect x="59" y="70" width="6" height="15" fill="#78350f"/></svg>`,
  rabbit: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="70" rx="15" ry="10" fill="#e2e8f0"/><circle cx="60" cy="60" r="8" fill="#e2e8f0"/><rect x="58" y="45" width="4" height="12" rx="2" fill="#cbd5e1"/><rect x="62" y="45" width="4" height="12" rx="2" fill="#cbd5e1"/></svg>`,
  flower: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="48" y="60" width="4" height="30" fill="#15803d"/><circle cx="50" cy="50" r="10" fill="#f472b6"/><circle cx="40" cy="45" r="8" fill="#f472b6"/><circle cx="60" cy="45" r="8" fill="#f472b6"/><circle cx="50" cy="35" r="8" fill="#f472b6"/></svg>`,
  campfire: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="70" width="40" height="10" fill="#451a03" transform="rotate(20 50 75)"/><rect x="30" y="70" width="40" height="10" fill="#451a03" transform="rotate(-20 50 75)"/><path d="M50 20 Q70 60 50 80 Q30 60 50 20" fill="#f59e0b"/><path d="M50 40 Q60 60 50 75 Q40 60 50 40" fill="#ef4444"/></svg>`,
  workbench: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="40" width="60" height="40" fill="#78350f"/><rect x="15" y="35" width="70" height="10" fill="#451a03"/><rect x="30" y="50" width="10" height="10" fill="#94a3b8"/></svg>`,
  tent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 80 L50 20 L90 80 Z" fill="#92400e"/><path d="M50 20 L50 80" stroke="rgba(0,0,0,0.2)" stroke-width="2"/></svg>`,
  hut: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="50" width="60" height="40" fill="#78350f"/><path d="M10 50 L50 10 L90 50 Z" fill="#7f1d1d"/><rect x="45" y="70" width="10" height="20" fill="#312e81"/></svg>`,
  loot_bag: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M30 80 Q50 90 70 80 L75 40 Q50 30 25 40 Z" fill="#78350f"/><path d="M30 40 Q50 35 70 40" stroke="#f59e0b" stroke-width="4" fill="none"/></svg>`,
  farm_plot: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" fill="#451a03" rx="10"/><rect x="15" y="15" width="70" height="70" fill="#2d1a12" rx="5"/><path d="M20 25 L80 25 M20 40 L80 40 M20 55 L80 55 M20 70 L80 70" stroke="rgba(255,255,255,0.05)" stroke-width="2"/></svg>`,
  grass_clump: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 90 L30 40 M50 90 L50 30 M50 90 L70 40" stroke="#15803d" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  
  // Enhanced Crop Growth Stages
  berry_stage_1: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 85 Q48 75 50 70 Q52 75 50 85" fill="#166534"/><path d="M50 72 L45 68" stroke="#166534" stroke-width="2"/></svg>`,
  berry_stage_2: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 85 Q40 65 50 50 Q60 65 50 85" fill="#15803d"/><path d="M50 80 L65 70 M50 75 L35 68" stroke="#15803d" stroke-width="3"/></svg>`,
  berry_stage_3: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 85 Q30 60 50 40 Q70 60 50 85" fill="#15803d"/><circle cx="40" cy="65" r="4" fill="#a855f7" opacity="0.6"/><circle cx="60" cy="55" r="4" fill="#a855f7" opacity="0.6"/><circle cx="50" cy="45" r="4" fill="#a855f7" opacity="0.6"/></svg>`,
  berry_stage_4: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="60" r="28" fill="#166534"/><circle cx="35" cy="55" r="7" fill="#9333ea"/><circle cx="65" cy="55" r="7" fill="#9333ea"/><circle cx="50" cy="40" r="7" fill="#9333ea"/><circle cx="50" cy="70" r="6" fill="#9333ea"/></svg>`,
  berry_stage_5: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="55" r="35" fill="#14532d"/><circle cx="30" cy="60" r="9" fill="#7c3aed"/><circle cx="70" cy="60" r="9" fill="#7c3aed"/><circle cx="50" cy="35" r="9" fill="#7c3aed"/><circle cx="50" cy="75" r="9" fill="#7c3aed"/><circle cx="35" cy="40" r="7" fill="#7c3aed"/><circle cx="65" cy="40" r="7" fill="#7c3aed"/><circle cx="50" cy="55" r="5" fill="#fff" opacity="0.3"/></svg>`,
};

const IMAGE_CACHE: Record<string, HTMLImageElement> = {};

const getAssetImage = (type: string): HTMLImageElement | null => {
  if (IMAGE_CACHE[type]) return IMAGE_CACHE[type];
  const svg = ASSETS_SVG[type];
  if (!svg) return null;
  const img = new Image();
  img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
  IMAGE_CACHE[type] = img;
  return img;
};

export const GameCanvas: React.FC<Props> = ({ gameState, canvasRef, placingEntityType }) => {
  const grassImgRef = useRef<HTMLImageElement | null>(null);
  const artGrassImgRef = useRef<HTMLImageElement | null>(null);
  const [grassLoaded, setGrassLoaded] = useState(false);
  const [artGrassLoaded, setArtGrassLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = 'grass.jpg';
    img.onload = () => {
      grassImgRef.current = img;
      setGrassLoaded(true);
    };

    const artImg = new Image();
    artImg.src = 'artificial_grass.jpg';
    artImg.onload = () => {
      artGrassImgRef.current = artImg;
      setArtGrassLoaded(true);
    };
  }, []);

  /**
   * Procedurally draws a humanoid character (Player or NPC)
   * with a more realistic structure, shading, and limb movement.
   */
  const drawHumanoid = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    options: { 
      gender: 'male' | 'female', 
      outfitColor: string, 
      isWalking: boolean, 
      facing: string, 
      equippedItemId: string | null, 
      interactionAnim: number,
      scale: number,
      isNPC?: boolean,
      isShopkeeper?: boolean
    }
  ) => {
    const { gender, outfitColor, isWalking, facing, equippedItemId, interactionAnim, scale, isNPC, isShopkeeper } = options;
    const now = Date.now();
    const time = now / 150;
    
    ctx.save();
    ctx.translate(x, y);

    // 1. Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); 
    ctx.ellipse(0, 0, 18 * scale, 10 * scale, 0, 0, Math.PI * 2); 
    ctx.fill();

    // Walking / Idle Bobbing
    const bob = isWalking ? Math.sin(time * 2) * 2 : Math.sin(time) * 0.5;
    ctx.translate(0, bob);

    // Facing calculation (left/right)
    const isFacingEast = facing.includes('e') || facing === 'right';
    const sideMult = isFacingEast ? 1 : -1;

    // Animation states
    const legSwing = isWalking ? Math.sin(time * 1.5) * 15 : 0;
    const armSwing = isWalking ? Math.cos(time * 1.5) * 20 : Math.sin(time * 0.5) * 5;

    // 2. Legs
    const drawLeg = (offsetX: number, angle: number) => {
        ctx.save();
        ctx.translate(offsetX * scale, -10 * scale);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.fillStyle = '#1c1917'; // Pant color
        ctx.beginPath();
        ctx.roundRect(-4 * scale, 0, 8 * scale, 14 * scale, 3 * scale);
        ctx.fill();
        // Boot
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(-5 * scale, 10 * scale, 10 * scale, 5 * scale);
        ctx.restore();
    };

    drawLeg(-5, legSwing);
    drawLeg(5, -legSwing);

    // 3. Torso
    ctx.save();
    ctx.translate(0, -32 * scale);
    const bodyGrad = ctx.createLinearGradient(-12 * scale, 0, 12 * scale, 0);
    bodyGrad.addColorStop(0, outfitColor);
    bodyGrad.addColorStop(1, '#00000044'); // Subtle shadow on one side
    ctx.fillStyle = bodyGrad;
    
    if (gender === 'female') {
        // More curved torso for female
        ctx.beginPath();
        ctx.moveTo(-10 * scale, 0);
        ctx.bezierCurveTo(-14 * scale, 10 * scale, -14 * scale, 25 * scale, -10 * scale, 32 * scale);
        ctx.lineTo(10 * scale, 32 * scale);
        ctx.bezierCurveTo(14 * scale, 25 * scale, 14 * scale, 10 * scale, 10 * scale, 0);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.roundRect(-13 * scale, 0, 26 * scale, 34 * scale, 6 * scale);
        ctx.fill();
    }
    
    // Clothing Detail (Buttons/Seams)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 5 * scale);
    ctx.lineTo(0, 30 * scale);
    ctx.stroke();

    // 4. Arms
    const drawArm = (isFront: boolean) => {
        const armSide = isFront ? 1 : -1;
        ctx.save();
        const baseAngle = isFront ? armSwing : -armSwing;
        const interactionOffset = isFront && interactionAnim > 0 ? -60 : 0;
        
        ctx.translate(13 * armSide * scale, 5 * scale);
        ctx.rotate(((baseAngle + interactionOffset) * Math.PI) / 180);
        
        // Sleeve
        ctx.fillStyle = outfitColor;
        ctx.beginPath();
        ctx.roundRect(-4 * scale, 0, 8 * scale, 16 * scale, 4 * scale);
        ctx.fill();
        
        // Hand
        ctx.fillStyle = '#fef3c7'; // Skin tone
        ctx.beginPath();
        ctx.arc(0, 18 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();

        // 5. Tool / Weapon (Front arm only)
        if (isFront && equippedItemId) {
            let toolKey = 'axe_tool';
            if (equippedItemId.includes('pick')) toolKey = 'pickaxe_tool';
            else if (equippedItemId.includes('hoe')) toolKey = 'hoe_tool';
            
            const toolImg = getAssetImage(toolKey);
            if (toolImg) {
                ctx.save();
                ctx.translate(0, 18 * scale);
                ctx.rotate(0.5);
                ctx.drawImage(toolImg, -15 * scale, -15 * scale, 30 * scale, 30 * scale);
                ctx.restore();
            }
        }
        ctx.restore();
    };

    // Sort arms by depth
    if (isFacingEast) {
        drawArm(false); // Back arm
        drawArm(true);  // Front arm
    } else {
        drawArm(true);  // Back arm
        drawArm(false); // Front arm
    }

    // 6. Head
    ctx.save();
    ctx.translate(0, -10 * scale); // Position head relative to body
    
    // Neck
    ctx.fillStyle = '#f3e8c0';
    ctx.fillRect(-4 * scale, -2 * scale, 8 * scale, 4 * scale);

    // Face
    const skinGrad = ctx.createRadialGradient(0, -8 * scale, 0, 0, -8 * scale, 12 * scale);
    skinGrad.addColorStop(0, '#fef3c7');
    skinGrad.addColorStop(1, '#f3e8c0');
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.arc(0, -12 * scale, 11 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    const eyeX = (isFacingEast ? 4 : -4) * scale;
    ctx.beginPath(); ctx.arc(eyeX - (1*sideMult), -14 * scale, 1.5 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX + (4*sideMult), -14 * scale, 1.5 * scale, 0, Math.PI * 2); ctx.fill();

    // Hair / Hat
    if (isShopkeeper) {
        // Wizard-like hat
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(-15 * scale, -18 * scale);
        ctx.lineTo(15 * scale, -18 * scale);
        ctx.lineTo(0, -35 * scale);
        ctx.closePath();
        ctx.fill();
    } else {
        // Hair
        ctx.fillStyle = gender === 'female' ? '#451a03' : '#1c1917';
        if (gender === 'female') {
            // Long hair
            ctx.beginPath();
            ctx.ellipse(0, -16 * scale, 13 * scale, 10 * scale, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-13 * scale, -16 * scale, 5 * scale, 25 * scale);
            ctx.fillRect(8 * scale, -16 * scale, 5 * scale, 25 * scale);
        } else {
            // Short hair
            ctx.beginPath();
            ctx.ellipse(0, -18 * scale, 12 * scale, 8 * scale, 0, Math.PI, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore(); // Head
    ctx.restore(); // Torso
    ctx.restore(); // Main translate
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const render = () => {
      const { width, height } = canvas;
      const { playerPos, playerStats, entities, particles, floatingTexts, projectiles, viewConfig, chunks, clickMarker } = gameState;
      const { zoom, cameraOffsetX, cameraOffsetY } = viewConfig;
      const nowTs = Date.now();
      
      const tw = TILE_WIDTH * zoom;
      const th = TILE_HEIGHT * zoom;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2 + cameraOffsetX, height / 2 + cameraOffsetY);

      const startX = Math.floor(playerPos.x - (width / 2 + cameraOffsetX) / tw - 2);
      const endX = Math.ceil(playerPos.x + (width / 2 - cameraOffsetX) / tw + 2);
      const startY = Math.floor(playerPos.y - (height / 2 + cameraOffsetY) / th - 2);
      const endY = Math.ceil(playerPos.y + (height / 2 - cameraOffsetY) / th + 2);

      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const cx = Math.floor(x / CHUNK_SIZE);
          const cy = Math.floor(y / CHUNK_SIZE);
          const key = `${cx},${cy}`;
          const chunk = chunks[key];
          
          let tile: TileType;
          if (chunk) {
            const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            tile = chunk[lx][ly];
          } else {
            tile = calculateTileType(x, y);
          }

          const screenX = (x - playerPos.x) * tw;
          const screenY = (y - playerPos.y) * th;

          if (tile === 'grass' && grassImgRef.current && grassLoaded) {
            ctx.drawImage(grassImgRef.current, screenX, screenY, tw + 1, th + 1);
            ctx.fillStyle = 'rgba(0, 50, 0, 0.15)';
            ctx.fillRect(screenX, screenY, tw + 1, th + 1);
          } else if (tile === 'artificial_grass' && artGrassImgRef.current && artGrassLoaded) {
            ctx.drawImage(artGrassImgRef.current, screenX, screenY, tw + 1, th + 1);
          } else {
            let color = '#064e3b';
            if (tile === 'water') color = '#1d4ed8';
            else if (tile === 'sand') color = '#f59e0b';
            else if (tile === 'snow_tile') color = '#f8fafc';
            else if (tile === 'stone') color = '#44403c';
            else if (tile === 'road_tile') color = '#574230';

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, tw + 1, th + 1);
          }
        }
      }

      const renderables = [
        ...entities.map(e => ({ type: 'entity' as const, data: e })),
        { type: 'player' as const, data: { ...playerStats, x: playerPos.x, y: playerPos.y } }
      ];
      renderables.sort((a, b) => a.data.y - b.data.y);

      renderables.forEach(r => {
        const screenX = (r.data.x - playerPos.x) * tw + tw/2;
        const screenY = (r.data.y - playerPos.y) * th + th/2;

        if (r.type === 'player') {
          drawHumanoid(ctx, screenX, screenY, {
            gender: playerStats.character.gender,
            outfitColor: playerStats.character.outfitColor,
            isWalking: playerStats.isWalking,
            facing: playerStats.facing,
            equippedItemId: playerStats.equippedItemId,
            interactionAnim: playerStats.interactionAnim,
            scale: zoom
          });
        } else {
          const ent = r.data as Entity;
          
          if (ent.type === 'villager' || ent.type === 'shopkeeper') {
             drawHumanoid(ctx, screenX, screenY, {
                gender: (parseInt(ent.id.slice(-1)) || 0) % 2 === 0 ? 'male' : 'female',
                outfitColor: ent.type === 'shopkeeper' ? '#1e1b4b' : '#15803d',
                isWalking: (ent.aiState !== 'idle' && ent.aiState !== 'working'),
                facing: ent.facing || 'se',
                equippedItemId: ent.aiState === 'working' ? 'hoe' : null,
                interactionAnim: ent.interactionAnim || 0,
                scale: zoom,
                isNPC: true,
                isShopkeeper: ent.type === 'shopkeeper'
             });
          } else {
            const img = getAssetImage(ent.type);
            if (img) {
                const size = (ent.type.includes('tree') ? 120 : 64) * zoom;
                ctx.save();
                if (ent.facing === 'left') {
                    ctx.translate(screenX, screenY);
                    ctx.scale(-1, 1);
                    ctx.translate(-screenX, -screenY);
                }

                if (ent.health < ent.maxHealth) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(screenX - 20 * zoom, screenY - 50 * zoom, 40 * zoom, 4 * zoom);
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(screenX - 20 * zoom, screenY - 50 * zoom, (ent.health / ent.maxHealth) * 40 * zoom, 4 * zoom);
                }

                if (ent.level && ent.level > 1 && (ent.type === 'workbench' || ent.type === 'hut')) {
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2 * zoom;
                    ctx.font = `bold ${12 * zoom}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.strokeText(`LVL ${ent.level}`, screenX, screenY - 65 * zoom);
                    ctx.fillText(`LVL ${ent.level}`, screenX, screenY - 65 * zoom);
                }

                if (ent.type === 'farm_plot' && ent.growthStage) {
                    if (ent.growthStage === 5) {
                        const glowPulse = (Math.sin(nowTs / 300) + 1) / 2;
                        ctx.save();
                        ctx.globalAlpha = 0.2 + glowPulse * 0.3;
                        const grad = ctx.createRadialGradient(screenX, screenY - 30 * zoom, 0, screenX, screenY - 30 * zoom, 40 * zoom);
                        grad.addColorStop(0, 'rgba(124, 58, 237, 0.8)');
                        grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY - 30 * zoom, 40 * zoom, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();

                        const hoverBob = Math.sin(nowTs / 400) * 8 * zoom;
                        ctx.font = `bold ${16 * zoom}px serif`;
                        ctx.textAlign = 'center';
                        ctx.fillText('🍇', screenX, screenY - 70 * zoom + hoverBob);
                    }

                    ctx.save();
                    ctx.translate(screenX, screenY);
                    const stageImg = getAssetImage(`berry_stage_${ent.growthStage}`);
                    if (stageImg) {
                        const cropSize = 64 * zoom;
                        ctx.drawImage(stageImg, -cropSize/2, -cropSize * 0.85, cropSize, cropSize);
                    }
                    ctx.restore();
                }

                ctx.drawImage(img, screenX - size/2, screenY - size * 0.8, size, size);
                ctx.restore();
            }
          }
        }
      });

      // Particles, projectils, texts...
      particles.forEach(p => {
        const screenX = (p.x - playerPos.x) * tw + tw/2;
        const screenY = (p.y - playerPos.y) * th + th/2;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        if (p.type === 'heart') {
            ctx.font = `${p.size * 20 * zoom}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText('❤️', screenX, screenY);
        } else {
            const s = p.size * zoom * 10;
            ctx.fillRect(screenX - s/2, screenY - s/2, s, s);
        }
      });
      ctx.globalAlpha = 1.0;

      projectiles.forEach(p => {
        const screenX = (p.x - playerPos.x) * tw + tw/2;
        const screenY = (p.y - playerPos.y) * th + th/2;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); 
        ctx.arc(screenX, screenY, 3 * zoom, 0, Math.PI * 2); 
        ctx.fill();
      });

      floatingTexts.forEach(ft => {
        const screenX = (ft.x - playerPos.x) * tw + tw/2;
        const screenY = (ft.y - playerPos.y) * th + th/2;
        ctx.save();
        ctx.font = `bold ${14 * zoom}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3 * zoom;
        ctx.strokeText(ft.text, screenX, screenY);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, screenX, screenY);
        ctx.restore();
      });

      ctx.restore();

      if (clickMarker && clickMarker.life > 0) {
        ctx.save();
        ctx.translate(width / 2 + cameraOffsetX, height / 2 + cameraOffsetY);
        const screenX = (clickMarker.x - playerPos.x) * tw + tw/2;
        const screenY = (clickMarker.y - playerPos.y) * th + th/2;
        ctx.strokeStyle = `rgba(251, 191, 36, ${clickMarker.life})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, (1.0 - clickMarker.life) * 40 * zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [gameState, canvasRef, grassLoaded, artGrassLoaded]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  return (
    <canvas 
      ref={canvasRef} 
      width={window.innerWidth} 
      height={window.innerHeight} 
      className="block bg-stone-900" 
    />
  );
};
