import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Ensure single instance in development to avoid connection spikes during HMR
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying after 3 attempts
    }
    return Math.min(times * 100, 3000); // Backoff up to 3 seconds
  }
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
