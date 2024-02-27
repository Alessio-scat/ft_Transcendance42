import './components/game-renderer-2d.ce.js';
import './components/game-player.ce.js';
import './components/game-scoreboard.ce.js';
import './components/game-dialog.ce.js';
import './view-game.ce.scss';
import GameLocalApi from './localApi/GameLocalApi.js';
import AudioPlayer from './localApi/AudioPlayer.js';
import { exitFullscreen } from '@/fullscreen.js';
import { redirectTo } from '@/router.js';

const template = `
<div class="viewGame">
  <div class="viewGame-wrapper">
    <div class="viewGame-header">
      <game-scoreboard></game-scoreboard>
    </div>
    <div class="viewGame-body">
      <div class="viewGame-body-left">
        <div class="viewGame-touchBtn is-playerLeft is-up">
          <ui-icon name="arrow-up"></ui-icon>
        </div>
        <game-player class="viewGame-player-left"></game-player>
        <div class="viewGame-touchBtn is-playerLeft is-down">
        <ui-icon name="arrow-down"></ui-icon>
      </div>
      </div>
      <div class="viewGame-body-center">
        <game-renderer-2d class="viewGame-renderer"></game-renderer-2d>
      </div>
      <div class="viewGame-body-right">
        <div class="viewGame-touchBtn is-playerRight is-up">
        <ui-icon name="arrow-up"></ui-icon>
      </div>
        <game-player class="viewGame-player-right"></game-player>
        <div class="viewGame-touchBtn is-playerRight is-down">
        <ui-icon name="arrow-down"></ui-icon>
      </div>
      </div>
    </div>
    <div class="viewGame-footer">
      <div class="viewGame-tip">
        <span class="viewGame-tip-icon">
          <ui-icon name="bulb"></ui-icon>
        </span>
        <span class="viewGame-tip-text">Press Spacebar to pause / resume the game.</span>
      </div>
    </div>
  </div>
  <game-dialog class="viewGame-dialog"></game-dialog>
</div>
`;

