'use strict';

const config = require('../configure');
const strings = {};

for (let lang of config.i18n.lang) {
    strings[lang] = require(`./${lang}/strings.json`);
}

module.exports = strings;
