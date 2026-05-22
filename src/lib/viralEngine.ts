// src/lib/viralEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// ALGORITHMIC REALISM ENGINE v5 — "Stage-Based Distribution"
//
// Ye sirf S-curves nahi hai. Ye simulate karta hai exactly kaise
// Instagram / TikTok content distribute karta hai:
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │  REAL ALGORITHM PIPELINE                                             │
// │                                                                      │
// │  POST                                                                │
// │   ↓ Stage 0: Indexing   (0–90 min)   zero reach, processing         │
// │   ↓ Stage 1: SEED       (90m–3h)     15–35% engaged followers       │
// │   │          ER < 4%? ──────────────────────────────→ FLOP          │
// │   ↓ Stage 2: HASHTAG    (3–8h)       hashtag + interest graph       │
// │   │          ER < 6%? ──────────────────────────────→ AVERAGE       │
// │   ↓ Stage 3: EXPLORE    (8–24h)      Explore / For-You feed         │
// │   │          ER < 8%? ──────────────────────────────→ GOOD          │
// │   ↓ Stage 4: VIRAL WAVE (24–72h)     full platform distribution     │
// │   ↓ Stage 5: LONG TAIL  (72h+)       gradual decay                  │
// │                                                                      │
// │   ✦ RE-SURFACE: 5% chance algo re-pushes old posts (real mechanic)  │
// │   ✦ SAVES are weighted 3–4× more than likes (Instagram truth)       │
// │   ✦ SHARES are the strongest viral signal                           │
// │   ✦ WATCH TIME simulated for reels (completion % → algo push)       │
// │   ✦ ACCOUNT AUTHORITY: consistent posters get better initial push   │
// │   ✦ GHOST FOLLOWERS: 20–45% of food account followers are ghosts    │
// │   ✦ SEASONAL FOOD BOOSTS: Diwali, New Year, Eid, Monsoon season     │
// └──────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════

// ── Utilities ────────────────────────────────────────────────────────────

export const getHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
};

const gh = (s: string, salt: string): number => getHash(s + salt);

const lerp = (a: number, b: number, t: number): number =>
    a + (b - a) * Math.max(0, Math.min(1, t));

const clamp = (v: number, lo: number, hi: number): number =>
    Math.max(lo, Math.min(hi, v));

// Gompertz — best curve for viral content (slow → explosive → plateau)
const gompertz = (t: number, k = 4.2, t0 = 0.35): number =>
    Math.exp(-Math.exp(-k * (t - t0)));

// ── App-wide boost (single knob) ────────────────────────────────────────
// 1.25 = app is 25% more active than "ground truth" → feels rewarding
// Keep below 1.40 to remain believable.
const APP_BOOST = 1.25;

// ── Types ────────────────────────────────────────────────────────────────

type ContentStyle = 'reel' | 'video' | 'photo' | 'carousel';
type Archetype    = 'homecook' | 'enthusiast' | 'foodblogger' | 'chef_brand' | 'viral_star';
type PostDestiny  = 'flop' | 'average' | 'good' | 'viral';
type HashtagStrat = 'none' | 'niche' | 'mixed' | 'broad';

// ── Account Fingerprint ──────────────────────────────────────────────────
// Every account gets a deterministic personality from its ID.

interface Fingerprint {
    archetype:           Archetype;
    contentStyle:        ContentStyle;
    timezoneOffset:      number;       // hours from UTC
    peakHourStart:       number;       // local hour 0-23
    peakHourEnd:         number;
    weekendBias:         number;       // 0.85–1.40
    unfollowSensitivity: number;       // 0.30–0.70
    authorityScore:      number;       // 0–1: algo trust in this account
    ghostFollowerRatio:  number;       // 0.20–0.45: silent followers
    hashtagStrat:        HashtagStrat;
    postingConsistency:  number;       // 0–1: regular poster = better push
    rewatchRate:         number;       // for reels: views / unique viewers
}

