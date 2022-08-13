//const PUBLISHER = '10.223.144.116';
//const PUBLISHER_PASSWORD = 'sdkjgoiudjbij49r8fiufj48fkfk49spht956054kfjfu4jegtfkgk4';

const PUBLISHER = '10.209.128.16';
const PUBLISHER_PASSWORD = 'sdkjgoiudjbij49r8fiufj48fkfk49spht956054kfjfu4jegtfkgk4';

const defaultTTLMinutes = 60;
const redisPackage = require('redis');

const subscriber = redisPackage.createClient({
   url: `redis://@${PUBLISHER}:6379`
});


const redis = redisPackage.createClient();
let usedMemory = 0;
let loc, key, val, res;

redis.on('connect', async () => {
    console.log('local redis connected');
    await redis.set('test', 'yippie');
    const result = await redis.get('test');
    console.log('test', result);

    setInterval(async () => {
        try {
            const result = await redis.info();
            result.split("\n").map((line) => {
                if (line.match(/used_memory:/)) {
                    usedMemory = line.split(":")[1];
                    console.log(`Used memory: ${usedMemory}`);
                }
            });
            // IMPORTANT: measure absolute memory consumption and if > 90% flush cache
        } catch(err) {

        }
    }, 5000);
});

redis.on('error', err => {
    console.error('local redis error', err);
});

const updateLocalCache = async (key, val) => {
    res = await redis.set(key, val, {EX: defaultTTLMinutes * 60});
}

subscriber.on('connect', async () => {
    subscriber.subscribe('url', (message) => {
        loc = message.indexOf('||');
        key = message.substring(0, loc);
        val = message.substring(loc+2);
        console.log(key, val.length);
        updateLocalCache(key, val);
        // if usedMemory < memoryThreshold
    });
});


redis.connect();
subscriber.connect();

