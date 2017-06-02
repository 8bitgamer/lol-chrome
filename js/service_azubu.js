/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

var service_azubu = new Service('azubu', {
    url: 'http://api.azubu.tv/public/channel/live/list/game/league-of-legends',
    //favurl: 'https://api.twitch.tv/kraken/streams/{id}',
    id: 'azubu',
    name: 'Azubu',
    img: '../image/azubu.png',
    errorImg: '../image/errazubu.png',
    processData: function (data, gameId, callback) {
        if (callback === undefined) {
            callback = StreamBrowser.Streams.updateStream;
        }

        if (gameId === undefined)
            return;

        var streams = data.data;

        // Update all items
        for (var i = 0; i < streams.length; i++) {
            var streamGameId = gameId;

            var stream = streams[i];
            if (!stream.is_live)
                continue;

            var streamdata = {
                service: service_azubu,
                game: StreamBrowser.Games[streamGameId],
                id: stream.user.username,
                viewers: stream.view_count,
                name: stream.user.display_name,
                altname: stream.user.alt_name,
                embed: stream.url_stream,
                page: stream.url_channel,
                chat: stream.url_chat
            };

            callback(streamdata);
        }
    }
});
