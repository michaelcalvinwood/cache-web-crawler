const debugMode = false;
// Settings
const defaultTTLMinutes = 240; // amount of time before a key expires from the cache
const cutKeysInHalfThreshold = 80; // percent memory utilization to start cutting keys in half
const flushCacheTreshold = 90; // percent memory utilitzation to flush the entire cache
const microstatsFrequency = '5s'; // example values 5s, 5m, 5h
const reportCacheMemoryUsageMs = 15000; // number of ms to wait before reporting cache memory usage

// Modules
require('dotenv').config();
const microstats = require('microstats');
const redisPackage = require('redis');
const { networkInterfaces } = require('os');
const { default: axios } = require('axios');

// Redis Clients
let redisReady = false;

const redis = redisPackage.createClient();

const subscriber = redisPackage.createClient({
    url: `redis://@${process.env.PUBLISHER}:6379`
 });

// const remoteRedis = redisPackage.createClient({
//     url: `redis://@${process.env.PUBLISHER}:6379`
//  });
 

// Functions

const getServerIpAddress = () => {
    const nets = networkInterfaces();
    return nets.eth0[0].address;
}
const serverIpAddress = getServerIpAddress();
console.log(`Server IP Address: ${serverIpAddress}`);


const sendWarningEmail = () => {
    const request = {
        url: "https://api.smtp.com/v4/messages?api_key=c7b410b870f73c1458c53a724de786910013d765",
        method: "post",
        data: {
            "channel": "admin_appgalleria_com",
            "recipients": {
              "to": [
                {
                  "name": "Michael Wood",
                  "address": "mwood@pymnts.com"
                }
              ],
              "cc": [
                {
                  "name": "Bryan Lynn",
                  "address": "blynn@pymnts.com"
                }
              ]
            },
            "originator": {
              "from": {
                "name": "Michael Wood",
                "address": "admin@appgalleria.com"
              }
            },
            "subject": `WARNING: ${serverIpAddress} is at ${percentMemoryUsage}% Memory Usage`,
            "body": {
              "parts": [
                {
                  "type": "text/html",
                  "content": `Redis caches memory has been reduced for ${serverIpAddress} due to excessive memory usage (${percentMemoryUsage}%).`
                }
              ]
            }
          }
    }
    axios(request)
    .then(response => {
        console.log('Warning email successfully sent.');
    })
    .catch(error => {
        console.error(error);
    })
}

// console.log redis memory usage in human readable format
const reportRedisMemoryUsage = async () => {
    if (!debugMode) return;

    try {
        const result = await redis.info();
        result.split("\n").map((line) => {
            if (line.match(/used_memory_human:/)) {
                usedMemory = line.split(":")[1];
                console.log(`REDIS MEMORY: ${usedMemory}`);
            }
        });
        // IMPORTANT: measure absolute memory consumption and if > 90% flush cache
    } catch(err) {

    }
}

// If memory usage exceeds threshold then cut the number of keys in half
const cutKeysInHalf = async () => {
    if (!redisReady) return;

    console.log(`SYSTEM MEMORY: ${percentMemoryUsage}%`);
    console.log('CUT KEYS IN HALF HERE');

    let keys = await redis.keys('http*');
    console.log (`Num keys before: ${keys.length}`);

    let result;

    for (let i = 0; i < keys.length; i += 2) {
        result = await redis.del(keys[i]);
    }

    keys = await redis.keys('http*');
    console.log (`Num keys after: ${keys.length}`);

    sendWarningEmail();
}

// If memory threshold exceeds emergency levels then flush the cache entirely
const flushCache = async () => {
    if (!redisReady) return;

    console.log(`SYSTEM MEMORY: ${percentMemoryUsage}%`);
    console.log('FLUSH CACHE HERE');

    await redis.flushAll();

    let keys = await redis.keys('http*');
    console.log (`Num keys: ${keys.length}`);

    sendWarningEmail();
}

// Test flushCache function
// IMPORTANT: Comment this out after testing!
//setTimeout(flushCache, 30000);

let percentMemoryUsage = 0;
microstats.on('memory', memory => { 
    percentMemoryUsage = memory.usedpct;
    if (debugMode) console.log(`SYSTEM MEMORY: ${percentMemoryUsage}%`);
    
    if (percentMemoryUsage > flushCacheTreshold) flushCache();
    else if (percentMemoryUsage > cutKeysInHalfThreshold) cutKeysInHalf();

});
//microstats.on('cpu', cpu => { console.log('SYSTEM CPU:', cpu) });
//microstats.on('disk', disk => { console.log('SYSTEM DISK:', disk)});

let options = { frequency: microstatsFrequency };
microstats.start(options, err => {
  if(err) console.log(err);
});

let usedMemory = 0;
let loc, key, val, res;


redis.on('connect', async () => {
    redisReady = true;
    console.log('local redis connected');
    await redis.set('test', 'yippie');
    const result = await redis.get('test');
    console.log('test', result);

    setInterval(reportRedisMemoryUsage, reportCacheMemoryUsageMs);
});

redis.on('error', err => {
    console.error('local redis error', err);
});

const updateLocalCache = async (key, val) => {
    res = await redis.set(key, val, {EX: defaultTTLMinutes * 60});
}

subscriber.on('connect', async () => {
    console.log('subscriber redis connected');
    
    subscriber.subscribe('url', (message) => {
        loc = message.indexOf('||');
        key = message.substring(0, loc);
        val = message.substring(loc+2);
        if (debugMode) console.log(key, val.length);
        updateLocalCache(key, val);
        // if usedMemory < memoryThreshold
    });
});


redis.connect();
subscriber.connect();

