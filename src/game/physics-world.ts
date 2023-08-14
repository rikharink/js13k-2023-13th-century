import { Client, SpatialHashGrid } from '../data-structures/spatial-hash-grid';
import { AABB } from '../math/geometry/aabb';
import { Vector2, add, scale } from '../math/vector2';
import { Settings } from '../settings';

const v: Vector2 = [0, 0];

const gridSize: Vector2 = [50, 50];

interface RigidBody {
  id: number;
  position: Vector2;
  size: Vector2;
  acceleration: Vector2;
  velocity: Vector2;
  collider: AABB;
  client?: Client;
}

export class PhysicsWorld {
  private shg!: SpatialHashGrid;
  private bodies!: RigidBody[];

  initialize(bounds: AABB) {
    this.shg = new SpatialHashGrid(bounds, gridSize);
    this.bodies = [];
  }

  public add(body: RigidBody) {
    body.client = this.shg.newClient(body.id, body.collider);
    this.bodies.push(body);
  }

  public remove(body: RigidBody) {
    this.shg.remove(body.client!);
    body.client = undefined;
    this.bodies = this.bodies.filter((b) => b.id === body.id);
  }

  public tick(gravity: Vector2): void {
    const dt = Settings.fixedDeltaTime * Settings.timeScale;

    for (let body of this.bodies) {
      const broad = this.broadPhase(body);
      this.applyForces(body, broad, gravity);
      add(body.velocity, body.velocity, scale(v, body.acceleration, dt));
      add(body.position, body.position, scale(v, body.velocity, dt));
      this.shg.updateClient(body.client!);
    }
  }

  private applyForces(_body: RigidBody, broad: RigidBody[], _gravity: Vector2) {
    // NARROW
    for (let candidate of broad) {
      console.debug(candidate);
    }
  }

  private broadPhase(body: RigidBody): RigidBody[] {
    const ids = this.shg.findNear(body.collider, [body.id]).map((c) => c.entityId);
    return this.bodies.filter((b) => ids.findIndex((i) => b.id === i) !== -1);
  }
}
