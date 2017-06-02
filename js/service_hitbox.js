/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

var service_hitbox_gamemap = {
    'lol': 'League of Legends',
    'dota2': 'Dota 2',
    'sc2': '',
    'sc2_hos': 'Starcraft 2: Heart of the Swarm',
    'hs': 'Hearthstone: Heroes of Warcraft'
};

var service_hitbox = new Service('hitbox', {
    url: 'http://api.hitbox.tv/media/live/list',
    id: 'hitbox',
    name: 'Hitbox',
    img: '../image/hitbox.png',
    errorImg: '../image/errhitbox.png',
    processData: function (data, gameId, callback) {
        if (callback === undefined) {
            callback = StreamBrowser.Streams.updateStream;
        }

        if (gameId === undefined)
            return;

        var streams = data.livestream;

        var streamGameId = service_hitbox_gamemap[gameId];

        // Update all items
        for (var i = 0; i < streams.length; i++) {
            var stream = streams[i];
            if (stream.media_is_live != "1")
                continue;

            // Filter on game id
            if (stream.category_name != streamGameId)
                continue;

            var streamdata = {
                service: service_hitbox,
                game: StreamBrowser.Games[gameId],
                id: stream.media_user_id,
                viewers: stream.media_views,
                name: stream.media_user_name,
                altname: stream.media_display_name + " - " + stream.media_status,
                embed: 'http://hitbox.tv/#!/embed/' + stream.media_name + '?autoplay=true',
                page: stream.channel.channel_link,
                chat: 'http://www.hitbox.tv/embedchat/' + stream.media_name
            };

            callback(streamdata);
        }
    }
});