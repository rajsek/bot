'use strict';
const assert = require('assert');

const textMessage = (message) => ({
    message: {
        text: message
    }
});
const mediaMessage =(type,url) =>({
      message: {
        attachment: {
            type: type,
            payload: {
                url: url
            }
        }
    }
})
/*
    const videoMessage = (url) => ({
        message: {
            "attachment": {
                "type": "video",
                "payload": {
                    "url": url
                }
            }
        }
    });
    const audioMessage = (url) => ({
        message: {
            "attachment": {
                "type": "audio",
                "payload": {
                    "url": url
                }
            }
        }
    });

*/

const quickReplyMessage = (questions, options) => ({
    message: {
        text: questions,
        quick_replies: Object.keys(options).map(key => {
            if (options[key].content_type === 'text' && options[key].image_url) {
                return {
                    content_type: 'text',
                    payload: options[key].payload,
                    title: options[key].title,
                    image_url: options[key].image_url
                }
            }
            else if (options[key].content_type === 'text') {
                return {
                    content_type: 'text',
                    payload: options[key].payload,
                    title: options[key].title
                }
            }
            else if (options[key].content_type === 'location') {
                return {
                    content_type: 'location'
                }
            }
        })
    }
});
const buttonMessage = (questions, buttons) => ({
    message: {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'button',
                text: questions,
                buttons: Object.keys(buttons).map(key => {
                    if (buttons[key].type === 'web_url') {
                        return {
                            type: 'web_url',
                            title: buttons[key].title,
                            url: buttons[key].url,
                            webview_height_ratio: "compact"

                        }
                    }
                    else if (buttons[key].type === 'postback') {
                        return {
                            type: 'postback',
                            title: buttons[key].title,
                            payload: buttons[key].payload
                        }
                    }
                    else if (buttons[key].type === 'phone_number') {
                        return {
                            type: 'phone_number',
                            title: buttons[key].title,
                            payload: buttons[key].payload
                        }
                    }
                })
            }
        }
    }
});
const genericMessage = (bubbles) => {
    assert(bubbles, 'bubble is not supplied');
    assert(bubbles.length <= 10, 'bubble count should not  be greater than 10');
    return {
        message: {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: bubbles
                }
            }
        }
    }
};


module.exports = { textMessage, mediaMessage,genericMessage,buttonMessage,quickReplyMessage };
