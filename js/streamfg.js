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

var updateTimeout = undefined;
var updateTimer = 1100;
var maxExtensions = 5;
var updateExtensions = 0;

// UI
var doUpdateTable = function _doUpdateTable() {
    //var table = StreamBrowser.Background.getTable();

    var serviceStatus = StreamBrowser.Background.getServiceStatusAttrs();
    var serviceHeaders = $('.statusheader > img');
    serviceHeaders.each(function (i, e) {
        var serviceid = $(this).attr('data-service-id');
        var attrs = serviceStatus[serviceid];
        if (!attrs) {
            $(this).hide();
        } else {
            $(this).show().attr(attrs);
        }
    });

    // Get streams and update table
    var streamArray = StreamBrowser.Streams.toArray();
    streamArray.sort(streamSort);

    var rows = showRows(streamArray.length, '#streamTable');

    for (var i = 0; i < streamArray.length; i++) {
        setRow($(rows[i]), streamArray[i]);
    }

    // Clear references from closures
    rows = null;
    streamArray = null;
};

var updateTable = function _updateTable(immediate) {
    // TODO: when creating table: send flat data about table to main page. Main page parses it, then changes the data in static rows in the table (instead of generating a new table every time).
    if (immediate) {
        doUpdateTable();
        return;
    }

    if (updateTimeout !== undefined) {
        if (updateExtensions >= maxExtensions) {
            return;
        }

        // reset the timeout if we still have extensions
        clearTimeout(updateTimeout);
        updateExtensions++;
    }

    updateTimeout = setTimeout(function () {
        doUpdateTable();
        updateTimeout = undefined
        updateExtensions = 0;
    }, updateTimer);
}

$(function() {
    StreamBrowser.Background.foredoc = $(document);
    if (StreamBrowser.onForedocLoaded) {
        StreamBrowser.onForedocLoaded.fire({
            document: $(document)
        });
    }

    $(document).bind("contextmenu", function (e) {
        return false;
    });

    $(document).click(function () {
        StreamBrowser.Background.hideContextMenu();
    });

});

// Hook for unloading
$(window).on('beforeunload', function(){
    StreamBrowser.Background.foredoc = undefined;
});

$(function () {
    initializeTable('#streamscontainer', 'streamTable', true);
    doUpdateTable();
});