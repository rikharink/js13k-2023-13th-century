import { RgbColor } from '../math/color';
import { makeOctaveNoise2D } from '../math/noise/2d';
import { normalize } from '../math/util';
import { Vector2 } from '../math/vector2';
import { Texture } from '../textures/texture';
import { generateTextureFromData } from '../textures/textures';

export interface Biome {
  name: string;
  treshold: number;
  color: RgbColor;
}

export interface MapSettings {
  seed: number;
  size: Vector2;
  octaves: number;
  baseFrequency: number;
  biomes: Biome[];
}

// biomes should be sorted by treshold
function findBiome(v: number, biomes: Biome[]): Biome {
  for (let biome of biomes) {
    if (v < biome.treshold) {
      return biome;
    }
  }
  return {
    name: 'NOTFOUND',
    treshold: Number.MAX_SAFE_INTEGER,
    color: [227, 28, 121],
  };
}

export function generateMap(gl: WebGL2RenderingContext, settings: MapSettings): Texture {
  const noise = makeOctaveNoise2D(settings.seed, settings.octaves, settings.baseFrequency);
  let n = settings.size[0] * settings.size[1];
  let noiseMap: number[] = new Array(n);
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  for (let i = 0; i < n; i++) {
    let n = noise(i % settings.size[0], Math.floor(i / settings.size[0]));
    if (n > max) {
      max = n;
    }
    if (n < min) {
      min = n;
    }
    noiseMap[i] = n;
  }
  noiseMap = noiseMap.map((n) => normalize(n, min, max));

  n *= 4;
  const data = new Uint8Array(n);
  for (let i = 0; i < n; i += 4) {
    let v = noiseMap[i / 4];
    const biome = findBiome(v, settings.biomes);
    data[i + 0] = biome.color[0];
    data[i + 1] = biome.color[1];
    data[i + 2] = biome.color[2];
    data[i + 3] = 255;
  }
  return generateTextureFromData(gl, data, settings.size);
}
