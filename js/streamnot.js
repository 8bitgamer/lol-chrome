/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var bg = chrome.extension.getBackgroundPage();
var StreamBrowser = StreamBrowser || bg.StreamBrowser || {};

var notifications = [];
var notStreams = [];
var notTimeout;
var notCloseTime = 5000;
var notCheckTime = 500;

var updateNotifications = function _updateNotifications() {
    if (StreamBrowser.Background.streamnots.length == 0) {
        window.setTimeout(function () { updateNotifications(); }, notCheckTime);
        return;
    }

    while (StreamBrowser.Background.streamnots.length > 0) {
        var stream = StreamBrowser.Background.streamnots.pop();
        if (notifications.indexOf(stream) != -1) {
            continue;
        }
        notStreams.push(stream);
    }

    renderNotifications();

    window.setTimeout(function () { updateNotifications(); }, notCheckTime);
};

var renderNotifications = function _renderNotifications() {
    $('#notification').empty();

    // Sort by name (TODO: provide sort order?)
    notStreams.sort(function (a, b) { return a.name.toLowerCase() > b.name.toLowerCase(); });

    for (var i = 0; i < notStreams.length; i++) {
        var streamlink = getNot(notStreams[i]);
        $('#notification').append(streamlink);
    }

    // Refresh timeout for close
    window.clearTimeout(notTimeout);
    notTimeout = window.setTimeout(function () { closeNot(); }, notCloseTime);
};

var getNot = function _getNot(stream) {
    return stream.getRow(['fav', 'service', 'name']);
};

var closeNot = function _closeNot() {
    StreamBrowser.Background.notifyOpen = false;
    window.close();
}

$(function () {
    // Parse URL parameters
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }

    // Set link information
    $('#streamername').text(decodeURI(vars['name']));
    $('#streamer').attr('href', decodeURIComponent(vars['link']));
    $('#streamer').click(function () {
        StreamBrowser.Background.getStreamWindow($(this).attr('href'));
        window.close();
    });

    // Set window timeout (and hover timeout)
    notTimeout = window.setTimeout(closeNot, notCloseTime);

    // Update the notifications
    updateNotifications();

    $('body').hover(function () {
        window.clearTimeout(notTimeout);
        return false;
    }, function () {
        notTimeout = window.setTimeout(closeNot, notCloseTime);
        return false;
    });
});

var  = function _(name) {
    $('body').append('<p><a id="streamer" href=""><span id="streamername">' + name + '</span> is online</a></p>');
}