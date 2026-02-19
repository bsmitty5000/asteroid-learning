import Phaser from 'phaser';
import { SHIP } from '../config';
import { velocityFromAngle, clampMagnitude, wrapPosition } from '../utils/math';

export class Ship extends Phaser.GameObjects.Container
{
  /** Current velocity components — public so GameScene can read them for bullet spawning. */
  public velocityX: number = 0;
  public velocityY: number = 0;

  /** Whether the ship is currently invincible (post-respawn). GameScene checks this for collisions. */
  public isInvincible: boolean = false;

  /** Graphics child for the ship shape (nose, wings, rear indent). */
  private graphics!: Phaser.GameObjects.Graphics;

  /** Separate Graphics child for the thrust flame — toggled visible/hidden based on input. */
  private thrustGraphics!: Phaser.GameObjects.Graphics;

  /** Timestamp of last bullet fired — compared against SHIP.FIRE_RATE for rate limiting. */
  private lastFireTime: number = 0;

  /** Reference to the flicker timer so it can be cleaned up on scene transition. */
  private flickerTimer?: Phaser.Time.TimerEvent;

  /** Reference to the invincibility end timer so it can be cleaned up on scene transition. */
  private invincibilityTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number)
  {
    // 1. Initialize Container at position
    super(scene, x, y);

    // 2. Create Graphics children and draw the ship + thrust flame
    this.graphics = this.createShipGraphics();
    this.thrustGraphics = this.createThrustGraphics();
    this.thrustGraphics.setVisible(false);

    // 3. Enable physics on this Container
    scene.physics.world.enable(this);

    // 4. Configure circular physics body, centered on Container origin
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(SHIP.SIZE, -SHIP.SIZE, -SHIP.SIZE);

    // 5. Add self to scene
    scene.add.existing(this);
  }

  /**
   * Draws the ship shape onto a Graphics child and adds it to this Container.
   * Ship is 4 points: nose at (size, 0), wings at (-size, ±size*0.7), rear indent at (-size*0.6, 0).
   * Double-stroke glow: wide semi-transparent blue underneath, thin white on top.
   */
  private createShipGraphics(): Phaser.GameObjects.Graphics
  {
    const g = this.scene.add.graphics();
    g.lineStyle(5, 0x081699, 1.0);

    g.beginPath();
    g.moveTo(SHIP.SIZE, 0);

    g.lineTo(-SHIP.SIZE, -SHIP.SIZE * 0.7);
    g.lineTo(-SHIP.SIZE * 0.6, 0);
    g.lineTo(-SHIP.SIZE, SHIP.SIZE * 0.7);
    g.closePath();
    g.strokePath();
    
    g.lineStyle(1, 0xFFFFFF, 0.5);

    g.beginPath();
    g.moveTo(SHIP.SIZE, 0);

    g.lineTo(-SHIP.SIZE, -SHIP.SIZE * 0.7);
    g.lineTo(-SHIP.SIZE * 0.6, 0);
    g.lineTo(-SHIP.SIZE, SHIP.SIZE * 0.7);
    g.closePath();
    g.strokePath();

    this.add(g);
    return g;
  }

  /**
   * Draws a small V-shape thrust flame behind the ship on separate Graphics.
   * Toggled visible when the player is pressing up arrow.
   */
  private createThrustGraphics(): Phaser.GameObjects.Graphics
  {
    const g = this.scene.add.graphics();
    g.lineStyle(5, 0xF2720A, 0.8);

    g.beginPath();
    g.moveTo(-SHIP.SIZE, SHIP.SIZE * 0.35);

    g.lineTo(-SHIP.SIZE * 1.33, 0);
    g.lineTo(-SHIP.SIZE, -SHIP.SIZE * 0.35);
    g.strokePath();
    
    g.lineStyle(2, 0xF20A0A, 1.0);
    g.beginPath();
    g.moveTo(-SHIP.SIZE, SHIP.SIZE * 0.35);

    g.lineTo(-SHIP.SIZE * 1.33, 0);
    g.lineTo(-SHIP.SIZE, -SHIP.SIZE * 0.35);
    g.strokePath();

    this.add(g);
    return g;
  }

  /**
   * Called every frame by GameScene. Handles rotation, thrust, position update, and screen wrapping.
   * @param delta - ms since last frame (multiply by delta/1000 for frame-rate independence)
   * @param cursors - Phaser cursor key object with up/left/right arrow state
   */
  update(delta: number, cursors: Phaser.Types.Input.Keyboard.CursorKeys): void
  {
    const dt = delta / 1000.0;

    // 1. Rotation
    if (cursors.left.isDown)
    {
      this.angle -= SHIP.ROTATION_SPEED * dt;
    }
    if (cursors.right.isDown)
    {
      this.angle += SHIP.ROTATION_SPEED * dt;
    }

    // 2. Thrust — adds to velocity, clamped to MAX_SPEED
    if (cursors.up.isDown)
    {
      const thrust = velocityFromAngle(this.angle, SHIP.THRUST * dt);
      this.velocityX += thrust.x;
      this.velocityY += thrust.y;
      const clamped = clampMagnitude(this.velocityX, this.velocityY, SHIP.MAX_SPEED);
      this.velocityX = clamped.x;
      this.velocityY = clamped.y;
      this.thrustGraphics.setVisible(true);
    }
    else
    {
      this.thrustGraphics.setVisible(false);
    }

    // 3. Position — velocity persists (no friction in space)
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // 4. Screen wrapping
    const wrapped = wrapPosition(this.x, this.y, SHIP.SIZE);
    this.x = wrapped.x;
    this.y = wrapped.y;
  }

  /**
   * Returns true if enough time has passed since the last shot (based on SHIP.FIRE_RATE).
   * @param time - current game time in ms (from update's time parameter)
   */
  canFire(time: number): boolean
  {
    return (time - this.lastFireTime) >= SHIP.FIRE_RATE;
  }

  /**
   * Records the timestamp of the last fired bullet for rate limiting.
   * @param time - current game time in ms
   */
  recordFire(time: number): void
  {
    this.lastFireTime = time
  }

  /**
   * Activates invincibility: sets flag, starts a flicker effect (repeating timer that
   * toggles alpha), and schedules a delayed call to end invincibility after SHIP.INVINCIBILITY ms.
   */
  makeInvincible(): void
  {
    if (this.flickerTimer)
    {
      this.scene.time.removeEvent(this.flickerTimer);
    }
    if (this.invincibilityTimer)
    {
      this.scene.time.removeEvent(this.invincibilityTimer);
    }

    this.isInvincible = true;
    this.flickerTimer = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        this.alpha = this.alpha === 1 ? 0.5 : 1;
      },
      repeat: -1
    });

    this.invincibilityTimer = this.scene.time.delayedCall(SHIP.INVINCIBILITY, () =>
    {
      if(this.flickerTimer != undefined)
      {
        this.scene.time.removeEvent(this.flickerTimer);
      }
      this.alpha = 1;
      this.isInvincible = false;
    })
  }

  /**
   * Respawn: reposition to (x, y), zero velocity, point up (angle = -90), trigger invincibility.
   */
  reset(x: number, y: number): void
  {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angle = -90;
    this.makeInvincible();
    this.visible = true;
  }

  /**
   * Destroy any active timers to prevent errors during scene transitions.
   * Call this before transitioning away from GameScene.
   */
  cleanup(): void
  {
      if(this.flickerTimer != undefined)
      {
        this.scene.time.removeEvent(this.flickerTimer);
      }
      if(this.invincibilityTimer != undefined)
      {
        this.scene.time.removeEvent(this.invincibilityTimer);
      }
  }
}
