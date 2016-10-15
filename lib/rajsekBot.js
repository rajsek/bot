'use strict';

const util = require('util');
const EventEmitter = require('events').EventEmitter;
const request = require('request');
const Router = require('express').Router;
const FB_URL = 'https://graph.facebook.com/v2.6/';
const FB_MESSENGER_URL = `${FB_URL}/me/messages`;

class MyStream extends EventEmitter {
  constructor() {
    super();
  }
  
}


function Botly(options) {
    if (!(this instanceof Botly)) {
        return new Botly(options);
    }

    if (!options || !options.accessToken) {
        throw new Error('Must provide accessToken');
    }
    this.accessToken = options.accessToken;
    this.verifyToken = options.verifyToken;
    this.webHookPath = options.webHookPath || '/';
    this.notificationType = options.notificationType || NOTIFICATION_TYPE.REGULAR;
    EventEmitter.call(this);
}