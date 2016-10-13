'use strict';

const swearjar = require('swearjar');
const randomOf = require('../helpers/random-of');
const s = require('../../i18n/strings');

const answers = [
    'swear_reaction_1',
    'swear_reaction_2',
    'swear_reaction_3',
    'swear_reaction_4',
    'swear_reaction_5',
    'swear_reaction_6',
    'swear_reaction_7',
    'swear_reaction_8'
];

const swearDetect = (config) => (msg, conv, next) => {
    const locale = conv.locale;

    if (config && config.wordsPath) {
        swearjar.loadBadWords(config.wordsPath);
    }

    if (/stupid bot/.test(msg)) {
        conv.reply('Pathetic human!');
    } else if (swearjar.profane(msg)) {
        const randomReply = s[locale][randomOf(answers)];
        conv.reply(randomReply);
        console.log(conv.context.last_event);
        //Repeat the previous question when swear words appear - it will be stored in conv.context.last_event variable
        if (typeof conv.context.last_event === 'function')
            conv.context.last_event();
    } else {
        next();
    }
}

module.exports = swearDetect;
