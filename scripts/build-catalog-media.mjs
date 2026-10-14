// Publish the downloaded product photos as compressed static assets. Run this
// when the catalog or its photos change; deployments only validate the result.
//
//   node scripts/build-catalog-media.mjs          # (re)encode photos for every family in products.json
//   node scripts/build-catalog-media.mjs --check  # validate the manifest + files (prebuild / predev)
//   node scripts/build-catalog-media.mjs --prune  # drop families no longer in products.json from the
//                                                 # manifest and delete their photos (no re-encoding)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildCatalog, loadSource, SOURCE_DIR } from "./import-brand-catalog.mjs";
import { CATALOG_MEDIA_PREFIX, validateCatalogMedia } from "../app/products/data/catalog-media.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CATALOG_FILE = path.join(ROOT, "app/products/data/products.json");
const MEDIA_FILE = path.join(ROOT, "app/products/data/catalog-media.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const WIDTH = 768;
const QUALITY = 78;
const PROFILE = `webp-${WIDTH}-${QUALITY}-v1`;

export async function generateCatalogMedia({ catalog, sources, imageDir, publicDir, onProgress = () => {} }) {
  const { default: sharp } = await import("sharp");
  sharp.concurrency(1);
  const familyFiles = new Map();
  for (const product of catalog) {
    if (familyFiles.has(product.family)) continue;
    const row = sources.get(product.sku)?.product;
    const files = String(row?.image_files ?? "").split("|")
      .map((file) => file.trim().replace(/^images\//, ""))
      .filter((file) => /^[A-Za-z0-9_-][A-Za-z0-9._-]*\.(?:png|jpe?g|webp|gif|avif)$/i.test(file));
    familyFiles.set(product.family, [...new Set(files)]);
  }
  const files = [...new Set([...familyFiles.values()].flat())];
  const published = new Map();
  const failed = [];
  const outputDir = path.join(publicDir, "assets/catalog");
  await mkdir(outputDir, { recursive: true });
  let cursor = 0;
  let completed = 0;
  await Promise.all(Array.from({ length: Math.min(4, files.length) }, async () => {
    while (cursor < files.length) {
      const job = cursor++;
      const file = files[job];
      try {
        const input = await readFile(path.join(imageDir, file));
        const hash = createHash("sha256").update(PROFILE).update(input).digest("hex").slice(0, 16);
        const target = path.join(outputDir, `${hash}.webp`);
        if (!existsSync(target) || statSync(target).size === 0) {
          const temporary = `${target}.${process.pid}.${job}.tmp`;
          await sharp(input, { failOn: "error" }).rotate()
            .resize({ width: WIDTH, height: WIDTH, fit: "inside", withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 2 }).toFile(temporary);
          await rename(temporary, target);
        }
        published.set(file, `${CATALOG_MEDIA_PREFIX}${hash}.webp`);
      } catch (error) {
        failed.push({ file, reason: error.message });
      }
      completed++;
      if (completed % 500 === 0 || completed === files.length) onProgress(completed, files.length);
    }
  }));
  const media = { schemaVersion: 1, width: WIDTH, quality: QUALITY, products: {} };
  for (const [family, photos] of familyFiles) {
    media.products[family] = [...new Set(photos.map((file) => published.get(file)).filter(Boolean))];
  }
  const problems = validateCatalogMedia(catalog, media, (image) => existsSync(path.join(publicDir, image)));
  if (problems.length) throw new Error(problems.slice(0, 20).join("\n"));
  return { media, failed };
}

function checkMedia(catalog, media) {
  const problems = validateCatalogMedia(catalog, media, (image) => {
    const file = path.join(PUBLIC_DIR, image);
    return existsSync(file) && statSync(file).size > 0;
  });
  if (problems.length) throw new Error(problems.slice(0, 20).join("\n"));
  const images = new Set(Object.values(media.products).flat());
  const bytes = [...images].reduce((total, image) => total + statSync(path.join(PUBLIC_DIR, image)).size, 0);
  console.log(`[catalog-media] ${Object.keys(media.products).length} families, ${images.size} photos, ${(bytes / 1048576).toFixed(1)} MB; all ${catalog.length} listings have production photos`);
}

// Keep only the families that are still in the catalogue; delete every photo
// under public/assets/catalog that no remaining family references. Used after
// products were removed from the catalogue (app/config/catalog-exclusions.js).
async function pruneMedia(catalog, media) {
  const families = new Set(catalog.map((product) => product.family));
  const kept = {};
  let droppedFamilies = 0;
  for (const [family, images] of Object.entries(media.products)) {
    if (families.has(family)) kept[family] = images;
    else droppedFamilies += 1;
  }
  const referenced = new Set(Object.values(kept).flat().map((image) => path.basename(image)));
  const outputDir = path.join(PUBLIC_DIR, "assets/catalog");
  let removedFiles = 0;
  let removedBytes = 0;
  for (const file of readdirSync(outputDir)) {
    if (referenced.has(file)) continue;
    const full = path.join(outputDir, file);
    removedBytes += statSync(full).size;
    unlinkSync(full);
    removedFiles += 1;
  }
  const pruned = { ...media, products: kept };
  const json = JSON.stringify(pruned) + "\n";
  if (readFileSync(MEDIA_FILE, "utf8") !== json) await writeFile(MEDIA_FILE, json);
  console.log(`[catalog-media] pruned ${droppedFamilies} families from the manifest; deleted ${removedFiles} unreferenced photos (${(removedBytes / 1048576).toFixed(1)} MB)`);
  return pruned;
}

async function main() {
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, "utf8"));
  if (process.argv.includes("--check")) {
    checkMedia(catalog, JSON.parse(readFileSync(MEDIA_FILE, "utf8")));
    return;
  }
  if (process.argv.includes("--prune")) {
    const media = await pruneMedia(catalog, JSON.parse(readFileSync(MEDIA_FILE, "utf8")));
    checkMedia(catalog, media);
    return;
  }
  const { sources } = buildCatalog(loadSource(), { licensedMedia: false });
  const { media, failed } = await generateCatalogMedia({ catalog, sources,
    imageDir: path.join(SOURCE_DIR, "images"), publicDir: PUBLIC_DIR,
    onProgress: (done, total) => console.log(`[catalog-media] ${done}/${total} photos processed`),
  });
  const json = JSON.stringify(media) + "\n";
  if (!existsSync(MEDIA_FILE) || readFileSync(MEDIA_FILE, "utf8") !== json) {
    const temporary = `${MEDIA_FILE}.${process.pid}.tmp`;
    await writeFile(temporary, json);
    await rename(temporary, MEDIA_FILE);
  }
  if (failed.length) console.warn(`[catalog-media] ${failed.length} unusable secondary photos skipped: ${JSON.stringify(failed.slice(0, 10))}`);
  checkMedia(catalog, media);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(`[catalog-media] ${error.message}`); process.exitCode = 1; });
}
