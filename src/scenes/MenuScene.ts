import Phaser from 'phaser';
import { GAME } from '../config';

export class MenuScene extends Phaser.Scene
{
  constructor()
  {
    super({ key: 'Menu' });
  }

  create(): void
  {
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 3, 'ASTEROIDS', 
    {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, 'Press ENTER to start', 
    {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.keyboard!.once('keydown-ENTER', () =>
    {
      this.scene.start('Game');
    });
  }
}