const getFingerprint = (id: string): Fingerprint => {
    const h  = getHash(id);
    const h2 = gh(id, 'fp2');
    const h3 = gh(id, 'fp3');
    const h4 = gh(id, 'fp4');
    const h5 = gh(id, 'fp5');

    // Archetype power-law distribution
    const tier = h % 1000;
    let archetype: Archetype;
    if      (tier < 520) archetype = 'homecook';
    else if (tier < 780) archetype = 'enthusiast';
    else if (tier < 910) archetype = 'foodblogger';
    else if (tier < 970) archetype = 'chef_brand';
    else                 archetype = 'viral_star';

    // Timezone — weighted toward IST (platform is India-focused)
    const tzB = h2 % 12;
    const timezoneOffset =
        tzB < 6  ? 5.5 :   // IST
        tzB < 8  ? 8   :   // SGT/HKT
        tzB < 9  ? 1   :   // CET
        tzB < 10 ? -5  :   // EST
        tzB < 11 ? -8  :   // PST
                   3;       // MSK/GST

    const peakHourStart = 18 + (h3 % 4);          // 6pm–9pm local
    const peakHourEnd   = peakHourStart + 2 + (h4 % 3);
    const weekendBias   = 0.85 + (h3 % 55) / 100;

    const cB = h4 % 100;
    const contentStyle: ContentStyle =
        cB < 40 ? 'reel' : cB < 65 ? 'video' : cB < 85 ? 'photo' : 'carousel';

    // Authority: higher for consistent, older accounts (derived from hash variance)
    const authorityScore = clamp(0.2 + (h5 % 80) / 100, 0.20, 0.95);

    // Ghost followers: food accounts notoriously have lots of silent followers
    const ghostFollowerRatio = 0.20 + (h2 % 25) / 100; // 20–45%

    const hsB = h5 % 100;
    const hashtagStrat: HashtagStrat =
        hsB < 15 ? 'none' : hsB < 45 ? 'niche' : hsB < 75 ? 'mixed' : 'broad';

    const postingConsistency = clamp(0.1 + (h3 % 90) / 100, 0.10, 0.95);

    // Reels get rewatched — ratio between plays and unique viewers
    const rewatchRate = contentStyle === 'reel'  ? 1.25 + (h4 % 30) / 100
                      : contentStyle === 'video' ? 1.08 + (h5 % 15) / 100
                      : 1.0;

    return {
        archetype, contentStyle, timezoneOffset,
        peakHourStart, peakHourEnd,
        weekendBias, unfollowSensitivity: 0.30 + (h4 % 40) / 100,
        authorityScore, ghostFollowerRatio, hashtagStrat,
        postingConsistency, rewatchRate,
    };
};

// ── Seasonal Food Boost ──────────────────────────────────────────────────
// Real food content spikes around festivals and seasons.
// This makes engagement feel tied to the real world.

const getSeasonalMultiplier = (): number => {
    const now   = new Date();
    const month = now.getUTCMonth() + 1; // 1-12
    const day   = now.getUTCDate();

    // Diwali season: Oct–Nov → huge food content spike
    if (month === 10 || month === 11) return 1.18;

    // New Year / Christmas: Dec–Jan
    if (month === 12 || month === 1) return 1.14;

    // Eid al-Fitr: approx Apr (varies; fixed window for simulation)
    if (month === 4 && day >= 5 && day <= 20) return 1.16;

    // Holi: March
    if (month === 3 && day >= 10 && day <= 20) return 1.12;

    // Indian monsoon comfort-food season: Jul–Aug
    if (month === 7 || month === 8) return 1.08;

    // Summer slump: May–Jun (people outdoors, less cooking content)
    if (month === 5 || month === 6) return 0.92;

    return 1.0;
};

// ── Time of day ───────────────────────────────────────────────────────────

