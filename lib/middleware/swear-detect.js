'use strict';

const swearjar = require('swearjar');
const randomOf = require('../helpers/random-of');
const s = require('../../i18n/strings');

// const pageLanguageMap = new Map();

// for (let page of config.pages) {
//   pageLanguageMap.set(page.id, page.lang)
// }

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

const swearDetect = (config)=> (pagaID, msg) => {


    if (config && config.wordsPath) {
        swearjar.loadBadWords(config.wordsPath);
    }
    return swearjar.profane(msg)
}

module.exports = swearDetect;
