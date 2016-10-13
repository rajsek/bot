'use strict';

let config = {};

switch (process.env.NODE_ENV||'development') {
    case 'development':
        config = {
            page:
            {
                accessToken: process.env.PAGE_ACCESS_TOKEN || 'EAAZAMIDFHNQkBAO3bKXoTOxdPsfZBnZC9aTRMlrtZBt3rO5proTe5QntisN5sWKgZCk9c78Vh4rzmp0ciTE7sTAZAn9LkdZB5Y3MRlvi1ZB7VpLjoxgqU3bl1jDvCRyeZAhD6RnWZAIArree9QfyPpXi13rlZC8ip4PBAQoZBHcpD9zLcQZDZD',
                id: process.env.PAGE_ID || '1772551009678601',
                lang: 'en_US',
            }
            ,
            verifyToken: process.env.VERIFY_TOKEN || 'dahv5ooKaesh3eishen7',
            port: process.env.PORT || 5000,
            logLevel: process.env.LOG_LEVEL || 'silly'
        };
        break;

    case 'testing':
        config.logLevel = 'error';
        break;

    default:
        console.error('Unsupported NODE_ENV', process.env.NODE_ENV);
        process.exit(1);
}

// I18N
config.i18n = { lang: ['en_US'], default_lang: 'en_US'};

// language-specific configuration
for (let lang of config.i18n.lang) {
    config[lang] = {
        // list of rude words to detect
        foulSpeechFile: __dirname + '/i18n/' + lang + '/foul-speech.json'
    };
}

module.exports = config;