const getTimeOfDayMultiplier = (fp: Fingerprint): number => {
    const localH = clamp(
        (new Date().getUTCHours() + fp.timezoneOffset) % 24,
        0, 23.99,
    );

    if (localH >= 1  && localH < 6)  return 0.05 + (localH - 1) * 0.04;
    if (localH >= 6  && localH < 11) return lerp(0.30, 0.70, (localH - 6) / 5);
    if (localH >= 11 && localH < 17) return 0.55 + Math.sin(((localH - 11) / 6) * Math.PI) * 0.15;

    const pe = fp.peakHourEnd;
    if (localH >= 17 && localH <= pe) {
        return lerp(0.70, 1.00, Math.sin(((localH - 17) / Math.max(1, pe - 17)) * Math.PI));
    }
    if (localH > pe) return lerp(0.80, 0.10, (localH - pe) / (24 - pe));
    return 0.50;
};

// ── Day of week ───────────────────────────────────────────────────────────

const getDayOfWeekMultiplier = (fp: Fingerprint): number => {
    const day  = new Date().getUTCDay(); // 0=Sun
    const base = ([0.88, 0.72, 0.78, 0.90, 0.95, 1.05, 1.10] as const)[day] ?? 0.90;
    return (day === 0 || day === 6) ? base * fp.weekendBias : base;
};

// ── Stage-Based Distribution Model ───────────────────────────────────────
// THIS is the core innovation. Each post moves through stages.
// The destiny determines which gates it passes and how far it goes.
//
// Stage audience sizes (as multiplier of "seed audience"):
//   Seed:    followers × seedRatio  (15–35%)
//   Hashtag: seed × 2.5–5×
//   Explore: hashtag × 4–10×
//   Viral:   explore × 6–20×
//
// ER gates:
//   Seed → Hashtag:  need ER > 4%   (only average/good/viral pass)
//   Hashtag → Explore: need ER > 6% (only good/viral pass)
//   Explore → Viral: need ER > 8%   (only viral passes)

type DistributionStage = 'indexing' | 'seed' | 'hashtag' | 'explore' | 'viral_wave' | 'long_tail';

interface StageState {
    stage:            DistributionStage;
    audiencePool:     number;    // total unique accounts reached so far
    stageProgress:    number;    // 0–1 within current stage
    erAtGate:         number;    // ER% that passed the last gate
    resurfaced:       boolean;   // got a second wind from algo
}

