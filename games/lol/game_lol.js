/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var game_lol = new StreamBrowser.Game('lol', {
    name: 'League of Legends',

    serviceUrls: {
        'twitch': 'https://api.twitch.tv/kraken/streams?game=League+of+Legends&limit=100',

        'azubu': 'http://api.azubu.tv/public/channel/live/list/game/league-of-legends',
        'hitbox': 'http://api.hitbox.tv/media/live/list',
        'youtube': 'https://gdata.youtube.com/feeds/api/users/lolchampseries/live/events?v=2&itemsPerPage=100&inline=true&alt=json&status=active'
    },

    favbuttonClass: 'stream_lol',
    favButtonImg: '../games/lol/image/stream_lol.png',

    theme: {
        id: 'lol',
        name: 'League of Legends',
        img: '../games/lol/image/stream_lol.png',
        style: '../games/lol/lol.css'
    }
});