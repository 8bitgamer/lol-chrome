/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

var service_youtube = new Service('youtube', {
    url: 'https://gdata.youtube.com/feeds/api/users/lolchampseries/live/events?v=2&itemsPerPage=100&inline=true&alt=json&status=active',
    id: 'youtube',
    name: 'YouTube',
    img: '../image/youtube.png',
    errorImg: '../image/erryoutube.png',
    processData: function (data, gameId) {
        var entries = data.feed.entry;
        for (var key in entries) {
            try {
                var entry = entries[key];
                var content = entry.content.entry[0];

                var name = content.author[0].name.$t;
                var id = content.media$group.yt$videoid.$t;

                var streamdata = {
                    service: service_youtube,
                    game: StreamBrowser.Games[gameId],
                    id: name,
                    viewers: content.yt$statistics.currentViewers,
                    name: name,
                    altname: content.title.$t || name,
                    embed: 'https://www.youtube.com/v/' + id + '?autoplay=1&hd=1',
                    page: 'https://www.youtube.com/watch?v=' + id + '&autoPlay=1&hd=1',
                    chat: ''
                };

                StreamBrowser.Streams.updateStream(streamdata);
            }
            catch (err) {
                var x = 53;
            }
        }

        // Update all items
        //        for (var key in data.streams) {
        //            var stream = data.streams[key];

        //            var chan = $.isArray(stream.channel) ? stream.channel[0] : stream.channel;

        //            if (chan) {
        //                var streamdata = {
        //                    service: service_twitch,
        //                    game: StreamBrowser.Games[gameId],
        //                    id: chan._id,
        //                    viewers: stream.viewers,
        //                    name: chan.display_name,
        //                    altname: (chan.status && chan.status.length) ? chan.status : chan.display_name,
        //                    embed: chan.url + '/popout',
        //                    page: chan.url,
        //                    chat: 'http://www.twitch.tv/chat/embed?channel=' + chan.name + '&popout_chat=true'
        //                };

        //                StreamBrowser.Streams.updateStream(streamdata);
        //            }
        //        }
    }
});