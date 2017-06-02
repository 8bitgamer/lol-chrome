/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
*
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

var nameTrimStart = new RegExp("^[\n\r\t ]+");
var nameTrimEnd = new RegExp("[\n\r\t ]+$");

function Stream(key, data) {
    this.key = key;

    /* settings */
    this.service = data.service;
    this.game = data.game;
    this.id = data.id;
    this.name = data.name;
    this.altname = data.altname;
    this.viewers = data.viewers;

    this.altname = data.altname;

    /* links */
    this.links = {
        embed: data.embed,
        page: data.page,
        chat: data.chat
    };

    this.lastUpdate = 0;
    this.isFavorite = false;

    // Initialization

    // look up favorite
    this.isFavorite = StreamBrowser.Favorites.isFavorite(this.key);

    // Set last update to creation time
    if (this.game !== undefined) {
        this.lastUpdate = this.service.gameUpdateCount[this.game.id];
    }
}

    // Methods
    Stream.prototype.isLive = function _isLive() {
        return this.lastUpdate >= this.service.gameUpdateCount[this.game.id];
    };

    // Updates the stream and returns whether or not the stream just came online
    Stream.prototype.update = function _update(newData) {
        if (newData.game !== undefined) {
            this.game = newData.game;
        }

        this.name = newData.name;
        this.altname = newData.altname;

        // Make sure there is a default viewer count
        if (newData.viewers == undefined) {
            if (this.viewers == undefined)
                this.viewers = 500;
        }
        else
            this.viewers = newData.viewers;

        var wasOnline = (this.lastUpdate >= this.service.gameUpdateCount[this.game.id] - 2);
        this.lastUpdate = (newData.lastUpdate) ? newData.lastUpdate : this.service.gameUpdateCount[this.game.id];

        return !wasOnline;
    };

    StreamBrowser.Streams = new (function () {
        this.defaultColumns = ['fav', 'service', 'name', 'viewers'];

        var cache = {};
        var streamLiveHandlers = [];

        this.createKey = function _createKey(data) {
            if (!data.service || !data.service.id || !data.id)
                return undefined;

            return data.service.id + '.' + data.id;
        }

        function createLegacyKey(data) {
            if (!data.service || !data.service.id || !data.legacyid)
                return undefined;

            return data.service.id + '.' + data.legacyid;
        }

        this.toArray = function _toArray(fields) {
            var removeKeys = [];
            for (var i in cache) {
                if (!cache[i].isLive()) {
                    removeKeys.push(i);
                }

                var enableGame = cache[i].game.isEnabled();
                if (enableGame === "false" || enableGame === false) {
                    removeKeys.push(i);
                }
            }
            for (var i = 0; i < removeKeys.length; i++) {
                delete cache[removeKeys[i]];
            }

            var arr = [];
            for (var i in cache) {
                arr.push(cache[i]);
            }
            return arr;
        };

        this.onStreamLive = function _onStreamLive(handler, filter) { // function(stream)
            streamLiveHandlers.push({
                handler: handler,
                filter: filter || function (stream) { return true; }
            });
        };

        this.getStream = function _getStream(key) {
            return cache[key];
        };

        this.createStream = function _createStream(key, data) {
            return new Stream(key, data);
        };

        this.updateStream = function _updateStream(data) {
            var key = StreamBrowser.Streams.createKey(data);
            if (key == undefined)
                return;

            var newOnline = true;
            if (key in cache) {
                var stream = cache[key];
                newOnline = stream.update(data);
            }
            else {
                cache[key] = new Stream(key, data);

                // Migrate legacy favorites
                var legacykey = createLegacyKey(data);
                if (StreamBrowser.Favorites.isFavorite(legacykey)) {
                    cache[key].isFavorite = true;
                    StreamBrowser.Favorites.setFavorite(legacykey, false);
                    StreamBrowser.Favorites.setFavorite(key, true);
                }
            }

            if (newOnline) {
                for (var i = 0; i < streamLiveHandlers.length; i++) {
                    var liveHandler = streamLiveHandlers[i];
                    if (liveHandler.filter(cache[key])) {
                        liveHandler.handler(cache[key]);
                    }
                }
            }
        };

        this.getTableLayout = function _getTableLayout(tableid, columns) {
            if (columns === undefined) {
                columns = StreamBrowser.Streams.defaultColumns;
            }

            var tid = tableid || 'streamTable';
            var table = '<div id="' + tid + '"><div class="statusheader"></div><div class="row">';

            for (var i = 0; i < columns.length; i++) {
                var columnKey = columns[i];
                if (columnKey == 'fav') {
                    table += '<div class="cell_fav"><div class="favheart" title="Favorites"/></div>';
                }
                else if (columnKey == 'service') {
                    table += '<div class="cell_service"></div>';
                }
                else if (columnKey == 'name') {
                    table += '<div class="cell_name">Name</div>';
                }
                else if (columnKey == 'viewers') {
                    table += '<div class="cell_viewers">Viewers</div>';
                }
            }

            table += '</div></div>';
            return table;
        };

        this.getRowTemplate = function _getRowTemplate(columns) {
            if (columns === undefined) {
                columns = StreamBrowser.Streams.defaultColumns;
            }

            var row = '<div class="row" data-key="">';

            for (var i = 0; i < columns.length; i++) {
                var columnKey = columns[i];
                if (columnKey == 'fav') {
                    row += '<div class="cell_fav"><button title="Favorite" class="favbutton stream" /></div>';
                }
                else if (columnKey == 'service') {
                    row += '<div class="cell_service"><img alt="" title="" /></div>';
                }
                else if (columnKey == 'name') {
                    row += '<div class="cell_name"><span><a href="" title=""></a></span></div>';
                }
                else if (columnKey == 'viewers') {
                    row += '<div class="cell_viewers">' + this.viewers + '</div>';
                }
            }

            row += '</div>';

            // Return the row
            return row;
        };

        // Listen for favorite update
        StreamBrowser.Favorites.onFavoriteUpdate(function (key, value) {
            if (cache[key]) {
                cache[key].isFavorite = value;
            }
        });
    })();
