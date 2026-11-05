import { SteamProfile } from 'deadlock_api_client';
import { steamIdToAccountId } from '../utils/steamUtils';
import { createLogger } from './Logger';

declare const __STEAM_WEB_KEY__: string;

const logger = createLogger('steamWebApi');

interface SteamVanityResponse {
  response: {
    success: number;
    steamid?: string;
    message?: string;
  };
}

/**
 * Resolves a Steam `/id/<vanity>` profile name to a SteamID64 via the Steam
 * Web API's ResolveVanityURL. Returns null if the name has no match or the
 * request fails.
 */
export async function resolveVanityUrl(
  vanityName: string,
): Promise<string | null> {
  try {
    const k = atob(__STEAM_WEB_KEY__);
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${k}&vanityurl=${encodeURIComponent(vanityName)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: SteamVanityResponse = await res.json();
    if (data?.response?.success !== 1 || !data.response.steamid) {
      logger.log('No vanity match for', vanityName, data?.response?.message);
      return null;
    }
    return data.response.steamid;
  } catch (err) {
    logger.error('Failed to resolve vanity URL', vanityName, err);
    return null;
  }
}

interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  profileurl: string;
  loccountrycode?: string;
  realname?: string;
}

interface SteamApiResponse {
  response: {
    players: SteamPlayer[];
  };
}

/**
 * Fetches a Steam profile directly from the Steam Web API.
 * Used as a fallback when the deadlock-api /players/steam endpoint
 * returns no results for an account.
 */
export async function fetchSteamProfileDirect(
  steamId64: string,
): Promise<SteamProfile | null> {
  try {
    const k = atob(__STEAM_WEB_KEY__);
    // console.log(k);
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${k}&steamids=${steamId64}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: SteamApiResponse = await res.json();
    console.log('Steam Web API response for', steamId64, data);
    const player = data?.response?.players?.[0];
    if (!player) return null;

    const accountId = steamIdToAccountId(steamId64);
    if (!accountId) return null;

    return {
      account_id: accountId,
      avatar: data.response.players[0].avatar,
      avatarmedium: data.response.players[0].avatarmedium,
      avatarfull: data.response.players[0].avatarfull,
      personaname: data.response.players[0].personaname,
      profileurl: data.response.players[0].profileurl,
      realname: data.response.players[0].realname ?? null,
      countrycode: data.response.players[0].loccountrycode ?? null,
      last_updated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
