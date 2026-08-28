/**
 * Simple in-memory rate limiter.
 *
 * Good enough for a single-instance deploy (e.g. one Vercel/Render
 * instance, or running locally) to stop casual abuse of the Gemini
 * quota. It will NOT work correctly across multiple serverless
 * instances (each instance has its own memory, so limits reset per
 * instance) — if this app ever gets real traffic on a
 * multi-instance/serverless platform, swap this for a shared store
 * like Upstash Redis instead.
 */

type Bucket = number[];

const requestLog = new Map<string, Bucket>();

// Periodically drop old IPs so the map doesn't grow forever.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupIfNeeded(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

    lastCleanup = now;

    for (const [key, timestamps] of requestLog.entries()) {
        const recent = timestamps.filter((t) => now - t < windowMs);
        if (recent.length === 0) {
            requestLog.delete(key);
        } else {
            requestLog.set(key, recent);
        }
    }
}

/**
 * Returns true if the given identifier (usually an IP) has exceeded
 * `limit` requests within `windowMs`. Also records the current request.
 */
export function isRateLimited(
    identifier: string,
    limit: number,
    windowMs: number
): boolean {
    cleanupIfNeeded(windowMs);

    const now = Date.now();
    const timestamps = (requestLog.get(identifier) ?? []).filter(
        (t) => now - t < windowMs
    );

    if (timestamps.length >= limit) {
        // Don't record the rejected attempt — only successful admits count.
        requestLog.set(identifier, timestamps);
        return true;
    }

    timestamps.push(now);
    requestLog.set(identifier, timestamps);
    return false;
}

/**
 * Best-effort client identifier from request headers. Not spoof-proof
 * (a client can fake x-forwarded-for), but sufficient for slowing down
 * casual abuse rather than defending against a determined attacker.
 */
export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;

    return "unknown";
}