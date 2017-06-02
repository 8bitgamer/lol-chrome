/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

StreamBrowser.Games = new (function () {
    // Game registration
    this.registeredGames = [];

    this.register = function _register(game) {
        this[game.id] = game;
        this.registeredGames.push(game.id);
    };

    // Update
    this.updateAll = function _updateAll() {
        for (var i = 0; i < this.registeredGames.length; i++) {
            var game = this[this.registeredGames[i]];
            if (game.update)
                game.update();
        }
    };

    // Find
    this.find = function _find(gameName) {
        for (var i = 0; i < StreamBrowser.Games.registeredGames.length; i++) {
            var game = StreamBrowser.Games[StreamBrowser.Games.registeredGames[i]];
            if (game.Name === gameName) {
                return game;
            }
        }

        return undefined;
    }
});

StreamBrowser.Game = function(id, settings) {
    console.log("loading game " + id + " " + JSON.stringify(settings));

    this.id = id;
    this.Name = settings.name;

    // Key/value pairs of urls for each service that supports this game
    this.serviceUrls = settings.serviceUrls;
    this.favbuttonClass = settings.favbuttonClass;
    this.favButtonImg = settings.favButtonImg;

    this.ProcessRow = settings.processRow;
    this.Update = settings.update;

    // Theme data
    this.Theme = settings.theme;

    // Initialization
    StreamBrowser.Games.register(this);
};

StreamBrowser.Game.prototype.isEnabled = function () {
    return StreamBrowser.Storage.settings.sync.get('game_enable_' + this.id) !== "false";
};