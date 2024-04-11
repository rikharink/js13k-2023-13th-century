import { Vector2, angle, distance, normalize, scale, subtract } from '../math/vector2';
import { Radian } from '../types';

export interface BoidWrapper {
  id: number;
  boid: Boid;
}

export interface Boid {
  id: number;
  position: Vector2;
  velocity: Vector2;
  fov: Radian;
}

export interface Deflector {
  position: Vector2;
  radius: number;
  strength: number;
}

function isInFov(boid: Boid, position: Vector2): boolean {
  const r = angle(boid.velocity, subtract([0, 0], position, boid.position));
  return r < boid.fov / 2;
}

export function separation(self: BoidWrapper, others: BoidWrapper[], seperationDistance: number): Vector2 {
  const steer: Vector2 = [0, 0];
  let count = 0;

  for (const other of others) {
    if (other.id === self.id) continue;
    const dist = distance(self.boid.position, other?.boid.position);
    if (dist < seperationDistance && isInFov(self.boid, other.boid.position)) {
      const diff = subtract([0, 0], self.boid.position, other.boid.position);
      normalize(diff, diff);
      steer[0] += diff[0] / dist;
      steer[1] += diff[1] / dist;
      count++;
    }
  }

  if (count > 0) {
    steer[0] /= count;
    steer[1] /= count;
  }

  return steer;
}

export function alignment(self: BoidWrapper, others: BoidWrapper[], alignmentDistance: number): Vector2 {
  const avgVelocity: Vector2 = [0, 0];
  let count = 0;

  for (const other of others) {
    if (other.id === self.id) continue;
    const dist = distance(self.boid.position, other.boid.position);

    if (dist < alignmentDistance && isInFov(self.boid, other.boid.position)) {
      avgVelocity[0] += other.boid.velocity[0];
      avgVelocity[1] += other.boid.velocity[1];
      count++;
    }
  }

  if (count > 0) {
    avgVelocity[0] /= count;
    avgVelocity[1] /= count;
    normalize(avgVelocity, avgVelocity);
  }

  return avgVelocity;
}

export function cohesion(self: BoidWrapper, others: BoidWrapper[], cohesionDistance: number): Vector2 {
  const centerOfMass: Vector2 = [0, 0];
  let count = 0;
  for (const other of others) {
    if (other.id === self.id) continue;
    //const other = others.find((o) => o.id === client.entityId)!;
    const dist = distance(self.boid.position, other.boid.position);

    if (dist < cohesionDistance && isInFov(self.boid, other.boid.position)) {
      centerOfMass[0] += other.boid.position[0];
      centerOfMass[1] += other.boid.position[1];
      count++;
    }
  }

  if (count > 0) {
    centerOfMass[0] /= count;
    centerOfMass[1] /= count;
    const desired = subtract(centerOfMass, centerOfMass, self.boid.position);
    normalize(desired, desired);
    return desired;
  }

  return [0, 0];
}

//TODO: maybe make it a collision shape instead of a point + radius
export function deflect(boid: BoidWrapper, deflectors: Deflector[]): Vector2 {
  const deflectorSeparation: Vector2 = [0, 0];
  for (const deflector of deflectors) {
    const distanceToDeflector = distance(boid.boid.position, deflector.position);
    if (distanceToDeflector < deflector.radius) {
      const toDeflector = normalize([0, 0], subtract([0, 0], deflector.position, boid.boid.position));
      deflectorSeparation[0] += toDeflector[0] / distanceToDeflector;
      deflectorSeparation[1] += toDeflector[1] / distanceToDeflector;
      scale(deflectorSeparation, deflectorSeparation, deflector.strength);
    }
  }
  return deflectorSeparation;
}

export function seek(boid: BoidWrapper, goal: Vector2, seekDistance: number): Vector2 {
  const dist = distance(boid.boid.position, goal);
  if (dist < seekDistance && isInFov(boid.boid, goal)) {
    const desired = subtract([0, 0], goal, boid.boid.position);
    normalize(desired, desired);
    return desired;
  }
  return [0, 0];
}
