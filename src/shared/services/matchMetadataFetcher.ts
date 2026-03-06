/**
 * Service for fetching match metadata with fallback through the salts pipeline.
 *
 * Fallback chain:
 *  1. Try the parsed metadata endpoint (fast, cached by deadlock-api)
 *  2. If unavailable, fetch salts for the match → submit them to deadlock-api ingest
 *  3. Retry the parsed metadata endpoint after ingestion
 *  4. If salts have a metadata_url, fetch the raw .meta.bz2 and decompress + parse locally
 */

import {
  MatchesApi,
  InternalApi,
  MatchSaltsResponse,
  ClickhouseSalts,
} from 'deadlock_api_client';
import { deadlockApiConfig } from './deadlock-api/deadlockApiClient';
import type { MatchMetadataResponse } from '../../renderer/main-window/views/MatchHistory/matchMetadata.types';
import { createLogger } from './Logger';

const logger = createLogger('matchMetadataFetcher');

const matchesApi = new MatchesApi(deadlockApiConfig);
const internalApi = new InternalApi(deadlockApiConfig);

/**
 * Attempt to fetch parsed match metadata, falling back to the salts→ingest pipeline.
 * Returns null if the match cannot be resolved through any path.
 */
export async function fetchMatchMetadataWithFallback(
  matchId: number,
): Promise<MatchMetadataResponse | null> {
  // 1. Try the parsed metadata endpoint directly
  logger.log(`[${matchId}] Step 1: Trying parsed metadata endpoint…`);
  try {
    const response = await matchesApi.metadata({ matchId });
    const data = response.data as unknown as MatchMetadataResponse;
    if (data?.match_info?.players?.length) {
      logger.log(
        `[${matchId}] Step 1: SUCCESS — got metadata with ${data.match_info.players.length} players`,
      );
      return data;
    }
    logger.warn(`[${matchId}] Step 1: Response received but no player data`);
  } catch (err) {
    logger.log(
      `[${matchId}] Step 1: metadata endpoint failed (expected for un-ingested matches)`,
      err,
    );
  }

  // 2. Fetch salts for this match
  logger.log(`[${matchId}] Step 2: Fetching salts…`);
  let salts: MatchSaltsResponse | null = null;
  try {
    const saltsResponse = await matchesApi.salts({ matchId });
    salts = saltsResponse.data;
    logger.log(
      `[${matchId}] Step 2: Got salts — cluster=${salts?.cluster_id}, meta_salt=${salts?.metadata_salt}, replay_salt=${salts?.replay_salt}`,
    );
  } catch (err) {
    logger.warn(
      `[${matchId}] Step 2: Salts endpoint failed — cannot proceed`,
      err,
    );
    return null;
  }

  if (!salts) {
    logger.warn(`[${matchId}] Step 2: Salts response was null`);
    return null;
  }

  // 3. Submit salts to deadlock-api ingest so the match becomes available
  logger.log(`[${matchId}] Step 3: Submitting salts to ingest endpoint…`);
  try {
    const clickhouseSalts: ClickhouseSalts[] = [
      {
        match_id: salts.match_id,
        cluster_id: salts.cluster_id ?? undefined,
        metadata_salt: salts.metadata_salt ?? undefined,
        replay_salt: salts.replay_salt ?? undefined,
      },
    ];
    await internalApi.ingestSalts({ clickhouseSalts });
    logger.log(`[${matchId}] Step 3: Ingest request succeeded`);
  } catch (err) {
    logger.warn(
      `[${matchId}] Step 3: Ingest request failed — will still retry metadata`,
      err,
    );
  }

  // 4. Wait briefly, then retry the parsed metadata endpoint
  logger.log(`[${matchId}] Step 4: Waiting 10s before retry…`);
  await new Promise((r) => setTimeout(r, 10000));
  try {
    const retryResponse = await matchesApi.metadata({ matchId });
    const retryData = retryResponse.data as unknown as MatchMetadataResponse;
    if (retryData?.match_info?.players?.length) {
      logger.log(
        `[${matchId}] Step 4: SUCCESS — retry returned metadata with ${retryData.match_info.players.length} players`,
      );
      return retryData;
    }
    logger.warn(
      `[${matchId}] Step 4: Retry returned response but no player data`,
    );
  } catch (err) {
    logger.warn(`[${matchId}] Step 4: Retry failed`, err);
  }

  logger.warn(`[${matchId}] All steps exhausted — match metadata unavailable`);
  return null;
}

/**
 * Submit an array of salts to the deadlock-api ingest endpoint.
 * Used by both match detail fallback and httpcache scanning.
 */
export async function submitSaltsToApi(
  salts: ClickhouseSalts[],
): Promise<boolean> {
  logger.log(
    `submitSaltsToApi: submitting ${salts.length} salts to ingest endpoint`,
  );
  try {
    await internalApi.ingestSalts({ clickhouseSalts: salts });
    logger.log(
      `submitSaltsToApi: successfully submitted ${salts.length} salts`,
    );
    return true;
  } catch (err) {
    logger.error('submitSaltsToApi: ingest request failed:', err);
    return false;
  }
}
