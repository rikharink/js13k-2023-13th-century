import { ResourceManager } from '../managers/resource-manager';
import { Sprite } from '../rendering/sprite';
import { Scene } from './scene';
import { Camera } from '../rendering/camera';
import { AABB, intersects } from '../math/geometry/aabb';
import { sat } from '../math/util';
import { Settings } from '../settings';
import { PARISIAN_BLUE } from '../palette';
import { SceneManager } from '../managers/scene-manager';
import { keyboardManager, rng } from '../game';
import { Vector2, add, mul, normalize, scale, limit, signedAngle, copy } from '../math/vector2';
import { Texture } from '../textures/texture';
import { Boid, alignment, cohesion, deflect, seek, separation } from '../game/boid';
import { TAU } from '../math/const';

const PLAYER_ID = -1;
let cowId = 0xbeef;

class Cow {
  public id: number;
  public goal: Vector2;
  public health: number = 100;

  constructor(public sprite: Sprite) {
    this.id = sprite.id;
    this.goal = [0, 0];
  }

  public get boid(): Boid {
    return this.sprite;
  }

  public updateGoal(target: Sprite): void {
    copy(this.goal, target.center);
  }
}

export class BaseScene implements Scene {
  public name = 'base scene';
  public camera: Camera;
  public sprites: Sprite[];
  public trauma: number = 0;
  public traumaDampening: number = 0.02;
  public bounds: AABB = {
    min: [0, 0],
    max: [Settings.resolution[0] * 1, Settings.resolution[1] * 1],
  };
  public sceneTime: number = 0;

  public sceneManager: SceneManager;
  public resourceManager: ResourceManager;

  private player: Sprite;
  private cows: Cow[] = [];
  private cowTexture: Texture;

  public constructor(sceneManager: SceneManager, resourceManager: ResourceManager) {
    this.sceneManager = sceneManager;
    this.resourceManager = resourceManager;
    this.camera = new Camera([Settings.resolution[0], Settings.resolution[1]]);
    this.camera.followSpeed = [0.3, 0.3];
    this.sprites = [];

    const playerTexture = resourceManager.textures.get('sc')!;
    this.player = new Sprite(PLAYER_ID, [32, 32], [0, 0], playerTexture);
    this.player.velocity = [4, 4];
    this.player.color = PARISIAN_BLUE;
    this.sprites.push(this.player);
    this.cowTexture = resourceManager.textures.get('sc')!;
  }

  public onPush(): void {
    console.debug(`pushed scene: ${this.name}`);
    this.sceneTime = 0;
  }

  public onPop(): void {
    console.debug(`Scene ${this.name} ran for ${this.sceneTime}ms`);
    this.camera.reset();
  }

  private spawnCow() {
    const cow = new Sprite(
      cowId++,
      [16, 32],
      [rng() * this.bounds.max[0], rng() * this.bounds.max[1]],
      this.cowTexture,
    );
    cow.color = [255, 255, 255];
    cow.velocity = [rng() * 2, rng() * 2];
    cow.anchor = [0.5, 0.5];
    cow.fov = TAU * 0.51;

    this.sprites.push(cow);
    this.cows.push(new Cow(cow));
  }

  private despawnCow(cow: Cow) {
    this.sprites.splice(this.sprites.indexOf(cow.sprite), 1);
    this.cows.splice(this.cows.indexOf(cow), 1);
  }

  private tickCows() {
    for (let cow of this.cows) {
      if (cow.health <= 0) {
        this.despawnCow(cow);
      }

      const seperationForce = separation(cow, this.cows, Settings.seperationDistance);
      const alignmentForce = alignment(cow, this.cows, Settings.alignmentDistance);
      const cohesionForce = cohesion(cow, this.cows, Settings.cohesionDistance);
      cow.updateGoal(this.player);
      const seekForce: Vector2 =
        cow.goal[0] !== 0 && cow.goal[1] !== 0 ? seek(cow, cow.goal, Settings.seekDistance) : [0, 0];
      const deflectForce = deflect(cow, [{ position: cow.goal, radius: 100, strength: 100 }]);
      const totalForce = scale(seperationForce, seperationForce, Settings.seperationWeight);
      add(totalForce, totalForce, scale(alignmentForce, alignmentForce, Settings.alignmentWeight));
      add(totalForce, totalForce, scale(cohesionForce, cohesionForce, Settings.cohesionWeight));
      add(totalForce, totalForce, scale(seekForce, seekForce, Settings.seekWeight));
      add(totalForce, totalForce, deflectForce);
      add(cow.sprite.velocity, cow.sprite.velocity, totalForce);
      limit(cow.sprite.velocity, Settings.maxVelocity);
      add(cow.sprite.position, cow.sprite.position, cow.sprite.velocity);
      let r = signedAngle([0, -1], cow.sprite.velocity);
      cow.sprite.rotation = !Number.isNaN(r) ? r : 0;

      if (intersects(cow.sprite.collider, this.player.collider)) {
        cow.health -= 1;
        this.trauma += 0.025;
      }
    }

    if (this.cows.length < 20) {
      this.spawnCow();
    }
  }

  public tick(): void {
    if (keyboardManager.hasKeyUp('Escape')) {
      this.sceneManager.popScene();
    }

    const movement: Vector2 = [0, 0];
    if (keyboardManager.hasKeyDown('KeyW') || keyboardManager.hasKeyDown('ArrowUp')) {
      add(movement, movement, [0, -1]);
    }
    if (keyboardManager.hasKeyDown('KeyS') || keyboardManager.hasKeyDown('ArrowDown')) {
      add(movement, movement, [0, 1]);
    }
    if (keyboardManager.hasKeyDown('KeyA') || keyboardManager.hasKeyDown('ArrowLeft')) {
      add(movement, movement, [-1, 0]);
    }
    if (keyboardManager.hasKeyDown('KeyD') || keyboardManager.hasKeyDown('ArrowRight')) {
      add(movement, movement, [1, 0]);
    }

    normalize(movement, movement);
    mul(movement, movement, this.player.velocity);
    add(this.player.position, this.player.position, movement);

    this.tickCows();
    this.camera.wantedOrigin = this.player.center;
    this.trauma -= this.traumaDampening;
    this.trauma = sat(this.trauma);
    this.sceneTime += Settings.fixedDeltaTime * Settings.timeScale;
  }
}
