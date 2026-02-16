# Asteroids Game Implementation Plan

**Goal:** Build a browser-based Asteroids clone using Phaser 3 + TypeScript + Vite, with vector-style graphics and clean extensible architecture.

**Architecture:** Scene-based with game object classes. Four scenes (Boot, Menu, Game, GameOver) orchestrate gameplay. Three entity classes (Ship, Asteroid, Bullet) extend Phaser.GameObjects.Container and own their own behavior. Manual velocity physics for movement, Phaser physics only for collision detection.

**Tech Stack:** Phaser 3.90, TypeScript 5, Vite 6, Vitest for unit testing

**Testing strategy:** Game logic (vector math, screen wrapping, config) is extracted into pure functions and unit tested with Vitest. Visual rendering and scene integration are verified manually in the browser. We do NOT mock Phaser objects — we isolate logic away from Phaser instead.

**Reference:** See `docs/plans/2026-02-16-asteroids-game-design.md` for full design rationale.

**How to use this plan:** You drive the implementation. Write the code yourself, consulting Phaser docs and this plan for guidance. Ask Claude to:
- Write/generate tests for you when you've finished a piece of code
- Code review your work at the end of each task
- Explain any concept you're not 100% clear on
- Help debug if something isn't working

---

## Task 1: Project Scaffolding

**Goal:** Get a working Phaser 3 + TypeScript + Vite dev environment showing something on screen.

**What you'll do:**
1. Run `npm init -y` to create package.json
2. Install dependencies: `npm install phaser@3` and `npm install -D typescript vite vitest @vitest/ui`
3. Create `tsconfig.json`, `vite.config.ts`, `index.html`, and `src/main.ts`
4. Add npm scripts: `dev`, `build`, `test`, `test:ui`

**Key concepts to understand:**
- **`tsconfig.json`** — tells TypeScript how to compile. Key settings: `"moduleResolution": "bundler"` (lets Vite handle module resolution), `"strict": true` (catches more bugs at compile time), `"lib": ["ESNext", "DOM"]` (gives you browser APIs + modern JS).
- **`vite.config.ts`** — Vite config. The `/// <reference types="vitest" />` at the top is a TypeScript "triple-slash directive" that adds Vitest's types so the `test` field is recognized in Vite's config. Without it, TypeScript would error on the `test` property.
- **`index.html`** — Vite uses this as the entry point (not a JS file like Webpack). The `<script type="module">` tag tells the browser to load your TS as an ES module — Vite transpiles it on the fly during dev.
- **`Phaser.Game` config** — `type: Phaser.AUTO` lets Phaser choose WebGL or Canvas (prefers WebGL). `parent: 'game'` mounts the canvas inside that DOM element. The `scene` array determines which scenes exist and which loads first.

**Verify:** Run `npm run dev`, open http://localhost:8080. You should see a black screen with "Phaser is working!" text. If you see this, Phaser, Vite, and TypeScript are all wired up correctly.

**Commit** when it works.

---

## Task 2: Game Config & Constants

**Goal:** Create a central config file for all tunable game values. This prevents magic numbers scattered through your code and makes tuning gameplay easy.

**What you'll do:**
1. Create `src/config.ts` with exported `const` objects for: `GAME` (dimensions, lives, initial asteroid count), `SHIP` (thrust, speed, rotation, size, invincibility, fire rate), `ASTEROID` (per-size radius, speed range, vertex count, jaggedness), `BULLET` (speed, lifespan, size), `SCORE` (points per asteroid size).
2. Use `as const` on each object — this is a TypeScript feature that makes all properties `readonly` and narrows their types to literal values (e.g., `WIDTH` becomes type `800` not `number`).

