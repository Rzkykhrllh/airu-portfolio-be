import { prisma } from "../config/prisma";

// Precomputes a daily-shuffled, collection-diverse ordering of all PUBLIC
// photo IDs, so the homepage gallery doesn't clump by upload batch/theme.
// Rotates once per UTC day, same order for every visitor that day.
// Recomputed lazily on first request of the day and cached in-memory
// (no Redis in this stack) — resets harmlessly on redeploy.

const UNCATEGORIZED_BUCKET = "__uncategorized__";

let cache: { dateKey: string; order: string[] } | null = null;
let computing: Promise<string[]> | null = null;

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

// Simple deterministic PRNG (mulberry32) seeded from the date string, so
// the shuffle is reproducible within a day and different across days.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDate(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function roundRobinMerge(buckets: string[][]): string[] {
  const order: string[] = [];
  let index = 0;
  let anyLeft = true;
  while (anyLeft) {
    anyLeft = false;
    for (const bucket of buckets) {
      if (bucket[index] !== undefined) {
        order.push(bucket[index]);
        anyLeft = true;
      }
    }
    index++;
  }
  return order;
}

async function computeDailyOrder(dateKey: string): Promise<string[]> {
  const photos = await prisma.photo.findMany({
    where: { visibility: "PUBLIC" },
    select: {
      id: true,
      collections: {
        select: { collectionId: true },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  });

  const rand = mulberry32(seedFromDate(dateKey));

  const bucketMap = new Map<string, string[]>();
  for (const photo of photos) {
    const bucketKey = photo.collections[0]?.collectionId ?? UNCATEGORIZED_BUCKET;
    const bucket = bucketMap.get(bucketKey);
    if (bucket) {
      bucket.push(photo.id);
    } else {
      bucketMap.set(bucketKey, [photo.id]);
    }
  }

  const shuffledBucketKeys = shuffle(Array.from(bucketMap.keys()), rand);
  const shuffledBuckets = shuffledBucketKeys.map((key) => shuffle(bucketMap.get(key)!, rand));

  return roundRobinMerge(shuffledBuckets);
}

// Returns today's precomputed public photo order, recomputing once per
// UTC day. Concurrent callers during a recompute share the same in-flight
// promise instead of triggering duplicate queries.
export async function getDailyPublicOrder(): Promise<string[]> {
  const dateKey = todayKey();

  if (cache && cache.dateKey === dateKey) {
    return cache.order;
  }

  if (computing) {
    return computing;
  }

  computing = computeDailyOrder(dateKey)
    .then((order) => {
      cache = { dateKey, order };
      computing = null;
      return order;
    })
    .catch((error) => {
      computing = null;
      throw error;
    });

  return computing;
}
