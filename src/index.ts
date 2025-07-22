import * as fs from "fs";

function readWORD(buffer: Buffer, offset: number): number {
  return buffer.readUInt16LE(offset);
}

function readDWORD(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

function readHeader(buffer: Buffer) {
  const size = readDWORD(buffer, 0);
  const magic = readWORD(buffer, 4);
  const frames = readWORD(buffer, 6);
  const width = readWORD(buffer, 8);
  const height = readWORD(buffer, 10);
  const colorDepth = readWORD(buffer, 12);

  return {
    size,
    magic,
    frames,
    width,
    height,
    colorDepth,
  };
}

function readFrameHeader(buffer: Buffer, offset: number) {
  const bytesInFrame = readDWORD(buffer, offset);
  const magic = readWORD(buffer, offset + 4);
  const oldChunkCount = readWORD(buffer, offset + 6);
  const duration = readWORD(buffer, offset + 8);
  const chunkCount = readDWORD(buffer, offset + 12);

  return {
    bytesInFrame,
    magic,
    oldChunkCount,
    duration,
    chunkCount,
  };
}

function main() {
  const filepath = process.argv[2];
  if (!filepath) {
    console.error("Usage: ts-node src/index.ts <file.aseprite>");
    process.exit(1);
  }

  const buffer = fs.readFileSync(filepath);
  const header = readHeader(buffer);
  console.log("Header:", header);

  const frameOffset = 128;
  const frameHeader = readFrameHeader(buffer, frameOffset);
  console.log("First Frame Header:", frameHeader);
}

main();
