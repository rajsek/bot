'use strict';
const attachLocale = require('./lib/middleware/attach-locale');
const s = require('./i18n/strings');

const fbBot = require('./lib/fb-bot');
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


//const bot =fbBot(greeter);
//const bot           =   fbBot({pageId: page.id, defaultLocale: page.lang, accessToken: page.accessToke
const bot =new fbBot()
for(let page of config.pages) {
	let greeting=s[page.lang]['welcome_screen'];

	let menu_buttons    =   {
        'play_quiz': s[page.lang]['play_quiz'],
        'generate_meme': s[page.lang]['generate_meme'],
        'watch_movie_clip': s[page.lang]['watch_movie_clip'],
        'listen_audio': s[page.lang]['listen_audio']
    };
    let buttons     =   Object.keys(menu_buttons).map(key => ({
        type: 'postback',
        payload: key,
        title: menu_buttons[key]||key
    }));
  	buttons.push({
        type: "web_url",
        title: s[page.lang]['talk_to_human'],
        url: config.human_url
    });


	let pageSettings={
		pageId:page.id,
		buttons:buttons,
		setupGreeting:greeting,
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
