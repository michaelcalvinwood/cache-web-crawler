const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

let rawdata = fs.readFileSync('crawlList.json');
const urlList = JSON.parse(rawdata);

rawdata = fs.readFileSync('minuteUpdateList.json');
const minuteUpdates = JSON.parse(rawdata);

const hostname = process.env.HOSTNAME;
const hostname2 = process.env.HOSTNAME2;

console.log(urlList);
console.log(`Hostname: ${process.env.HOSTNAME}`);


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
            console.log(`Minute update: ${request.url}`);
            response = await axios(request);        
            await sleep(1000);

        } catch(error) {
            console.error(`Error getting minute update for ${request.url}`);
        }
    }
}

setInterval(() => {
   updateMinuteUrls();
}, 3 * 60 * 1000);


const triggerCache = async urls => {
  if (!urls) return;
  if (!Array.isArray(urls)) return;
  if (!urls.length) return;

  while (1) {
    // get links for all urls
    let links = [];

    for (let i = 0; i < urls.length; ++i) {
        let request = {
          url: urls[i],
          method: 'get',
          timeout: 15000
        }
        try {
          response = await axios(request);
          const $ = cheerio.load(response.data);
          const linkObjects = $('a');
          linkObjects.each((index, element) => {
            links.push($(element).attr('href'));
          });
        } catch (error) {
          console.error(`Error getting ${request.url}`);
        }
    }
    console.log(`Found ${links.length} links`);
  
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
    console.log(`${mappedLinks.length} mapped links`);
    
    // filter out any urls that do not point to the host

    let filteredLinks = mappedLinks.filter(link => {
      if (link.startsWith(hostname) || link.startsWith(hostname2)) return true;
      console.log(link);
      return false;
    });
    console.log(`${filteredLinks.length} filtered links`);
    
    // find the unique links
    let uniqueLinks = [...new Set(filteredLinks)];
    console.log(`${uniqueLinks.length} unique links`);
  
    // slowly request each unique link one by one

    for (let i = 0; i < uniqueLinks.length; ++i) {
      request = {
        url: uniqueLinks[i],
        method: 'get',
        timeout: 10000
      };

      try {
        console.log(`fetching ${request.url}`);
        response = await axios(request);
      } catch(e) {

      }
      await sleep(1500);
    }
  }  

  // sleep five minutes before cycling again
  await sleep(300000);
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
      console.log(`fetching last 100 posts`, request);
      response = await axios(request);
      console.log(` got last 100 posts`);
      
 }    
 catch(err) {
      console.log(`ERROR ${err.code}: Cannot fetch ${request.url}`);
      return;
 }
}

testRestConnection();