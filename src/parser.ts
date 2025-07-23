import * as fs from "fs";
import * as zlib from "zlib";

export interface CelData {
  layerIndex: number;
  frameIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rawData: Buffer; // un‑compressed RGBA | Gray | Index data
}

export interface LayerData {
  index: number;
  name: string;
}
export interface AsepriteData {
  width: number;
  height: number;
  frames: number;
  layers: LayerData[];
  cels: CelData[];
}

// --- little‑helper readers ---------------------------------------------------
const WORD = (b: Buffer, o: number) => b.readUInt16LE(o);
const DWORD = (b: Buffer, o: number) => b.readUInt32LE(o);
const SHORT = (b: Buffer, o: number) => b.readInt16LE(o);
const BYTE = (b: Buffer, o: number) => b.readUInt8(o);
const STRING = (b: Buffer, o: number) => {
  const len = WORD(b, o);
  return b.toString("utf8", o + 2, o + 2 + len);
};

// ---------------------------------------------------------------------------
export function parseAseprite(path: string): AsepriteData {
  const buf = fs.readFileSync(path);
  const frameCount = WORD(buf, 6);
  const width = WORD(buf, 8);
  const height = WORD(buf, 10);

  const layers: LayerData[] = [];
  const cels: CelData[] = [];

  let cursor = 128; // skip 128‑byte file header
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const bytesInFrame = DWORD(buf, cursor);
    const chunkOld = WORD(buf, cursor + 6);
    const chunkNew = DWORD(buf, cursor + 12);
    const chunks = chunkOld === 0xffff ? chunkNew : chunkOld;

    let chunkPtr = cursor + 16; // 16‑byte frame header
    const frameEnd = cursor + bytesInFrame;

    while (chunkPtr < frameEnd) {
      const chunkSize = DWORD(buf, chunkPtr);
      const chunkType = WORD(buf, chunkPtr + 4);

      switch (chunkType) {
        case 0x2004:
          {
            const header = chunkPtr + 6;
            const name = STRING(buf, header + 16);
            layers.push({ index: layers.length, name });
          }
          break;
        case 0x2005:
          {
            const base = chunkPtr + 6;
            const layerI = WORD(buf, base);
            const x = SHORT(buf, base + 2);
            const y = SHORT(buf, base + 4);
            const opacity = BYTE(buf, base + 6);
            const celTyp = WORD(buf, base + 7);

            if (celTyp !== 2) {
              break;
            }

            const w = WORD(buf, base + 16);
            const h = WORD(buf, base + 18);

            const dataStart = base + 20;
            const dataEnd = chunkPtr + chunkSize;
            const comp = buf.subarray(dataStart, dataEnd);

            let raw: Buffer;
            try {
              raw = zlib.inflateSync(comp);
            } catch {
              console.warn(`⚠️ decompress f${frameIndex} l${layerI}`);
              break;
            }

            cels.push({ layerIndex: layerI, frameIndex, x, y, width: w, height: h, opacity, rawData: raw });
          }
          break;

        default:
          console.warn(`⚠️ unknown chunk type 0x${chunkType.toString(16)} at f${frameIndex} c${chunkPtr}`);
          break;
      }
      chunkPtr += chunkSize;
    }
    cursor += bytesInFrame;
  }
  return { width, height, frames: frameCount, layers, cels };
}
