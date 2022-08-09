const cheerio = require('cheerio');
const axios = require('axios');

const request = {
    url: 'https://dev.pymnts.com',
    method: 'get'
};

axios(request)
.then(response => {
    const html = response.data;

    const $ = cheerio.load(html);
    const linkObjects = $('a');
    const links = [];
    linkObjects.each((index, element) => {
      links.push($(element).attr('href'));
    });

    console.log(links);

})
.catch(err => console.error('ERROR', request));
