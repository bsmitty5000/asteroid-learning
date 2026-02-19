import Phaser from 'phaser';
import { ASTEROID } from '../config';
import { velocityFromAngle, wrapPosition, randomBetween, generateAsteroidVertices } from '../utils/math';

/** The three asteroid sizes — determines radius, speed range, vertex count, and score value. */
export type AsteroidSize = 'LARGE' | 'MEDIUM' | 'SMALL';

/** Maps each AsteroidSize to its config values from ASTEROID in config.ts. */
const SIZE_CONFIG = 
{
    LARGE: ASTEROID.LARGE,
    MEDIUM: ASTEROID.MEDIUM,
    SMALL: ASTEROID.SMALL,
} as const;

const CHILD_SIZE: Record<AsteroidSize, AsteroidSize | null> = 
{
    LARGE: 'MEDIUM',
    MEDIUM: 'SMALL',
    SMALL: null,
};

export class Asteroid extends Phaser.GameObjects.Container
{
    /** This asteroid's size category — used by GameScene for scoring and split logic. */
    public readonly size: AsteroidSize;

    /** Current velocity components — set once on creation, never changes (asteroids don't accelerate). */
    public velocityX: number;
    public velocityY: number;

    /** Graphics child for the asteroid shape (jagged polygon with glow effect). */
    private graphics!: Phaser.GameObjects.Graphics;

    /** The config values (radius, speed range, vertex count) for this asteroid's size. */
    private config: (typeof SIZE_CONFIG)[AsteroidSize];

    /**
     * @param scene - the owning Phaser scene
     * @param x - spawn x position
     * @param y - spawn y position
     * @param size - which size category: 'LARGE', 'MEDIUM', or 'SMALL'
     * @param velocityX - optional x velocity; if omitted, a random direction/speed is generated
     * @param velocityY - optional y velocity; if omitted, a random direction/speed is generated
     */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        size: AsteroidSize,
        velocityX?: number,
        velocityY?: number,
    )
    {
        // 1. Initialize Container at position
        super(scene, x, y);

        this.size = size;
        this.config = SIZE_CONFIG[size];

        // 2. Generate velocity — use provided values or pick random direction + speed within range
        if (velocityX !== undefined && velocityY !== undefined)
        {
            this.velocityX = velocityX;
            this.velocityY = velocityY;
        }
        else
        {
            const angle = randomBetween(0, 360);
            const speed = randomBetween(this.config.SPEED_MIN, this.config.SPEED_MAX);
            const vel = velocityFromAngle(angle, speed);
            this.velocityX = vel.x;
            this.velocityY = vel.y;
        }

        // 3. Create Graphics child — generate unique jagged polygon, draw with double-stroke glow
        this.graphics = this.createAsteroidGraphics();

        // 4. Enable physics on this Container
        scene.physics.world.enable(this);

        // 5. Configure circular physics body, centered on Container origin
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(this.config.RADIUS, -this.config.RADIUS, -this.config.RADIUS);

        // 6. Add self to scene
        scene.add.existing(this);
    }

    /**
     * Generates a unique jagged polygon using generateAsteroidVertices, then draws it
     * with double-stroke glow: wide semi-transparent blue underneath, thin white on top.
     */
    private createAsteroidGraphics(): Phaser.GameObjects.Graphics
    {
        const g = this.scene.add.graphics();
        const vertices = generateAsteroidVertices(  this.config.RADIUS,
                                                    this.config.VERTICES,
                                                    ASTEROID.JAGGEDNESS);
        g.lineStyle(4, 0x081699, 0.6);
        g.beginPath();
        g.moveTo(vertices[0].x, vertices[0].y);
        for(let i = 1; i < vertices.length; i++)
        {
            g.lineTo(vertices[i].x, vertices[i].y);
        }
        g.closePath();
        g.strokePath();
        
        g.lineStyle(1, 0xFFFFFF, 0.5);
        g.beginPath();
        g.moveTo(vertices[0].x, vertices[0].y);
        for(let i = 1; i < vertices.length; i++)
        {
            g.lineTo(vertices[i].x, vertices[i].y);
        }
        g.closePath();
        g.strokePath();
        this.add(g);
        return g;
    }

    /**
     * Called every frame by GameScene. Applies constant velocity and wraps at screen edges.
     * Asteroids don't accelerate or rotate — just linear motion + wrapping.
     * @param delta - ms since last frame
     */
    update(delta: number): void
    {
        const dt = delta / 1000.0;

        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        const wrapped = wrapPosition(this.x, this.y, this.config.RADIUS);
        this.x = wrapped.x;
        this.y = wrapped.y;
    }

    /**
     * Returns the next smaller size when this asteroid is destroyed, or null if already SMALL.
     * Called by GameScene to determine whether to spawn child asteroids on split.
     */
    getChildSize(): AsteroidSize | null
    {
        return CHILD_SIZE[this.size];
    }
}