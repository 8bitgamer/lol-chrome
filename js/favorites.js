/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

// Favorites
StreamBrowser.Favorites = new (function () {
    var favoriteUpdateHandlers = [];

    var favs = [];

    var isReady = new $.Deferred();
    this.onReady = function _onReady(handler) { isReady.done(handler); }

    StreamBrowser.Storage.data.sync.onWarm(function () {
        favs = StreamBrowser.Storage.data.sync.get('streamfavorites') || [];

        if (!$.isArray(favs)) {
            var favsplits = favs.split(',');
            if ($.isArray(favsplits))
                favs = favsplits;
            else
                favs = [favs];
        }

        isReady.resolve();
    });

    this.onFavoriteUpdate = function _onFavoriteUpdate(handler) { // function(key, value)
        favoriteUpdateHandlers.push(handler);
    };

    this.favoriteUpdated = function _favoriteUpdated(key, value) {
        for (var i = 0; i < favoriteUpdateHandlers.length; i++) {
            favoriteUpdateHandlers[i](key, value);
        }
    }

    this.isFavorite = function _isFavorite(key) {
        return (favs.indexOf(key) != -1);
    };

    this.setFavorite = function _setFavorite(key, value) {
        var changed = false;

        if (value) {
            if (favs.indexOf(key) == -1) {
                favs.push(key);
                changed = true;
            }
        }
        else {
            var id = favs.indexOf(key);
            if (id != -1) {
                favs.splice(id, 1);
                changed = true;
            }
        }

        if (changed === false) {
            return;
        }

        StreamBrowser.Storage.data.sync.set('streamfavorites', favs);

        this.favoriteUpdated(key, value);
    };

    this.getFavorites = function _getFavorites() {
        return favs;
    };

    this.forEach = function _forEach(fun) { // fun(fav_key)
        for (var i = 0; i < favs.length; i++) {
            fun(favs[i]);
        }
    };
});


