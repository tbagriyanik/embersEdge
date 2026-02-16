
# Ember's Edge: Optimization & Modernization Plan

## 1. Core Architecture Refactor (Performance Critical)
**Goal:** Achieve stable 60+ FPS with 5,000+ entities.
*   **Problem:** Currently, `gameState` is held in React `useState`. Every movement updates state, triggering a full React Tree Reconciliation (Re-render) 60 times a second. This is the primary bottleneck.
*   **Solution:** Move the "Game Engine" state into a `useRef` object (Mutable State).
    *   The `GameCanvas` reads directly from the `ref` in its own animation loop.
    *   The `HUD` and UI components sync with the `ref` via a throttled subscription (e.g., update UI only 30 times a second, or only on events).
    *   **Benefit:** Zero React overhead during the physics/render frame.

## 2. Graphics Pipeline Optimization
**Goal:** Reduce draw calls and CPU usage during rendering.
*   **Sprite Caching:** Currently, the game draws Emojis using `ctx.fillText`. Browsers are slow at rasterizing text every frame.
    *   *Fix:* Create an offscreen canvas cache. Render every entity type (Tree, Rock, Player) to a small image once at startup. Use `ctx.drawImage` in the loop.
*   **View Frustum Culling:**
    *   *Fix:* Only iterate and render entities that are actually inside the camera's viewport (plus a small buffer).
*   **World Map Caching:**
    *   *Fix:* Instead of calculating Perlin noise (`getTileType`) for every tile every frame, generate the world into a `TileType[][]` array once on startup.

## 3. Gameplay Fluidity
**Goal:** Make movement feel weightier and more responsive.
*   **Inertia-based Movement:** Replace instant velocity changes with acceleration and friction logic.
*   **Spatial Hashing:**
    *   *Fix:* Collision detection currently loops through all entities ($O(N)$). Implement a `Map<"x,y", EntityId>` for $O(1)$ collision lookups.
*   **Camera Smoothing:** Implement a Linear Interpolation (Lerp) for the camera to follow the player smoothly.

## 4. Modern UI/UX
**Goal:** "Glassmorphism" aesthetic with high readability.
*   **Visuals:** Use `backdrop-filter: blur()`, semi-transparent backgrounds, and subtle borders.
*   **Feedback:** Add floating text for damage/healing.
*   **Minimap:** Optimize minimap to use the cached World Map instead of recalculating noise.

---

## Execution Checklist

- [ ] **Step 1 (Engine):** Refactor `App.tsx` to use `useRef` for physics state.
- [ ] **Step 2 (Rendering):** Implement `SpriteCache` in `GameCanvas.tsx`.
- [ ] **Step 3 (World):** Implement `WorldCache` and `SpatialHash` in `App.tsx`.
- [ ] **Step 4 (UI):** Update `HUD` to read from throttled state.
