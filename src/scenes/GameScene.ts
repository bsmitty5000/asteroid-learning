import Phaser from 'phaser';
import { GAME, SHIP, BULLET, SCORE, ASTEROID } from '../config';
import { Ship } from '../entities/Ship';
import { Asteroid, AsteroidSize } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { velocityFromAngle } from '../utils/math';

export class GameScene extends Phaser.Scene
{
    /** Player ship entity. */
    private ship!: Ship;

    /** Active asteroids on screen. */
    private asteroids: Asteroid[] = [];

    /** Active bullets on screen. */
    private bullets: Bullet[] = [];

    /** Phaser cursor key references (up/down/left/right/space/shift). */
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    /** Separate space key reference for firing. */
    private fireKey!: Phaser.Input.Keyboard.Key;

    /** Current score — increases when asteroids are destroyed. */
    private score: number = 0;

    /** Remaining lives — game over when this hits 0. */
    private lives: number = GAME.LIVES;

    /** Current wave number — controls how many asteroids spawn. */
    private wave: number = 1;

    /** True while the ship is dead and waiting to respawn — prevents update logic on the ship. */
    private isRespawning: boolean = false;

    /** HUD text displaying current score. */
    private scoreText!: Phaser.GameObjects.Text;

    /** HUD text displaying remaining lives. */
    private livesText!: Phaser.GameObjects.Text;

    constructor()
    {
        super({ key: 'Game' });
    }

    /**
     * Called each time the scene starts (including restarts). Sets up all game state,
     * input, HUD, and spawns the first wave of asteroids.
     */
    create(): void
    {
        // TODO
        // 1. Reset all state: score=0, lives=GAME.LIVES, wave=1, isRespawning=false,
        //    clear asteroids[] and bullets[]
        // 2. Set up input: createCursorKeys() for movement, addKey(SPACE) for firing
        // 3. Create Ship at screen center (GAME.WIDTH/2, GAME.HEIGHT/2), pointing up (setAngle(-90))
        // 4. Create HUD text: scoreText top-left, livesText top-right
        // 5. Call spawnWave() to create initial asteroids
        this.score = 0;
        this.lives = GAME.LIVES;
        this.wave = 1;
        this.isRespawning = false;
        for (let i = this.asteroids.length - 1; i >= 0; i--) 
        {
            this.asteroids[i].destroy();
        }
        this.asteroids = [];
        for (let i = this.bullets.length - 1; i >= 0; i--) 
        {
            this.bullets[i].destroy();
        }
        this.bullets = [];

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.ship = new Ship(this, GAME.WIDTH / 2, GAME.HEIGHT / 2);

        this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, 
        {
            fontSize: '20px',
            color: '#ffffff',
        });

        this.livesText = this.add.text(GAME.WIDTH - 10, 10, `Lives: ${this.lives}`, 
        {
            fontSize: '20px',
            color: '#ffffff',
            align: 'right',
        });
        this.livesText.setOrigin(1, 0); // anchor to top-right instead of top-left

