// Zips extension/ into web/public/billy-extension.zip for the /extension download link.
// Usage: node scripts/pack-extension.mjs [--server https://billy.example.app]
// --server sets the zip's default Billy server; the unpacked folder keeps localhost for dev.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT } from "./image-api.mjs";

const flag = process.argv.indexOf("--server");
const server = (flag >= 0 ? process.argv[flag + 1] : process.env.BILLY_PUBLIC_URL)?.replace(/\/+$/, "");

const staging = mkdtempSync(join(tmpdir(), "billy-pack-"));
const out = join(ROOT, "web/public/billy-extension.zip");
try {
  cpSync(join(ROOT, "extension"), join(staging, "billy-extension"), { recursive: true });
  if (server) {
    if (!/^https?:\/\/[^/]+$/.test(server)) throw new Error(`--server must be an origin like https://billy.vercel.app, got ${server}`);
    const shared = join(staging, "billy-extension/shared.js");
    const source = readFileSync(shared, "utf8");
    const patched = source.replace(/export const DEFAULT_SERVER = "[^"]*";/, `export const DEFAULT_SERVER = "${server}";`);
    if (patched === source) throw new Error("DEFAULT_SERVER not found in extension/shared.js");
    writeFileSync(shared, patched);
  }
  rmSync(out, { force: true });
  execFileSync("zip", ["-r", "-X", out, "billy-extension", "-x", "*.DS_Store", "billy-extension/icons/icon.svg"], {
    cwd: staging,
    stdio: "ignore",
  });
  console.log(`Packed ${out} (${(statSync(out).size / 1024).toFixed(0)} KB), default server ${server ?? "http://localhost:3000"}`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
