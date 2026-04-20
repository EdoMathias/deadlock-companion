import axios from 'axios';
import { DEADLOCK_ASSETS_BASE_URL } from '../../consts';
import { apiCache, CACHE_TTL } from '../../utils/apiCache';
import type { ItemMetadata, ItemDescription } from '../../types/items';

interface AssetsItemRaw {
  id: number;
  class_name: string;
  name: string;
  type: string;
  cost?: number | null;
  item_tier?: number;
  item_slot_type?: string;
  is_active_item?: boolean;
  activation?: string;
  shopable?: boolean;
  disabled?: boolean;
  image?: string | null;
  image_webp?: string | null;
  shop_image?: string | null;
  shop_image_webp?: string | null;
  description?: {
    desc?: string | null;
    desc2?: string | null;
    active?: string | null;
    passive?: string | null;
  } | null;
  [key: string]: any;
}

interface AssetsHeroRaw {
  id: number;
  class_name: string;
  name: string;
  images: {
    icon_hero_card?: string | null;
    icon_hero_card_webp?: string | null;
    icon_image_small?: string | null;
    icon_image_small_webp?: string | null;
    minimap_image?: string | null;
    minimap_image_webp?: string | null;
    top_bar_vertical_image?: string | null;
    top_bar_vertical_image_webp?: string | null;
    [key: string]: any;
  };
  [key: string]: any;
}

function mapRawToItemMetadata(raw: AssetsItemRaw): ItemMetadata | null {
  if (raw.type !== 'upgrade') return null;
  if (raw.disabled) return null;

  const desc: ItemDescription | null = raw.description
    ? {
        desc: raw.description.desc ?? null,
        active: raw.description.active ?? null,
        passive: raw.description.passive ?? null,
      }
    : null;

  return {
    id: raw.id,
    class_name: raw.class_name,
    name: raw.name,
    cost: raw.cost ?? null,
    item_tier: (raw.item_tier as 1 | 2 | 3 | 4 | 5) ?? 1,
    item_slot_type:
      (raw.item_slot_type as 'weapon' | 'spirit' | 'vitality') ?? 'weapon',
    is_active_item: raw.is_active_item ?? false,
    activation: raw.activation ?? 'passive',
    shopable: raw.shopable ?? false,
    image: raw.image ?? null,
    image_webp: raw.image_webp ?? null,
    shop_image: raw.shop_image ?? null,
    shop_image_webp: raw.shop_image_webp ?? null,
    description: desc,
  };
}

export async function fetchAllItems(
  language: string = 'english',
): Promise<ItemMetadata[]> {
  const cached = apiCache.get<ItemMetadata[]>(
    'item_metadata',
    `all_${language}`,
  );
  if (cached) return cached;

  const response = await axios.get<AssetsItemRaw[]>(
    `${DEADLOCK_ASSETS_BASE_URL}/v2/items`,
    { params: { language } },
  );

  const items = response.data
    .map(mapRawToItemMetadata)
    .filter((item): item is ItemMetadata => item !== null && item.shopable);

  apiCache.set('item_metadata', `all_${language}`, items, CACHE_TTL.ITEM_METADATA);
  return items;
}

export async function fetchItemById(
  idOrClassName: string | number,
  language: string = 'english',
): Promise<ItemMetadata | null> {
  const response = await axios.get<AssetsItemRaw>(
    `${DEADLOCK_ASSETS_BASE_URL}/v2/items/${idOrClassName}`,
    { params: { language } },
  );

  return mapRawToItemMetadata(response.data);
}

export async function fetchAllHeroes(
  language: string = 'english',
): Promise<AssetsHeroRaw[]> {
  const cached = apiCache.get<AssetsHeroRaw[]>(
    'heroes_metadata',
    `all_${language}`,
  );
  if (cached) return cached;

  const response = await axios.get<AssetsHeroRaw[]>(
    `${DEADLOCK_ASSETS_BASE_URL}/v2/heroes`,
    { params: { language, only_active: true } },
  );

  const data = response.data;
  apiCache.set('heroes_metadata', `all_${language}`, data, CACHE_TTL.ITEM_METADATA);
  return data;
}
