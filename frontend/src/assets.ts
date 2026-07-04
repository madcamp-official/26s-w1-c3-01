const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://ftnsishunxghsoadiaze.supabase.co";
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
  fried: storageAsset("tags/fried.png"),
  stirfried: storageAsset("tags/stir-fried.png"),
  steamed: storageAsset("tags/steamed.png")
};

export const allergyAssets = {
  shrimp: storageAsset("allergies/shrimp.png"),
  crab: storageAsset("allergies/crab.png"),
  milk: storageAsset("allergies/milk.png"),
  wheat: storageAsset("allergies/wheat.png"),
  peanut: storageAsset("allergies/peanut.png"),
  egg: storageAsset("allergies/egg.png")
};
