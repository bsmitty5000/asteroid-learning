import Phaser from 'phaser';
import { GAME } from '../config';

export class GameOverScene extends Phaser.Scene
{
  constructor()
  {
    super({ key: 'GameOver' });
  }

  create(data: { score: number }): void
  {
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 3, 'GAME OVER', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, `Score: ${data.score}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 2 / 3, 'Press ENTER to return to menu', {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.keyboard!.once('keydown-ENTER', () =>
    {
      this.scene.start('Menu');
    });
  }
}
