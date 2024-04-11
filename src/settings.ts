import { TAU } from './math/const';

export const Settings = {
  resolution: [1280, 800],
  fixedDeltaTime: 1000 / 60,
  minLoadingTimeMs: 100,
  maxRotationalShake: TAU * 0.1,
  maxTranslationalShake: 25,
  seed: 1337,
  timeScale: 1,
  seperationDistance: 100,
  seperationWeight: 200,
  alignmentDistance: 30,
  alignmentWeight: 4,
  cohesionDistance: 100,
  cohesionWeight: 1,
  seekDistance: 1000,
  seekWeight: 1,
  maxVelocity: 10,
};
