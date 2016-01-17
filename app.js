'use strict';
var TelegramBot = require('node-telegram-bot-api'),
    omdb = require('omdb'),
    extend = require("xtend"),
    token = require('./config').token;

var bot = new TelegramBot(token, {polling: true}),
    lastData;

function sendMessage(chatId, text, options) {
    var opts = extend({
        disable_web_page_preview: true,
        parse_mode: 'Markdown'
    }, options);


    bot.sendMessage(
        chatId,
        text,
        opts
    );
}

function parseSearchData(msg, data) {
    var text = '';

    data.forEach((item, index) => {
        if (item.type === 'series' && item.year.from) {
            item.year = `${item.year.from} — ${item.year.to || '...'}`;
        }

        text += `${index + 1}. ${item.title} (${item.year || 'unknown'}) http://www.imdb.com/title/${item.imdb}\n\n`;
    });

    text += `Enter the number of film (1 - ${data.length}).`;

    sendMessage(msg.chat.id, text);
}

function parseValidSearchAndSendMessage(msg) {
    console.log(msg);

    omdb.search(msg.text, (err, data) => {
        if (!err && data.length) {
            lastData = data;
            parseSearchData(msg, data);
        } else {
            sendMessage(msg.chat.id, `Sorry, not found.`);
        }
    });
}

function createFullFilmMessage(film) {
    console.log(film);
    if (film.type === 'series' && film.year.from) {
        film.year = `${film.year.from} — ${film.year.to || '...'}`;
    }

    return `Title: *${film.title}*\nYear: *${film.year}*\nDirector: *${film.director || 'unknown'}*\nRating IMDB: *${film.imdb.rating}*\n\n${film.plot ? ('Plot: ' + film.plot + ''): ''}\n\n${film.poster ? ('Poster: [' + film.imdb.id +'](' + film.poster + ')'): ''}`;
}

bot.on('message', (msg) => {
    var message = msg.text,
        messageToNumber = message - 1;

    if (!isNaN(messageToNumber)) {
        if (lastData && lastData[messageToNumber]) {
            return omdb.get({
                imdb: lastData[messageToNumber].imdb
            }, (err, data) => {
                if (!err) {
                    sendMessage(msg.chat.id, createFullFilmMessage(data), {
                        photo: data.poster,
                        caption: data.title + ' (' + (data.year || 'unknown') + ')'
                    });
                }
            });
        }
    }

    parseValidSearchAndSendMessage(msg);
});