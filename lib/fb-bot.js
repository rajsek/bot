'use strict';
const graphAPI = require('./graph-api');
const templates = require('./templates');


// Simple Express middleware to process Facebook messaging events.

const assert = require('assert');
const merge = require('lodash.merge');
const log = require('./logger');

// Extract the messaging entries in the given request body
function getMessagingEntries(body) {
    let val = (
        body.object == 'page' &&
        body.entry &&
        Array.isArray(body.entry) &&
        body.entry.length > 0 && // fixme: iterate over entries
        Array.isArray(body.entry[0].messaging) &&
        body.entry[0].messaging) || [];
    return val.filter(m => (m.message || m.postback) && m.sender);
}

function getDeliveryStatus(body) {
    let val = (
        body.object == 'page' &&
        body.entry &&
        Array.isArray(body.entry) &&
        body.entry.length > 0 && // fixme: iterate over entries
        Array.isArray(body.entry[0].messaging) &&
        body.entry[0].messaging) || [];

    return val[0].delivery ? val[0] : false;
}

// Session class. Stores user data, conversation state and provides `reply` and `ask` functions
// to interact with the user.
function Session(fbUserId, options) {
    const debounce = 1000;
    const queue = [];

    const doSend = (payload) => {
        log.silly('do send', payload);

        graphAPI('/me/messages', { method: 'post', json: payload }).then(data => {
            if (payload.store_message_id) {
                this.context = merge({}, this.context, { last_message_id: data.message_id });
            }
        }).catch(err => {
            log.error('Error sending message', err);
        })
    };

    // Polls the queue every in an interval defined by `debounce`, sends the message on top
    const processQueue = () => {
        let msg = queue.pop();
        if (msg)
            doSend(msg);
        // TODO: try to emulate typing speed, length of next message on queue * x or 1s
    };
    this.showLoading = () => {
        log.silly('do send loading');
        graphAPI('/me/messages', { method: 'post', json: { recipient: { id: fbUserId }, sender_action: 'typing_on' } }).catch(err => {
            log.error('Error sending message', err);
        })
    }

    this.initDefaults = () => {
        log.verbose(`init or reset session for ${fbUserId}`);
        this.asking = null;
        this.locale = options.defaultLocale;
        this.context = { fbUserId };
        this.accessToken = options.accessToken;
        this.start_time = new Date().getTime() / 1000;
    }

    this.initDefaults();
};

// Send a message to recipient via Graph API. Second arg must be either a string or an object.
// If it's a string it will be sent as plain text message, if it's an object it must adhere to the
// full specs for structured messages (i.e. `{attachment: {type: template}, ...}`)

Session.prototype.reply = function (msg, store_message_id) {
    store_message_id = store_message_id || false;
    return this.sendMessage(msg, store_message_id);
};

//Send a post request to show loading symbol to the user
Session.prototype.loading = function () {
    return this.showLoading();
};

// To 'ask' means we reply with the given question and process the next incoming message with the
// given callback. That means we can ask for specific information, then evaluate the response,
// store it in context or rephrase our question in case the response is not what we expect
Session.prototype.ask = function (question, fn) {
    this.asking = fn;
    return this.sendMessage(question);
};

// Merge given data into session context. Call this at any point, usually after you receive
// a message and did any post-processing like parsing, natural language processing, etc.
Session.prototype.merge = function (data) {
    this.context = merge({}, this.context, data);
    log.silly('Context after merge: ', JSON.stringify(this.context, null, 2));
};

Session.prototype.reset = function () {
    this.initDefaults();
};

Session.prototype.setLocale = function (locale) {
    this.locale = locale;
}

Session.prototype.setTime = function (time) {
    this.start_time = time;
}