// Derive the current stage from post age and destiny
const getStageState = (
    ageHours:   number,
    destiny:    PostDestiny,
    postHash:   number,
    followers:  number,         // approx account followers at time of post
    fp:         Fingerprint,
): StageState => {

    // Indexing: no stage yet
    if (ageHours < 1.5) {
        return { stage: 'indexing', audiencePool: 0, stageProgress: 0, erAtGate: 0, resurfaced: false };
    }

    // ── Seed audience size ─────────────────────────────────────────────────
    // Algorithm shows post to most-engaged followers first (not ALL followers).
    // Authority score improves this ratio.
    const seedRatio    = 0.15 + fp.authorityScore * 0.20; // 15–35%
    const seedAudience = Math.floor(followers * seedRatio);

    // ── Hashtag/interest strategy multiplier ──────────────────────────────
    const hashtagMult: Record<HashtagStrat, number> = {
        none: 1.0, niche: 2.8, mixed: 4.2, broad: 3.5, // broad is noisy, niche is targeted
    };

    // ── Stage timings (hours) ──────────────────────────────────────────────
    // Different destinies have different pacing
    const timings: Record<PostDestiny, {
        seedEnd: number; hashEnd: number; expEnd: number; viralEnd: number;
    }> = {
        flop:    { seedEnd: 3,  hashEnd: 8,  expEnd: 24, viralEnd: 72 },
        average: { seedEnd: 3,  hashEnd: 10, expEnd: 28, viralEnd: 80 },
        good:    { seedEnd: 4,  hashEnd: 12, expEnd: 32, viralEnd: 90 },
        viral:   { seedEnd: 3,  hashEnd: 8,  expEnd: 24, viralEnd: 72 },
    };
    const T = timings[destiny];

    // ── Re-surface mechanic ────────────────────────────────────────────────
    // ~5% of posts get re-pushed by algo after 7–30 days.
    // Only average/good/viral can resurface. Determined by postHash.
    const canResurface    = destiny !== 'flop' && (postHash % 20) === 0; // 5%
    const resurfaceAt     = canResurface ? (168 + (postHash % 576)) : Infinity; // 7–31 days
    const resurfaced      = canResurface && ageHours >= resurfaceAt;

    // If resurfaced, treat it like a fresh good post
    if (resurfaced) {
        const rAge = ageHours - resurfaceAt;
        const rPool = seedAudience * hashtagMult[fp.hashtagStrat] * 3;
        return {
            stage: rAge < T.hashEnd ? 'hashtag' : 'explore',
            audiencePool: Math.floor(rPool),
            stageProgress: clamp(rAge / T.expEnd, 0, 1),
            erAtGate: 0.07,
            resurfaced: true,
        };
    }

    // ── Normal stage progression ───────────────────────────────────────────

    // FLOP: passes seed, dies at hashtag gate
    if (destiny === 'flop') {
        if (ageHours < T.seedEnd) {
            return {
                stage: 'seed',
                audiencePool: seedAudience,
                stageProgress: clamp((ageHours - 1.5) / (T.seedEnd - 1.5), 0, 1),
                erAtGate: 0, resurfaced: false,
            };
        }
        // Dies — enters slow decay, very small long tail
        const decayPool = Math.floor(seedAudience * 1.1);
        return {
            stage: 'long_tail',
            audiencePool: decayPool,
            stageProgress: clamp((ageHours - T.seedEnd) / 120, 0, 1),
            erAtGate: 0.028, resurfaced: false,
        };
    }

    // AVERAGE: passes seed + hashtag gate, dies at explore gate
    if (destiny === 'average') {
        const hashAudience = Math.floor(seedAudience * hashtagMult[fp.hashtagStrat] * lerp(1.5, 2.5, fp.authorityScore));

        if (ageHours < T.seedEnd) {
            return { stage: 'seed', audiencePool: seedAudience, stageProgress: clamp((ageHours - 1.5) / (T.seedEnd - 1.5), 0, 1), erAtGate: 0, resurfaced: false };
        }
        if (ageHours < T.hashEnd) {
            return { stage: 'hashtag', audiencePool: hashAudience, stageProgress: clamp((ageHours - T.seedEnd) / (T.hashEnd - T.seedEnd), 0, 1), erAtGate: 0.052, resurfaced: false };
        }
        // Plateaus — very small explore trickle
        const plateauPool = Math.floor(hashAudience * 1.3);
        return { stage: 'long_tail', audiencePool: plateauPool, stageProgress: clamp((ageHours - T.hashEnd) / 200, 0, 1), erAtGate: 0.051, resurfaced: false };
    }

    // GOOD: passes seed + hashtag + explore gates, no viral
    if (destiny === 'good') {
        const hashAudience    = Math.floor(seedAudience * hashtagMult[fp.hashtagStrat] * lerp(2.5, 4.0, fp.authorityScore));
        const exploreAudience = Math.floor(hashAudience * lerp(4, 8, fp.authorityScore));

        if (ageHours < T.seedEnd) {
            return { stage: 'seed', audiencePool: seedAudience, stageProgress: clamp((ageHours - 1.5) / (T.seedEnd - 1.5), 0, 1), erAtGate: 0, resurfaced: false };
        }
        if (ageHours < T.hashEnd) {
            return { stage: 'hashtag', audiencePool: hashAudience, stageProgress: clamp((ageHours - T.seedEnd) / (T.hashEnd - T.seedEnd), 0, 1), erAtGate: 0.068, resurfaced: false };
        }
        if (ageHours < T.expEnd) {
            return { stage: 'explore', audiencePool: exploreAudience, stageProgress: clamp((ageHours - T.hashEnd) / (T.expEnd - T.hashEnd), 0, 1), erAtGate: 0.075, resurfaced: false };
        }
        // Long tail after explore
        const ltPool = Math.floor(exploreAudience * 0.85);
        return { stage: 'long_tail', audiencePool: ltPool, stageProgress: clamp((ageHours - T.expEnd) / 300, 0, 1), erAtGate: 0.072, resurfaced: false };
    }

    // VIRAL: passes all gates
    {
        const hashAudience    = Math.floor(seedAudience * hashtagMult[fp.hashtagStrat] * lerp(3.5, 6.0, fp.authorityScore));
        const exploreAudience = Math.floor(hashAudience * lerp(6, 12, fp.authorityScore));
        const viralAudience   = Math.floor(exploreAudience * lerp(5, 18, fp.authorityScore));

        if (ageHours < T.seedEnd) {
            return { stage: 'seed', audiencePool: seedAudience, stageProgress: clamp((ageHours - 1.5) / (T.seedEnd - 1.5), 0, 1), erAtGate: 0, resurfaced: false };
        }
        if (ageHours < T.hashEnd) {
            return { stage: 'hashtag', audiencePool: hashAudience, stageProgress: clamp((ageHours - T.seedEnd) / (T.hashEnd - T.seedEnd), 0, 1), erAtGate: 0.078, resurfaced: false };
        }
        if (ageHours < T.expEnd) {
            return { stage: 'explore', audiencePool: exploreAudience, stageProgress: clamp((ageHours - T.hashEnd) / (T.expEnd - T.hashEnd), 0, 1), erAtGate: 0.086, resurfaced: false };
        }
        if (ageHours < T.viralEnd) {
            return { stage: 'viral_wave', audiencePool: viralAudience, stageProgress: clamp((ageHours - T.expEnd) / (T.viralEnd - T.expEnd), 0, 1), erAtGate: 0.091, resurfaced: false };
        }
        // Long tail post-viral
        const ltPool = Math.floor(viralAudience * 0.70);
        return { stage: 'long_tail', audiencePool: ltPool, stageProgress: clamp((ageHours - T.viralEnd) / 400, 0, 1), erAtGate: 0.088, resurfaced: false };
    }
};

