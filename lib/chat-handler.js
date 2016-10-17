'use strict';
const config = require('../configure');
var request = require('request');
const fbBot = require('./fb-bot');
const strings = require('../i18n/strings');
const graphAPI = require('./graph-api');
const randomOf = require('./helpers/random-of');
const swareDetect = require('./middleware/swear-detect')({ wordsPath: config["en_US"].foulSpeechFile });
const pageLanguageMap = new Map();
const swareDetectReply = new Map();
const bot = new fbBot()


for (let page of config.pages) {
  pageLanguageMap.set(page.id, page.lang)
  swareDetectReply.set(page.id, page.answers)
}

/**
 * belwo funcitosn need to a handler 
 * 
 */
function sendGenericMessage(pageId, recipientId) {

  const bubbles = [{
    title: "rift",
    subtitle: "Next-generation virtual reality",
    item_url: "http://google.co.in",
    image_url: "http://bestanimations.com/Holidays/Fireworks/fireworks/fireworks-animated-gif-23.gif",
    buttons: [{
      type: "web_url",
      url: "https://www.oculus.com/en-us/rift/",
      title: "Open Web URL"
    }, {
      type: "postback",
      title: "Call Postback",
      payload: "Payload for first bubble",
    }],
  }, {
    title: "touch",
    subtitle: "Your Hands, Now in VR",
    item_url: "https://www.oculus.com/en-us/touch/",
    image_url: "https://secure.static.tumblr.com/8773ce8c80b939810f4afc88b87192d4/esfldks/I63myx1av/tumblr_static_imagesspiral.gif",
    buttons: [{
      type: "web_url",
      url: "https://www.oculus.com/en-us/touch/",
      title: "Open Web URL"
    }, {
      type: "postback",
      title: "Call Postback",
      payload: "Payload for second bubble",
    }]
  }]
  bot.sendGenericMessage(pageId, recipientId, bubbles)


}
const getLocaleString = (pageId, stringId) => {
  const pageLocale = pageLanguageMap.get(pageId);
  return strings[pageLocale][stringId]
}
function sendQuickReplyMessage(pageId, recipientId, payload) {
  let question, options;

  if (payload === 'send_button_types') {
    const buttons = ['url_button', 'post_button', 'call_button', 'share_button', 'buy_button'];
    question = 'Different Types buttens supproted by FB';
    options = buttons.map((button) => ({
      content_type: 'text',
      title: getLocaleString(pageId, button),
      payload: button
    }));
  }
  else {
    question = "Pick a color:";
    options = [
      {
        "content_type": "text",
        "title": "Red",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
      },
      {
        "content_type": "text",
        "title": "Green",
        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
      }
    ];
  }
  bot.sendQuickReplyMessage(pageId, recipientId, question, options)
}
function sendSwearMessage(pageId, recipientId) {
  const pageLocale = pageLanguageMap.get(pageId);
  const pageSwearAnswer = swareDetectReply.get(pageId)
  const messageText = strings[pageLocale][randomOf(pageSwearAnswer)];
  bot.sendTextMessage(pageId, recipientId, messageText);
}
function sendVideoMessage(pageId, recipientId) {
  const videoUrl = 'https://krds-demo.herokuapp.com/small.mp4';
  bot.sendVideoMessage(pageId, recipientId, videoUrl);
}
function sendAudioMessage(pageId, recipientId) {
  const audioUrl = 'http://krds-demo.herokuapp.com/Aalanaana_Naal.mp3';
  bot.sendAudioMessage(pageId, recipientId, audioUrl);
}
function sendFileMessage(pageId, recipientId) {
  const audioUrl = 'https://krds-demo.herokuapp.com/en-js-p2.pdf';
  bot.sendFileMessage(pageId, recipientId, audioUrl);
}
function sendImageMessage(pageId, recipientId) {
  const imageoUrl = 'https://krds-demo.herokuapp.com/tumblr_static_imagesspiral.gif';
  bot.sendImageMessage(pageId, recipientId, imageoUrl);
}
const logMessage = (messageObject) => {
  if (messageObject.delivery) {
    let messageText = messageObject.text ? messageObject.text : messageObject.payload;
    console.log("Received delivery callback for user %d and page %d with message id value '%s' " +
      "at %d", messageObject.senderId, messageObject.pageId, messageText, messageObject.deliveryMessageIds);
  }
}
const structureMessage = (event) => {
  let message = event.message;
  let postback = event.postback;
  let delivery = event.delivery;
  let plainText = message && message.text;
  let attachment = message && message.attachments;
  let quickReply = message && message.quick_reply && message.quick_reply.payload;
  let postbackText = postback && postback.payload;
  let deliveryMessageIds = delivery && delivery.mids;
  let messageType = plainText ? 'text' : attachment ? 'attachment' : postbackText ? 'postback' : quickReply ? 'quickReply' : 'undefined';
  return {
    text: plainText,
    attachment: attachment,
    payload: postbackText || quickReply,
    type: messageType,
    senderId: event.sender.id,
    pageId: event.recipient.id,
    timeOfMessage: event.timestamp,
    delivery: event.delivery,
    deliveryMessageIds: deliveryMessageIds
  }
}
const receivedMessage = (messageObject) => {
  let senderId = messageObject.senderId;
  let pageId = messageObject.pageId
  let payload = messageObject.payload;
  let text = messageObject.text;
  let type = messageObject.type;
  let messageText = undefined;
  if (type === 'text') {
    switch (text) {
      case 'image':
        sendImageMessage(pageId, senderId);
        break;
      case 'shareButton':
        sendButtonMessage(pageId, senderId);
        break;
      case 'generic':
        sendGenericMessage(pageId, senderId);
        break;
      case 'quick':
        sendQuickReplyMessage(pageId, senderId);
        break;
      case 'video':
        sendVideoMessage(pageId, senderId)
        break;
      case 'audio':
        sendAudioMessage(pageId, senderId)
        break;
      case 'file':
        sendFileMessage(pageId, senderId)
        break;
      /**
       *  process user message just check swear word and echo the same message to user
       * */
      default:
        const isHarshText = swareDetect(pageId, text);
        if (isHarshText)
          sendSwearMessage(pageId, senderId)
        else
          bot.sendTextMessage(pageId, senderId, text);
    }
  }
  else if (type === 'attachment') {  //process the user attachment  may have following types [image, audio, video, file or location]
    messageText = "Message with attachment received";
    bot.sendTextMessage(pageId, senderId, messageText);
  }
  else {
    messageText = `unknown message type :'${type}' is identified. user message :'${text}'`;
    bot.sendTextMessage(pageId, senderId, messageText);

  }
}

