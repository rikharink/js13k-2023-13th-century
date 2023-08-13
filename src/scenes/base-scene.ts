import { ResourceManager } from '../managers/resource-manager';
import { Sprite } from '../rendering/sprite';
import { Scene } from './scene';
import { Camera } from '../rendering/camera';
import { AABB } from '../math/geometry/aabb';
import { clamp, sat } from '../math/util';
import { Settings } from '../settings';
import { center } from '../math/geometry/rectangle';

const PLAYER_ID = 0;
export class BaseScene implements Scene {
  public name = 'base scene';
  public camera: Camera;
  public sprites: Sprite[];
  public trauma: number = 0;
  public traumaDampening: number = 0.02;
  public bounds: AABB = {
    min: [0, 0],
    max: [1280 * 1, 800 * 1],
  };
  public sceneTime: number = 0;
  private player: Sprite;

  public constructor(resourceManager: ResourceManager, camera: Camera) {
    const playerTexture = resourceManager.textures.get('sc')!;
    this.player = {
      id: PLAYER_ID,
      drawRect: {
        position: [0, 0],
        size: [32, 64],
      },
      sourceRect: {
        position: [0, 0],
        size: [1, 1],
      },
      color: [255, 0, 0],
      anchor: [0.5, 0.5],
      texture: playerTexture,
      collider: {},
      velocity: [0, 0],
      rotation: 0,
      flipx: false,
      flipy: false,
    };
    this.sprites = [this.player];
    this.camera = camera;
    camera.followSpeed = [0.3, 0.3];
  }

  public onPush(): void {
    console.debug(`pushed scene: ${this.name}`);
    this.sceneTime = 0;
  }

  public onPop(): void {
    console.debug(`Scene ${this.name} ran for ${this.sceneTime}ms`);
  }

  public tick(camera: Camera): void {
    const playerCenter = center(this.player.drawRect);
    camera.wantedOrigin = [playerCenter[0], playerCenter[1] - camera.center[1] + this.player.drawRect.size[1] * 0.5];

    this.player.velocity[0] += Math.sign(-this.player.velocity[0]) * 0.1;
    console.debug(this.player.velocity[0]);
    this.player.velocity[0] = clamp(-10, 10, this.player.velocity[0]);
    this.trauma -= this.traumaDampening;
    this.trauma = sat(this.trauma);
    this.sceneTime += Settings.fixedDeltaTime * Settings.timeScale;
  }
}
