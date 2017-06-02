/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

if (chrome) {
    StreamBrowser.Host = new (function () {

        function getLocalStorage(storageName) {
            var localItems = localStorage.getItem(storageName);
            if (localItems) {
                try {
                    localItems = JSON.parse(localItems);
                }
                catch (err) {
                    console.log('error setting ' + storageName + ' + storage (local backup): ' + chrome.runtime.lastError);
                }
            }

            return localItems || {};
        }

        this.SyncStorage = new (function () {

            this.get = function _get(key, callback) { // callback(items) where items like { 'key1': 'value1', 'key2': 'value2', ... }
                // backup local storage method
                var localItems = getLocalStorage("sync");
                setTimeout(function () {
                    callback(localItems);
                }, 1);
                //                chrome.storage.sync.get(key, function (items) {
                //                    if (chrome.runtime.lastError != undefined) {
                //                        console.log('error getting sync storage: ' + chrome.runtime.lastError);
                //                        callback(localItems);
                //                        return;
                //                    }

                //                    // Check write times
                //                    var localWrite = (localItems && localItems.lastWrite) ? localItems.lastWrite : 0;
                //                    var syncWrite = (items && items["lastWrite"]) ? items["lastWrite"] : 0;

                //                    var finalItems = (syncWrite >= localWrite) ? items : localItems;

                //                    callback(finalItems);
                //                });
            };

            this.set = function _set(obj) {
                try {
                    var writeTime = Date.now();
                    obj["lastWrite"] = writeTime;

                    var localItems = getLocalStorage("sync");
                    localItems = $.extend(localItems, obj);
                    localStorage.setItem("sync", JSON.stringify(localItems));

                    //chrome.storage.sync.set(obj);
                }
                catch (err) {
                    // TODO: handle set errors
                    console.log('error setting sync storage: ' + chrome.runtime.lastError);
                }
            };

        })();

        this.LocalStorage = new (function () {


            this.get = function _get(key, callback) { // callback(items) where items like { 'key1': 'value1', 'key2': 'value2', ... }
                // backup local storage method
                var localItems = getLocalStorage("local");
                setTimeout(function () {
                    callback(localItems);
                }, 1);

                //                chrome.storage.local.get(key, function (items) {
                //                    if (chrome.runtime.lastError != undefined) {
                //                        console.log('error getting local storage: ' + chrome.runtime.lastError);
                //                        callback(localItems);
                //                        return;
                //                    }

                //                    // Check write times
                //                    var localWrite = (localItems && localItems.lastWrite) ? localItems.lastWrite : 0;
                //                    var syncWrite = (items && items["lastWrite"]) ? items["lastWrite"] : 0;

                //                    var finalItems = (syncWrite >= localWrite) ? items : localItems;

                //                    callback(finalItems);
                //                });
            };

            this.set = function _set(obj) {
                try {
                    var writeTime = Date.now();
                    obj["lastWrite"] = writeTime;

                    var localItems = getLocalStorage("local");
                    localItems = $.extend(localItems, obj);
                    localStorage.setItem("local", JSON.stringify(localItems));

                    //chrome.storage.local.set(obj);
                }
                catch (err) {
                    // TODO: handle set errors
                    console.log('error setting local storage: ' + chrome.runtime.lastError);
                }
            };

        })();

        // Returns an array of current popup pages
        this.GetForeground = function _GetForeground() {
            return chrome.extension.getViews({ type: "popup" });
        };

        this.CreateChatWindow = function _CreateChatWindow(uri, sizex, sizey) {
            chrome.windows.create({
                url: uri,
                focused: true,
                type: "popup",
                width: sizex,
                height: sizey
            });
        };

        // Create a new stream window (even if one is open)
        var tabId;
        this.CreateStream = function _CreateStream(url) {
            chrome.tabs.create({ "url": url }, function (tab) {
                tabId = tab.id;
            });
        };

        // Open a stream in a current stream window
        this.OpenStream = function _OpenStream(url) {
            if (tabId == undefined || tabId == -1) {
                StreamBrowser.Host.CreateStream(url);
                return;
            }

            chrome.tabs.get(tabId, function (tab) {
                if (!tab) {
                    StreamBrowser.Host.CreateStream(url);
                }
                else {
                    chrome.tabs.update(tab.id, { url: url, selected: true });
                }
            });
        };

        // Shows a notification page
        var notStreams = [];
        var notificationId = undefined;
        var notId = 0;

        this.ShowNotification = function _ShowNotification() {
            var icon = chrome.runtime.getURL("./games/lol/image/icon_96.png");

            // Add new notifications to list
            while (StreamBrowser.Background.streamnots.length > 0) {
                var stream = StreamBrowser.Background.streamnots.pop();
                if (notStreams.indexOf(stream) != -1) {
                    continue;
                }
                notStreams.push(stream);
            }

            notStreams.sort(function (a, b) { return a.name.toLowerCase() > b.name.toLowerCase(); });

            // Create notification items
            var notItems = [];
            for (var i = 0; i < notStreams.length; i++) {
                notItems.push({ title: notStreams[i].name, message: "" });
            }

            var title = (notStreams.length > 1) ? "Streamers are online" : "A streamer is online";

            // Create notification options
            var not_opt = {
                type: "list",
                title: title,
                message: "Primary message to display",
                iconUrl: icon,
                items: notItems
            }

            // Create or update notification
            if (notificationId !== undefined) {
                // Update
                chrome.notifications.update(notificationId, not_opt, function (notId) { });
            } else {
                // Create
                var id = "not" + (notId++);
                notificationId = id;
                chrome.notifications.create(id, not_opt, function (notId) { });
            }

            ///////////////////////////////////////

            //            var notification = webkitNotifications.createNotification(icon, 'A streamer is online', notString);
            //            notification.show();

            //            var notTimeout = window.setTimeout(function () {
            //                StreamBrowser.Background.notifyOpen = false;
            //                notification.cancel();
            //                notification.close();
            //                notStreams = [];
            //            }, 5000);

            var notInterval = window.setInterval(function () {
                if (!StreamBrowser.Background.notifyOpen) {
                    window.clearInterval(notInterval);
                    return;
                }

                if (StreamBrowser.Background.streamnots.length > 0) {
                    //                    notification.cancel();
                    //                    notification.close();
                    //                    window.clearTimeout(notTimeout);
                    window.clearInterval(notInterval);
                    StreamBrowser.Host.ShowNotification();
                }
            }, 250);
        };

        chrome.notifications.onClosed.addListener(function (notId, byUser) {
            if (notId !== notificationId) {
                return;
            }

            notificationId = undefined;

            StreamBrowser.Background.notifyOpen = false;

            notStreams = [];
        });

    })();
}