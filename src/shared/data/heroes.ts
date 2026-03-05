/**
 * Static hero map derived from the deadlock-api.com /v2/heroes response.
 * Keyed by hero ID (the same `hero_id` used in match history, live match, etc.).
 *
 * Contains only the fields needed for display purposes:
 *   id, class_name, name, tags, images
 *
 * Source: https://assets.deadlock-api.com/v2/heroes
 * Last updated: 2026-03-05
 */

export interface HeroImages {
  icon_hero_card?: string;
  icon_hero_card_webp?: string;
  icon_image_small?: string;
  icon_image_small_webp?: string;
  minimap_image?: string;
  minimap_image_webp?: string;
  hero_card_critical?: string;
  hero_card_critical_webp?: string;
  hero_card_gloat?: string;
  hero_card_gloat_webp?: string;
  top_bar_vertical_image?: string;
  top_bar_vertical_image_webp?: string;
  background_image?: string;
  background_image_webp?: string;
  name_image?: string;
}

export interface HeroInfo {
  id: number;
  class_name: string;
  name: string;
  tags: string[];
  images: HeroImages;
}

/** Hero map keyed by hero ID. */
export const HEROES: Record<number, HeroInfo> = {
  1: {
    id: 1,
    class_name: 'hero_inferno',
    name: 'Infernus',
    tags: ['Arsonist', 'Explosive', 'Burn Rubber'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/infernus_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/infernus_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/infernus.svg',
    },
  },
  2: {
    id: 2,
    class_name: 'hero_gigawatt',
    name: 'Seven',
    tags: ['High Voltage', 'Merciless', 'Area Denial'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/gigawatt_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/seven_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/seven_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/seven.svg',
    },
  },
  3: {
    id: 3,
    class_name: 'hero_hornet',
    name: 'Vindicta',
    tags: ['Sniper', 'Soaring', 'One Shot Kill'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/hornet_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/vindicta_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/vindicta_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/vindicta.svg',
    },
  },
  4: {
    id: 4,
    class_name: 'hero_ghost',
    name: 'Lady Geist',
    tags: ['Lifesteal', 'Self Damage', 'Fatale'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/spectre_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/geist_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/geist_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/lady_geist.svg',
    },
  },
  6: {
    id: 6,
    class_name: 'hero_atlas',
    name: 'Abrams',
    tags: ['Tank', 'Brawler', 'Bull-Headed'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bull_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/abrams_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/abrams_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/abrams.svg',
    },
  },
  7: {
    id: 7,
    class_name: 'hero_wraith',
    name: 'Wraith',
    tags: ['Duelist', 'Isolator', 'Telekinetic'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/wraith_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/wraith_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/wraith_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/wraith.svg',
    },
  },
  8: {
    id: 8,
    class_name: 'hero_forge',
    name: 'McGinnis',
    tags: ['Inventor', 'Support', 'Disruption'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/engineer_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/mcginnis_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/mcginnis_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/mcginnis.svg',
    },
  },
  10: {
    id: 10,
    class_name: 'hero_chrono',
    name: 'Paradox',
    tags: ['Calculated', 'Disruptor', 'Tactician'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/chrono_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/paradox_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/paradox_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/paradox.svg',
    },
  },
  11: {
    id: 11,
    class_name: 'hero_dynamo',
    name: 'Dynamo',
    tags: ['Teamplay', 'Initiator', 'Clutch'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/sumo_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/dynamo_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/dynamo_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/dynamo.svg',
    },
  },
  12: {
    id: 12,
    class_name: 'hero_kelvin',
    name: 'Kelvin',
    tags: ['Protector', 'Explorer', 'Ice Cold'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kelvin_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/kelvin_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/kelvin_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/kelvin.svg',
    },
  },
  13: {
    id: 13,
    class_name: 'hero_haze',
    name: 'Haze',
    tags: ['Assassin', 'Stealthy', 'Lethal'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/haze_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/haze_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/haze_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/haze.svg',
    },
  },
  14: {
    id: 14,
    class_name: 'hero_astro',
    name: 'Holliday',
    tags: ['Crackshot', 'Explosive', 'Apprehender'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/astro_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/astro_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/astro_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/holliday.svg',
    },
  },
  15: {
    id: 15,
    class_name: 'hero_bebop',
    name: 'Bebop',
    tags: ['Hook', 'Bomb', 'Punch'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bebop_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/bebop_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/bebop_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/bebop.svg',
    },
  },
  16: {
    id: 16,
    class_name: 'hero_nano',
    name: 'Calico',
    tags: ['Tricksy', 'Slippery', 'Burst Damage'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/nano_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/calico_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/calico_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/calico.svg',
    },
  },
  17: {
    id: 17,
    class_name: 'hero_orion',
    name: 'Grey Talon',
    tags: ['Precision', 'Hunter', 'Area Denial'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/archer_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/grey_talon_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/grey_talon_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/grey_talon.svg',
    },
  },
  18: {
    id: 18,
    class_name: 'hero_krill',
    name: 'Mo & Krill',
    tags: ['Tag-Team', 'Initiator', 'Burrower'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/digger_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/krill_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/krill_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/mo_krill.svg',
    },
  },
  19: {
    id: 19,
    class_name: 'hero_shiv',
    name: 'Shiv',
    tags: ['Rage', 'Bleed', 'Repeat'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/shiv_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/shiv_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/shiv_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/shiv.svg',
    },
  },
  20: {
    id: 20,
    class_name: 'hero_tengu',
    name: 'Ivy',
    tags: ['Team-up', 'Disruptor', 'Rock Solid'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/tengu_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/ivy_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/ivy_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/ivy.svg',
    },
  },
  25: {
    id: 25,
    class_name: 'hero_warden',
    name: 'Warden',
    tags: ['Initiator', 'Fearless', 'One Man Army'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/warden_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/warden_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/warden_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/warden.svg',
    },
  },
  27: {
    id: 27,
    class_name: 'hero_yamato',
    name: 'Yamato',
    tags: ['Relentless', 'Acrobatics', 'Pursuer'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/yamato_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/yamato_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/yamato_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/yamato.svg',
    },
  },
  31: {
    id: 31,
    class_name: 'hero_lash',
    name: 'Lash',
    tags: ['Initiator', 'High Flying', 'Arrogant'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/lash_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/lash_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/lash_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/lash.svg',
    },
  },
  35: {
    id: 35,
    class_name: 'hero_viscous',
    name: 'Viscous',
    tags: ['Evasive', 'Disruptor', 'Gooey'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/viscous_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/viscous_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/viscous_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/viscous.svg',
    },
  },
  50: {
    id: 50,
    class_name: 'hero_synth',
    name: 'Pocket',
    tags: ['Trickster', 'Burst Damage', 'Frogs'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/synth_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/pocket_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/pocket_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/pocket.svg',
    },
  },
  52: {
    id: 52,
    class_name: 'hero_mirage',
    name: 'Mirage',
    tags: ['Bodyguard', 'Traveller', 'Focused'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/mirage_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/mirage_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/mirage_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/mirage.svg',
    },
  },
  58: {
    id: 58,
    class_name: 'hero_viper',
    name: 'Vyper',
    tags: ['Gunner', 'Slippery', 'Rat-a-Tat'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/kali_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/vyper_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/vyper_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/vyper.svg',
    },
  },
  60: {
    id: 60,
    class_name: 'hero_magician',
    name: 'Sinclair',
    tags: ['Trickster', 'Copycat', 'Versatile'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/magician_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/magician_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/magician_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/sinclair.svg',
    },
  },
  63: {
    id: 63,
    class_name: 'hero_vampirebat',
    name: 'Mina',
    tags: ['Harasser', 'Nimble', 'Vexing'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/vampirebat_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/mina_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/mina_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/mina.svg',
    },
  },
  64: {
    id: 64,
    class_name: 'hero_drifter',
    name: 'Drifter',
    tags: ['Stalker', 'Bloodthirsty', 'Cruel'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/drifter_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/drifter_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/drifter_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/drifter.svg',
    },
  },
  65: {
    id: 65,
    class_name: 'hero_priest',
    name: 'Venator',
    tags: ['Devout', 'Arms Expert', 'Tactical'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/priest_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/priest_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/priest_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/priest.svg',
    },
  },
  66: {
    id: 66,
    class_name: 'hero_frank',
    name: 'Victor',
    tags: ["You Can't Kill Me"],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/frank_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/victor_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/victor_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/victor.svg',
    },
  },
  67: {
    id: 67,
    class_name: 'hero_bookworm',
    name: 'Paige',
    tags: ['Helpful', 'Protector', 'Booksmart'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/bookworm_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/patience_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/patience_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/paige.svg',
    },
  },
  68: {
    id: 68,
    class_name: 'hero_boho',
    name: 'Boho',
    tags: [],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/boho_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/boho_card.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/boho_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/boho_mm.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/boho_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/boho_vertical.webp',
    },
  },
  69: {
    id: 69,
    class_name: 'hero_doorman',
    name: 'The Doorman',
    tags: ['Disorienting', 'Map Control', 'Mind Games'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/doorman_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/doorman_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/doorman_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/doorman.svg',
    },
  },
  70: {
    id: 70,
    class_name: 'hero_skyrunner',
    name: 'Skyrunner',
    tags: [],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_card.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_mm.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/skyrunner_vertical.webp',
    },
  },
  71: {
    id: 71,
    class_name: 'hero_swan',
    name: 'Swan',
    tags: [],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_card.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_mm.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/swan_vertical.webp',
    },
  },
  72: {
    id: 72,
    class_name: 'hero_punkgoat',
    name: 'Billy',
    tags: ['Punk', 'Chaotic', 'G.O.A.T.'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/punkgoat_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/billy_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/billy_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/billy.svg',
    },
  },
  73: {
    id: 73,
    class_name: 'hero_druid',
    name: 'Druid',
    tags: [],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_card.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_mm.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/druid_vertical.webp',
    },
  },
  74: {
    id: 74,
    class_name: 'hero_graf',
    name: 'Graf',
    tags: ['Harasser', 'Nimble', 'Vexing'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_card.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_mm.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/graf_vertical.webp',
    },
  },
  75: {
    id: 75,
    class_name: 'hero_fortuna',
    name: 'Fortuna',
    tags: ['Duelist', 'Isolator', 'Telekinetic'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_card.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_mm.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fortuna_vertical.webp',
    },
  },
  76: {
    id: 76,
    class_name: 'hero_necro',
    name: 'Graves',
    tags: ['Morbid', 'Area Denial', 'Necromancer'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/necro_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/necro_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/necro_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/necro.svg',
    },
  },
  77: {
    id: 77,
    class_name: 'hero_fencer',
    name: 'Apollo',
    tags: ['Finesse', 'Mobility', 'A Cut Above'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/fencer_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/fencer_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/fencer_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/fencer.svg',
    },
  },
  78: {
    id: 78,
    class_name: 'hero_airheart',
    name: 'Airheart',
    tags: [],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/airheart_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/airheart_card.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/airheart_card.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/airheart_card.webp',
    },
  },
  79: {
    id: 79,
    class_name: 'hero_familiar',
    name: 'Rem',
    tags: ['Helpful', 'Tiny', 'zZzzZ'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/familiar_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/familiar_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/familiar_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/familiar.svg',
    },
  },
  80: {
    id: 80,
    class_name: 'hero_werewolf',
    name: 'Silver',
    tags: ['Feral', 'Hot Mess', 'Transformation'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/werewolf_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/werewolf_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/werewolf_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/werewolf.svg',
    },
  },
  81: {
    id: 81,
    class_name: 'hero_unicorn',
    name: 'Celeste',
    tags: ['Performer', 'Disruptive', 'Dazzling'],
    images: {
      icon_hero_card:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_card.png',
      icon_hero_card_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_card.webp',
      icon_image_small:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_sm.png',
      icon_image_small_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_sm.webp',
      minimap_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_mm.png',
      minimap_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_mm.webp',
      hero_card_critical:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_card_critical.png',
      hero_card_critical_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_card_critical.webp',
      hero_card_gloat:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_card_gloat.png',
      hero_card_gloat_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_card_gloat.webp',
      top_bar_vertical_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_vertical.png',
      top_bar_vertical_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/unicorn_vertical.webp',
      background_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/unicorn_bg.png',
      background_image_webp:
        'https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/backgrounds/unicorn_bg.webp',
      name_image:
        'https://assets-bucket.deadlock-api.com/assets-api-res/icons/unicorn.svg',
    },
  },
  82: {
    id: 82,
    class_name: 'hero_opera',
    name: 'Opera',
    tags: [],
    images: {},
  },
};

/**
 * Returns the `HeroInfo` for the given hero ID, or `undefined` if not found.
 */
export function getHero(heroId: number): HeroInfo | undefined {
  return HEROES[heroId];
}

/** Sorted array of all heroes, useful for lists/dropdowns. */
export const HEROES_LIST: HeroInfo[] = Object.values(HEROES).sort((a, b) =>
  a.name.localeCompare(b.name),
);
