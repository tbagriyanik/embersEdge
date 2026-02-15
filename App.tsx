
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Inventory } from './components/Inventory';
import { Crafting } from './components/Crafting';
import { MobileControls } from './components/MobileControls';
import { MainMenu } from './components/MainMenu';
import { SoundManager } from './components/SoundManager';
import { PlayerStats, Item, Entity, GameState, EntityType, TileType, GameSettings, Language } from './types';
import { INITIAL_STATS, WORLD_SIZE, ITEMS, TIME_SCALE, RECIPES, TRANSLATIONS, TILE_WIDTH, TILE_HEIGHT } from './constants';

export const getTileType = (x: number, y: number, level: number = 1): TileType => {
  const dx = x - WORLD_SIZE / 2;
  const dy = y - WORLD_SIZE / 2;
  const distToCenter = Math.sqrt(dx * dx + dy * dy);
  const borderSize = 4;
  
  if (x < borderSize || x >= WORLD_SIZE - borderSize || y < borderSize || y >= WORLD_SIZE - borderSize) return 'water';
  if (distToCenter < 5) return 'water';
  if (distToCenter < 7.5) return 'sand';

  const n1 = Math.sin(x * 0.4) * Math.cos(y * 0.4);
  const n2 = Math.sin(x * 0.2 + y * 0.2) * 0.5;
  const combinedNoise = n1 * 0.6 + n2 * 0.3;

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
    projectiles: [],
    time: 600,
    isDay: true,
    gameStarted: false,
    weather: { type: 'clear', intensity: 0, transition: 0 },
    settings: { language: 'en', soundEnabled: true },
    viewConfig: { zoom: 1.0, rotation: 0, cameraOffsetX: 0, cameraOffsetY: 0 }
  });

  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [uiState, setUiState] = useState({ inventoryOpen: false, craftingOpen: false, settingsOpen: false, message: '' });
  const [isResting, setIsResting] = useState(false);
  const isMobile = useRef(/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)).current;
  
  const requestRef = useRef<number>(0);
  const activeKeys = useRef<Set<string>>(new Set());
  const velocity = useRef({ x: 0, y: 0 });
  const lastUpdate = useRef(performance.now());
  
  // Mouse target logic
  const mouseTargetPos = useRef<{ x: number, y: number } | null>(null);
  const targetEntityId = useRef<string | null>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const lang = gameState.settings.language;
  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  const showMessage = useCallback((msgKey: string, direct: boolean = false) => {
    const msg = direct ? msgKey : t(msgKey);
    setUiState(prev => ({ ...prev, message: msg }));
    setTimeout(() => setUiState(prev => ({ ...prev, message: '' })), 4000);
  }, [t]);

  const spawnEntities = useCallback((count: number) => {
    const newEnts: Entity[] = [];
    let spawned = 0;
    while (spawned < count) {
      const rx = Math.random() * WORLD_SIZE;
      const ry = Math.random() * WORLD_SIZE;
      const tile = getTileType(rx, ry);
      const distToSpawn = Math.sqrt((rx - WORLD_SIZE/2)**2 + (ry - (WORLD_SIZE/2 + 8))**2);
      
      if (tile !== 'water' && distToSpawn > 3) {
        let type: EntityType = 'tree_oak';
        const rand = Math.random();
        if (rand > 0.8) type = 'deer';
        else if (rand > 0.6) type = 'rabbit';
        else if (rand > 0.4) type = 'rock_standard';
        else if (rand > 0.2) type = 'bush_berry';
        else type = 'tree_oak';

        newEnts.push({
          id: `ent-${spawned}-${Date.now()}`,
          x: rx, y: ry, type,
          health: 5, maxHealth: 5
        });
        spawned++;
      }
    }
    return newEnts;
  }, []);

  const triggerRest = useCallback(() => {
    if (isResting) return;

    const state = gameStateRef.current;
    if (!state) return;

    const nearbyTent = state.entities.find(e => 
      e.type === 'tent' && Math.sqrt((e.x - state.playerPos.x)**2 + (e.y - state.playerPos.y)**2) < 2.0
    );

    if (!nearbyTent) {
      showMessage('Need a tent to rest!', true);
      return;
    }

    setIsResting(true);
    SoundManager.playUI('click');
    showMessage('Resting in tent... Zzz', true);
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          health: Math.min(prev.playerStats.maxHealth, prev.playerStats.health + 25),
          hunger: Math.max(0, prev.playerStats.hunger - 10),
          thirst: Math.max(0, prev.playerStats.thirst - 10)
        }
      }));
      setIsResting(false);
    }, 2000);
  }, [isResting, showMessage]);

  const triggerDrink = useCallback(() => {
    SoundManager.playGather('bush_berry');
    showMessage('Drinking fresh water...', true);
    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        thirst: Math.min(prev.playerStats.maxThirst, prev.playerStats.thirst + 35)
      }
    }));
  }, [showMessage]);

  const executeInteraction = useCallback((entityId: string) => {
    setGameState(prev => {
      const target = prev.entities.find(e => e.id === entityId);
      if (!target) return prev;

      const dist = Math.sqrt((target.x - prev.playerPos.x)**2 + (target.y - prev.playerPos.y)**2);
      if (dist > 1.8) return prev;

      SoundManager.playGather(target.type);
      const updatedEntities = prev.entities.map(e => 
        e.id === target.id ? { ...e, health: e.health - 1 } : e
      ).filter(e => e.health > 0);

      let rewardId = 'berry';
      let qty = 1;

      if (target.type.includes('tree')) rewardId = 'wood';
      else if (target.type.includes('rock')) rewardId = 'stone';
      else if (target.type === 'deer' || target.type === 'bear') {
        rewardId = 'meat_raw';
        qty = target.type === 'bear' ? 3 : 2;
      } else if (target.type === 'rabbit') {
        rewardId = 'meat_raw';
        qty = 1;
      }
      
      const rewardItem = { ...ITEMS[rewardId], quantity: qty };
      const newInv = [...prev.inventory];
      const existingIdx = newInv.findIndex(i => i.id === rewardItem.id);
      if (existingIdx > -1) newInv[existingIdx].quantity += qty;
      else newInv.push(rewardItem);

      return {
        ...prev,
        entities: updatedEntities,
        inventory: newInv,
        playerStats: { ...prev.playerStats, lastInteractTime: Date.now() }
      };
    });
  }, []);

  const handleInteract = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;

    const nearest = state.entities.find(e => 
      Math.sqrt((e.x - state.playerPos.x)**2 + (e.y - state.playerPos.y)**2) < 1.5
    );
    if (nearest) {
      executeInteraction(nearest.id);
      return;
    } 

    let nearWater = false;
    for (let dx = -1.2; dx <= 1.2; dx += 0.4) {
      for (let dy = -1.2; dy <= 1.2; dy += 0.4) {
        if (getTileType(state.playerPos.x + dx, state.playerPos.y + dy) === 'water') {
          nearWater = true;
          break;
        }
      }
      if (nearWater) break;
    }

    if (nearWater) {
      triggerDrink();
      return;
    }

    triggerRest();
  }, [triggerRest, executeInteraction, triggerDrink]);

  const placeStructure = useCallback((item: Item) => {
    setGameState(prev => {
      const newEntity: Entity = {
        id: `struct-${Date.now()}`,
        x: prev.playerPos.x,
        y: prev.playerPos.y,
        type: item.id as EntityType,
        health: 10,
        maxHealth: 10
      };

      const newInv = prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);

      showMessage(`Placed: ${item.name}`, true);
      SoundManager.playUI('click');

      return {
        ...prev,
        inventory: newInv,
        entities: [...prev.entities, newEntity]
      };
    });
  }, [showMessage]);

  const handleZoom = useCallback((delta: number) => {
    setGameState(prev => ({
      ...prev,
      viewConfig: {
        ...prev.viewConfig,
        zoom: Math.max(0.4, Math.min(2.5, prev.viewConfig.zoom + delta))
      }
    }));
  }, []);

  const handleRotate = useCallback((delta: number) => {
    setGameState(prev => ({
      ...prev,
      viewConfig: {
        ...prev.viewConfig,
        rotation: (prev.viewConfig.rotation + delta + 360) % 360
      }
    }));
  }, []);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const state = gameStateRef.current;
    if (!state) return null;

    const { zoom, rotation, cameraOffsetX, cameraOffsetY } = state.viewConfig;
    const tw = TILE_WIDTH * zoom;
    const th = TILE_HEIGHT * zoom;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const getTransformed = (wx: number, wy: number, rot: number) => {
      if (rot === 90) return { tx: wy, ty: WORLD_SIZE - 1 - wx };
      if (rot === 180) return { tx: WORLD_SIZE - 1 - wx, ty: WORLD_SIZE - 1 - wy };
      if (rot === 270) return { tx: WORLD_SIZE - 1 - wy, ty: wx };
      return { tx: wx, ty: wy };
    };

    const pTrans = getTransformed(state.playerPos.x, state.playerPos.y, rotation);
    const pScreenX = pTrans.tx * tw;
    const pScreenY = pTrans.ty * th;

    const offsetX = centerX - (pScreenX + tw/2) + cameraOffsetX;
    const offsetY = centerY - (pScreenY + th/2) + cameraOffsetY;

    const tx = (sx - offsetX) / tw;
    const ty = (sy - offsetY) / th;

    let wx = 0, wy = 0;
    if (rotation === 0) { wx = tx; wy = ty; }
    else if (rotation === 90) { wx = WORLD_SIZE - 1 - ty; wy = tx; }
    else if (rotation === 180) { wx = WORLD_SIZE - 1 - tx; wy = WORLD_SIZE - 1 - wy; }
    else if (rotation === 270) { wx = ty; wy = WORLD_SIZE - 1 - tx; }

    return { x: wx, y: wy };
  }, []);

  const update = useCallback((time: number) => {
    const dt = (time - lastUpdate.current) / 1000;
    lastUpdate.current = time;

    if (!gameStateRef.current.gameStarted) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const { inventoryOpen, craftingOpen, settingsOpen } = uiState;
    const isPaused = isResting || inventoryOpen || craftingOpen || settingsOpen;

    let dx = 0, dy = 0;
    
    if (!isPaused) {
      if (activeKeys.current.has('w')) dy -= 1;
      if (activeKeys.current.has('s')) dy += 1;
      if (activeKeys.current.has('a')) dx -= 1;
      if (activeKeys.current.has('d')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        mouseTargetPos.current = null;
        targetEntityId.current = null;
      } else if (mouseTargetPos.current) {
        const currentPos = gameStateRef.current.playerPos;
        const dist = Math.sqrt((mouseTargetPos.current.x - currentPos.x)**2 + (mouseTargetPos.current.y - currentPos.y)**2);
        const stopDist = targetEntityId.current ? 1.2 : 0.15;

        if (dist > stopDist) {
          dx = (mouseTargetPos.current.x - currentPos.x) / dist;
          dy = (mouseTargetPos.current.y - currentPos.y) / dist;
        } else {
          if (targetEntityId.current) {
            executeInteraction(targetEntityId.current);
            targetEntityId.current = null;
          }
          mouseTargetPos.current = null;
        }
      }
    }

    const accel = 35;
    const friction = 14;
    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx*dx + dy*dy);
      velocity.current.x += (dx / mag) * accel * dt;
      velocity.current.y += (dy / mag) * accel * dt;
    }

    velocity.current.x *= Math.max(0, 1 - friction * dt);
    velocity.current.y *= Math.max(0, 1 - friction * dt);

    const speed = Math.sqrt(velocity.current.x**2 + velocity.current.y**2);
    
    setGameState(prev => {
      if (isPaused) return { ...prev, time: (prev.time + 0.1) % 2400 };

      const nextX = prev.playerPos.x + velocity.current.x * dt;
      const nextY = prev.playerPos.y + velocity.current.y * dt;

      const tile = getTileType(nextX, nextY);
      const isBlocked = tile === 'water' || prev.entities.some(e => 
        !['rabbit', 'scorpion', 'road', 'bridge'].includes(e.type) && Math.sqrt((e.x - nextX)**2 + (e.y - nextY)**2) < 0.6
      );

      let facing = prev.playerStats.facing;
      if (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.y) > 0.1) {
        if (velocity.current.x > 0 && velocity.current.y > 0) facing = 'se';
        else if (velocity.current.x < 0 && velocity.current.y > 0) facing = 'sw';
        else if (velocity.current.x > 0 && velocity.current.y < 0) facing = 'ne';
        else if (velocity.current.x < 0 && velocity.current.y < 0) facing = 'nw';
      }

      return {
        ...prev,
        playerPos: isBlocked ? prev.playerPos : { x: nextX, y: nextY },
        playerStats: {
          ...prev.playerStats,
          isWalking: speed > 0.5,
          facing,
          hunger: Math.max(0, prev.playerStats.hunger - 0.0015),
          thirst: Math.max(0, prev.playerStats.thirst - 0.0025)
        },
        time: (prev.time + 0.1) % 2400
      };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [isResting, uiState, executeInteraction, triggerRest, triggerDrink]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      activeKeys.current.add(key);
      if (key === 'f') setUiState(prev => ({ ...prev, inventoryOpen: !prev.inventoryOpen, craftingOpen: false, settingsOpen: false }));
      if (key === 'c') setUiState(prev => ({ ...prev, craftingOpen: !prev.craftingOpen, inventoryOpen: false, settingsOpen: false }));
      if (key === 'e') handleInteract();
      if (key === 'escape') {
        setUiState(prev => {
          if (prev.craftingOpen || prev.inventoryOpen || prev.settingsOpen) {
            return { ...prev, craftingOpen: false, inventoryOpen: false, settingsOpen: false };
          } else {
            // If no menus open, return to main menu
            setGameState(g => ({ ...g, gameStarted: false }));
            return prev;
          }
        });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => activeKeys.current.delete(e.key.toLowerCase());
    
    const handleWheel = (e: WheelEvent) => {
      handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const isPaused = isResting || uiState.inventoryOpen || uiState.craftingOpen || uiState.settingsOpen;
      
      if (e.button === 2 || e.button === 1) {
        isPanning.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      } else if (e.button === 0 && !isPaused) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        if (worldPos) {
          const clickedEntity = gameStateRef.current?.entities.find(ent => 
            Math.sqrt((ent.x - worldPos.x)**2 + (ent.y - worldPos.y)**2) < 0.8
          );
          if (clickedEntity) {
            targetEntityId.current = clickedEntity.id;
            mouseTargetPos.current = { x: clickedEntity.x, y: clickedEntity.y };
          } else {
            targetEntityId.current = null;
            mouseTargetPos.current = worldPos;
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setGameState(prev => ({
          ...prev,
          viewConfig: {
            ...prev.viewConfig,
            cameraOffsetX: prev.viewConfig.cameraOffsetX + dx,
            cameraOffsetY: prev.viewConfig.cameraOffsetY + dy
          }
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) isPanning.current = false;
    };

    const handleContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleInteract, handleZoom, screenToWorld, uiState, isResting]);

  const handleHUDAction = useCallback((action: 'use' | 'reorder' | 'equip', data: any) => {
    if (action === 'use') {
       const item = data as Item;
       if (item.type === 'food') {
          setGameState(prev => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              hunger: Math.min(100, prev.playerStats.hunger + (item.effect?.hunger || 0)),
              thirst: Math.min(100, prev.playerStats.thirst + (item.effect?.thirst || 0)),
              health: Math.min(prev.playerStats.maxHealth, prev.playerStats.health + (item.effect?.health || 0))
            },
            inventory: prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0)
          }));
          SoundManager.playGather('bush_berry');
       } else if (item.type === 'structure') {
          placeStructure(item);
       } else if (item.type === 'tool') {
          setGameState(prev => ({
            ...prev,
            playerStats: { ...prev.playerStats, equippedItemId: prev.playerStats.equippedItemId === item.id ? null : item.id }
          }));
          SoundManager.playUI('click');
       }
    } else if (action === 'equip') {
      setGameState(prev => ({
        ...prev,
        playerStats: { ...prev.playerStats, equippedItemId: (data as Item).id }
      }));
      SoundManager.playUI('click');
    } else if (action === 'reorder') {
      setGameState(prev => {
        const { fromIdx, toIdx } = data;
        const ni = [...prev.inventory];
        const it = ni[fromIdx];
        ni.splice(fromIdx, 1);
        ni.splice(toIdx, 0, it);
        return { ...prev, inventory: ni };
      });
    }
  }, [placeStructure]);

  if (!gameState.gameStarted) {
    return (
      <MainMenu 
        hasActiveSession={gameState.inventory.length > 0 || gameState.entities.length > 0}
        onStart={() => {
          SoundManager.init();
          SoundManager.startForestAmbience();
          setGameState(prev => ({ 
            ...prev, 
            gameStarted: true,
            entities: prev.entities.length === 0 ? spawnEntities(120) : prev.entities
          }));
        }}
        onContinue={() => {
          SoundManager.init();
          SoundManager.startForestAmbience();
          setGameState(prev => ({ ...prev, gameStarted: true }));
        }}
        settings={gameState.settings}
        onUpdateSettings={s => setGameState(prev => ({ ...prev, settings: s }))}
        playerStats={gameState.playerStats}
        onUpdatePlayerStats={ps => setGameState(prev => ({ ...prev, playerStats: ps }))}
      />
    );
  }

  const isNearWorkbench = !!gameState.entities.find(e => e.type === 'workbench' && Math.sqrt((e.x - gameState.playerPos.x)**2 + (e.y - gameState.playerPos.y)**2) < 2.5);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950">
      <GameCanvas gameState={gameState} gameStateRef={gameStateRef} mouseTargetRef={mouseTargetPos} />
      
      {isResting && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
          <div className="text-white font-black text-4xl animate-pulse flex flex-col items-center">
            <span>💤</span>
            <span className="text-sm mt-2 opacity-50 tracking-[0.3em] uppercase">Resting in tent</span>
          </div>
        </div>
      )}

      <HUD 
        stats={gameState.playerStats}
        time={gameState.time}
        message={uiState.message}
        gameState={gameState}
        onAction={handleHUDAction}
        onZoom={handleZoom}
        onRotate={handleRotate}
        onOpenSettings={() => setUiState(s => ({ ...s, settingsOpen: true, inventoryOpen: false, craftingOpen: false }))}
      />
      
      {uiState.inventoryOpen && (
        <Inventory 
          items={gameState.inventory}
          equippedItemId={gameState.playerStats.equippedItemId}
          onAction={handleHUDAction}
          onClose={() => setUiState(s => ({...s, inventoryOpen: false}))}
          language={gameState.settings.language}
        />
      )}
      
      {uiState.craftingOpen && (
        <Crafting 
          inventory={gameState.inventory}
          playerLevel={gameState.playerStats.level}
          isNearWorkbench={isNearWorkbench}
          onCraft={(recipeId) => {
            const recipe = RECIPES.find(r => r.id === recipeId);
            if (!recipe) return;
            
            setGameState(prev => {
               const canCraft = Object.entries(recipe.ingredients).every(([id, qty]) => {
                  const item = prev.inventory.find(i => i.id === id);
                  return item && item.quantity >= (qty as number);
               });
               
               if (!canCraft) return prev;
               
               let ni = [...prev.inventory];
               Object.entries(recipe.ingredients).forEach(([id, qty]) => {
                  const idx = ni.findIndex(i => i.id === id);
                  if (idx > -1) {
                    ni[idx].quantity -= (qty as number);
                    if (ni[idx].quantity <= 0) ni.splice(idx, 1);
                  }
               });
               
               const existingIdx = ni.findIndex(i => i.id === recipe.output.id);
               if (existingIdx > -1) ni[existingIdx].quantity += recipe.output.quantity;
               else ni.push({ ...recipe.output });
               
               SoundManager.playUI('fanfare');
               showMessage('Crafted: ' + recipe.name, true);
               
               return { ...prev, inventory: ni };
            });
          }}
          onClose={() => setUiState(s => ({...s, craftingOpen: false}))}
          language={gameState.settings.language}
        />
      )}
      
      {uiState.settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-3xl font-black mb-8 tracking-tighter text-amber-500 uppercase">{t('settings')}</h2>
              <div className="space-y-6 text-white">
                <div className="flex flex-col gap-3">
                   <span className="text-[11px] font-black tracking-widest text-white/40 uppercase">{t('language')}</span>
                   <div className="grid grid-cols-2 gap-3">
                      {(['en', 'tr'] as Language[]).map(l => (
                        <button key={l} onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, language: l}}))} className={`py-3.5 rounded-xl font-black text-[11px] uppercase border transition-all ${gameState.settings.language === l ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-white/5 border-white/10 text-white/50'}`}>{l === 'en' ? 'English' : 'Türkçe'}</button>
                      ))}
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                   <span className="text-[11px] font-black tracking-widest text-white/40 uppercase">{t('sound')}</span>
                   <button onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, soundEnabled: !prev.settings.soundEnabled}}))} className={`py-3.5 rounded-xl font-black text-[11px] uppercase border transition-all ${gameState.settings.soundEnabled ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-white/5 border-white/10 text-white/50'}`}>{gameState.settings.soundEnabled ? 'ON' : 'OFF'}</button>
                </div>
              </div>
              <button onClick={() => setUiState(s => ({...s, settingsOpen: false}))} className="w-full py-4 mt-10 bg-white text-stone-950 font-black rounded-xl uppercase tracking-widest text-[11px] hover:bg-amber-500 transition-colors">{t('back')}</button>
           </div>
        </div>
      )}
      
      {isMobile && <MobileControls onMove={(dx, dy) => {
        velocity.current.x = dx * 10;
        velocity.current.y = dy * 10;
        mouseTargetPos.current = null;
      }} onInteractStart={handleInteract} onInteractEnd={() => {}} />}
    </div>
  );
};

export default App;
