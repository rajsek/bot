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

//const chat = (verifyToken) => (req, res) => {



function receivedQuickReply(event) {
  var senderId = event.sender.id;
  var pageId = event.recipient.id;
  var timeOfPostback = event.timestamp;
  var payload = event.message.quick_reply.payload;
  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, pageID, payload, timeOfPostback);
  const messageText = "Quick Postback called for payload " + payload;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  // swithc(payload)
  // { case 'simpleText' : bot.sendTextMessage(pageId, recipientId, messageText); break;
  //  case 'sendVideo'  : bot.  bot.sendVideoMessage(pageId, recipientId, videoUrl); break;
  // }
  bot.sendTextMessage(pageId, senderId, messageText)
}
function sendGenericMessage(pageId, recipientId) {

  const bubbles = [{
    title: "rift",
    subtitle: "Next-generation virtual reality",
    item_url: "http://rajasekar.cz.cc",
    image_url: "http://rajasekar.cz.cc",
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
function sendQuickReplyMessage(pageId, recipientId) {
  const question = "Pick a color:";
  const options = [
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
  bot.sendQuickReplyMessage(pageId, recipientId, question, options)
}
function sendSwearMessage(pageId, recipientId) {
  const pageLocale = pageLanguageMap.get(pageId);
  const pageSwearAnswer = swareDetectReply.get(pageId)
  const messageText = strings[pageLocale][randomOf(pageSwearAnswer)];
  bot.sendTextMessage(pageId, recipientId, messageText);
}
function sendVideoMessage(pageId, recipientId) {
  const videoUrl = 'http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_1mb.mp4';
  bot.sendVideoMessage(pageId, recipientId, videoUrl);
}
function sendAudioMessage(pageId, recipientId) {
  const audioUrl = 'http://www.stephaniequinn.com/Music/Allegro%20from%20Duet%20in%20C%20Major.mp3';
  bot.sendAudioMessage(pageId, recipientId, audioUrl);
}
function sendFileMessage(pageId, recipientId) {
  const audioUrl = 'http://www.pdf995.com/samples/pdf.pdf';
  bot.sendFileMessage(pageId, recipientId, audioUrl);
}
function sendImageMessage(pageId, recipientId) {
  const imageoUrl = 'https://secure.static.tumblr.com/8773ce8c80b939810f4afc88b87192d4/esfldks/I63myx1av/tumblr_static_imagesspiral.gif';
  bot.sendImageMessage(pageId, recipientId, imageoUrl);
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var pageID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  var messageText = message.text;
  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageAttachments = message.attachments;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, pageID, timeOfMessage);
  console.log(JSON.stringify(message));

  //swear-detect check //feel like this async fun which will create some problem 
  const isHarshText = swareDetect(pageID, message.text);
  if (isHarshText)
    messageText = "harshText"
  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(pageID, senderID);
        break;
      case 'shareButton':
        sendButtonMessage(pageID, senderID);
        break;
      case 'generic':
        sendGenericMessage(pageID, senderID);
        break;
      case 'quick':
        sendQuickReplyMessage(pageID, senderID);
        break;
      case 'video':
        sendVideoMessage(pageID, senderID)
        break;
      case 'audio':
        sendAudioMessage(pageID, senderID)
        break;
      case 'file':
        sendFileMessage(pageID, senderID)
        break; 
      case 'harshText':
        sendSwearMessage(pageID, senderID)
        break;
      default:
        bot.sendTextMessage(pageID, senderID, messageText);
    }
  } else if (messageAttachments) {
    //process the user attachment and send the reply
    const messageText = "Message with attachment received";
    bot.sendTextMessage(pageID, senderID, messageText);
  }
}

function receivedPostback(event) {
  var senderId = event.sender.id;
  var pageId = event.recipient.id;
  var timeOfPostback = event.timestamp;
  var payload = event.postback.payload;
  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderId, pageId, payload, timeOfPostback);
  const messageText = "Postback called for payload " + payload;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  // swithc(payload)
  // { case 'simpleText' : bot.sendTextMessage(pageId, recipientId, messageText); break;
  //  case 'sendVideo'  : bot.  bot.sendVideoMessage(pageId, recipientId, videoUrl); break;
  // }
  bot.sendTextMessage(pageId, senderId, messageText)
}

const chatHandler = (req, res) => {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object == 'page') {
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;
      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.message) {
          if (messagingEvent.message.quick_reply) {
            receivedQuickReply(messagingEvent)
          }
          else {
            receivedMessage(messagingEvent);
          }
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.delivery) {
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
