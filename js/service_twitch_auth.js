/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var StreamBrowser = StreamBrowser || {};

StreamBrowser.twitch_auth = new (function () {
    var client_id = "tk1nxmrqetscq14kmfdi6cn3m0dlzrt";

    var extension_id = chrome.runtime.id;
    var redirect_uri = "https://" + extension_id + ".chromiumapp.org/twitchoauth";
    var scopes = "user_read user_follows_edit";

    var token_key = 'access_token';

    var token = undefined;
    var auth_header = undefined;
    var is_preauthorized = false;

    var user_info = undefined;
    var follows_info = undefined;

    var follow_keys = [];

    var auth_uri = "https://api.twitch.tv/kraken/oauth2/authorize" +
        "?response_type=token" +
        "&client_id=" + client_id +
        "&redirect_uri=" + redirect_uri +
        "&scope=" + scopes;

    var page_limit = 100;

    var user_uri = "https://api.twitch.tv/kraken/user";
    var follows_uri = "https://api.twitch.tv/kraken/users/{user}/follows/channels?limit=" + page_limit;

    var follow_uri = "https://api.twitch.tv/kraken/users/{user}/follows/channels/{target}";
    var unfollow_uri = "https://api.twitch.tv/kraken/users/{user}/follows/channels/{target}";

    var reset = function _resetTwitchAuth() {
        token = undefined;
        auth_header = undefined;
        is_preauthorized = false;

        user_info = undefined;
        follows_info = undefined;

        follow_keys = [];
        StreamBrowser.Storage.settings.local.set('twitch_auth', undefined);
    };

    // Connect settings
    var connect_setting_show = {
        id: "connect",
        title: "Connect",
        description: undefined,
        settings: [
            {
                id: "twitchconnect",
                src: "../image/twitch_connect_light.png",
                alt: "Connect with Twitch",
                type: "img_button",
                description: "Connect with Twitch to sync your favorites with Twitch follows (it may take a minute or two for follows to show up as favorites).",
                onclick: function () {
                    StreamBrowser.twitch_auth.login();
                }
            }]
    };

    var connect_setting_hide = {
        id: "connect",
        title: "Connect",
        description: undefined,
        settings: [
        {
            id: "twitchconnect",
            type: "info",
            title: '<img src="../image/twitch.png" alt="Connected"> Connected to Twitch',
            description: "Connected as "
        }]
    };

    var set_auth_token = function _set_auth_token(tok) {
        token = tok;
        if (token !== undefined) {
            auth_header = 'OAuth ' + token;
        }
    };

    var twitch_ajax = function _twitch_ajax(url, success, settings) {
        if (settings === undefined)
            settings = {};

        if (user_info && user_info.name) {
            url = url.replace("{user}", user_info.name);
        }

        $.ajax($.extend({
            'url': url,
            type: "GET",
            headers: {
                'Authorization': auth_header,
                'Client-ID': client_id
            },
            'success': success,
            'error': function (xhr, textStatus, errorThrown) {
                console.log("Twitch: connection error (" + textStatus + "): " + errorThrown);
                reset();
                StreamBrowser.Settings.mergeSettings(connect_setting_show);
            }
        }, settings));
    };

    this.isLoggedIn = function _isLoggedIn() {
        return (token !== undefined);
    };

    this.login = function _login() {
        if (this.isLoggedIn()) {
            return;
        }

        var self = this;

        chrome.identity.launchWebAuthFlow({
            'url': auth_uri,
            'interactive': true
        }, function (redirect_url) {
            console.log('redirect received: ' + redirect_url);

            // Get access token
            var params = utility.getAuthParams(redirect_url);

            set_auth_token(params[token_key]);

            // Save auth token in settings
            StreamBrowser.Storage.settings.local.set('twitch_auth', params[token_key]);

            self.getUserInfo();
        });
    };

    this.getUserInfo = function _getUserInfo() {
        if (user_info !== undefined) {
            return user_info;
        }

        var self = this;

        // Get user info
        twitch_ajax(user_uri, function (data) {
            user_info = data;

            console.log("Twitch: got user data for " + user_info.name);
            connect_setting_hide.settings[0].description = 'Connected as <a href="http://www.twitch.tv/' + user_info.name + '">' + user_info.name + '</a>.';
            StreamBrowser.Settings.mergeSettings(connect_setting_hide);

            self.getFollows();
        });
    };

    this.getFollows = function _getFollows(next_url, new_follows) {
        var url = next_url || follows_uri;
        var follows_arr = new_follows || [];
        var self = this;
        twitch_ajax(url, function (data) {
            follows_info = data;

            // Parse follows to set favorites
            if (!follows_info.follows) {
                return;
            }

            // Process follows
            for (var i = 0; i < follows_info.follows.length; i++) {
                var follow = follows_info.follows[i];
                if (!follow.channel) {
                    continue;
                }

                var follow_key = "twitch." + follow.channel.name;

                if (follows_arr.indexOf(follow_key) === -1) {
                    follows_arr.push(follow_key);
                    console.log("Twitch: Loaded follow " + follow.channel.name);
                }
            }

            // Get any more pages of follows
            if (follows_info.follows.length >= page_limit) {
                self.getFollows(follows_info._links.next, follows_arr);
            } else {
                // Set new follows
                follow_keys = follows_arr;

                // Verify following
                for (var i = 0; i < follow_keys.length; i++) {
                    StreamBrowser.Favorites.setFavorite(follow_keys[i], true);
                }

                if (!is_preauthorized) {

                    // No more follows - make sure to add any missing ones from current favorites
                    // Only do this on first connecting with Twitch
                    StreamBrowser.Favorites.onReady(function () {
                        is_preauthorized = true;

                        StreamBrowser.Favorites.forEach(function (fav_key) {
                            StreamBrowser.twitch_auth.addFollow(fav_key);
                        });
                    });
                }
                else {
                    // Sync favorites to Twitch follows (Twitch follows are authoritative)
                    var remove_favs = [];

                    // Find favs that have been removed
                    StreamBrowser.Favorites.forEach(function (fav_key) {
                        if (fav_key.indexOf("twitch.") !== 0) {
                            return;
                        }

                        if (follow_keys.indexOf(fav_key) === -1) {
                            remove_favs.push(fav_key);
                        }
                    });

                    // Remove all favs that aren't follows
                    for (var i = 0; i < remove_favs.length; i++) {
                        StreamBrowser.Favorites.setFavorite(remove_favs[i], false);
                    }
                }

                StreamBrowser.Background.forceRedraw();

                // Reload from follows on Twitch in 60s to get any new follows
                setTimeout(function () { StreamBrowser.twitch_auth.getFollows(); }, 60000);
            }
        });
    };

    this.addFollow = function _addFollow(key) {
        if (follow_keys.indexOf(key) !== -1) {
            // already following
            return;
        }

        // Make follow call
        var i = key.indexOf('.');
        var provider = key.substr(0, i);
        if (provider != "twitch") {
            return;
        }

        var target = key.substring(i + 1);

        twitch_ajax(follow_uri.replace("{target}", target), function (data) {
            console.log("Twitch: Added follow " + target);
            follow_keys.push(key);
        }, { type: "PUT" });
    };

    this.removeFollow = function _removeFollow(key) {
        var followid = follow_keys.indexOf(key);
        if (followid === -1) {
            // already not following
            return;
        }

        // Make follow call
        var i = key.indexOf('.');
        var provider = key.substr(0, i);
        if (provider != "twitch") {
            return;
        }

        var target = key.substring(i + 1);

        twitch_ajax(unfollow_uri.replace("{target}", target), function (data) {
            console.log("Twitch: Removed follow " + target);
            follow_keys.splice(key, 1);
        }, { type: "DELETE" });

    };

    // Register favorite handler
    StreamBrowser.Favorites.onFavoriteUpdate(function (key, value) {
        //follows_keys
        if (value) {
            StreamBrowser.twitch_auth.addFollow(key);
        } else {
            StreamBrowser.twitch_auth.removeFollow(key);
        }
    });

    // Initialize
    StreamBrowser.Storage.settings.local.onWarm(function () {
        var tok = StreamBrowser.Storage.settings.local.get('twitch_auth');
        if (tok !== undefined) {
            is_preauthorized = true;

            set_auth_token(tok);

            // Initialize the user
            StreamBrowser.twitch_auth.getUserInfo();

            console.log("Twitch: Already connected in with Twitch.");

            return;
        }

        // No auth, show the "Connect with Twitch" button
        console.log("Twitch: Not connected with Twitch.");
        StreamBrowser.Settings.mergeSettings(connect_setting_show);
    });
})();