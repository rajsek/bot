'use strict';

const fbTokenVerify = (verifyToken) => (req, res) => {
  if (req.query['hub.verify_token'] === verifyToken) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(400).send('Error, wrong validation token');
  }
}

module.exports = fbTokenVerify;
