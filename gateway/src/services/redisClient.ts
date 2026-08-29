/**
 * Mock Redis Client — In-Memory Implementation
 * 
 * Uses timestamp-based TTL tracking instead of setTimeout to prevent
 * memory leaks under high load. Expired keys are lazily evicted on access
 * and periodically cleaned via a background sweep.
 */

class MockRedisClient {
  public isOpen = false;
  private store: Map<string, { value: string; expiresAt?: number }> = new Map();
  private sets: Map<string, { members: Set<string>; expiresAt?: number }> = new Map();
  private sweepInterval: ReturnType<typeof setInterval> | null = null;

  on(_event: string, _handler: any) {}

  async connect() {
    this.isOpen = true;

    // Periodic lazy cleanup every 10 seconds
    this.sweepInterval = setInterval(() => this.evictExpired(), 10_000);

    // Prevent the timer from keeping the process alive
    if (this.sweepInterval && typeof this.sweepInterval === "object" && "unref" in this.sweepInterval) {
      (this.sweepInterval as NodeJS.Timeout).unref();
    }
  }

  private isExpired(expiresAt?: number): boolean {
    if (expiresAt === undefined) return false;
    return Date.now() > expiresAt;
  }

  private evictExpired() {
    const now = Date.now();

    for (const [key, entry] of this.store) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }

    for (const [key, entry] of this.sets) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.sets.delete(key);
      }
    }
  }

  async incr(key: string): Promise<number> {
    const existing = this.store.get(key);

    if (existing && this.isExpired(existing.expiresAt)) {
      this.store.delete(key);
    }

    const entry = this.store.get(key);
    const val = parseInt(entry?.value || "0", 10);
    const newVal = val + 1;

    this.store.set(key, {
      value: newVal.toString(),
      expiresAt: entry?.expiresAt,
    });

    return newVal;
  }

  async expire(key: string, seconds: number) {
    const expiresAt = Date.now() + seconds * 1000;

    // Update TTL on store entries
    const storeEntry = this.store.get(key);
    if (storeEntry) {
      storeEntry.expiresAt = expiresAt;
    }

    // Update TTL on set entries
    const setEntry = this.sets.get(key);
    if (setEntry) {
      setEntry.expiresAt = expiresAt;
    }
  }

  async sAdd(key: string, member: string): Promise<number> {
    const existing = this.sets.get(key);

    if (existing && this.isExpired(existing.expiresAt)) {
      this.sets.delete(key);
    }

    if (!this.sets.has(key)) {
      this.sets.set(key, { members: new Set(), expiresAt: undefined });
    }

    const entry = this.sets.get(key)!;

    if (entry.members.has(member)) return 0;
    entry.members.add(member);
    return 1;
  }

  async sCard(key: string): Promise<number> {
    const entry = this.sets.get(key);

    if (!entry) return 0;
    if (this.isExpired(entry.expiresAt)) {
      this.sets.delete(key);
      return 0;
    }

    return entry.members.size;
  }

  async keys(_pattern: string): Promise<string[]> {
    this.evictExpired(); // Clean up before listing

    const result: string[] = [];

    for (const key of this.store.keys()) {
      result.push(key);
    }

    for (const key of this.sets.keys()) {
      if (!result.includes(key)) {
        result.push(key);
      }
    }

    return result;
  }

  async del(keys: string | string[]) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    for (const key of keysArray) {
      this.store.delete(key);
      this.sets.delete(key);
    }
  }
}

const redisClient = new MockRedisClient();

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Mock Redis connected (timestamp-based TTL, no setTimeout leaks)");
  }
}

export default redisClient as any;