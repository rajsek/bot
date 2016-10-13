'use strict';

const logger = require('../logger');

const fetchFBProfile = module.exports = (graph) => (msg, sess, next) => {
  if (sess.context.fbProfile) return next();

  graph(sess.context.fbUserId)
    .then(fbProfile => {
      sess.merge({fbProfile});
      next();
    })
    .catch(err => {
      logger.warn('Failed to get user info', err);
      next();
    });
};
