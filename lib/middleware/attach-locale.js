'use strict';

const config = require('../../configure');
const log = require('../logger');

/*
 * Attaches user's locale information to the session. The locale information is obtained from the 
 * Facebook profile information of the user (hence this middleware depends on fetch-fb-profile 
 * middleware to run first)
 */
const attachLocale = (msg, sess, next) => {
    if (!sess.context.fbProfile) {
        log.warn('User profile not found in session. Make sure you use `fetchFBProfile` middleware');
    };

    if (hasLocale(sess) && isSupportedLocale(sess)) {
        sess.locale = sess.context.fbProfile.locale;
        log.debug(`Using locale: ${sess.locale}`);
    } else {
        log.debug(`No or unsupported locale (${sess.context.fbProfile.locale})`);
    }

    next();
}

const hasLocale = (sess) =>
    sess.context.fbProfile && sess.context.fbProfile.locale

const isSupportedLocale = (sess) =>
    config.i18n.lang.indexOf(sess.context.fbProfile.locale) > -1

module.exports = attachLocale;
