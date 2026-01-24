
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Inventory } from './components/Inventory';
import { Crafting } from './components/Crafting';
import { MobileControls } from './components/MobileControls';
import { MainMenu } from './components/MainMenu';
import { SoundManager } from './components/SoundManager';
import { PlayerStats, Item, Entity, GameState, EntityType, WeatherType, TileType, FacingDirection, GameSettings, Language } from './types';
import { INITIAL_STATS, WORLD_SIZE, ITEMS, TIME_SCALE, RECIPES, SAVE_KEY, TRANSLATIONS, TILE_WIDTH, TILE_HEIGHT } from './constants';

export const getTileType = (x: number, y: number, level: number = 1): TileType => {
  const dx = x - WORLD_SIZE / 2;
  const dy = y - WORLD_SIZE / 2;
  const distToCenter = Math.sqrt(dx * dx + dy * dy);
  const borderSize = Math.max(0, level >= 5 ? 0 : level >= 3 ? 2 : 4);
  
  if (x < borderSize || x >= WORLD_SIZE - borderSize || y < borderSize || y >= WORLD_SIZE - borderSize) return 'water';
  if (level >= 3 && x > WORLD_SIZE * 0.65 && y > WORLD_SIZE * 0.65) return 'desert_tile';
  if (level >= 5 && x < WORLD_SIZE * 0.35 && y < WORLD_SIZE * 0.35) return 'snow_tile';
  if (distToCenter < 5) return 'water';
  if (distToCenter < 7.5) return 'sand';

  const n1 = Math.sin(x * 0.4) * Math.cos(y * 0.4);
  const n2 = Math.sin(x * 0.2 + y * 0.2) * 0.5;
  const n3 = Math.cos(x * 1.5) * Math.sin(y * 1.5) * 0.1;
  const combinedNoise = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;

  if (combinedNoise > 0.65) return 'water';
  if (combinedNoise > 0.45) return 'sand';
  return 'grass';
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 + 8 },
    playerStats: INITIAL_STATS,
    inventory: [],
    entities: [],
    projectiles: [], // Added missing projectiles array
    time: 600,
    isDay: true,
    gameStarted: false,
    weather: { type: 'clear', intensity: 0, transition: 0 },
    settings: { language: 'en', soundEnabled: true },
    viewConfig: { zoom: 1.0, rotation: 0, cameraOffsetX: 0, cameraOffsetY: 0 }
  });

  const [uiState, setUiState] = useState({ inventoryOpen: false, craftingOpen: false, settingsOpen: false, message: '' });
  const [isResting, setIsResting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastMouseClientPos = useRef<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const requestRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const footstepAccumulator = useRef<number>(0);
  
  const inputDir = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const activeKeys = useRef<Set<string>>(new Set());
  const isInteracting = useRef(false);
  const lastInteractTimeInput = useRef(0);

  const lang = gameState.settings.language;
  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  // Determine if the player is in a critical state (Health, Hunger, or Thirst < 20%)
  const isCritical = useMemo(() => {
    const s = gameState.playerStats;
    return s.health < 20 || s.hunger < 20 || s.thirst < 20;
  }, [gameState.playerStats]);

  const showMessage = useCallback((msgKey: string, direct: boolean = false) => {
    const msg = direct ? msgKey : t(msgKey);
    setUiState(prev => ({ ...prev, message: msg }));
    setTimeout(() => setUiState(prev => ({ ...prev, message: '' })), 4000);
  }, [lang, t]);

  const addXP = useCallback((amount: number) => {
    setGameState(prev => {
      let newXP = prev.playerStats.xp + amount;
      let newLevel = prev.playerStats.level;
      let leveledUp = false;
      if (newXP >= 100 * newLevel) {
        newXP -= 100 * newLevel;
        newLevel += 1;
        leveledUp = true;
      }
      if (leveledUp) {
        SoundManager.playUI('fanfare');
        const rewards = RECIPES.filter(r => r.levelRequired === newLevel).map(r => r.name).join(", ");
        showMessage(`${t('level_up')} ${newLevel}${rewards ? `\n🎁 ${rewards}` : ""}`, true);
      }
      return {
        ...prev,
        playerStats: {
          ...prev.playerStats,
          level: newLevel, xp: newXP,
          maxHealth: leveledUp ? prev.playerStats.maxHealth + 10 : prev.playerStats.maxHealth,
          health: leveledUp ? prev.playerStats.maxHealth + 10 : prev.playerStats.health,
        }
      };
    });
  }, [showMessage, t]);

  const handleInventoryAction = useCallback((action: 'use' | 'reorder' | 'equip', data: any) => {
    setGameState(prev => {
      let ni = [...prev.inventory], ns = {...prev.playerStats};
      if (action === 'use') {
        const item = data as Item;
        if (item.type === 'food' && item.effect) {
            ns.hunger = Math.min(100, ns.hunger + (item.effect.hunger || 0));
            ns.thirst = Math.min(100, ns.thirst + (item.effect.thirst || 0));
            const idx = ni.findIndex(i => i.id === item.id);
            if (idx > -1) { ni[idx].quantity -= 1; if (ni[idx].quantity <= 0) ni.splice(idx, 1); }
            SoundManager.playGather('bush_berry');
        } else if (item.type === 'tool') {
          ns.equippedItemId = ns.equippedItemId === item.id ? null : item.id;
          SoundManager.playUI('click');
        }
      } else if (action === 'reorder') {
        const { fromIdx, toIdx } = data; const it = ni[fromIdx];
        ni.splice(fromIdx, 1); ni.splice(toIdx, 0, it);
      } else if (action === 'equip') {
        ns.equippedItemId = (data as Item).id;
        SoundManager.playUI('click');
      }
      return {...prev, inventory: ni, playerStats: ns};
    });
  }, []);

  const spawnEntities = useCallback((count: number, level: number, specificType?: EntityType[]) => {
    const newEnts: Entity[] = [];
    const baseTypes = ['tree', 'rock', 'bush', 'deer', 'rabbit'];
    
    let spawned = 0;
    while (spawned < count) {
      const rx = Math.random() * WORLD_SIZE;
      const ry = Math.random() * WORLD_SIZE;
      const tile = getTileType(rx, ry, level);
      
      if (tile !== 'water') {
        let category = baseTypes[Math.floor(Math.random() * baseTypes.length)];
        if (tile === 'grass' && Math.random() < 0.4) category = Math.random() > 0.5 ? 'tree' : 'rock';
        if (tile === 'desert_tile') category = Math.random() > 0.7 ? 'tree' : (Math.random() > 0.4 ? 'rock' : 'scorpion');

        let finalType: EntityType = 'rock_standard';
        if (category === 'tree') {
            if (tile === 'desert_tile') finalType = 'tree_palm';
            else finalType = Math.random() > 0.5 ? 'tree_oak' : 'tree_pine';
        } else if (category === 'rock') {
            const r = Math.random();
            if (r > 0.85) finalType = 'rock_iron';
            else finalType = 'rock_standard';
        } else if (category === 'bush') {
            const r = Math.random();
            if (r > 0.7) finalType = 'bush_berry';
            else if (r > 0.4) finalType = 'bush_flower';
            else finalType = 'bush_dry';
        } else {
            finalType = category as EntityType;
        }
        
        newEnts.push({
          id: `ent-${Date.now()}-${spawned}-${Math.random()}`, x: rx, y: ry, type: finalType,
          health: ['deer', 'bear'].includes(finalType) ? 8 : (finalType === 'rabbit' ? 2 : 5),
          maxHealth: ['deer', 'bear'].includes(finalType) ? 8 : (finalType === 'rabbit' ? 2 : 5),
          targetX: rx,
          targetY: ry,
          spawnTime: Date.now()
        });
        spawned++;
      }
    }
    return newEnts;
  }, []);

  const triggerRest = useCallback(() => {
    if (isResting) return;
    setIsResting(true);
    SoundManager.playUI('click');
    
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        time: (prev.time + 500) % 2400,
        playerStats: {
          ...prev.playerStats,
          health: Math.min(prev.playerStats.maxHealth, prev.playerStats.health + 25),
          stamina: prev.playerStats.maxStamina
        }
      }));
      showMessage('Rested for 5 hours', true);
    }, 1000);

    setTimeout(() => {
      setIsResting(false);
    }, 2500);
  }, [isResting, showMessage]);

  const interact = useCallback(() => {
    if (isResting) return;
    setGameState(prev => {
      const { x: px, y: py } = prev.playerPos;
      const range = (prev.playerStats.equippedItemId === 'bow' && prev.inventory.find(i => i.id === 'arrow')?.quantity) ? 5 : 1.8;
      const idx = prev.entities.findIndex(e => Math.sqrt((e.x - px)**2 + (e.y - py)**2) <= range);
      
      const newStats = { ...prev.playerStats, lastInteractTime: Date.now() };

      if (idx === -1) return { ...prev, playerStats: newStats };
      
      const ent = prev.entities[idx];
      const newInv = [...prev.inventory];
      const newEnts = [...prev.entities];

      if (ent.type === 'well') { SoundManager.playGather('bush_berry'); return { ...prev, playerStats: { ...newStats, thirst: Math.min(100, newStats.thirst + 40) } }; }
      
      if (ent.type === 'tent' || ent.type === 'hut') { 
        triggerRest(); 
        return { ...prev, playerStats: newStats }; 
      }
      
      if (ent.type === 'workbench') { setUiState(u => ({ ...u, craftingOpen: true })); return { ...prev, playerStats: newStats }; }

      SoundManager.playGather(ent.type);
      
      const dmg = prev.playerStats.equippedItemId === 'axe' ? 3 : 1;
      const updatedHealth = ent.health - dmg;

      if (updatedHealth <= 0) {
        newEnts.splice(idx, 1);
        let item = null;
        if (ent.type.startsWith('tree')) item = { ...ITEMS.wood, quantity: 3 };
        else if (ent.type.startsWith('rock')) item = { ...ITEMS.stone, quantity: 2 };
        else if (ent.type === 'bush_berry') item = { ...ITEMS.berry, quantity: 2 };
        else if (['deer', 'bear', 'rabbit', 'scorpion'].includes(ent.type)) item = { ...ITEMS.meat_raw, quantity: 2 };
        
        if (item) {
          const invIdx = newInv.findIndex(i => i.id === item!.id && i.quantity < (i.maxStack || 99));
          if (invIdx > -1) newInv[invIdx].quantity += item.quantity; else newInv.push(item);
        }
        addXP(10);
      } else {
        newEnts[idx] = { ...ent, health: updatedHealth, isFleeing: true, targetX: ent.x + (ent.x - px) * 5, targetY: ent.y + (ent.y - py) * 5 };
        addXP(3);
      }
      return { ...prev, entities: newEnts, inventory: newInv, playerStats: { ...newStats, stamina: Math.max(0, newStats.stamina - 1) } };
    });
  }, [addXP, triggerRest]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (isResting) return;
    
    if (['1', '2', '3', '4', '5'].includes(key)) {
      const idx = parseInt(key) - 1;
      const item = gameState.inventory[idx];
      if (item) handleInventoryAction('use', item);
      e.preventDefault();
      return;
    }

    if (key === 'f') {
        setUiState(u => ({...u, inventoryOpen: !u.inventoryOpen, craftingOpen: false, settingsOpen: false}));
        e.preventDefault();
        return;
    }

    if (key === 'c') {
        setUiState(u => ({...u, craftingOpen: !u.craftingOpen, inventoryOpen: false, settingsOpen: false}));
        e.preventDefault();
        return;
    }

    if (uiState.craftingOpen || uiState.inventoryOpen || uiState.settingsOpen) {
      if (key === 'escape') setUiState(p => ({...p, craftingOpen: false, inventoryOpen: false, settingsOpen: false}));
      return;
    }

    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        if (!activeKeys.current.has(key)) { 
          activeKeys.current.add(key); 
          let dx = 0, dy = 0;
          if (activeKeys.current.has('w') || activeKeys.current.has('arrowup')) dy = -1;
          if (activeKeys.current.has('s') || activeKeys.current.has('arrowdown')) dy = 1;
          if (activeKeys.current.has('a') || activeKeys.current.has('arrowleft')) dx = -1;
          if (activeKeys.current.has('d') || activeKeys.current.has('arrowright')) dx = 1;
          inputDir.current = { x: dx, y: dy };
        }
        e.preventDefault();
    } else if (key === 'e') {
        if (!isInteracting.current) { isInteracting.current = true; lastInteractTimeInput.current = Date.now(); interact(); }
        e.preventDefault();
    } else if (key === 'escape' && gameState.gameStarted) {
        setGameState(p => ({...p, gameStarted: false}));
        e.preventDefault();
    }
  }, [interact, uiState, gameState.gameStarted, gameState.inventory, handleInventoryAction, isResting]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        activeKeys.current.delete(key);
        let dx = 0, dy = 0;
        if (activeKeys.current.has('w') || activeKeys.current.has('arrowup')) dy = -1;
        if (activeKeys.current.has('s') || activeKeys.current.has('arrowdown')) dy = 1;
        if (activeKeys.current.has('a') || activeKeys.current.has('arrowleft')) dx = -1;
        if (activeKeys.current.has('d') || activeKeys.current.has('arrowright')) dx = 1;
        inputDir.current = { x: dx, y: dy };
    } else if (key === 'e') {
        isInteracting.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tick = useCallback(() => {
    if (!gameState.gameStarted || gameOver || isResting) {
        requestRef.current = requestAnimationFrame(tick);
        return;
    }

    setGameState(prev => {
      const now = Date.now();
      const newTime = (prev.time + TIME_SCALE) % 2400;

      if (isInteracting.current && now - lastInteractTimeInput.current > 350) {
        lastInteractTimeInput.current = now;
        interact();
      }

      const friction = 0.82;
      const accel = 0.007;
      velocity.current.x = velocity.current.x * friction + inputDir.current.x * accel;
      velocity.current.y = velocity.current.y * friction + inputDir.current.y * accel;
      
      const nextX = Math.max(0, Math.min(WORLD_SIZE - 1, prev.playerPos.x + velocity.current.x));
      const nextY = Math.max(0, Math.min(WORLD_SIZE - 1, prev.playerPos.y + velocity.current.y));
      
      const targetTile = getTileType(nextX, nextY, prev.playerStats.level);
      const canMove = targetTile !== 'water';
      
      const finalX = canMove ? nextX : prev.playerPos.x;
      const finalY = canMove ? nextY : prev.playerPos.y;

      const mag = Math.sqrt(velocity.current.x**2 + velocity.current.y**2);
      footstepAccumulator.current += mag;

      let newFacing = prev.playerStats.facing;
      if (mag > 0.01) {
        const cx = velocity.current.x, cy = velocity.current.y;
        if (cx > 0.001 && cy > 0.001) newFacing = 'se';
        else if (cx < -0.001 && cy > 0.001) newFacing = 'sw';
        else if (cx > 0.001 && cy < -0.001) newFacing = 'ne';
        else if (cx < -0.001 && cy < -0.001) newFacing = 'nw';
        else if (cx > 0.001) newFacing = 'se'; else if (cx < -0.001) newFacing = 'sw';
        else if (cy > 0.001) newFacing = 'se'; else if (cy < -0.001) newFacing = 'ne';

        if (footstepAccumulator.current > 0.3 && canMove) {
          footstepAccumulator.current = 0;
          SoundManager.playFootstep(getTileType(finalX, finalY), mag * 20);
        }
      }

      const animals = ['deer', 'rabbit', 'scorpion', 'bear'];
      let finalEntities = prev.entities.map(ent => {
        if (!animals.includes(ent.type)) return ent;
        const dist = Math.sqrt((ent.x - prev.playerPos.x)**2 + (ent.y - prev.playerPos.y)**2);
        let moveX = ent.x, moveY = ent.y;
        let targetX = ent.targetX ?? ent.x, targetY = ent.targetY ?? ent.y;
        let isFleeing = ent.isFleeing ?? false;

        if (dist < (ent.type === 'rabbit' ? 4 : 6)) {
          isFleeing = true;
          const dx = ent.x - prev.playerPos.x, dy = ent.y - prev.playerPos.y;
          const m = Math.sqrt(dx*dx + dy*dy);
          targetX = ent.x + (dx/m)*4; targetY = ent.y + (dy/m)*4;
        } else if (isFleeing && dist > 9) isFleeing = false;

        if (!isFleeing && Math.random() < 0.005) {
          targetX = ent.x + (Math.random()-0.5)*8; targetY = ent.y + (Math.random()-0.5)*8;
        }

        targetX = Math.max(1, Math.min(WORLD_SIZE-1, targetX));
        targetY = Math.max(1, Math.min(WORLD_SIZE-1, targetY));
        if (getTileType(targetX, targetY) === 'water') { targetX = ent.x; targetY = ent.y; }

        const speed = isFleeing ? 0.08 : 0.02;
        const dx = targetX - ent.x, dy = targetY - ent.y;
        const dM = Math.sqrt(dx*dx + dy*dy);
        if (dM > 0.1) { moveX += (dx/dM)*speed; moveY += (dy/dM)*speed; }

        return { ...ent, x: moveX, y: moveY, targetX, targetY, isFleeing };
      });

      spawnTimerRef.current += TIME_SCALE;
      if (spawnTimerRef.current > 60) {
        spawnTimerRef.current = 0;
        finalEntities = finalEntities.filter(e => {
            const d = Math.sqrt((e.x - prev.playerPos.x)**2 + (e.y - prev.playerPos.y)**2);
            return ['campfire', 'tent', 'hut', 'workbench', 'well'].includes(e.type) || d < 28;
        });
        if (finalEntities.length < 250) finalEntities.push(...spawnEntities(15, prev.playerStats.level));
      }

      return {
        ...prev, playerPos: { x: finalX, y: finalY },
        time: newTime, isDay: newTime > 400 && newTime < 2000,
        entities: finalEntities,
        playerStats: {
          ...prev.playerStats, isWalking: mag > 0.001 && canMove, facing: newFacing,
          hunger: Math.max(0, prev.playerStats.hunger - 0.006),
          thirst: Math.max(0, prev.playerStats.thirst - 0.009),
          health: Math.max(0, prev.playerStats.health + (prev.playerStats.hunger <= 0 ? -0.05 : 0))
        }
      };
    });
    requestRef.current = requestAnimationFrame(tick);
  }, [gameState.gameStarted, gameOver, interact, spawnEntities, isResting]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [tick]);

  useEffect(() => {
    const initialEnts = spawnEntities(350, 1);
    for (let i = 0; i < 8; i++) initialEnts.push({ id: `well-${i}`, x: Math.random()*WORLD_SIZE, y: Math.random()*WORLD_SIZE, type: 'well', health: 100, maxHealth: 100 });
    setGameState(prev => ({ ...prev, entities: initialEnts }));
  }, [spawnEntities]);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden select-none bg-stone-950 text-stone-100"
      onWheel={e => setGameState(p => {
        let nz = Math.max(0.5, Math.min(2.0, p.viewConfig.zoom - e.deltaY * 0.001));
        return {...p, viewConfig: {...p.viewConfig, zoom: nz}};
      })}
      onPointerDown={e => {
        const target = e.target as HTMLElement;
        if (e.button === 0 && !target.closest('.pointer-events-auto, button, a') && gameState.gameStarted) {
            setIsPanning(true);
            lastMouseClientPos.current = { x: e.clientX, y: e.clientY };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={e => {
        if (!isPanning || !lastMouseClientPos.current) return;
        const dx = e.clientX - lastMouseClientPos.current.x, dy = e.clientY - lastMouseClientPos.current.y;
        lastMouseClientPos.current = { x: e.clientX, y: e.clientY };
        setGameState(p => {
            let ox = Math.max(-300, Math.min(300, p.viewConfig.cameraOffsetX + dx));
            let oy = Math.max(-300, Math.min(300, p.viewConfig.cameraOffsetY + dy));
            return {...p, viewConfig: {...p.viewConfig, cameraOffsetX: ox, cameraOffsetY: oy}};
        });
      }}
      onPointerUp={e => { setIsPanning(false); (e.target as HTMLElement).releasePointerCapture(e.pointerId); }}
      onPointerCancel={e => { setIsPanning(false); (e.target as HTMLElement).releasePointerCapture(e.pointerId); }}
    >
      <GameCanvas gameState={gameState} />
      
      {/* Critical Vitals Red Overlay */}
      <div 
        className={`fixed inset-0 z-[150] pointer-events-none transition-opacity duration-1000 ${isCritical ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(220, 38, 38, 0.4) 100%)'
        }}
      >
        <div className={`absolute inset-0 bg-red-600/10 ${isCritical ? 'animate-vitals-pulse' : ''}`} />
      </div>

      {/* Cinematic Resting Overlay */}
      <div 
        className={`fixed inset-0 bg-black z-[200] pointer-events-none transition-opacity duration-1000 flex flex-col items-center justify-center ${isResting ? 'opacity-100' : 'opacity-0'}`}
      >
         <div className="text-white font-black text-4xl tracking-widest animate-pulse uppercase">Resting...</div>
         <div className="text-white/20 text-xs mt-4 tracking-[0.5em] uppercase">Time is passing</div>
      </div>

      <HUD stats={gameState.playerStats} time={gameState.time} message={uiState.message} gameState={gameState} onAction={handleInventoryAction} onZoom={() => {}} onRotate={() => {}} onOpenSettings={() => {}} />
      {isMobile && <MobileControls onMove={(dx, dy) => { if (activeKeys.current.size === 0) inputDir.current = {x: dx, y: dy}; }} onInteractStart={() => { if (activeKeys.current.size === 0) {isInteracting.current = true; lastInteractTimeInput.current = Date.now();}} } onInteractEnd={() => { if (activeKeys.current.size === 0) isInteracting.current = false; }} />}
      {!gameState.gameStarted && <MainMenu onStart={() => { SoundManager.init(); SoundManager.startForestAmbience(); setGameState(p => ({...p, gameStarted: true})); }} settings={gameState.settings} onUpdateSettings={s => setGameState(p => ({...p, settings: s}))} playerStats={gameState.playerStats} onUpdatePlayerStats={p => setGameState(g => ({...g, playerStats: p}))} />}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4 z-50 pointer-events-auto">
         {isMobile && <button onPointerDown={() => isInteracting.current = true} onPointerUp={() => isInteracting.current = false} className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-3xl font-black shadow-[0_0_40px_rgba(245,158,11,0.5)] active:scale-90 transition-all">E</button>}
         <button onClick={() => setUiState(u => ({...u, inventoryOpen: !u.inventoryOpen, craftingOpen: false}))} className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-xl shadow-xl">🎒</button>
         <button onClick={() => setUiState(u => ({...u, craftingOpen: !u.craftingOpen, inventoryOpen: false}))} className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-xl shadow-xl">⚒️</button>
      </div>
      {uiState.inventoryOpen && <Inventory items={gameState.inventory} equippedItemId={gameState.playerStats.equippedItemId} onAction={handleInventoryAction} onClose={() => setUiState(u => ({...u, inventoryOpen: false}))} language={gameState.settings.language} />}
      {uiState.craftingOpen && <Crafting inventory={gameState.inventory} playerLevel={gameState.playerStats.level} isNearWorkbench={gameState.entities.some(e => e.type === 'workbench' && Math.sqrt((e.x-gameState.playerPos.x)**2 + (e.y-gameState.playerPos.y)**2) < 2)} onCraft={recipeId => {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;
        setGameState(prev => {
          const newInv = [...prev.inventory];
          Object.entries(recipe.ingredients).forEach(([id, qty]) => {
            const idx = newInv.findIndex(i => i.id === id);
            if (idx > -1) newInv[idx].quantity -= qty;
          });
          if (recipe.output.type === 'structure') {
             const newEntity: Entity = { id: `struct-${Date.now()}`, x: prev.playerPos.x + 1, y: prev.playerPos.y + 1, type: recipe.output.id as EntityType, health: 20, maxHealth: 20 };
             return { ...prev, entities: [...prev.entities, newEntity], inventory: newInv.filter(i => i.quantity > 0) };
          }
          const invIdx = newInv.findIndex(i => i.id === recipe.output.id);
          if (invIdx > -1) newInv[invIdx].quantity += recipe.output.quantity;
          else newInv.push({ ...recipe.output });
          SoundManager.playUI('fanfare');
          showMessage('CRAFTED!', true);
          return { ...prev, inventory: newInv.filter(i => i.quantity > 0) };
        });
        addXP(20);
      }} onClose={() => setUiState(u => ({...u, craftingOpen: false}))} language={gameState.settings.language} />}
      
      <style>{`
        @keyframes vitals-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        .animate-vitals-pulse {
          animation: vitals-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
export default App;
