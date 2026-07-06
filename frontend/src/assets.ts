export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://ftnsishunxghsoadiaze.supabase.co";
const ASSET_BUCKET = "ui-assets";

export function storageAsset(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${ASSET_BUCKET}/${path}`;
}

export const logoAssets = {
  startKo: storageAsset("logos/start-ko.png"),
  appEn: storageAsset("logos/in-app-en.png")
};

export const categoryAssets = {
  korean: storageAsset("categories/korean.png"),
  japanese: storageAsset("categories/japanese.png"),
  chinese: storageAsset("categories/chinese.png"),
  western: storageAsset("categories/western.png"),
  asian: storageAsset("categories/asian.png"),
  meat: storageAsset("categories/meat.png"),
  fastfood: storageAsset("categories/fast-food.png")
};

export const tagAssets = {
  spicy: storageAsset("tags/spicy.png"),
  soup: storageAsset("tags/soup.png"),
  grilled: storageAsset("tags/grilled.png"),
  braised: storageAsset("tags/braised.png"),
  fried: storageAsset("tags/fried.png"),
  stirfried: storageAsset("tags/stir-fried.png"),
  steamed: storageAsset("tags/steamed.png"),
  boiled: storageAsset("tags/boiled.png"),
  raw: storageAsset("tags/raw.png")
};

export const allergyAssets = {
  shrimp: storageAsset("allergies/shrimp.png"),
  crab: storageAsset("allergies/crab.png"),
  milk: storageAsset("allergies/milk.png"),
  wheat: storageAsset("allergies/wheat.png"),
  peanut: storageAsset("allergies/peanut.png"),
  egg: storageAsset("allergies/egg.png"),
  mackerel: storageAsset("allergies/mackerel.png"),
  chicken: storageAsset("allergies/chicken.png"),
  soy: storageAsset("allergies/soy.png"),
  pork: storageAsset("allergies/pork.png"),
  buckwheat: storageAsset("allergies/buckwheat.png"),
  peach: storageAsset("allergies/peach.png"),
  sulfites: storageAsset("allergies/sulfites.png"),
  squid: storageAsset("allergies/squid.png"),
  beef: storageAsset("allergies/beef.png"),
  pineNut: storageAsset("allergies/pine-nut.png"),
  shellfish: storageAsset("allergies/shellfish.png"),
  tomato: storageAsset("allergies/tomato.png"),
  walnut: storageAsset("allergies/walnut.png")
};
