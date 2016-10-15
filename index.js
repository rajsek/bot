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

const accessTokenMap= new Map();


const graph = graphAPI();

//const bot =fbBot(greeter);
const bot           =   fbBot(greeter, {accessToken: accessToken, pageId: page.id, defaultLocale: page.lang, accessToken: page.accessToken});

for(let page of config.pages) {
	let greeting=s[page.lang]['welcome_screen'];

	let menu_buttons    =   {
        'best_of_month': s[page.lang]['top_of_month'],
        'five_last': s[page.lang]['five_last'],
        'keywords': s[page.lang]['keywords'],
        'switch_locale': s[page.lang]['change_language']
    };
    let buttons     =   Object.keys(menu_buttons).map(key => ({
        type: 'postback',
        payload: key,
        title: menu_buttons[key]
    }));
  	buttons.push({
        type: "web_url",
        title: s[page.lang]['talk_to_human'],
        url: config.human_url
    });


	let pageSettings={
		pageId:id,
		setupPersistentMenu:buttons,
		setupGreeting:greeting
		setupStartButton:true
	}
	bot.start(pageSettings).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

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

app.use('/images', express.static(__dirname + '/images'));