// ── Archetype profiles ────────────────────────────────────────────────────

interface ArchetypeProfile {
    minCap: number; rangeCap: number; growthDays: number; delayMinutes: number;
}

const ARCHETYPE_PROFILES: Record<Archetype, ArchetypeProfile> = {
    homecook:    { minCap: 40,   rangeCap: 260,  growthDays: 90,  delayMinutes: 720 },
    enthusiast:  { minCap: 200,  rangeCap: 800,  growthDays: 120, delayMinutes: 600 },
    foodblogger: { minCap: 900,  rangeCap: 1500, growthDays: 180, delayMinutes: 480 },
    chef_brand:  { minCap: 2200, rangeCap: 2000, growthDays: 240, delayMinutes: 360 },
    viral_star:  { minCap: 4200, rangeCap: 3500, growthDays: 300, delayMinutes: 240 },
};

// ── Lifecycle multiplier ──────────────────────────────────────────────────

const getLifecycleMult = (ageInDays: number, h: number): number => {
    const ps = h % 80;
    if (ageInDays < 15)  return lerp(1.40, 1.10, ageInDays / 15) + ps / 400;
    if (ageInDays < 90)  return lerp(1.10, 0.95, (ageInDays - 15) / 75);
    if (ageInDays < 200) return 0.90 + Math.sin(ageInDays * 0.18) * 0.06;
    return lerp(0.90, 0.70, Math.min(1, (ageInDays - 200) / 500));
};

// ── Daily follower noise ──────────────────────────────────────────────────
// Real accounts don't grow smoothly. They have quiet days and mini-spikes.

const getDailyFollowerNoise = (id: string, ageInDays: number): number => {
    const dayIndex = Math.floor(ageInDays);
    const ds       = getHash(id + 'day' + dayIndex.toString());

    // ~8% chance: algo viral day → +30–60% spike
    if ((ds % 13) === 0) return 0.30 + (ds % 31) / 100;

    // ~12% chance: rest day → small dip
    if ((ds % 9) === 0) return -0.05 - (ds % 8) / 100;

    // Normal: -10% to +18% (positive skewed)
    return -0.10 + (ds % 100) / (100 / 0.28);
};

// ── Followers calculator ──────────────────────────────────────────────────