class ViewGame extends HTMLElement {
  #keys = {};
  #touchs = {
    left: { up: false, down: false },
    right: { up: false, down: false },
  };
  #gameState = null;
  #audioPlayer = null;

  constructor() {
    super();

    this.renderDialog = this.renderDialog.bind(this);
    this.handleInitMessage = this.handleInitMessage.bind(this);
    this.handleUpdateMessage = this.handleUpdateMessage.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  async connectedCallback() {
    // init
    this.gameApi = new GameLocalApi();

    this.#audioPlayer = new AudioPlayer();
    await this.#audioPlayer.load('collision', '/assets/sounds/hit.wav');
    await this.#audioPlayer.load('score', '/assets/sounds/score.wav');
    await this.#audioPlayer.load('victory', '/assets/sounds/victory.wav');
    await this.#audioPlayer.load('defeat', '/assets/sounds/defeat.wav');

    this.innerHTML = template;

    // Dialog
    this.dialogEl = this.querySelector('.viewGame-dialog');

    // Renderer
    this.rendererEl = this.querySelector('.viewGame-renderer');

    // Game API events
    this.gameApi.on('init', this.handleInitMessage);
    this.gameApi.on('update', this.handleUpdateMessage);

    // UI Events
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('touchstart', this.handleTouchStart);
    document.addEventListener('touchend', this.handleTouchEnd);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('click', this.handleClick);
    this.gameApi.emit('reset');
    exitFullscreen();
  }

  renderPlayers() {
    this.playerLeftEl = this.querySelector('.viewGame-player-left');
    if (this.playerLeftEl) {
      this.playerLeftEl.setAttribute('name', this.#gameState.playerLeft.name);
      this.playerLeftEl.setAttribute('avatar', this.#gameState.playerLeft.avatar);
      this.playerLeftEl.setAttribute('score', 0);
      this.playerLeftEl.setAttribute('score-max', this.#gameState.scoreMax);
    }

    this.playerRightEl = this.querySelector('.viewGame-player-right');
    if (this.playerLeftEl) {
      this.playerRightEl.setAttribute('name', this.#gameState.playerRight.name);
      this.playerRightEl.setAttribute('avatar', this.#gameState.playerRight.avatar);
      this.playerRightEl.setAttribute('score', 0);
      this.playerRightEl.setAttribute('score-max', this.#gameState.scoreMax);
      this.playerRightEl.setAttribute('direction', 'right');
    }
  }

  renderScores() {
    this.querySelector('.viewGame-player-left')?.setAttribute('score', this.#gameState.scoreLeft || 0);
    this.querySelector('game-scoreboard')?.setAttribute('score-left', this.#gameState.scoreLeft || 0);
    this.querySelector('.viewGame-player-right')?.setAttribute('score', this.#gameState.scoreRight || 0);
    this.querySelector('game-scoreboard')?.setAttribute('score-right', this.#gameState.scoreRight || 0);
  }

  renderDialog() {
    const players = {
      playerLeft: this.#gameState.playerLeft,
      playerRight: this.#gameState.playerRight,
    };

    const controls = {
      start: {
        icon: 'play',
        action: () => {
          this.gameApi.emit('start');
        },
      },
      pause: {
        icon: 'pause',
        action: () => this.gameApi.emit('pause'),
      },
      resume: {
        icon: 'play',
        action: () => this.gameApi.emit('resume'),
      },
      quit: {
        icon: 'quit',
        action: () => redirectTo('/'),
      },
      restart: {
        icon: 'restart',
        action: () => {
          this.gameApi.emit('reset');
          this.gameApi.emit('start');
        },
      },
    };

    switch (this.#gameState.status) {
      case 'initialized':
        this.dialogEl.render({
          open: true,
          players,
          title: 'Ready?',
          controls: [{ ...controls.start, large: true }],
        });
        break;
      case 'paused':
        this.dialogEl.render({
          open: true,
          title: 'Paused',
          controls: [controls.restart, { ...controls.resume, large: true }, controls.quit],
        });
        break;
      case 'finished':
        const winner = this.#gameState.scoreLeft > this.#gameState.scoreRight ? 'left' : 'right';
        const winnerName = winner === 'left' ? players.playerLeft.name : players.playerRight.name;
        this.dialogEl.render({
          open: true,
          players,
          winner,
          title: `${winnerName} wins!`,
          controls: [controls.restart, controls.quit],
        });
        break;
      default:
        this.dialogEl.render({ open: false });
    }
  }

  handleInitMessage(data) {
    const json = JSON.parse(data);
    // todo: validate data
    this.#gameState = json?.state;
    this.style.setProperty('--viewGame-ratio', `${this.#gameState.width / this.#gameState.height}`);
    this.renderPlayers();
    this.renderDialog();
    this.renderScores();
    this.rendererEl.init(this.#gameState);
    this.rendererEl.start();
  }

  handleUpdateMessage(data) {
    const json = JSON.parse(data);
    // todo: validate data
    const updates = json?.state;
    this.#gameState = {
      ...this.#gameState,
      ...updates,
    };

    // dialog
    this.renderDialog();

    // renderer
    this.rendererEl.update(updates);
    if (updates.status === 'finished') {
      this.rendererEl.stop();
    }

    // players and board
    if (updates.scoreLeft != null || updates.scoreRight != null) {
      this.renderScores();
    }

    // sounds
    this.#audioPlayer.play(json?.event);
  }

  handleKeyDown(event) {
    // space
    if (event.code === 'Space') {
      switch (this.#gameState.status) {
        case 'initialized':
          this.gameApi.emit('start');
          return;
        case 'running':
          this.gameApi.emit('pause');
          return;
        case 'paused':
          this.gameApi.emit('resume');
          return;
        case 'finished':
          this.gameApi.emit('reset');
          this.gameApi.emit('start');
          this.renderDialog();
          return;
      }
    }

    // paddle moves
    if (!['w', 's', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    if (this.#keys[event.key]) return;

    this.#keys[event.key] = true;

    if (['w', 's'].includes(event.key)) {
      const dir = Number(Boolean(this.#keys.w)) - Number(Boolean(this.#keys.s));
      this.gameApi.emit('updatePaddleLeftMove', dir);
    } else {
      const dir = Number(Boolean(this.#keys.ArrowUp)) - Number(Boolean(this.#keys.ArrowDown));
      this.gameApi.emit('updatePaddleRightMove', dir);
    }
  }

  handleKeyUp(event) {
    // paddle moves (stop)
    if (!this.#keys[event.key]) return;

    this.#keys[event.key] = false;

    if (['w', 's'].includes(event.key)) {
      this.#updatePaddleLeftMove();
    } else if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      this.#updatePaddleRightMove();
    }
  }

  handleTouchStart(event) {
    const touchEl = event.target.closest('.viewGame-touchBtn');
    if (!touchEl) return;

    event.preventDefault();

    const playerKey = touchEl.classList.contains('is-playerLeft') ? 'left' : 'right';
    const dirKey = touchEl.classList.contains('is-up') ? 'up' : 'down';
    this.#touchs[playerKey][dirKey] = true;

    touchEl.classList.add('is-active');
    if (playerKey === 'left') {
      this.#updatePaddleLeftMove();
    } else {
      this.#updatePaddleRightMove();
    }
  }

  handleTouchEnd(event) {
    const touchEl = event.target.closest('.viewGame-touchBtn');
    if (!touchEl) return;

    event.preventDefault();

    const playerKey = touchEl.classList.contains('is-playerLeft') ? 'left' : 'right';
    const dirKey = touchEl.classList.contains('is-up') ? 'up' : 'down';
    this.#touchs[playerKey][dirKey] = false;

    touchEl.classList.remove('is-active');
    if (playerKey === 'left') {
      this.#updatePaddleLeftMove();
    } else {
      this.#updatePaddleRightMove();
    }
  }

  #updatePaddleLeftMove() {
    const keyMove = Number(Boolean(this.#keys.w)) - Number(Boolean(this.#keys.s));
    const touchMove = Number(Boolean(this.#touchs.left.up)) - Number(Boolean(this.#touchs.left.down));

    let dir = 0;
    if (keyMove + touchMove > 0) {
      dir = 1;
    } else if (keyMove + touchMove < 0) {
      dir = -1;
    }
    this.gameApi.emit('updatePaddleLeftMove', dir);
  }

  #updatePaddleRightMove() {
    const keyMove = Number(Boolean(this.#keys.ArrowUp)) - Number(Boolean(this.#keys.ArrowDown));
    const touchMove = Number(Boolean(this.#touchs.right.up)) - Number(Boolean(this.#touchs.right.down));

    let dir = 0;
    if (keyMove + touchMove > 0) {
      dir = 1;
    } else if (keyMove + touchMove < 0) {
      dir = -1;
    }
    this.gameApi.emit('updatePaddleRightMove', dir);
  }
}

customElements.define('view-game', ViewGame);
