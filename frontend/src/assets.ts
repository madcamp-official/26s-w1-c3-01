export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://ftnsishunxghsoadiaze.supabase.co";
const ASSET_BUCKET = "ui-assets";

export function storageAsset(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${ASSET_BUCKET}/${path}`;
}

export function localAsset(path: string) {
  return `/assets/${path}`;
}

export function menuAsset(menuId?: number | null) {
  return typeof menuId === "number" && menuId > 0 ? storageAsset(`menus/${menuId}.png`) : "";
}

export const logoAssets = {
  startKo: storageAsset("logos/start-ko.png"),
  appEn: storageAsset("logos/in-app-en.png")
};

export const categoryAssets = {
  korean: localAsset("categories/korean.webp"),
  japanese: localAsset("categories/japanese.webp"),
  chinese: localAsset("categories/chinese.webp"),
  western: localAsset("categories/western.webp"),
  asian: localAsset("categories/asian.webp"),
  meat: localAsset("categories/meat.webp"),
  fastfood: localAsset("categories/fast-food.webp")
};

export const tagAssets = {
  spicy: localAsset("tags/spicy.webp"),
  soup: localAsset("tags/soup.webp"),
  grilled: localAsset("tags/grilled.webp"),
  braised: localAsset("tags/braised.webp"),
  fried: localAsset("tags/fried.webp"),
  stirfried: localAsset("tags/stir-fried.webp"),
  steamed: localAsset("tags/steamed.webp"),
  boiled: localAsset("tags/boiled.webp"),
  raw: localAsset("tags/raw.webp")
};

export const allergyAssets = {
  shrimp: localAsset("allergies/shrimp.webp"),
  crab: localAsset("allergies/crab.webp"),
  milk: localAsset("allergies/milk.webp"),
  wheat: localAsset("allergies/wheat.webp"),
  peanut: localAsset("allergies/peanut.webp"),
  egg: localAsset("allergies/egg.webp"),
  mackerel: localAsset("allergies/mackerel.webp"),
  chicken: localAsset("allergies/chicken.webp"),
  soy: localAsset("allergies/soy.webp"),
  pork: localAsset("allergies/pork.webp"),
  buckwheat: localAsset("allergies/buckwheat.webp"),
  peach: localAsset("allergies/peach.webp"),
  sulfites: localAsset("allergies/sulfites.webp"),
  squid: localAsset("allergies/squid.webp"),
  beef: localAsset("allergies/beef.webp"),
  pineNut: localAsset("allergies/pine-nut.webp"),
  shellfish: localAsset("allergies/shellfish.webp"),
  tomato: localAsset("allergies/tomato.webp"),
  walnut: localAsset("allergies/walnut.webp")
};