const receivedPayload = (messageObject) => {
  let senderId = messageObject.senderId;
  let pageId = messageObject.pageId
  let payload = messageObject.payload;
  let messageText = undefined;
  let options,question;

  switch (payload) {
    case 'send_button_types':
      sendQuickReplyMessage(pageId, senderId, payload);
      break;
    case 'url_button':
      question ="Exmple of URL button"
      options = [{
        "type": "web_url",
        "url": "https://petersapparel.parseapp.com",
        "title": "Show Website"
      },
      {
        "type": "web_url",
        "url": "https://petersapparel.parseapp.com",
        "title": "Show Website"
      }]
      bot.buttonMessage(pageId, senderId, question,options);
      break;
    default:
      messageText = "Received Postback with  payload: " + payload;
      bot.sendTextMessage(pageId, senderId, messageText);
  }
}
const chatHandler = (req, res) => {
  var data = req.body;

  if (data.object == 'page') {
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        let messageObject = structureMessage(messagingEvent)
        logMessage(messageObject); // Need to set this a middleware
        if (messagingEvent.message && !messagingEvent.message.quick_reply) {
          receivedMessage(messageObject);
        }
        else if (messagingEvent.postback || (messagingEvent.message && messagingEvent.message.quick_reply)) {
          receivedPayload(messageObject)
        }
        else if (messagingEvent.delivery) {
          //This is not required for this usecase
          //Note : Delivery payload is set as delivery confirmation message by FB messenger api)
          //receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.optin) {
          //This is not required for this usecase
          //Note : on click of 'send to messenger' web plugin, 'opt-in' payload is send by FB messenger api
          //receivedOptin(messagingEvent);       
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });
    res.sendStatus(200);
  }
}
module.exports = chatHandler;
