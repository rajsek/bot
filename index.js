'use strict';
const attachLocale = require('./lib/middleware/attach-locale');
const s = require('./i18n/strings');

//const fbBot = require('./lib/fb-bot');
const fbTokenVerify = require('./lib/fb-token-verify');
const chatHandler = require('./lib/chat-handler');
const fetchFBProfile = require('./lib/middleware/fetch-fb-profile');
const graphAPI = require('./lib/graph-api');
// const bot = require('./bots/greeter');
const swearDetect = require('./lib/middleware/swear-detect');


const bodyParser = require('body-parser');
const express = require('express');

const logger = require('./lib/logger');
const config = require('./configure');

const app = express();

const graph = graphAPI(config.page.accessToken);

// const botS = fbBot(greeter, { graph: graph, pageId: page.id, defaultLocale: page.lang });

// bot.use(fetchFBProfile(graph));
// bot.use(attachLocale);
// bot.use(swearDetect({ wordsPath: config[page.lang].foulSpeechFile }));

// WebHook verification endpoint
app.use(bodyParser.json());
app.get('/webhook/', fbTokenVerify(config.verifyToken));
app.post('/webhook/',chatHandler);

app.listen(config.port, () => {
    logger.info('Bot running on port :' + config.port);
    logger.info('Webhook verification token is ' + config.verifyToken);
});