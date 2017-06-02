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
    var storage = StreamBrowser.Storage;
    var settings = storage.settings;

    // Settings access
    StreamBrowser.Settings = new (function() {

        var defaultSettings = {
            id: "settings",
            title: "Settings",
            description: undefined,
            settings: [
                {
                    id: "shownotifications",
                    type: "checkbox",
                    title: "Show desktop notifications",
                    description: "Enables or disables popup notifications for favorite streamers.",
                    setting: "showNotifications",
                    defaultValue: true
                },
                {
                    id: "opentotab",
                    type: "checkbox",
                    title: "Always open streams in new tab",
                    description: "Middle mouse button will open streams in a new tab when this is not checked.",
                    setting: "openNewTab",
                    defaultValue: false
                },
                {
                    id: "opentopage",
                    type: "checkbox",
                    title: "Open stream page",
                    description: "Streams will open to the streamer page instead of the embedded player (you can also just right-click to do this).",
                    setting: "openToPage",
                    defaultValue: true
                },
                {
                    id: "usealtname",
                    type: "checkbox",
                    title: "Display stream title",
                    description: "Use the stream title instead of the streamer name for stream display.",
                    setting: "useAltName",
                    defaultValue: false,
                    updateAfterChange: true
                }
            ]};

        this.settingsList = [];
        
        this.updateCallback = undefined;

        this.updateSettingsDisplay = function _updateSettingsDisplay(categoryId) {
            if (this.updateCallback !== undefined && $.isFunction(this.updateCallback)) {
                this.updateCallback(categoryId);
            }
        };

        this.addSettings = function _addSettings(settingsObj) {
            this.settingsList.push(settingsObj);
            this.updateSettingsDisplay(settingsObj.id);
        };

        this.updateSettings = function _updateSettings(settingsObj) {
            for (var i = 0; i < this.settingsList.length; i++) {
                if (this.settingsList[i].id === settingsObj.id) {
                    this.settingsList[i] = settingsObj;
                    break;
                }
            }

            this.updateSettingsDisplay(settingsObj.id);
        };

        this.mergeSettings = function _mergeSettings(settingsObj) {
            var foundid = -1;

            for (var i = 0; i < this.settingsList.length; i++) {
                if (this.settingsList[i].id !== settingsObj.id) {
                    continue;
                }

                for (var s = 0; s < settingsObj.settings.length; s++) {
                    // Update each setting
                    var found = false;

                    var self = this;
                    $.each(this.settingsList[i].settings, function(sid, sel) {
                        if (sel.id === settingsObj.settings[s].id) {
                            self.settingsList[i].settings[sid] = settingsObj.settings[s];
                            found = true;
                            return false;
                        }
                    });

                    if (!found) {
                        this.settingsList[i].settings.push(settingsObj.settings[s]); 
                    }
                }

                var foundid = i;

                break;
            }

            if (foundid === -1) {
                this.addSettings(settingsObj);
            } else {
                this.updateSettingsDisplay(settingsObj.id);
            }
        };

        // Initialization
        this.addSettings(defaultSettings);
    })();
})();