'use strict';

const request = require('request');
const log = require('./logger');
const config            =   require('./configure');
const accessTokenMap =new Map();

for(let page of config.pages) {
  accessTokenMap.set(page.id,page.accessToken)
}
// Make a Graph API request, return a promise on the response
// Will reject of response statusCode is >= 400
const GraphAPI = module.exports = (pageId,path, options) => {
  if (!/^\//.test(path)) path = '/' + path;

  const url = 'https://graph.facebook.com/v2.6' + path;
  const defaults = {
    qs: {access_token: accessTokenMap.get(pageId)},
    method: 'GET',
    json: true
  };

  const opts = Object.assign({url}, defaults, options || {});
  
  log.debug(opts.method.toUpperCase(), opts.url);
  log.silly(JSON.stringify(opts, null, 2));

  return new Promise((resolve, reject) =>
    request(opts, (err, res) => {
      if (err) return reject(err);

      log.debug(opts.url, '-', res.statusCode);
      log.silly(JSON.stringify(res.body, null, 2), '\n');

      if (res.statusCode >= 400) reject(res.body.error);
      else resolve(res.body);
    })
  );
};

// // Make a Graph API request, return a promise on the response
// // Will reject of response statusCode is >= 400
// const GraphAPI1 = module.exports = (accessToken) => (path, options) => {
//   if (!/^\//.test(path)) path = '/' + path;

//   const url = 'https://graph.facebook.com/v2.6' + path;
//   const defaults = {
//     qs: {access_token: accessToken},
//     method: 'GET',
//     json: true
//   };

//   const opts = Object.assign({url}, defaults, options || {});
  
//   log.debug(opts.method.toUpperCase(), opts.url);
//   log.silly(JSON.stringify(opts, null, 2));

//   return new Promise((resolve, reject) =>
//     request(opts, (err, res) => {
//       if (err) return reject(err);

//       log.debug(opts.url, '-', res.statusCode);
//       log.silly(JSON.stringify(res.body, null, 2), '\n');

//       if (res.statusCode >= 400) reject(res.body.error);
//       else resolve(res.body);
//     })
//   );
// };

