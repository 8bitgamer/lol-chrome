/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

var service_twitch = new Service('twitch', {
    url: 'https://api.twitch.tv/kraken/streams?game=League+of+Legends',
    //favurl: 'https://api.twitch.tv/kraken/streams/{id}',
    headers: { 'Client-ID': 'tk1nxmrqetscq14kmfdi6cn3m0dlzrt' },
    id: 'twitch',
    name: 'Twitch',
    img: '../image/twitch.png',
    errorImg: '../image/errtwitch.png',
    processData: function (data, gameId, callback) {
        if (callback === undefined) {
            callback = StreamBrowser.Streams.updateStream;
        }

        var isFavUpdate = (gameId === undefined);

        var chanStartId = -1;
        var streams = [];
        if (data.streams) {
            for (var key in data.streams) {
                streams.push(data.streams[key]);
            }
        }
        if (data.stream) {
            streams.push(data.stream);
        }
        if (data.channels) {
            chanStartId = streams.length;
            for (var key in data.channels) {
                streams.push(data.channels[key]);
            }
        }

        // Update all items
        for (var i = 0; i < streams.length; i++) {
            var streamGameId = gameId;

            var stream = streams[i];

            var chan = stream;
            if (chanStartId === -1 || chanStartId > i) {
                // Stream has a channel
                chan = $.isArray(stream.channel) ? stream.channel[0] : stream.channel;
            } else {
                // All channels from here on
                stream = { viewers: 0, channel: chan };
            }

            if (chan === undefined) {
                continue;
            }

            if (streamGameId === undefined) {
                // Try to get game id
                var gamename = chan.game;

                // TODO: Here we just hope the game name matches the Twitch name. Add a special field for this?
                for (var g = 0; g < StreamBrowser.Games.registeredGames.length; g++) {
                    var rgi = StreamBrowser.Games.registeredGames[g];
                    var game = StreamBrowser.Games[rgi];
                    if (!game || game.Name !== gamename) {
                        continue;
                    }

                    // Game matches
                    streamGameId = rgi;
                    break;
                }
            }

            if (streamGameId === undefined) {
                continue;
            }

            var streamdata = {
                service: service_twitch,
                game: StreamBrowser.Games[streamGameId],
                id: chan.name,
                legacyid: chan._id,
                viewers: stream.viewers,
                name: chan.display_name,
                altname: (chan.status && chan.status.length) ? chan.status : chan.display_name,
                embed: chan.url + '/popout',
                page: chan.url,
                chat: 'http://www.twitch.tv/chat/embed?channel=' + chan.name + '&popout_chat=true'
            };

            if (isFavUpdate) {
                streamdata.lastUpdate = service_twitch.gameUpdateCount[streamGameId] + 1;
            }

            callback(streamdata);
        }
    }
});