export const calculateFakeFollowers = (
    id: string,
    createdAt: string,
    postsCount: number,
    isFakeOn: boolean,
): number => {
    if (!isFakeOn || !id || !createdAt) return 0;

    const now         = Date.now();
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime) || createdTime > now) return 0;

    const fp      = getFingerprint(id);
    const profile = ARCHETYPE_PROFILES[fp.archetype];
    const ageMin  = Math.floor((now - createdTime) / 60_000);
    if (ageMin <= profile.delayMinutes) return 0;

    const activeMin = ageMin - profile.delayMinutes;
    const activeHrs = activeMin / 60;
    const ageDays   = ageMin / 1440;

    const h  = getHash(id);
    const h2 = gh(id, 'flw');

    // Ghost account: no posts
    if (!postsCount || postsCount === 0) {
        const gMax = 3 + (h % 15);
        return Math.floor(gMax * (1 - Math.exp(-activeHrs / 96)));
    }

    // Base cap from archetype
    let maxCap = profile.minCap + (h % profile.rangeCap);

    // Posts bonus (diminishing returns after 15 posts)
    const postBonus = 1 + Math.min(
        0.80,
        postsCount * 0.035 - (postsCount > 15 ? (postsCount - 15) * 0.008 : 0),
    );
    maxCap = Math.floor(maxCap * postBonus);

    // Content style modifier
    const styleMod: Record<ContentStyle, number> = {
        reel: 1.22, video: 1.10, carousel: 1.05, photo: 0.95,
    };
    maxCap = Math.floor(maxCap * styleMod[fp.contentStyle]);

    // Posting consistency: regular posters get algo favor
    maxCap = Math.floor(maxCap * (0.85 + fp.postingConsistency * 0.30));

    // S-curve core
    const tau          = profile.growthDays * 24;
    const variance     = 1 + ((h2 % 12) / 200);
    const rawFollowers = maxCap * (1 - Math.exp(-(activeHrs * variance) / tau));

    // Lifecycle phase
    let followers = rawFollowers * getLifecycleMult(ageDays, h);

    // Time & day (blended lightly — cumulative number)
    followers *= lerp(1, getTimeOfDayMultiplier(fp), 0.28);
    followers *= lerp(1, getDayOfWeekMultiplier(fp),  0.18);

    // Seasonal food content boost
    followers *= lerp(1, getSeasonalMultiplier(), 0.40);

    // Daily realistic noise (makes it NOT smooth)
    const noise = getDailyFollowerNoise(id, ageDays);
    followers  *= (1 + noise * 0.15);

    // Micro unfollow waves
    if (followers > 30) {
        const amp  = followers * fp.unfollowSensitivity * 0.04;
        followers += Math.sin(ageDays * 2.1 + (h % 6))  * amp;
        followers += Math.cos(ageDays * 0.9 + (h2 % 4)) * amp * 0.4;
    }

    // App boost
    followers *= APP_BOOST;

    const earlyMin = Math.min(maxCap * 0.02, 5);
    return Math.max(0, Math.floor(Math.max(followers, earlyMin)));
};

// ── Engagement calculator ─────────────────────────────────────────────────
// Returns views, likes, saves, comments AND shares + reach.
// Platform-accurate hierarchy enforced: Comments < Saves < Likes << Views
// Instagram algo weights:   Shares(5×) > Saves(3×) > Comments(2×) > Likes(1×)

export interface EngagementMetrics {
    views:    number;
    likes:    number;
    saves:    number;
    comments: number;
    shares:   number;   // most powerful viral signal
    reach:    number;   // unique accounts (< views for reels due to rewatches)
}

// Per-destiny view profiles — calibrated for stage-based audiences
// Views are now DERIVED from stage audiencePool, not fixed ranges.
// These are multipliers on the audiencePool at current stage.
interface DestinyProfile {
    audienceConversionRate: [number, number]; // what % of pool actually sees it
    likeRate:               [number, number]; // % of REACH who like
    saveRate:               [number, number]; // % of REACH who save (algo gold)
    commentRate:            [number, number]; // % of REACH who comment
    shareRate:              [number, number]; // % of REACH who share (viral trigger)
}

