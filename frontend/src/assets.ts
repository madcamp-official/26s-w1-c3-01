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
  korean: localAsset("categories/korean.png"),
  japanese: localAsset("categories/japanese.png"),
  chinese: localAsset("categories/chinese.png"),
  western: localAsset("categories/western.png"),
  asian: localAsset("categories/asian.png"),
  meat: localAsset("categories/meat.png"),
  fastfood: localAsset("categories/fast-food.png")
};

export const tagAssets = {
  spicy: localAsset("tags/spicy.png"),
  soup: localAsset("tags/soup.png"),
  grilled: localAsset("tags/grilled.png"),
  braised: localAsset("tags/braised.png"),
  fried: localAsset("tags/fried.png"),
  stirfried: localAsset("tags/stir-fried.png"),
  steamed: localAsset("tags/steamed.png"),
  boiled: localAsset("tags/boiled.png"),
  raw: localAsset("tags/raw.png")
};

export const allergyAssets = {
  shrimp: localAsset("allergies/shrimp.png"),
  crab: localAsset("allergies/crab.png"),
  milk: localAsset("allergies/milk.png"),
  wheat: localAsset("allergies/wheat.png"),
  peanut: localAsset("allergies/peanut.png"),
  egg: localAsset("allergies/egg.png"),
  mackerel: localAsset("allergies/mackerel.png"),
  chicken: localAsset("allergies/chicken.png"),
  soy: localAsset("allergies/soy.png"),
  pork: localAsset("allergies/pork.png"),
  buckwheat: localAsset("allergies/buckwheat.png"),
  peach: localAsset("allergies/peach.png"),
  sulfites: localAsset("allergies/sulfites.png"),
  squid: localAsset("allergies/squid.png"),
  beef: localAsset("allergies/beef.png"),
  pineNut: localAsset("allergies/pine-nut.png"),
  shellfish: localAsset("allergies/shellfish.png"),
  tomato: localAsset("allergies/tomato.png"),
  walnut: localAsset("allergies/walnut.png")
};