**Values to use (you'll tune these later by playing):**
- Screen: 800x600, 3 lives, 4 initial asteroids
- Ship: 200 thrust (px/s²), 400 max speed (px/s), 200 rotation (deg/s), 20 radius, 2000ms invincibility, 250ms fire rate
- Asteroids: Large (40r, 30-80 speed, 10 verts), Medium (25r, 50-120, 8 verts), Small (12r, 80-180, 6 verts), all 0.4 jaggedness
- Bullet: 500 speed, 1000ms lifespan, 2 radius
- Score: Large=20, Medium=50, Small=100 (smaller = harder to hit = more points)

**Ask Claude** to generate the config tests when you're done writing `config.ts`. Tests should verify the relationships (e.g., smaller asteroids are faster, score increases as size decreases).

**Commit** when tests pass.

---

## Task 3: Math Utilities

**Goal:** Build pure functions for 2D vector math and screen wrapping. These are the mathematical foundations of the game and the most testable code in the project.

**What you'll write in `src/utils/math.ts`:**

1. **`Vec2` interface** — `{ x: number; y: number }`. A simple 2D vector type used throughout.

2. **`wrapPosition(x, y, margin) → Vec2`** — Screen wrapping. If x goes past `GAME.WIDTH + margin`, set it to `-margin` (reappear on left). Same for all 4 edges. The `margin` is typically the object's radius so it fully disappears before reappearing.

3. **`velocityFromAngle(angleDeg, speed) → { vx, vy }`** — Converts an angle + speed into x/y velocity components. This is basic trigonometry: `vx = cos(angle) * speed`, `vy = sin(angle) * speed`. **Important:** Phaser uses degrees for angles but trig functions use radians, so you need to convert: `rad = deg * Math.PI / 180`. Also, 0° points right and 90° points down (standard screen coordinates, y increases downward).

4. **`clampMagnitude(vx, vy, max) → { vx, vy }`** — Limits a velocity vector's magnitude (length) without changing its direction. Calculate magnitude with Pythagorean theorem: `mag = √(vx² + vy²)`. If `mag > max`, scale both components by `max / mag`. This enforces max speed on the ship.

5. **`randomBetween(min, max) → number`** — Random float in range. Simple: `min + Math.random() * (max - min)`.

6. **`generateAsteroidVertices(radius, numVertices, jaggedness) → Vec2[]`** — Creates a jagged polygon. Distribute `numVertices` points evenly around a circle (angle step = 2π / n), then offset each point's distance from center by a random amount (`radius * (1 + random * jaggedness)`). This gives each asteroid a unique rocky shape.

**Ask Claude** to generate the math tests when you're done. Tests should cover edge cases for wrapping, known angles for velocity (0°, 90°), clamping behavior, and vertex generation.

**Commit** when tests pass.

---

## Task 4: Scene Skeleton — Boot, Menu, GameOver

**Goal:** Set up the three simpler scenes and wire up the scene flow. After this you'll have a working navigation loop (minus the actual game).

**What you'll write:**

**`src/scenes/BootScene.ts`** — Extends `Phaser.Scene`. Constructor calls `super({ key: 'Boot' })` — the key string is how scenes reference each other. Its `create()` method just calls `this.scene.start('Menu')` to immediately transition.

**`src/scenes/MenuScene.ts`** — Displays title text and "press ENTER to start" using `this.add.text()`. Listens for ENTER with `this.input.keyboard!.once('keydown-ENTER', callback)`. The `once` means it only fires one time (prevents double-starts). The `!` is TypeScript's non-null assertion — `keyboard` could theoretically be null if no keyboard exists, but we know it won't be.

**`src/scenes/GameOverScene.ts`** — Receives score data via the `create(data)` parameter. When one scene does `this.scene.start('GameOver', { score: 500 })`, the target scene's `create` receives that object. Displays the score and listens for ENTER to go back to Menu.

**`src/main.ts`** — Update to import all three scenes and list them in the `scene` array of the game config. Also add the physics config here: `physics: { default: 'arcade', arcade: { debug: false } }`. The arcade physics system is Phaser's simplest — axis-aligned bounding boxes and circles. We need it for collision detection later. Set `debug: true` temporarily if you ever want to see the collision bodies drawn on screen.

**Key concept — Phaser Scene lifecycle:**
- `constructor()` → runs once when scene class is instantiated
- `preload()` → load assets (images, audio) — we skip this since we draw everything
- `create()` → runs each time the scene starts — set up game objects here
- `update(time, delta)` → runs every frame (~60fps) — game loop goes here

**Verify:** `npm run dev` → see "ASTEROIDS" title screen. Pressing Enter will error (GameScene doesn't exist yet) — that's expected.

**Commit** when the menu displays correctly.

---

## Task 5: Ship Entity

**Goal:** Build the player ship with manual thrust-based physics and vector-style rendering.

**What you'll write in `src/entities/Ship.ts`:**

A class extending `Phaser.GameObjects.Container`. A Container is a game object that can hold other game objects as children. When you move/rotate the Container, all children move/rotate with it. This is perfect for entities: draw the shape at local origin (0,0), then position the Container wherever you want on screen.

**Properties you'll need:**
- `velocityX`, `velocityY` (public — GameScene reads these for bullet spawning)
- `isInvincible` (public — GameScene checks this for collision)
- `graphics` — a `Phaser.GameObjects.Graphics` child for the ship shape
- `thrustGraphics` — separate Graphics child for the thrust flame (so you can toggle it)
- `lastFireTime` — tracks fire rate limiting

**Constructor pattern** (this repeats for all entities):
```
1. super(scene, x, y)           — initialize Container at position
2. Create Graphics, add as child — draw the visual shape
3. Enable physics on Container   — scene.physics.world.enable(this)
4. Configure physics body         — setCircle for collision detection
5. Add self to scene              — scene.add.existing(this)
```

**Drawing the ship** — Use the Graphics API: `g.lineStyle(width, color, alpha)` sets pen style, then `g.beginPath()`, `g.moveTo()`, `g.lineTo()`, `g.closePath()`, `g.strokePath()` draw a polygon. The ship is 4 points: nose at (size, 0), two wings at (-size, ±size*0.7), and a rear indent at (-size*0.6, 0). For the glow effect, draw the same shape twice — first with a wider, semi-transparent blue stroke, then with a thin white stroke on top.

**The thrust flame** — A small V-shape behind the ship. Draw it on separate Graphics so you can show/hide it with `setVisible()` based on whether the player is pressing up.

**The `update(delta, cursors)` method** — This is the heart of the ship's physics. Called every frame by GameScene:
1. **Rotation:** If left/right arrow down, adjust `this.angle` by `ROTATION_SPEED * dt`. `dt = delta / 1000` converts milliseconds to seconds. Multiplying by dt makes movement frame-rate independent — the ship rotates the same speed whether the game runs at 30fps or 144fps.
2. **Thrust:** If up arrow down, convert the ship's current angle to a velocity vector using `velocityFromAngle`, scale by `THRUST * dt`, and add to current velocity. Then clamp to MAX_SPEED. This creates the classic Asteroids "drift" — you accelerate in one direction, then if you rotate and thrust another way, your trajectory curves.
3. **Position:** Add `velocity * dt` to position.
4. **Wrap:** Call `wrapPosition` to handle screen edges.

**Other methods:**
- `canFire(time)` / `recordFire(time)` — fire rate limiting using timestamp comparison
- `makeInvincible()` — sets flag, creates a flicker effect using `scene.time.addEvent` (a repeating timer that toggles alpha), and a delayed call to end invincibility
- `reset(x, y)` — for respawning: reposition, zero velocity, point up, trigger invincibility
- `cleanup()` — destroy timers (prevents errors when scene transitions)

**Physics body:** `body.setCircle(SHIP.SIZE, -SHIP.SIZE, -SHIP.SIZE)` — the two negative offsets center the circle on the Container's origin. Without them, the circle would be offset to the bottom-right.

**You cannot visually test this yet** — it needs GameScene (Task 8). But you can ask Claude to review the code for correctness.

**Commit** when you're satisfied with the code.

---

## Task 6: Asteroid Entity

**Goal:** Build asteroids with randomized shapes, three sizes, and the split-on-destroy mechanic.

**What you'll write in `src/entities/Asteroid.ts`:**

Same Container pattern as Ship. Key differences:

**Size system:** Define `AsteroidSize = 'LARGE' | 'MEDIUM' | 'SMALL'` (a TypeScript union type — the value can only be one of these three strings). Create a `SIZE_CONFIG` lookup object mapping each size to its config values from `config.ts`. The constructor takes a `size` parameter and looks up its config.

**Random velocity:** Constructor accepts optional `velocityX`/`velocityY`. If not provided, generates a random direction and speed within the size's range. The optional params are for when asteroids split — the parent provides specific velocities to the children.

**Drawing:** Same Graphics pattern as Ship. Use `generateAsteroidVertices` to create a unique jagged polygon, then draw it with `moveTo` to the first vertex and `lineTo` for the rest, with `closePath` to connect back to the start. Double-stroke for glow (wide blue under thin white).

**`getChildSize()`** — Returns the next size down, or `null` if smallest. This is called by GameScene when splitting. Using a switch statement on the size enum is clean and explicit.

**Update** is simple — apply velocity, wrap position. Asteroids don't rotate or accelerate (you could add slow rotation later as a visual enhancement).

**Commit.**

---

## Task 7: Bullet Entity

**Goal:** Build the simplest entity — a projectile with a lifespan.

**What you'll write in `src/entities/Bullet.ts`:**

Same Container pattern. Constructor takes `velocityX`/`velocityY` directly (calculated by GameScene from the ship's angle and velocity). No random behavior.

**Key design:** `update(delta)` returns a `boolean` — `true` if alive, `false` if lifespan expired. This lets GameScene iterate bullets and destroy dead ones in a clean pattern:
```typescript
for (let i = bullets.length - 1; i >= 0; i--) {
  if (!bullets[i].update(delta)) {
    bullets[i].destroy();
    bullets.splice(i, 1);
  }
}
```
The reverse iteration (`i--`) is important — if you iterate forward and remove items, you skip elements because indices shift.

**Drawing:** Just a small filled circle. `g.fillStyle(color, alpha)` then `g.fillCircle(0, 0, radius)`.

**Commit.**

---

## Task 8: GameScene — Core Gameplay Loop

**Goal:** Wire everything together into a playable game. This is the largest and most important task.

**What you'll write in `src/scenes/GameScene.ts`:**

**Properties:**
- `ship`, `asteroids[]`, `bullets[]` — entity references
- `cursors`, `fireKey` — input references
- `score`, `lives`, `wave`, `isRespawning` — game state
- `scoreText`, `livesText` — HUD text objects

**`create()` — Scene setup:**
1. Reset all state (important — `create` runs every time you start a new game)
2. Set up input: `this.input.keyboard!.createCursorKeys()` returns an object with `up`, `down`, `left`, `right`, `space`, `shift` keys. We also register space separately for firing.
3. Create Ship at screen center, pointing up (`setAngle(-90)` because 0° is rightward)
4. Create HUD text
5. Call `spawnWave()` to create initial asteroids

**`update(time, delta)` — The game loop:** Phaser calls this every frame. `time` is total elapsed ms since game start, `delta` is ms since last frame (~16.7ms at 60fps).
1. If not respawning: update ship, check fire input
2. Update all bullets (remove dead ones)
3. Update all asteroids
4. Check collisions
5. If no asteroids remain, increment wave and spawn more

**`fireBullet(time)` — Spawning bullets:**
- Calculate bullet velocity from ship's angle using `velocityFromAngle`
- Add ship's current velocity to bullet velocity (so bullets feel natural when moving)
- Spawn at ship's nose (offset from center by ship's size in the facing direction)

**`spawnWave()` — Wave generation:**
- Number of asteroids = `INITIAL_ASTEROIDS + (wave - 1)`
- Each spawns at a random screen edge, with minimum distance from ship

**`checkBulletAsteroidCollisions()` — Nested loop collision:**
- `this.physics.overlap(objA, objB)` returns true if their physics bodies overlap
- On hit: add score, split asteroid, destroy bullet
- Iterate both arrays in reverse to safely remove elements

**`splitAsteroid(asteroid, index)`:**
- Get child size from asteroid
- If not null: spawn 2 children at same position with random velocities
- Remove original from array and destroy

**`onShipHit()`:**
- Decrement lives, update HUD
- If lives = 0: transition to GameOver with score
- Otherwise: hide ship, set respawning flag, delayed call to respawn with invincibility

**Update `src/main.ts`:** Import GameScene, add it to the scene array.

**Verify:** This is the big payoff. Run `npm run dev` and play the game. Test every mechanic from the checklist below.

**Commit.**

---

## Task 9: Verification & Polish

**Run all tests:** `npx vitest run` — everything should pass.

**Full playtest checklist:**
- [ ] Menu → Game transition works
- [ ] Ship rotates with left/right arrows
- [ ] Ship thrusts with up arrow (flame visible)
- [ ] Ship drifts when not thrusting (no friction)
- [ ] Screen wrapping works for ship, asteroids, and bullets
- [ ] Space fires bullets from ship's nose
- [ ] Fire rate limiting works (can't machine-gun)
- [ ] Bullets inherit ship's velocity
- [ ] Bullets disappear after ~1 second
- [ ] Bullets destroy asteroids on contact
- [ ] Large asteroids split into 2 medium
- [ ] Medium asteroids split into 2 small
- [ ] Small asteroids just disappear
- [ ] Score updates correctly (20/50/100)
- [ ] Ship dies on asteroid contact
- [ ] Lives decrement, HUD updates
- [ ] Ship respawns at center with invincibility flicker
- [ ] Can't die during invincibility
- [ ] Game over when lives = 0
- [ ] Game over shows final score
- [ ] Can restart from game over
- [ ] Clearing all asteroids spawns a new wave with more asteroids
- [ ] Vector glow effect visible on ship and asteroids

**Ask Claude** to code review your complete codebase at this point. Good things to check: are there any cleanup issues (memory leaks from timers/events), is the code organized clearly, are there any Phaser best practices you missed.

**Commit** any fixes.

---

## Phaser Docs to Bookmark

These are the Phaser 3 API pages most relevant to what you're building:
- [Phaser.Scene](https://newdocs.phaser.io/docs/3.80.0/Phaser.Scene) — scene lifecycle
- [Phaser.GameObjects.Container](https://newdocs.phaser.io/docs/3.80.0/Phaser.GameObjects.Container) — entity base class
- [Phaser.GameObjects.Graphics](https://newdocs.phaser.io/docs/3.80.0/Phaser.GameObjects.Graphics) — vector drawing
- [Phaser.Physics.Arcade](https://newdocs.phaser.io/docs/3.80.0/Phaser.Physics.Arcade) — collision detection
- [Phaser.Input.Keyboard](https://newdocs.phaser.io/docs/3.80.0/Phaser.Input.Keyboard) — keyboard input
