const cheerio = require('cheerio');
const axios = require('axios');

let urlList = [
  'https://dev.pymnts.com',
  'https://dev.pymnts.com/',
  'https://dev.pymnts.com/data/?type=study',
  'https://dev.pymnts.com/streaming/',
  'https://dev.pymnts.com/today-on-pymnts/',
  'https://dev.pymnts.com/topic/b2b/',
  'https://dev.pymnts.com/topic/retail/',
  'https://dev.pymnts.com/topic/fintech/',
  'https://dev.pymnts.com/topic/connected-economy/',
  'https://dev.pymnts.com/topic/crypto/',
  'https://dev.pymnts.com/emea/',
  'https://dev.pymnts.com/data/?type=tracker',
  'https://dev.pymnts.com/topic/markets/'
]

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
  console.log(links);
}

triggerCache(urlList);
