'use strict';

/**
 * Bot actual bot controller
 */
const s = require('../i18n/strings');


/**
 * @param {Object} menuOptions
 * Keys are button payloads, values are functions that handle the corresponding action.
 * For instance, if the persistent menu only has 1 button named 'buy air ticket',
 * menuOptions = {
 *   '__menu_buy_air_ticket__': require('./bots/air-ticket-bot')
 * }
 * Or it could be socialMediaBrief or any other bot.
 */
module.exports = (menuOptions) => (message, conv) => {


}
