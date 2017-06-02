/*
 * Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
 * 
 * You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
 * You may not create derivative versions of the software without written permission of the author.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

var StreamBrowser = StreamBrowser || {};

(function () {
    var tabId = -1;

    var chatsizex = 400;
    var chatsizey = 600;

    StreamBrowser.Background = new (function () {
        this.streamnots = [];
        this.notifyOpen = false;

        this.foredoc = undefined;

        function notifyStream(stream) {
            var key = stream.key;
            if (StreamBrowser.Background.streamnots.indexOf(stream) == -1) {
                StreamBrowser.Background.streamnots.push(stream);
            }

            if (StreamBrowser.Background.notifyOpen) {
                return;
            }

            StreamBrowser.Background.notifyOpen = true;
            StreamBrowser.Host.ShowNotification('html/stream_notification.html');
        };

        function updatePanels(immediate) {
            // Get all popups and update them
            var views = StreamBrowser.Host.GetForeground();
            for (vi in views) {
                var view = views[vi];
                if (view.updateTable) {
                    view.updateTable(immediate);
                }
            }
        };

        // Force a redraw
        this.forceRedraw = function _forceRedraw() { updatePanels(); };

        // Context menu
        this.showContextMenu = function _showContextMenu(stream, x, y) {
            if (!StreamBrowser.Background.foredoc) {
                return;
            }

            var menu = $('#contextmenu', StreamBrowser.Background.foredoc);
            if (menu.length == 0) {
                menu = $('<div id="contextmenu" class="contextmenu"><ul></ul></div>', StreamBrowser.Background.foredoc);
                $('body', StreamBrowser.Background.foredoc).append(menu);
            }

            ul = $('#contextmenu > ul', StreamBrowser.Background.foredoc);
            ul.empty();

            ul.append($('<li class="streampage">Stream Page</li>', StreamBrowser.Background.foredoc));
            if (stream.links.chat && stream.links.chat != '')
                ul.append($('<li class="popoutchat">Popout Chat</li>', StreamBrowser.Background.foredoc));

            $('.streampage', ul).click(function (e) {
                StreamBrowser.Background.hideContextMenu();
                StreamBrowser.Background.openWindow(stream.links.page, e);
            });

            $('.popoutchat', ul).click(function () {
                StreamBrowser.Background.hideContextMenu();

                if (stream.links.chat) {
                    StreamBrowser.Host.CreateChatWindow(stream.links.chat, chatsizex, chatsizey);
                }
            });

            menu.css({
                top: y + 'px',
                left: x + 'px'
            }).show();
        };

        this.hideContextMenu = function _hideContextMenu() {
            $('#contextmenu', StreamBrowser.Background.foredoc).hide();
        };

        // UI Formatting
        this.getTable = function _getTable() {
            var updateCountTotal = 0;
            for (var i = 0; i < StreamBrowser.Services.registeredServices.length; i++) {
                updateCountTotal += StreamBrowser.Services[StreamBrowser.Services.registeredServices[i]].updateCount;
            }
            if (updateCountTotal == 0) {
                return $('<img src="../image/ajax-loader.gif" />');
            }

            var streamArray = StreamBrowser.Streams.toArray();

            streamArray.sort(function (a, b) {
                if (a.isFavorite != b.isFavorite) {
                    if (a.isFavorite)
                        return -1;
                    else
                        return 1;
                }

                if (b.viewers != a.viewers) {
                    return b.viewers - a.viewers;
                }

                if (a.name.toLowerCase() < b.name.toLowerCase())
                    return -1;
                else
                    return 1;
            });

            // Remove all but top N streams
            // TODO: Make this a setting!
            if (streamArray.length > 100) {
                streamArray.splice(100, streamArray.length - 100);
            }

            // Update ui

            var header = '<div class="statusheader">' + serviceStatus + '</div>';
            var table = $('<div>' + header + '<div class="row">' +
                    '<div class="cell_fav"><div class="favheart" title="Favorites"/></div>' +
                    '<div class="cell_service"></div>' +
                    '<div class="cell_name">Name</div>' +
                    '<div class="cell_viewers">Viewers</div>' +
                '</div></div>');

            for (var key in streamArray) {
                var stream = streamArray[key];

                if (!stream.isLive())// || stream.viewers == 0)
                    continue;

                var row = stream.getRow();

                table.append(row);
            }

            delete streamArray;

            return table;
        };

        this.getServiceStatusUi = function _getServiceStatusUi() {
            var serviceStatus = '';
            for (var i in StreamBrowser.Services.registeredServices) {
                serviceStatus += '<img src="" alt="" title="" data-service-id="' + StreamBrowser.Services[StreamBrowser.Services.registeredServices[i]].id + '" />';
            }
            return serviceStatus;
        };

        this.getServiceStatusAttrs = function _getServiceStatusAttrs() {
            var serviceStatus = {};
            
            for (var i in StreamBrowser.Services.registeredServices) {
                var service = StreamBrowser.Services[StreamBrowser.Services.registeredServices[i]];

                if (service.updateCount == 0)
                    continue;

                serviceStatus[service.id] = service.statusImgAttrs;
            }

            return serviceStatus;
        };
        
        // UI Methods

        // Open to the specified url (detects tab settings)
        this.openWindow = function _openWindow(url, clickevent) {
            var openNewTab = StreamBrowser.Storage.settings.sync.get('openNewTab');
            var lmb = (clickevent.which == 1);

            if ((openNewTab == 'true') ? !lmb : lmb) {
                // Left mouse button opens in default tab
                StreamBrowser.Host.OpenStream(url);
            }
            else {
                // Any other button opens a new tab
                StreamBrowser.Host.CreateStream(url);
            }
        }

        // Initialize

        // Handle streams coming online
        StreamBrowser.Streams.onStreamLive(function (stream) {
            var showNotifications = StreamBrowser.Storage.settings.sync.get('showNotifications');
            if (showNotifications == 'true') {
                notifyStream(stream);
            }
        }, function (stream) { return stream.isFavorite && stream.viewers > 0; });

        // Handle service updates
        StreamBrowser.Services.onServiceUpdated(function(key, value) {
//            var stream = StreamBrowser.Streams.getStream(key);
//            if (stream) {
//                stream.isFavorite = value;
//            }

            updatePanels();
        });

        // Handle favorite updates
        StreamBrowser.Favorites.onFavoriteUpdate(function() {
            updatePanels(true);
        });
    })();
    
    // Startup sequence
    // Many of these are asynchronous, so we have to follow the callbacks
    function startup() {
        waitUntilWarm();
    }

    function waitUntilWarm() {
        if (StreamBrowser.Storage.settings.IsWarm() && StreamBrowser.Storage.data.IsWarm()) {
            checkVersion();
        }
        else {
            // Wait for caches to warm
            setTimeout(waitUntilWarm, 50);
        }
    }
    
    // Version migration
    // Note: this will not always guarantee data migration, but will
    //       try to at least update from the previous version
    function migrateVersion() {
        // Migrate settings to new storage API
        var nots = window.localStorage.getItem('showNotifications');
        var newtab = window.localStorage.getItem('openNewTab');

        if (nots) StreamBrowser.Storage.settings.sync.set('showNotifications', nots);
        if (nots) StreamBrowser.Storage.settings.sync.set('openNewTab', newtab);

        // Migrate favorites
        var favs = window.localStorage.getItem('streamfavorites');
        if (favs) StreamBrowser.Storage.data.sync.set('streamfavorites', favs);
    }

    function checkVersion() {
        $.ajax({
            url: '/manifest.json',
            dataType: 'json',
            success: function (data) {
                var version = data.version;
                var oldVersion = StreamBrowser.Storage.settings.local.get('version');

                if (oldVersion != version)
                    migrateVersion();

                StreamBrowser.Storage.settings.local.set('version', version);

                // NOTE: if this fails to succeed there's some bigger problem going on - manifest has to exist
                startDataRetrieval();
            }
        });
    }

    // Last piece of startup - starts retrieving data and spinning up everything
    function startDataRetrieval() {
        StreamBrowser.Games.updateAll();
        StreamBrowser.Services.updateAll();
    }

    // Start everything up once loaded
    $(function () {
        startup();
    });
})();