        this.spawnWave();
    }

    /**
     * Main game loop — called every frame by Phaser.
     * @param time - total elapsed ms since game start (used for fire rate timing)
     * @param delta - ms since last frame (used for frame-rate independent movement)
     */
    update(time: number, delta: number): void
    {
        // TODO
        // 4. Check collisions: bullet↔asteroid, ship↔asteroid
        // 5. If no asteroids remain: increment wave, call spawnWave()
        if(!this.isRespawning)
        {
            this.ship.update(delta, this.cursors);
            if(this.ship.canFire(time) && this.fireKey.isDown)
            {
                this.fireBullet(time);
            }
        }

        let deadCount = 0;
        this.bullets.forEach(bullet => 
        {
            if (!bullet.update(delta)) 
            {
                bullet.destroy();
                deadCount++;
            }
        })
        if (deadCount > 0) 
        {
            this.bullets.splice(0, deadCount);
        }

        this.asteroids.forEach(asteroid => 
        {
            asteroid.update(delta);
        });

        for(let asteroidIdx = 0; asteroidIdx < this.asteroids.length; asteroidIdx++)
        {
            const asteroid = this.asteroids[asteroidIdx];
            for(let bulletIdx = 0; bulletIdx < this.bullets.length; bulletIdx++)
            {
                const bullet = this.bullets[bulletIdx];
                if(this.physics.overlap(asteroid, bullet))
                {
                    const childSize = asteroid.getChildSize();
                    if(childSize)
                    {
                        this.asteroids.push(new Asteroid(   this,
                                                            asteroid.x, asteroid.y,
                                                            childSize,
                                                            asteroid.velocityX, asteroid.velocityY));
                    }

                    asteroid.destroy();
                    bullet.destroy();
                    this.asteroids.splice(asteroidIdx, 1);
                    this.bullets.splice(bulletIdx, 1);
                }
            }
        }
    }

    /**
     * Creates a bullet at the ship's nose, with velocity from the ship's facing angle
     * plus the ship's current velocity (so bullets feel natural when moving).
     * @param time - current game time for recording fire timestamp
     */
    private fireBullet(time: number): void
    {
        // TODO
        // 1. Record fire time on ship
        // 2. Calculate bullet spawn position: offset from ship center by SHIP.SIZE
        //    in the ship's facing direction (use velocityFromAngle with ship.angle)
        // 3. Calculate bullet velocity: velocityFromAngle(ship.angle, BULLET.SPEED)
        //    then add ship's velocityX/Y so bullets inherit ship momentum
        // 4. Create new Bullet, push to bullets[]
        this.ship.recordFire(time);
        const offset = velocityFromAngle(this.ship.angle, SHIP.SIZE);
        offset.x += this.ship.x;
        offset.y += this.ship.y;
        const speed = velocityFromAngle(this.ship.angle, BULLET.SPEED);
        speed.x += this.ship.velocityX;
        speed.y += this.ship.velocityY;
        this.bullets.push(new Bullet(this, offset.x, offset.y, speed.x, speed.y));
    }

    /**
     * Spawns a wave of large asteroids at random screen edges.
     * Count = GAME.INITIAL_ASTEROIDS + (wave - 1), so each wave has one more.
     */
    private spawnWave(): void
    {
        // TODO
        // 1. Calculate count = GAME.INITIAL_ASTEROIDS + (wave - 1)
        // 2. For each: pick a random position along a screen edge,
        //    ensuring minimum distance from ship to avoid unfair spawns
        // 3. Create new Asteroid('LARGE'), push to asteroids[]
    }

    /**
     * Checks bullet↔asteroid collisions using Phaser's physics.overlap.
     * On hit: add score, split asteroid, destroy bullet.
     * Both arrays are iterated in reverse to safely remove elements mid-loop.
     */
    private checkBulletAsteroidCollisions(): void
    {
        // TODO
        // Nested reverse loop over bullets and asteroids
        // For each pair: if this.physics.overlap(bullet, asteroid)
        //   1. Add SCORE[asteroid.size] to score, update scoreText
        //   2. Call splitAsteroid(asteroid, asteroidIndex)
        //   3. Destroy bullet, splice from bullets[]
        //   4. Break inner loop (this bullet is gone)
    }

    /**
     * Checks ship↔asteroid collisions. Skips if ship is invincible or respawning.
     */
    private checkShipAsteroidCollisions(): void
    {
        // TODO
        // If isRespawning or ship.isInvincible: return early
        // For each asteroid: if this.physics.overlap(ship, asteroid)
        //   Call onShipHit(), break
    }

    /**
     * Splits an asteroid into two children of the next smaller size,
     * or just removes it if already SMALL.
     * @param asteroid - the asteroid that was hit
     * @param index - its index in the asteroids[] array
     */
    private splitAsteroid(asteroid: Asteroid, index: number): void
    {
        // TODO
        // 1. Get childSize from asteroid.getChildSize()
        // 2. If childSize is not null: spawn 2 new Asteroids at same position
        //    with random velocities, push to asteroids[]
        // 3. Destroy the original asteroid, splice from asteroids[] at index
    }

    /**
     * Handles the ship being hit: decrements lives, triggers game over or respawn.
     */
    private onShipHit(): void
    {
        // TODO
        // 1. Decrement lives, update livesText
        // 2. Hide ship (setVisible(false)), set isRespawning = true
        // 3. If lives <= 0: cleanup ship, transition to GameOver with score
        // 4. Otherwise: delayedCall to respawn — ship.reset(center), isRespawning = false
    }
}