// Rates are of REACH (unique viewers), not raw views.
// These match real Instagram analytics data.
const DESTINY_PROFILES: Record<PostDestiny, DestinyProfile> = {
    flop: {
        audienceConversionRate: [0.35, 0.65],
        likeRate:    [0.030, 0.060],  // 3–6% of viewers
        saveRate:    [0.004, 0.012],  // 0.4–1.2%
        commentRate: [0.002, 0.006],  // 0.2–0.6%
        shareRate:   [0.001, 0.004],  // 0.1–0.4% (almost nobody shares flops)
    },
    average: {
        audienceConversionRate: [0.45, 0.70],
        likeRate:    [0.045, 0.080],
        saveRate:    [0.010, 0.025],
        commentRate: [0.004, 0.012],
        shareRate:   [0.005, 0.018],
    },
    good: {
        audienceConversionRate: [0.55, 0.80],
        likeRate:    [0.055, 0.090],
        saveRate:    [0.018, 0.042],  // saves spike for good content
        commentRate: [0.006, 0.018],
        shareRate:   [0.015, 0.038],
    },
    viral: {
        audienceConversionRate: [0.60, 0.85],
        // Viral posts have lower % because explore audience is cold traffic
        likeRate:    [0.028, 0.062],
        saveRate:    [0.022, 0.055],  // saves stay high (recipe saves)
        commentRate: [0.008, 0.024],
        shareRate:   [0.025, 0.060],  // shares are what made it viral
    },
};

// Sample a value in a range using a 0-999 integer hash
const sampleRange = (range: [number, number], seed: number): number =>
    range[0] + ((seed % 1000) / 1000) * (range[1] - range[0]);

