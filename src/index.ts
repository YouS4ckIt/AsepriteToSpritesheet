import { parseAseprite } from "./parser";
import { generateSheets } from "./spritesheet";

async function main() {
  const ase = parseAseprite(process.argv[2]);
  generateSheets(ase, "./output");
}
main();
