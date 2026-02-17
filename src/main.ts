import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  parent: 'game',
  scene: {
    create() {
      const text = this.add.text(400, 300, 'Phaser is working!', {
        fontSize: '24px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
