import Phaser from 'phaser';
import { BULLET } from '../config';
import { wrapPosition } from '../utils/math';

export class Bullet extends Phaser.GameObjects.Container
{
    /** X velocity component — set once by GameScene from ship's angle + ship's velocity. */
    private velocityX: number;

    /** Y velocity component — set once by GameScene from ship's angle + ship's velocity. */
    private velocityY: number;

    /** Remaining lifespan in ms — bullet self-destructs when this reaches zero. */
    private lifespan: number = BULLET.LIFESPAN;

    /** Graphics child for the bullet shape (small filled circle). */
    private graphics!: Phaser.GameObjects.Graphics;

    /**
     * @param scene - the owning Phaser scene
     * @param x - spawn x position (ship's nose)
     * @param y - spawn y position (ship's nose)
     * @param velocityX - x velocity (calculated by GameScene from ship angle + ship velocity)
     * @param velocityY - y velocity (calculated by GameScene from ship angle + ship velocity)
     */
    constructor(scene: Phaser.Scene, x: number, y: number, velocityX: number, velocityY: number)
    {
        // 1. Initialize Container at position
        super(scene, x, y);

        this.velocityX = velocityX;
        this.velocityY = velocityY;

        // 2. Create Graphics child — small filled circle
        this.graphics = this.createBulletGraphics();

        // 3. Enable physics on this Container
        scene.physics.world.enable(this);

        // 4. Configure circular physics body, centered on Container origin
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(BULLET.SIZE, -BULLET.SIZE, -BULLET.SIZE);

        // 5. Add self to scene
        scene.add.existing(this);
    }

    /**
     * Draws a small filled circle for the bullet.
     * Uses fillStyle + fillCircle (no stroke needed — bullets are tiny dots).
     */
    private createBulletGraphics(): Phaser.GameObjects.Graphics
    {
        const g = this.scene.add.graphics();
        g.fillStyle(0xFFFFFF, 1.0);
        g.fillCircle(0, 0, BULLET.SIZE);
        this.add(g);
        return g;
    }

    /**
     * Called every frame by GameScene. Moves the bullet, wraps screen edges, and
     * decrements lifespan. Returns true if still alive, false if expired.
     * GameScene uses the return value to destroy dead bullets:
     *   if (!bullet.update(delta)) { bullet.destroy(); bullets.splice(i, 1); }
     * @param delta - ms since last frame
     * @returns true if alive, false if lifespan expired
     */
    update(delta: number): boolean
    {
        this.lifespan -= delta;
        if (this.lifespan <= 0)
        {
            return false;
        }

        const dt = delta / 1000.0;
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        const wrapped = wrapPosition(this.x, this.y, BULLET.SIZE);
        this.x = wrapped.x;
        this.y = wrapped.y;

        return true;
    }
}
