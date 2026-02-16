
# Ember's Edge: Game Design Document (GDD)

## 1. Project Overview
**Title:** Ember's Edge
**Genre:** 2.5D Isometric Survival RPG
**Tech Stack:** React 19, TypeScript, HTML5 Canvas (Mutable State Architecture)

## 2. Technical Architecture
To ensure high performance (60 FPS) on the web:
*   **State Management:** The core game loop uses a `useRef` object (`engineRef`) as the single source of truth, bypassing React's render cycle for physics and AI.
*   **Rendering:** Double-buffered rendering via `requestAnimationFrame`.
    *   **Sprite Cache:** Entities are pre-rendered to offscreen canvases.
    *   **View Culling:** Only visible tiles/entities are drawn.
*   **Physics:** Spatial Hash Grid (`Map<"x,y", EntityID>`) for O(1) collision detection.

## 3. Development Roadmap

### ✅ Phase 1: Persistence & Session Management
*   **Objective:** Allow players to save their progress and resume later.
*   **Tasks:**
    *   [x] Implement `localStorage` serialization for Game State (Stats, Inventory, Entities, World).
    *   [x] Add Auto-save mechanism (every 30s).
    *   [x] Rehydrate state on application load.

### ✅ Phase 2: Advanced Combat & AI
*   **Objective:** Deepen the survival challenge.
*   **Tasks:**
    *   [x] **Projectile System:** Implement Bow & Arrow physics with trajectories.
    *   [x] **Aggressive AI:** Hostile mobs (Scorpions, Bears) should chase players who get too close.
    *   [x] **Hit Feedback:** Visual flash or floating numbers when damage is dealt.

### ✅ Phase 3: World Expansion
*   **Objective:** Make the world feel alive.
*   **Tasks:**
    *   [x] **Dynamic Weather Effects:** Rain puddles, snow accumulation.
    *   [x] **Particle System 2.0:** Blood splatters, footstep dust, leaf particles.

### ✅ Phase 4: Building & Placement System
*   **Objective:** Allow players to shape the world.
*   **Tasks:**
    *   [x] **Placement Logic:** placement state, grid snapping, collision checks.
    *   [x] **Ghost Rendering:** Visual preview of structure before placing.
    *   [x] **Structure Integration:** Spawning entities from inventory items.

### ✅ Phase 5: Progression & Biomes
*   **Objective:** Long-term goals and environmental variety.
*   **Tasks:**
    *   [x] **XP & Leveling System:** XP curves, Level Up events, Stat boosts.
    *   [x] **Biome Generation:** Procedural Snow, Desert, and Forest zones based on Temp/Moisture.
    *   [x] **Infinite Chunking:** Move from 100x100 static world to scrolling chunks.

### ✅ Phase 6: Dynamic Lighting & Atmosphere
*   **Objective:** Enhance immersion and visual fidelity.
*   **Tasks:**
    *   [x] **Lighting Engine:** Lightmask system for realistic day/night cycles.
    *   [x] **Dynamic Light Sources:** Campfires and Player Lanterns that cut through darkness.
    *   [x] **Environmental Particles:** Smoke from fires, fireflies at night.

### ✅ Phase 7: Storage & Looting
*   **Objective:** Inventory management depth.
*   **Tasks:**
    *   [x] **Storage Chests:** Craftable containers to store excess items.
    *   [x] **Loot Bags:** Mobs drop interactive bags instead of instant items.
    *   [x] **Interaction System:** 'E' to open containers/loot.

### ⏳ Phase 8: Agriculture (Current Step)
*   **Objective:** Sustainable food sources.
*   **Tasks:**
    *   [x] **Farming Tools:** Hoe for tilling soil.
    *   [x] **Planting System:** Seeds, growth stages, and harvesting.
    *   [x] **Farm Plots:** Entities that change state over time.

## 4. Data Structures (Save Schema)
The `SAVE_KEY` in localStorage stores:
```json
{
  "playerPos": { "x": 50, "y": 50 },
  "playerStats": { ... },
  "inventory": [ ... ],
  "entities": [ ... ],
  "chunks": { "0,0": [...], ... },
  "time": 600,
  "seed": 123456
}
```
*Note: `collisionGrid` is transient and rebuilt on load.*
