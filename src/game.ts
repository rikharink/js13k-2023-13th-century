import './style.css';
import spriteVert from './rendering/shaders/sprite.vert';
import spriteFrag from './rendering/shaders/sprite.frag';
import postVert from './rendering/shaders/post.vert';
import postFrag from './rendering/shaders/post.frag';

import { SceneManager } from './managers/scene-manager';
import { getRandom } from './math/random';
import { MainRenderer } from './rendering/main-renderer';
import { Settings } from './settings';
import { KeyboardManager } from './managers/keyboard-manager';
import { PointerManager } from './managers/pointer-manager';
import { GamepadManager } from './managers/gamepad-manager';
import { AudioSystem } from './audio/audio-system';
import { ResourceManager, ResourceManagerBuilder } from './managers/resource-manager';
import { ColorCorrection } from './rendering/post-effects/color-correction';
import GUI from 'lil-gui';
import noise from './textures/noise.svg';
import parchment from './textures/parchment.svg';
import cow from './textures/cow.svg';
import { TAU } from './math/const';
import { Passthrough } from './rendering/post-effects/passthrough';
import { generateSolidTexture } from './textures/textures';
import { MainMenuScene } from './scenes/main-menu-scene';

let lil;
let gui: GUI;
let s: any;

if (import.meta.env.DEV) {
  lil = await import('lil-gui');
  gui = new lil.GUI();
  gui.close();
  s = await import('stats.js');
}

const app = document.getElementById('app')!;
app.innerHTML = `
<canvas id=g width=${Settings.resolution[0]} height=${Settings.resolution[1]}></canvas>
`;
export const canvas = document.getElementById('g') as HTMLCanvasElement;
export const gl = canvas.getContext('webgl2', {
  alpha: false,
})!;

export const keyboardManager = new KeyboardManager();
export const gamepadManager = new GamepadManager();
export const pointerManager = new PointerManager(canvas);
let isPaused = false;

export const rng = getRandom('JS13K2023');
export let resourceManager: ResourceManager;
const sceneManager = new SceneManager();
export let gameTime = 0;

new ResourceManagerBuilder()
  .addShader('sprite', spriteVert, spriteFrag)
  .addShader('post', postVert, postFrag)
  .addProceduralTexture('sc', () => generateSolidTexture(gl, [1, 1, 1]))
  .addSvgTexture('cow', cow, true, false)
  .addSvgTexture('snoise', noise, false, true)
  .addSvgTexture('bg', parchment, false, true)
  .build(gl, sceneManager)
  .then((rm) => {
    resourceManager = rm;
    resourceManager
      .addPostEffect('cc', new ColorCorrection(gl, resourceManager))
      .addPostEffect('pt', new Passthrough(gl, resourceManager, null));

    sceneManager.pushScene(new MainMenuScene(sceneManager, resourceManager));
    const renderer = new MainRenderer(gl, resourceManager);

    let stats: Stats | undefined = undefined;
    if (import.meta.env.DEV) {
      const settings = gui.addFolder('settings');
      settings.add(Settings, 'fixedDeltaTime');
      settings.add(Settings, 'timeScale', 0, 1);

      const pfx = gui.addFolder('postEffects');
      pfx.add(resourceManager.getPostEffect('cc'), 'isEnabled').name('cc enabled');
      pfx.add(resourceManager.getPostEffect('cc'), 'contrast', -1, 1, 0.05);
      pfx.add(resourceManager.getPostEffect('cc'), 'brightness', -1, 1, 0.05);
      pfx.add(resourceManager.getPostEffect('cc'), 'exposure', -1, 1, 0.05);
      pfx.add(resourceManager.getPostEffect('cc'), 'saturation', -1, 1, 0.05);
      pfx.addColor(resourceManager.getPostEffect('cc'), 'colorFilter');

      const scene = gui.addFolder('scene');
      scene.add(sceneManager.currentScene, 'trauma', 0, 1, 0.01);
      scene.add(sceneManager.currentScene, 'traumaDampening', 0, 1, 0.00001);

      const boids = gui.addFolder('boids');
      boids.add(Settings, 'seperationDistance', 0, 1000);
      boids.add(Settings, 'seperationWeight', 0, 1000);
      boids.add(Settings, 'alignmentDistance', 0, 1000);
      boids.add(Settings, 'alignmentWeight', 0, 1000);
      boids.add(Settings, 'cohesionDistance', 0, 1000);
      boids.add(Settings, 'cohesionWeight', 0, 1000);
      boids.add(Settings, 'seekDistance', 0, 1000);
      boids.add(Settings, 'seekWeight', 0, 1000);
      boids.add(Settings, 'maxVelocity', 0, 1000);

      const cameraGui = gui.addFolder('camera');
      cameraGui.add(sceneManager.currentScene.camera, 'scale', 0.01, 10, 0.01).name('zoom');
      cameraGui.add(sceneManager.currentScene.camera, 'rotation', 0, TAU);
      cameraGui.add(Settings, 'maxRotationalShake', 0, TAU, 0.001);
      cameraGui.add(Settings, 'maxTranslationalShake', 0, 1000, 1);

      stats = new s.default();
      stats!.showPanel(0);
      document.body.appendChild(stats!.dom);
    }

    let audioSystem: AudioSystem | undefined = undefined;
    document.addEventListener(
      'pointerdown',
      () => {
        audioSystem = new AudioSystem();
      },
      { once: true },
    );

    let _then = 0;
    let _accumulator = 0;

    function gameloop(now: number): void {
      requestAnimationFrame(gameloop);
      stats?.begin();
      resizeCanvas();

      if (isPaused) return;

      const dt = now - _then;
      if (dt > 1000) {
        _then = now;
        return;
      }

      _accumulator += dt;
      while (_accumulator >= Settings.fixedDeltaTime) {
        //FIXED STEP
        sceneManager.currentScene.tick();
        sceneManager.currentScene.camera.tick(
          gameTime,
          sceneManager.currentScene.trauma * sceneManager.currentScene.trauma,
        );
        keyboardManager.clear();
        gameTime += Settings.fixedDeltaTime * Settings.timeScale;
        _accumulator -= Settings.fixedDeltaTime;
      }

      //VARIABLE STEP
      const alpha = _accumulator / Settings.fixedDeltaTime;
      renderer.begin(gl);
      renderer.render(gl, sceneManager.currentScene, alpha, gameTime);
      renderer.end(gl);

      keyboardManager.tick();
      gamepadManager.tick();
      pointerManager.tick();
      _then = now;
      stats?.end();
    }

    function pause(): void {
      if (audioSystem) {
        audioSystem?.mute();
      }
      isPaused = true;
    }

    function resume(): void {
      console.log('resume');
      if (audioSystem) {
        audioSystem.unmute();
      }
      isPaused = false;
    }

    requestAnimationFrame(gameloop);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    });
  })
  .catch((e) => console.error(e));

function resizeCanvas() {
  const internalWidth = Settings.resolution[0];
  const internalHeight = Settings.resolution[1];
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const scaleFactor = Math.min(windowWidth / internalWidth, windowHeight / internalHeight);
  const scaledWidth = internalWidth * scaleFactor;
  const scaledHeight = internalHeight * scaleFactor;
  // Scale the canvas display size using CSS
  const sw = scaledWidth + 'px';
  const sh = scaledHeight + 'px';
  if (canvas.style.width !== sw || canvas.style.height !== sh) {
    canvas.style.width = sw;
    canvas.style.height = sh;
  }
}
