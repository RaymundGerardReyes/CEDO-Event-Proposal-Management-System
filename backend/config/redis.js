// Graceful Redis loading - won't crash if not available
let Redis = null;
let NodeCache = null;

try {
    Redis = require('ioredis');
    NodeCache = require('node-cache');
} catch (error) {
    console.warn('⚠️ Redis dependencies not available, using fallback mode:', error.message);
}

// Fallback in-memory cache when Redis is unavailable
const memoryCache = NodeCache ? new NodeCache({
    stdTTL: 600, // 10 minutes default TTL
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false, // Better performance
    maxKeys: 1000 // Limit memory usage
}) : null;

// Redis configuration for production
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,

    // Connection pool settings
    family: 4, // IPv4
    keepAlive: true,

    // Performance optimizations
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxLoadingTimeout: 5000,

    // Reconnection strategy
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnClusterDown: 300,
    maxRetriesPerRequest: 3,

    // Connection pooling
    enableOfflineQueue: false,

    // Compression for large values
    compression: 'gzip',

    // Key prefix for this application
    keyPrefix: 'cedo:',
};

// Create Redis client
let redisClient = null;
let isRedisAvailable = false;

try {
    if (Redis) {
        redisClient = new Redis(redisConfig);

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
            isRedisAvailable = true;
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis ready for operations');
            isRedisAvailable = true;
        });

        redisClient.on('error', (error) => {
            console.error('❌ Redis connection error:', error.message);
            isRedisAvailable = false;
        });

        redisClient.on('close', () => {
            console.warn('⚠️ Redis connection closed');
            isRedisAvailable = false;
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });
    } else {
        console.warn('⚠️ Redis module not available, using in-memory cache fallback');
        isRedisAvailable = false;
    }

} catch (error) {
    console.warn('⚠️ Redis not available, using in-memory cache fallback');
    isRedisAvailable = false;
}

// Cache service with fallback
class CacheService {
    constructor() {
        this.redis = redisClient;
        this.memory = memoryCache;
        this.defaultTTL = 3600; // 1 hour
    }

    // Check if Redis is available
    isRedisConnected() {
        return isRedisAvailable && this.redis && this.redis.status === 'ready';
    }

    // Get value from cache
    async get(key) {
        try {
            if (this.isRedisConnected()) {
                const value = await this.redis.get(key);
                return value ? JSON.parse(value) : null;
            } else if (this.memory) {
                return this.memory.get(key) || null;
            } else {
                return null; // No caching available
            }
        } catch (error) {
            console.warn(`Cache get error for key ${key}:`, error.message);
            return null;
        }
    }

    // Set value in cache
    async set(key, value, ttl = this.defaultTTL) {
        try {
            const serializedValue = JSON.stringify(value);

            if (this.isRedisConnected()) {
                await this.redis.setex(key, ttl, serializedValue);
                console.log(`✅ Cached in Redis: ${key} (TTL: ${ttl}s)`);
            } else if (this.memory) {
                this.memory.set(key, value, ttl);
                console.log(`✅ Cached in memory: ${key} (TTL: ${ttl}s)`);
            } else {
                console.log(`⚠️ No cache available for key: ${key}`);
            }

            return true;
        } catch (error) {
            console.warn(`Cache set error for key ${key}:`, error.message);
            return false;
        }
    }

    // Delete from cache
    async del(key) {
        try {
            if (this.isRedisConnected()) {
                await this.redis.del(key);
            } else if (this.memory) {
                this.memory.del(key);
            }
            console.log(`🗑️ Deleted from cache: ${key}`);
            return true;
        } catch (error) {
            console.warn(`Cache delete error for key ${key}:`, error.message);
            return false;
        }
    }

    // Delete multiple keys with pattern
    async delPattern(pattern) {
        try {
            if (this.isRedisConnected()) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    console.log(`🗑️ Deleted ${keys.length} keys matching pattern: ${pattern}`);
                }
            } else {
                // For memory cache, we need to get all keys and filter
                if (this.memory) {
                    const keys = this.memory.keys().filter(key =>
                        new RegExp(pattern.replace('*', '.*')).test(key)
                    );
                    keys.forEach(key => this.memory.del(key));
                }
                console.log(`🗑️ Deleted ${keys.length} keys from memory cache`);
            }
            return true;
        } catch (error) {
            console.warn(`Cache pattern delete error for ${pattern}:`, error.message);
            return false;
        }
    }

    // Check if key exists
    async exists(key) {
        try {
            if (this.isRedisConnected()) {
                return await this.redis.exists(key);
            } else if (this.memory) {
                return this.memory.has(key);
            } else {
                return false;
            }
        } catch (error) {
            console.warn(`Cache exists error for key ${key}:`, error.message);
            return false;
        }
    }

    // Get cache statistics
    getStats() {
        if (this.isRedisConnected()) {
            return {
                type: 'redis',
                connected: true,
                info: 'Redis cache active'
            };
        } else if (this.memory) {
            const stats = this.memory.getStats();
            return {
                type: 'memory',
                connected: false,
                keys: stats.keys,
                hits: stats.hits,
                misses: stats.misses,
                hitRate: stats.hits / (stats.hits + stats.misses),
                memoryUsage: `${stats.vsize} bytes`
            };
        } else {
            return {
                type: 'none',
                connected: false,
                info: 'No caching available'
            };
        }
    }

    // Flush all cache
    async flush() {
        try {
            if (this.isRedisConnected()) {
                await this.redis.flushdb();
            } else if (this.memory) {
                this.memory.flushAll();
            }
            console.log('🧹 Cache flushed successfully');
            return true;
        } catch (error) {
            console.warn('Cache flush error:', error.message);
            return false;
        }
    }
}

// Create cache service instance
const cache = new CacheService();

// Cache key generators
const CacheKeys = {
    user: (id) => `user:${id}`,
    proposal: (id) => `proposal:${id}`,
    userProposals: (userId) => `user:${userId}:proposals`,
    stats: () => 'stats:general',
    session: (sessionId) => `session:${sessionId}`,
    file: (fileId) => `file:${fileId}`,

    // Pattern for bulk operations
    patterns: {
        user: 'user:*',
        proposal: 'proposal:*',
        session: 'session:*',
        stats: 'stats:*'
    }
};

// Cache TTL configurations (in seconds)
const CacheTTL = {
    SHORT: 300,    // 5 minutes
    MEDIUM: 1800,  // 30 minutes  
    LONG: 3600,    // 1 hour
    EXTENDED: 86400, // 24 hours

    // Specific use cases
    USER_DATA: 1800,      // 30 minutes
    PROPOSALS: 900,       // 15 minutes
    STATS: 300,          // 5 minutes
    SESSION: 3600,       // 1 hour
    FILE_METADATA: 86400, // 24 hours
};

// Graceful shutdown
process.on('SIGINT', async () => {
    if (redisClient) {
        console.log('🔄 Closing Redis connection...');
        await redisClient.quit();
        console.log('✅ Redis connection closed');
    }
});

module.exports = {
    cache,
    CacheKeys,
    CacheTTL,
    redisClient,
    isRedisAvailable: () => isRedisAvailable
}; 