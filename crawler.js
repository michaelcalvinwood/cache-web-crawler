const sleepMinutes = 1;
const speedBumpSeconds = .5; // number seconds to wait in between fetching unique urls
const minuteUpdateMinutes = 1;

const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const redisPackage = require('redis');
const { request } = require('http');
const { response } = require('express');
const redis = redisPackage.createClient({password: process.env.PUBLISHER_PASSWORD});
let redisConnected = false;

redis.on('connect', async () => {
  console.log('redis connected');
  redisConnected = true;
});
redis.on('error', err => {
  console.error('Redis Error', err);
})
redis.connect();

let rawdata = fs.readFileSync('crawlList.json');
const urlList = JSON.parse(rawdata);

rawdata = fs.readFileSync('minuteUpdateList.json');
const minuteUpdates = JSON.parse(rawdata);

const hostname = process.env.HOSTNAME;
const hostname2 = process.env.HOSTNAME2;

console.log('[crawler]', urlList);
console.log(`[crawler] Hostname: ${process.env.HOSTNAME}`);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const updateMinuteUrls = async () => {
    let request = {};
    let response;

    for (let i = 0; i < minuteUpdates.length; ++i) {
        request = {
            url: minuteUpdates[i],
            method: 'get'
        }
        try {
            //console.log(`Minute update: ${request.url}`);
            response = await axios(request);     
            try {
              await redis.publish('url', 'test');
            } catch (e) {
              console.error(e.message);
            }
            await sleep(1000);

        } catch(error) {
            console.error(`Error getting minute update for ${request.url}`);
        }
    }
}

// setInterval(() => {
//    updateMinuteUrls();
// }, minuteUpdateMinutes * 62000);



const triggerCache = async urls => {
  if (!urls) return;
  if (!Array.isArray(urls)) return;
  if (!urls.length) return;
  let request;

  console.log('[crawler] infinite loop');

  while (1) {
    // get links for all urls
    let links = [];
    let response;

    for (let i = 0; i < urls.length; ++i) {
        request = {
          url: urls[i],
          method: 'get',
          timeout: 15000
        }
        try {
          response = await axios(request);
          console.log(`Got: ${request.url}`);
          let $ = cheerio.load(response.data);
          let linkObjects = $('a');
          linkObjects.each((index, element) => {
            links.push($(element).attr('href'));
          });
        } catch (error) {
          console.error(`Error getting ${request.url}: ${error.message}`);
        }
    }
    //console.log(`Found ${links.length} links`);
  
    // convert URIs to URLs
  
    let isUri = false;
    let isHost = false;
  
    let mappedLinks = links.map(link => {
      if (link.startsWith('/')) {
        //console.log(`got ${link}`);
        return hostname + link;
      }
      else return link;
    });
    //console.log(`${mappedLinks.length} mapped links`);
    
    // filter out any urls that do not point to the host

    let filteredLinks = mappedLinks.filter(link => {
      if (link.startsWith(hostname) || link.startsWith(hostname2)) return true;
      return false;
    });
    //console.log(`${filteredLinks.length} filtered links`);
    
    // find the unique links
    let uniqueLinks = [...new Set(filteredLinks)];
    console.log(`[crawler] ${new Date().toLocaleTimeString()}: ${uniqueLinks.length} unique links`);
  
    // slowly request each unique link one by one
    let info = {};

    for (let i = 0; i < uniqueLinks.length; ++i) {
      request = {
        url: uniqueLinks[i],
        method: 'get',
        timeout: 10000
      };
    
      try {
        console.log(`[${i+1}/${uniqueLinks.length}] Fetching ${request.url}`);
        response = await axios(request);
        await redis.publish('url', `${request.url}||${response.data}`);
      } catch(err) {
          console.error(`[crawler] ERROR ${err.code}: Cannot fetch ${request.url}`);
      }
      await sleep(speedBumpSeconds * 1000);
    }

    // sleep five minutes before cycling again
    console.log(`[crawler] Sleeping ${sleepMinutes} minutes`);
    await sleep(sleepMinutes * 60000);
  }  

 
}

triggerCache(urlList);

const testRestConnection = async () => {
  let request = {
      url: `https://pymnts.com/wp-json/wp/v2/posts/?type=posts&per_page=100`,
      method: 'get',
      timeout: 10000
 }
 let response;
 
 try {
      response = await axios(request);
 }    
 catch(err) {
      console.error(`[crawler] ERROR ${err.code}: Cannot fetch ${request.url}`);
      return;
 }
}

//testRestConnection();