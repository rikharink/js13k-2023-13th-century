import { ResourceManager } from '../managers/resource-manager';
import { Sprite } from '../rendering/sprite';
import { Scene } from './scene';
import { Camera } from '../rendering/camera';
import { AABB } from '../math/geometry/aabb';
import { sat } from '../math/util';
import { Settings } from '../settings';
import { PARISIAN_BLUE } from '../palette';
import { SceneManager } from '../managers/scene-manager';
import { keyboardManager } from '../game';
import { Vector2 } from '../math/vector2';
import { PhysicsWorld } from '../game/physics-world';

const PLAYER_ID = 0;
const TO_PIXELS_PER_SECOND = Settings.fixedDeltaTime * 0.001;
const GRAVITY: Vector2 = [0, 1 * TO_PIXELS_PER_SECOND];

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

  public physicsWorld: PhysicsWorld = new PhysicsWorld();
  public sceneManager: SceneManager;
  public resourceManager: ResourceManager;

  private player: Sprite;

  public constructor(sceneManager: SceneManager, resourceManager: ResourceManager) {
    this.sceneManager = sceneManager;
    this.resourceManager = resourceManager;
    this.camera = new Camera([Settings.resolution[0], Settings.resolution[1]]);
    this.camera.followSpeed = [0.3, 0.3];

    const playerTexture = resourceManager.textures.get('sc')!;
    this.player = new Sprite(PLAYER_ID, [32, 64], [0, 0], playerTexture);
    this.player.acceleration = GRAVITY;
    this.player.color = PARISIAN_BLUE;
    this.sprites = [this.player];
    this.physicsWorld.initialize(this.bounds);
    this.physicsWorld.add(this.player);
  }

  public onPush(): void {
    console.debug(`pushed scene: ${this.name}`);
    this.sceneTime = 0;
  }

  public onPop(): void {
    console.debug(`Scene ${this.name} ran for ${this.sceneTime}ms`);
    this.camera.reset();
  }

  public tick(): void {
    if (keyboardManager.hasKeyUp('Escape')) {
      this.sceneManager.popScene();
    }

    if (keyboardManager.hasKeyUp('KeyZ')) {
      console.debug('JUMP');
      console.debug(this.player.velocity);
      this.player.velocity[1] += 100;
      console.debug(this.player.velocity);
    }
    this.physicsWorld.tick(GRAVITY);

    this.camera.wantedOrigin[0] = this.player.center[0];
    this.trauma -= this.traumaDampening;
    this.trauma = sat(this.trauma);
    this.sceneTime += Settings.fixedDeltaTime * Settings.timeScale;
  }
}
