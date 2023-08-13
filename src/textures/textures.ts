import { RgbColor } from '../math/color';
import { Random } from '../math/random';
import { Size } from '../types';
import {
  GL_LINEAR,
  GL_REPEAT,
  GL_RGBA,
  GL_TEXTURE0,
  GL_TEXTURE_2D,
  GL_TEXTURE_MAG_FILTER,
  GL_TEXTURE_MIN_FILTER,
  GL_TEXTURE_WRAP_S,
  GL_TEXTURE_WRAP_T,
  GL_UNPACK_FLIP_Y_WEBGL,
  GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL,
  GL_UNSIGNED_BYTE,
} from '../rendering/gl-constants';
import { Texture } from './texture';
import { getWhiteNoise } from '../math/noise/whitenoise';

export function generateTextureFromData(
  gl: WebGL2RenderingContext,
  data: Uint8Array,
  size: [width: number, height: number],
): Texture {
  gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  const texture = gl.createTexture()!;
  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, texture);
  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
  gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
  gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, size[0], size[1], 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
  return { texture, size, sourceRect: { position: [0, 0], size } };
}

export function generateColorNoiseTexture(gl: WebGL2RenderingContext, size: Size, rng: Random): Texture {
  const n = size[0] * size[1];
  const pixels: Uint8Array = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const pi = i * 4;
    pixels[pi + 0] = 255 * rng();
    pixels[pi + 1] = 255 * rng();
    pixels[pi + 2] = 255 * rng();
    pixels[pi + 3] = 255;
  }

  return generateTextureFromData(gl, pixels, size);
}

export function generateWhiteNoiseTexture(gl: WebGL2RenderingContext, size: Size, rng: Random): Texture {
  return generateTextureFromData(gl, float32ArrayToUint8Array(getWhiteNoise(size, rng)), size);
}

export function float32ArrayToUint8Array(input: Float32Array): Uint8Array {
  const output = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] * 255;
  }
  return output;
}

export function generateRampTexture(gl: WebGL2RenderingContext, colors: RgbColor[]): Texture {
  const pixels: Uint8Array = new Uint8Array(colors.length * 4);
  for (let i = 0; i < colors.length; i++) {
    const pi = i * 4;
    pixels[pi + 0] = colors[i][0];
    pixels[pi + 1] = colors[i][1];
    pixels[pi + 2] = colors[i][2];
    pixels[pi + 3] = 255;
  }
  return generateTextureFromData(gl, pixels, [colors.length, 1]);
}

export function generateSolidTexture(gl: WebGL2RenderingContext, color: RgbColor): Texture {
  return generateRampTexture(gl, [color]);
}
