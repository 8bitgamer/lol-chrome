/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

function Store(location, bucket) {
    // Held by closure
    // var location
    // var bucket

    // Private Vars
    var cache = {};
    var isWarm = false;

    var prefix = bucket + '.';

    // Warm event
    var warmHandlers = [];

    this.onWarm = function _onWarm(handler) { // function(this)
        if (isWarm) {
            handler(this);
            return;
        }

        warmHandlers.push(handler);
    }

    // Properties
    this.IsWarm = function _IsWarm() { return isWarm; }

    // Public Methods
    this.get = function _get(name) {
        return cache[prefix + name];
    };
    this.set = function _set(name, value) {
        var fullname = prefix + name;
        cache[fullname] = value;

        var obj = {};
        obj[fullname] = value;

        location.set(obj);
    };

    // Initialization

    // Warm the cache
    var _self = this;
    location.get(null, function (items) {
        for (key in items) {
            if (key.indexOf(prefix) != 0)
                continue;

            var item = items[key];
            cache[key] = item;

            console.log('storage: ' + key + ': ' + item);
        }

        // Ready to go
        _self.isWarm = true;

        // Call event handlers
        for (var i = 0; i < warmHandlers.length; i++) {
            warmHandlers[i](this);
        }
    });
}

function DualStore(syncLocation, localLocation, bucket) {
    this.sync = new Store(syncLocation, bucket);
    this.local = new Store(localLocation, bucket);

    this.IsWarm = function _IsWarm() {
        return this.sync.IsWarm && this.local.IsWarm;
    };
};

StreamBrowser.Storage = new (function() {
    // Storage
    this.settings = new DualStore(StreamBrowser.Host.SyncStorage, StreamBrowser.Host.LocalStorage, 'settings');
    this.data = new DualStore(StreamBrowser.Host.SyncStorage, StreamBrowser.Host.LocalStorage, 'data');
})();