export const calculateFakeEngagement = (
    id:        string,
    createdAt: string,
    isFakeOn:  boolean,
    postId?:   string,
): EngagementMetrics => {
    const zero: EngagementMetrics = { views: 0, likes: 0, saves: 0, comments: 0, shares: 0, reach: 0 };
    if (!isFakeOn || !id || !createdAt) return zero;

    const now         = Date.now();
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime) || createdTime > now) return zero;

    const ageMin   = Math.floor((now - createdTime) / 60_000);
    const ageHours = ageMin / 60;
    if (ageMin <= 90) return zero;   // indexing delay

    const fp = getFingerprint(id);

    // ── Post-level hashes (all randomness from postId) ────────────────────
    const seed  = postId ?? (id + createdAt);
    const ph    = getHash(seed);
    const ph2   = gh(seed, 'lk');
    const ph3   = gh(seed, 'sv');
    const ph4   = gh(seed, 'cm');
    const ph5   = gh(seed, 'sh');
    const phNz  = gh(seed, 'nz');

    // Post destiny (per-post, not per-account)
    const luck = ph % 1000;
    let destiny: PostDestiny;
    if      (luck < 580) destiny = 'flop';
    else if (luck < 830) destiny = 'average';
    else if (luck < 950) destiny = 'good';
    else                 destiny = 'viral';

    const dp = DESTINY_PROFILES[destiny];

    // ── Estimate approx follower count for stage model ────────────────────
    // We need a rough follower count to seed the audience pool.
    const profile    = ARCHETYPE_PROFILES[fp.archetype];
    const h          = getHash(id);
    const approxCap  = profile.minCap + (h % profile.rangeCap);
    // Use ~50% saturation as a baseline (avoids circular dependency)
    const approxFollowers = Math.floor(approxCap * 0.50 * (0.8 + fp.authorityScore * 0.4));

    // ── Get current distribution stage ───────────────────────────────────
    const stageState = getStageState(ageHours, destiny, ph, approxFollowers, fp);

    if (stageState.stage === 'indexing') return zero;

    // ── Audience who actually saw the post at this stage ─────────────────
    const convRate = sampleRange(dp.audienceConversionRate, ph % 1000);
    let reach = Math.floor(stageState.audiencePool * convRate * stageState.stageProgress);

    // Stage-specific growth curve (Gompertz within each stage)
    reach = Math.floor(reach * gompertz(stageState.stageProgress));

    // Long tail: gradual decay of existing reach pool
    if (stageState.stage === 'long_tail') {
        const decayFactor = Math.max(0.10, 1 - stageState.stageProgress * 0.85);
        reach = Math.floor(reach * decayFactor);
    }

    // ── Time & day modifiers ──────────────────────────────────────────────
    const todMult = lerp(1, getTimeOfDayMultiplier(fp), 0.42);
    const dowMult = lerp(1, getDayOfWeekMultiplier(fp),  0.28);
    const seaMult = lerp(1, getSeasonalMultiplier(),     0.35);

    reach = Math.floor(reach * todMult * dowMult * seaMult);

    // Post-unique micro-noise (different per post so no two look the same)
    const microNoise = 1 + Math.sin(ageHours * (1.1 + (phNz % 5) * 0.4)) * 0.028;
    reach = Math.max(0, Math.floor(reach * microNoise * APP_BOOST));

    // ── Views vs Reach ────────────────────────────────────────────────────
    // Reels count rewatches — views > reach for video content.
    const views = Math.floor(reach * fp.rewatchRate);

    if (views === 0 && reach === 0) return zero;

    // ── Engagement rates (all based on REACH, not views) ─────────────────
    // Each metric uses a completely independent hash → never accidentally equal.
    let likeRate    = sampleRange(dp.likeRate,    ph2 % 1000);
    let saveRate    = sampleRange(dp.saveRate,     ph3 % 1000);
    let commentRate = sampleRange(dp.commentRate,  ph4 % 1000);
    let shareRate   = sampleRange(dp.shareRate,    ph5 % 1000);

    // ── Stage-specific ER modifiers ───────────────────────────────────────
    // Seed stage: core followers engage harder (they know the creator)
    if (stageState.stage === 'seed') {
        likeRate    *= 1.25;
        commentRate *= 1.40;
        saveRate    *= 1.15;
        shareRate   *= 1.10;
    }

    // Early surge (<25% through any stage): first wave engages more
    if (stageState.stageProgress < 0.25) {
        likeRate    *= 1.18;
        commentRate *= 1.30;
    }

    // Viral explore-traffic dilution: cold audience doesn't engage as hard
    if (destiny === 'viral' && (stageState.stage === 'explore' || stageState.stage === 'viral_wave')) {
        likeRate    *= 0.78;   // lower %
        saveRate    *= 1.12;   // but saves stay healthy (recipe bookmarking)
        commentRate *= 0.72;
        shareRate   *= 1.20;   // shares are what keep it spreading
    }

    // Re-surfaced posts: older audience is more selective
    if (stageState.resurfaced) {
        likeRate    *= 0.85;
        saveRate    *= 1.18;   // saves spike on re-discovery
        shareRate   *= 1.25;
        commentRate *= 0.90;
    }

    // ── Enforce platform-accurate hierarchy ───────────────────────────────
    // MUST always hold: Shares ≤ Comments ≤ Saves < Likes << Views
    // This is what makes the numbers look like a real Instagram analytics page.
    commentRate = Math.min(commentRate, saveRate    * 0.65);
    shareRate   = Math.min(shareRate,   commentRate * 0.80);
    saveRate    = Math.min(saveRate,    likeRate    * 0.52);

    // ── Final counts ──────────────────────────────────────────────────────
    const reachBase = reach > 0 ? reach : views;

    const likes    = clamp(Math.floor(reachBase * likeRate),    0, reachBase);
    const saves    = clamp(Math.floor(reachBase * saveRate),    0, likes);
    const comments = clamp(Math.floor(reachBase * commentRate), 0, saves);
    const shares   = clamp(Math.floor(reachBase * shareRate),   0, comments);

    return {
        views:    Math.max(0, views),
        reach:    Math.max(0, reach),
        likes:    Math.max(0, likes),
        saves:    Math.max(0, saves),
        comments: Math.max(0, comments),
        shares:   Math.max(0, shares),
    };
};