//Facebook bot middleware
const fbBot = module.exports = function FBBot() {
    // assert(options, 'options are required');
    // assert(options.graph, 'graph api is required');
    // assert(options.pageId, 'pageId is required');
    // assert(options.defaultLocale, 'defaultLocale is required');

    // const graph         =   options.graph;
    const sessions = new Map();
    const middleware = [];

    const self = {};

    // Sessions are stored in a Map by facebook user id. For each incoming  message we find the
    // matching session entry and pass it into the message handler. It would be relatively easy to
    // add persistent storage via Redis or pluggable storage handlers.

    // Find existing session by given key or create a new one. Return value will be a
    // shallow-clone copy and must be written back via updateSession
    const findOrCreateSession = (fbUserId) => {
        if (!sessions.has(fbUserId)) {
            log.verbose(`new session for ${fbUserId}`);
            let sess = new Session(fbUserId, "options");
            sessions.set(fbUserId, sess);
        }
        return sessions.get(fbUserId);
    };

    // Either call back to handler for last question, or handle with default handler
    // TODO: to accept multiple messages as answer, we can add a `next()` callback
    // that clears the `asking` callback instead of clearing it after the next message
    const handleMessage = (text, sess) => {
        // let handler =   msgHandler;
        // if (typeof sess.asking === 'function') {
        //     handler     =   sess.asking;
        //     sess.asking =   undefined; // reset _before_ handling in case we get a new one
        // }

        // handler(text, sess);
    };

    // Middlewares allow modification of message and session before handler. Middlewares can
    // abort the chain by not calling 'next' and sending a reply directly. Session state will
    // persist in that case, i.e. any 'asking' handlers will remain in place.
    const processMiddleware = (i, msg, sess) => {
        if (i >= middleware.length) handleMessage(msg, sess);
        else middleware[i].call(null, msg, sess, (newMsg, newSess) => {
            if (!newMsg) newMsg = msg;
            if (!newSess) newSess = sess;
            processMiddleware(i + 1, newMsg, newSess);
        });
    };

    const processMessage = (msg) => {
        log.verbose('bot processing msg' + JSON.stringify(msg));
        log.verbose(`sender is ${msg.sender.id}`);

        const sess = findOrCreateSession(msg.sender.id);
        const text = (msg.message && msg.message.text) || (msg.postback && msg.postback.payload);

        if (typeof msg.message_id != 'undefined') {
            sess.context = merge({}, sess.context, { message_id: msg.message_id });
        }

        processMiddleware(0, text, sess);
    }

    // Support for middleware
    const setupGreeting = (pageId, greetingMsg) => {
        if (!greetingMsg) return null;
        else return graphAPI(pageId,
            '/me/thread_settings', {
                method: 'post',
                json: {
                    setting_type: 'greeting',
                    greeting: {
                        text: greetingMsg
                    }
                }
            }
        );
    };

    const setupStartButton = (pageId) => {
        return graphAPI(pageId,
            '/me/thread_settings', {
                method: 'post',
                json: {
                    setting_type: 'call_to_actions',
                    thread_state: 'new_thread',
                    'call_to_actions': [{
                        payload: 'start_button'
                    }]
                }
            }
        )
    };

    const setupWelcomeMsg = (pageId, welcomeMsg) => {
        if (!welcomeMsg) return null;
        else return graphAPI(pageId,
            '/me/thread_settings', {
                method: 'post',
                json: {
                    setting_type: 'call_to_actions',
                    thread_state: 'new_thread',
                    call_to_actions: [{ "message": welcomeMsg }]
                }
            });
    };

    const setupPersistentMenu = (pageId, menu_buttons) => {
        if (!menu_buttons) return null;
        else {
            return graphAPI(pageId,
                '/me/thread_settings', {
                    method: 'post',
                    json: {
                        setting_type: 'call_to_actions',
                        thread_state: 'existing_thread',
                        call_to_actions: menu_buttons
                    }
                }
            );
        }
    };

    const subscribePage = (pageId) => {
        return graphAPI(pageId, '/me/subscribed_apps', { method: 'post' });
    };

    self.sendTextMessage = (pageId, recipientId, messageText) => {
        const message = templates.textMessage(messageText)
        const recipient = { recipient: { id: recipientId } }
        const messageData = Object.assign(recipient, message);
        callSendAPI(pageId, messageData);
    }
    self.sendVideoMessage = (pageId, recipientId, url) => {
        const message = templates.mediaMessage('video',url);
        const recipient = { recipient: { id: recipientId } }
        const messageData = Object.assign(recipient, message);
        callSendAPI(pageId, messageData);
    }
       self.sendImageMessage = (pageId, recipientId, url) => {
        const message = templates.mediaMessage('image',url);
        const recipient = { recipient: { id: recipientId } }
        const messageData = Object.assign(recipient, message);
        callSendAPI(pageId, messageData);
    }
      self.sendFileMessage = (pageId, recipientId, url) => {
        const message = templates.mediaMessage('file',url);
        const recipient = { recipient: { id: recipientId } }
        const messageData = Object.assign(recipient, message);
        callSendAPI(pageId, messageData);
    }
    self.sendAudioMessage = (pageId, recipientId, url) => {
        const message = templates.mediaMessage('audio',url);
        const recipient = { recipient: { id: recipientId } }
        const messageData = Object.assign(recipient, message);
        callSendAPI(pageId, messageData);
    }
    self.sendQuickReplyMessage = (pageId, recipientId, question, options) => {
        const message = templates.quickReplyMessage(question, options);
        const recipient = { recipient: { id: recipientId } }
        const messageData = Object.assign(recipient, message);
        callSendAPI(pageId, messageData);
    }
    self.sendGenericMessage = (pageId, recipientId, bubbles) => {
        const message = templates.genericMessage(bubbles);
        const recipient = { recipient: { id: recipientId } }
        const messageData = Object.assign(recipient, message);
        callSendAPI(pageId, messageData);
    }

    // function callSendAPI(pageId, messageData) {
    //     graphAPI(pageId,
    //         '/me/messages', {
    //             method: 'POST',
    //             json: messageData
    //         }
    //     );
    // }
    function callSendAPI(pageId, messageData) {
        graphAPI(pageId,
            '/me/messages', {
                method: 'POST',
                json: messageData
            }
        );
    }


    // attach middleware to the bot
    self.use = (fn) => {
        middleware.push(fn);
    };

    // start the bot (aka subscribe to page)
    self.start = (options) => {
        return subscribePage(options.pageId)
            .then(setupPersistentMenu(options.pageId, options.buttons))
            .then(setupGreeting(options.pageId, options.setupGreeting))
            .then(setupStartButton(options.pageId));
    };

    // process incoming message
    self.process = (msg) => {
        return processMessage(msg);
    };

    return self;
}
