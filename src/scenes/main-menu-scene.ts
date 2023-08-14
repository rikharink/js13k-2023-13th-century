import { keyboardManager } from '../game';
import { PhysicsWorld } from '../game/physics-world';
import { ResourceManager } from '../managers/resource-manager';
import { SceneManager } from '../managers/scene-manager';
import { rgbaString } from '../math/color';
import { AABB } from '../math/geometry/aabb';
import { sat } from '../math/util';
import { Vector2, add, scale, subtract } from '../math/vector2';
import { DARK_JADE } from '../palette';
import { Camera } from '../rendering/camera';
import { Sprite } from '../rendering/sprite';
import { Settings } from '../settings';
import { Texture } from '../textures/texture';
import { generateTextureFromText } from '../textures/textures';
import { BaseScene } from './base-scene';
import { Scene } from './scene';

const fontFamily = 'Superclarendon, "Bookman Old Style", "URW Bookman", "URW Bookman L", "Georgia Pro", Georgia, serif';
const fillStyle = rgbaString(DARK_JADE, 255);

let id = 0;
function getTextSprite(texture: Texture, position: Vector2): Sprite {
  return new Sprite(id++, texture.size, position, texture);
}

export class MainMenuScene implements Scene {
  public name: string = 'main menu';
  public sprites: Sprite[] = [];
  public bounds: AABB = {
    min: [0, 0],
    max: [Settings.resolution[0], Settings.resolution[1]],
  };
  public trauma: number = 1;
  public traumaDampening = 1;
  public camera: Camera;
  public sceneTime: number = 0;

  public physicsWorld: PhysicsWorld = new PhysicsWorld();
  public sceneManager: SceneManager;
  public resourceManager: ResourceManager;

  constructor(gl: WebGL2RenderingContext, sceneManager: SceneManager, resourceManger: ResourceManager) {
    this.camera = new Camera([Settings.resolution[0], Settings.resolution[1]]);
    this.sceneManager = sceneManager;
    this.resourceManager = resourceManger;

    const titleTexture = generateTextureFromText(gl, 'Vellum', {
      fontSize: 72,
      fontFamily,
      fillStyle,
    });
    const tpos = subtract([0, 0], this.camera.center, scale([0, 0], titleTexture.size, 0.5));
    this.sprites.push(getTextSprite(titleTexture, tpos));

    const subtitleTexture = generateTextureFromText(gl, 'a js13k game by Rik Harink', {
      fontSize: 32,
      fontFamily,
      fillStyle,
    });
    const stpos = subtract([0, 0], this.camera.center, scale([0, 0], subtitleTexture.size, 0.5));
    add(stpos, stpos, [0, 32]);
    this.sprites.push(getTextSprite(subtitleTexture, stpos));
  }

  onPush(): void {
    console.debug(`pushed scene: ${this.name}`);
    this.sceneTime = 0;
  }

  onPop(): void {
    console.debug(`Scene ${this.name} ran for ${this.sceneTime}ms`);
  }

  tick(): void {
    if (keyboardManager.hasKeyUp('Enter')) {
      this.sceneManager.pushScene(new BaseScene(this.sceneManager, this.resourceManager));
    }
    this.trauma -= this.traumaDampening;
    this.trauma = sat(this.trauma);
    this.sceneTime += Settings.fixedDeltaTime * Settings.timeScale;
  }
}
