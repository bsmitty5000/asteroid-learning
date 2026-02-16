# Asteroids Game Design

## Goals

- Learn 2D game development with TypeScript and Phaser 3
- Understand all aspects of code, architecture, and program flow
- Build a faithful Asteroids replica with clean vector-style visuals
- Keep the architecture open for gameplay extensions and multiplayer

## Tech Stack

- **Runtime:** Phaser 3 (current stable)
- **Language:** TypeScript
- **Build tool:** Vite
- **Visuals:** Procedural vector-style rendering via Phaser's Graphics API (no sprite assets)

## Project Structure

```
asteroid/
├── index.html              # Entry HTML with <div id="game">
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
└── src/
    ├── main.ts              # Creates Phaser.Game with config
    ├── config.ts            # Game constants (screen size, physics, scoring)
    ├── scenes/
    │   ├── BootScene.ts     # Minimal preload, transitions to Menu
    │   ├── MenuScene.ts     # Title screen, waits for input
    │   ├── GameScene.ts     # Main gameplay loop
    │   └── GameOverScene.ts # Score display, restart
    └── entities/
        ├── Ship.ts          # Player ship
        ├── Asteroid.ts      # Asteroid (all sizes)
        └── Bullet.ts        # Projectile
```

## Architecture: Scene-Based with Game Objects

Each game state is a Phaser Scene. Game entities are classes extending `Phaser.GameObjects.Container`. Scenes orchestrate (spawning, collisions, scoring) while entities own their behavior (movement, rendering, wrapping).

## Scene Flow

```
BootScene → MenuScene → GameScene ↔ GameOverScene
                ↑                        |
                └────────────────────────┘
```

- **BootScene:** Runs once on startup. Minimal setup, auto-transitions to MenuScene.
- **MenuScene:** Title screen, waits for player input, transitions to GameScene.
- **GameScene:** Main gameplay. `create()` spawns entities and registers collisions. `update(dt)` runs every frame: reads input, updates entities, checks win condition, updates HUD.
- **GameOverScene:** Receives final score via scene data passing, displays it, waits for input to return to MenuScene.

## Entity Design

All entities extend `Phaser.GameObjects.Container` with a child `Graphics` object for rendering.

### Ship

- **Properties:** velocity (vec2), rotationSpeed, thrustPower, isThrusting, isInvincible
- **Movement:** Manual vector math — thrust adds to velocity based on facing angle, velocity applied to position each frame, no friction (classic drift). Phaser physics used only for collision detection (circular body).
- **Screen wrapping:** Handled by the entity itself.
- **Respawn:** Brief invincibility with visual flicker (alpha toggle).

### Asteroid

- **Properties:** velocity (vec2), size (LARGE | MEDIUM | SMALL), vertices (randomized at creation)
- **Shape:** Randomized vertex offsets create unique jagged polygons per asteroid.
- **Size determines:** radius, physics body size, score value, split behavior.
- **Splitting:** LARGE → 2 MEDIUM, MEDIUM → 2 SMALL, SMALL → destroyed.
- **Speed:** Smaller asteroids move faster.

### Bullet

- **Properties:** velocity (vec2), lifespan (~1 second)
- **Spawning:** Created at ship's nose with velocity in ship's facing direction plus ship's current velocity.
- **Self-destructs** after lifespan expires.

## Rendering

Vector-style using Phaser's Graphics API: `lineStyle()`, `moveTo()`, `lineTo()`, `strokePath()`. Bright lines on dark background. Glow effects possible later via doubled strokes (thicker semi-transparent underneath).

## Physics Model

- **Movement:** Custom velocity-based. Thrust applies acceleration in facing direction. No friction. Screen wrapping on all edges.
- **Collision detection:** Phaser's `physics.add.overlap()` with circular bodies. Two collision pairs:
  - bullets ↔ asteroids
  - ship ↔ asteroids

## Collision Handling

### Bullet hits Asteroid

1. Destroy bullet
2. Add score (LARGE=20, MEDIUM=50, SMALL=100)
3. If not SMALL: spawn 2 smaller asteroids with diverging velocities
4. Destroy original asteroid
5. If zero asteroids remain: start next wave

### Ship hits Asteroid

1. If invincible: ignore
2. Destroy ship (visual explosion effect)
3. Decrement lives
4. Lives > 0: respawn at center with invincibility
5. Lives = 0: transition to GameOverScene

## Scoring & HUD

Text overlay showing score (top-left) and lives (top-right). Updated on change, not every frame.

## Wave Progression

Wave counter starts at 1. Each wave spawns `wave + 3` large asteroids at random screen edges with minimum distance from ship. Difficulty increases naturally through asteroid count.

## Extensibility

- **Gameplay additions:** New entity classes (EnemyShip, PowerUp), new scenes (ShopScene, LevelSelectScene).
- **Multiplayer:** Extract game state from GameScene into shared GameState object. Collision callbacks modify shared state. Network sync reads/writes to GameState. Architecture supports this refactor without rewriting entities.
