import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { parseAseprite, AsepriteData, CelData } from "./parser";
import * as fs from "fs";

type Dir = "up" | "down" | "left" | "right";
const DIR_ORDER: Dir[] = ["up", "down", "left", "right"];
const FRAMES_PER_DIR = 6;

function blit(ctx: CanvasRenderingContext2D, cel: CelData, dstX: number, dstY: number, flipX = false) {
  const imgData = ctx.createImageData(cel.width, cel.height);
  imgData.data.set(cel.rawData);
  if (flipX) {
    // AI did the magic here to flip horizontally
    // https://stackoverflow.com/questions/1114465/how-to-flip-a-canvas-image
    const w = cel.width,
      h = cel.height,
      d = imgData.data;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w / 2; x++) {
        const l = (y * w + x) * 4,
          r = (y * w + (w - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) {
          const t = d[l + k];
          d[l + k] = d[r + k];
          d[r + k] = t;
        }
      }
  }
  ctx.putImageData(imgData, dstX, dstY);
}

// main ------------------------------------------------------------
export function generateSheets(ase: AsepriteData, outDir: string) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const layer of ase.layers) {
    const canvas = createCanvas(
      ase.width * FRAMES_PER_DIR * DIR_ORDER.length, // 32 * 6 * 4 = 768
      ase.height // single‑row sheet
    );
    const ctx = canvas.getContext("2d");

    const byFrame = ase.cels.filter((c) => c.layerIndex === layer.index);

    DIR_ORDER.forEach((dir, dirIdx) => {
      for (let f = 0; f < FRAMES_PER_DIR; f++) {
        const cel = byFrame.find((c) => c.frameIndex === f);
        if (!cel) continue;
        const destX = (dirIdx * FRAMES_PER_DIR + f) * ase.width;
        const flip = dir === "left"; // flip RIGHT for LEFT
        blit(ctx, cel, destX, 0, flip);
      }
    });

    fs.writeFileSync(`${outDir}/${layer.name}.png`, canvas.toBuffer("image/png"));
  }
}
