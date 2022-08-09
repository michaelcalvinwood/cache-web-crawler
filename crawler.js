const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');

let rawdata = fs.readFileSync('urlList.json');
let urlList = JSON.parse(rawdata);
console.log(urlList);


const request = {
    url: 'https://dev.pymnts.com',
    method: 'get'
};


const triggerCache = async urls => {
  if (!urls) return;
  if (!Array.isArray(urls)) return;
  if (!urls.length) return;

  let links = [];

  for (let i = 0; i < urls.length; ++i) {
      let request = {
        url: urls[i],
        method: 'get'
      }
      try {
        response = await axios(request);
        const $ = cheerio.load(response.data);
        const linkObjects = $('a');
        linkObjects.each((index, element) => {
          links.push($(element).attr('href'));
        });
      } catch (error) {
        console.log(`Error getting ${request.url}`);
      }
  }
  console.log(`Found ${links.length} links`);

  // convert URIs to URLs

  // remove all links that do not belong to the HOSTNAME

  // Remove duplicates

  // get each link

}

triggerCache(urlList);
