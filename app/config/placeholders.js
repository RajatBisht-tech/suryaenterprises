// Placeholder product imagery. Every listing has a published photo
// (app/products/data/catalog-media.json); these flat SVG illustrations are
// the fallback the import writes into `image` and the frame ProductImage
// shows while a photo loads or if it fails. ONE data-driven map: level-2
// subcategory slug first, then the level-1 category slug, then a generic
// fallback.
//
// Files live in public/assets/placeholders (hand-drawn SVG, 320x320, white
// frame, crop green / harvest yellow / earth brown palette).

export const PLACEHOLDER_DIR = "/assets/placeholders/";

// Level-1 category slug -> file.
const BY_CATEGORY = {
  seeds: "seeds.svg",
  "traps-and-repellents": "traps-and-lures.svg",
  "farm-machinery": "farm-machinery.svg",
};

// Level-2 subcategory slug -> file (only the common ones have their own art).
const BY_SUBCATEGORY = {
  "traps-and-lures": "traps-and-lures.svg",
  sprayers: "sprayers.svg",
  tarpaulin: "tarpaulin.svg",
  mulches: "tarpaulin.svg",
  "brush-cutter": "brush-cutter.svg",
  "tillers-cultivator": "brush-cutter.svg",
};

export const GENERIC_PLACEHOLDER = `${PLACEHOLDER_DIR}generic.svg`;

export function placeholderFor(categorySlug, subcategorySlug) {
  const file = BY_SUBCATEGORY[subcategorySlug] ?? BY_CATEGORY[categorySlug];
  return file ? `${PLACEHOLDER_DIR}${file}` : GENERIC_PLACEHOLDER;
}

export const isPlaceholderImage = (src) => typeof src === "string" && src.startsWith(PLACEHOLDER_DIR);

// Every file the map can produce (the import script verifies they exist).
export const PLACEHOLDER_FILES = [...new Set([...Object.values(BY_CATEGORY), ...Object.values(BY_SUBCATEGORY), "generic.svg"])];
