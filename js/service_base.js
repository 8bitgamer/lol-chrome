/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

StreamBrowser.Services = new (function () {
    // Service update events
    var serviceUpdatedHandlers = [];
    
    // Service update event handler
    this.onServiceUpdated = function _onServiceUpdated(method) {
        if (method && $.isFunction(method)) {
            serviceUpdatedHandlers.push(method);
        }
    };

    // Service updated callback (returned from service registration)
    function serviceUpdatedCall(service, game) {
        for (var i = 0; i < serviceUpdatedHandlers.length; i++) {
            serviceUpdatedHandlers[i](service, game);
        }
    }

    // Service registration
    this.registeredServices = [];

    this.register = function _register(service) {
        this[service.id] = service;
        this.registeredServices.push(service.id);
        return serviceUpdatedCall;
    };

    // Update
    this.updateAll = function _updateAll() {
        for (var i = 0; i < this.registeredServices.length; i++) {
            this[this.registeredServices[i]].update();
        }
    };
})();

function Service(id, settings) {
    var refreshRate = settings.refreshRate || 65000;
    var requestCount = 0;

    // request settings
    var dataType = settings.dataType || 'json';
    var cache = (settings.cache != undefined) ? settings.cache : true;
    this.favurl = settings.favurl;
    this.headers = settings.headers;

    // settings
    this.id = id;
    this.name = settings.name;
    this.img = settings.img;
    this.errorImg = settings.img;
    var processData = settings.processData;
    var onServiceUpdated = undefined;

    // NOTE: hack to be able to process data outside an update callback
    this.process = settings.processData;
    
    // status
    this.updateCount = 0;
    this.gameUpdateCount = {};
    var gameUpdateTime = {};
    var status = true;
    this.statusImgAttrs = {};

    // fav update status
    var favUpdateTime = {};

    var intervalId = undefined;
    var updatingCount = 0;
    var _self = this;

    // Methods
    this.updateStatusImg = function _updateStatusImg() {
        var text = _self.name + (!status ? ' Error' : '') + ' (' + _self.updateCount + ' update' + (_self.updateCount > 1 ? 's' : '') + ')';
        this.statusImgAttrs = {
            src: (status ? _self.img : _self.errorImg),
            alt: text,
            title: text
        };
    }

    function updateFav(favid) {
        var now = (new Date()).getTime();
        if (favUpdateTime[favid] !== undefined && favUpdateTime[favid] > (now - refreshRate)) {
            // not enough time has passed to update this stream again
            return;
        }

        var favurl = _self.favurl.replace('{id}', favid);

        // Set last update time to prevent further updates to this fav while it's updating
        favUpdateTime[favid] = (new Date()).getTime();

        updatingCount++;

        $.ajax({
            url: favurl,
            cache: cache,
            dataType: dataType,
            type: 'GET',
            success: function (data) {
                status = (processData != undefined);
                if (processData != undefined) {
                    processData(data);
                }

                // Call event
                onServiceUpdated(_self);
            },
            complete: function (jqXHR, textStatus) {
//                if (textStatus != "success") {
//                    // Update status
//                    _self.status = false;
//                }

                updatingCount--;
            }
        });
    }

    function updateGame(gameId) {
        var game = StreamBrowser.Games[gameId];
        if (!game)
            return;
            
        var gameUrl = game.serviceUrls[_self.id];
        if (!gameUrl)
            return;

        var now = (new Date()).getTime();
        if (gameUpdateTime[game.id] !== undefined && gameUpdateTime[game.id] > (now - refreshRate)) {
            // not enough time has passed to update this game again
            return;
        }

        // Set last update time to stop any more updates to this game while it's updating
        gameUpdateTime[game.id] = (new Date()).getTime();

        updatingCount++;

        $.ajax({
            url: gameUrl,
            cache: cache,
            dataType: dataType,
            type: 'GET',
            headers: _self.headers,
            success: function (data) {
                _self.gameUpdateCount[gameId] = (_self.gameUpdateCount[gameId]) ? _self.gameUpdateCount[gameId] + 1 : 1;
                _self.updateCount++;

                status = (processData != undefined);
                if (processData != undefined) {
                    processData(data, gameId);
                }

                // Call event
                onServiceUpdated(_self, game);
            },
            complete: function (jqXHR, textStatus) {
                if (textStatus != "success") {
                    // Update status
                    _self.status = false;
                }

                _self.updateStatusImg();

                updatingCount--;
            }
        });
    }

    this.update = function _update() {
        // intervalGameId (the game currently being updated)
        // intervalId (not an array)
        // updatingCount

        //        var favUpdateTime = {};
        //        var intervalFavId = 0;

        // Clear any old interval
        if (intervalId !== undefined) {
            window.clearInterval(intervalId);
            updatingCount = 0;
        }

        var i = 0;
        var fi = 0;

        intervalId = window.setInterval(function _updateGames() {
            if (updatingCount >= 2) {
                return;
            }

            // Update a game
            // pre-bounds check
            if (i >= StreamBrowser.Games.registeredGames.length) {
                i = 0;
            }

            var game = StreamBrowser.Games[StreamBrowser.Games.registeredGames[i]];
            if (game && game.isEnabled()) {
                updateGame(StreamBrowser.Games.registeredGames[i]);
            } else {
                gameUpdateTime[StreamBrowser.Games.registeredGames[i]] = undefined;
            }

            i++;

            // bounds-check incremented index
            if (i >= StreamBrowser.Games.registeredGames.length) {
                i = 0;
            }

            // Update a fav
            if (_self.favurl === undefined) {
                return;
            }

            var favs = StreamBrowser.Favorites.getFavorites();
            if (favs.length === 0) {
                return;
            }

            if (fi >= favs.length) {
                fi = 0;
            }

            // Check key for service match and strip service id
            var favkey = favs[fi];
            if (favkey.indexOf(_self.id) === 0) {
                favkey = favkey.substring(_self.id.length + 1);
                updateFav(favkey);
            }

            fi++;
            if (fi >= favs.length) {
                fi = 0;
            }
        }, 200);
    };

    // Initialization
    onServiceUpdated = StreamBrowser.Services.register(this);
}