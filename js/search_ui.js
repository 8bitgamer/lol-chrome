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

StreamBrowser.Search = new (function () {
    this.uri = "https://api.twitch.tv/kraken/search/channels?q={q}&limit=50";
    this.columns = ['fav', 'service', 'name'];
    this.latestTime = undefined;
    this.results = undefined;
    this.request = undefined;
})();

function setResults(results) {
    if (results._total) {
        StreamBrowser.Search.results = [];

        // Create fake streams
        var twitch = StreamBrowser.Services['twitch'];
        twitch.process(results, undefined, function (stream_data) {
            var key = StreamBrowser.Streams.createKey(stream_data);
            StreamBrowser.Search.results.push(StreamBrowser.Streams.createStream(key, stream_data));
        });

        // Show results
        var rows = showRows(StreamBrowser.Search.results.length, '#searchResultsTable', StreamBrowser.Search.columns);

        for (var i = 0; i < StreamBrowser.Search.results.length; i++) {
            setRow($(rows[i]), StreamBrowser.Search.results[i], true, StreamBrowser.Search.columns);
        }

        // Clear references from closures
        rows = null;

        ////////////////////
        // TODO: continue searching for more results using continuation token
        ////////////////////

        StreamBrowser.Search.results = null;
    }
}

function doSearch() {
    // Cancel any previous request
    if (StreamBrowser.Search.request !== undefined) {
        StreamBrowser.Search.request.abort();
    }

    var term = $('#searchinput').val();
    if (term == '') {
        setResults({});
        StreamBrowser.Search.request = undefined;
        return;
    }

    var time = (new Date()).getTime();
    StreamBrowser.Search.latestTime = time;
    
    var searchuri = StreamBrowser.Search.uri.replace('{q}', term);

    // TODO: implement search for more than Twitch
    StreamBrowser.Search.request = $.ajax({
        url: searchuri,
        cache: true,
        dataType: 'json',
        type: 'GET',
        success: function (data) {
            if (time !== StreamBrowser.Search.latestTime)
                return;

            setResults(data);

            // TODO: continue getting results until out of results to get
        },
        complete: function (jqXHR, textStatus) {
            if (time !== StreamBrowser.Search.latestTime)
                return;

            if (textStatus != "abort") {
                StreamBrowser.Search.request = undefined;
            }
        }
    });
}

$(function () {
    initializeTable('#searchresults', 'searchResultsTable', false, StreamBrowser.Search.columns);

    $('#showsearch').click(function () {
        $('#searchpanel').fadeIn(400);
        $('#searchinput').focus();
    });

    $('#hidesearch').click(function () {
        window.scrollTo(0, 0);
        $('#searchpanel').fadeOut(400);
    });

    $('#searchinput').on('search', doSearch).keyup(doSearch);
});