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

var streamSort = function _streamSort(a, b) {
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
};

var addRows = function _addRows(count, tableid, columns) {
    var rowTemplate = StreamBrowser.Streams.getRowTemplate(columns);

    var table = $(tableid);

    for (var i = 0; i < count; i++) {
        setupRow($(rowTemplate)).appendTo(table);
    }
};

var showRows = function _showRows(count, tableid, columns) {
    var currentCount = $(tableid + ' .row:gt(0)').length;
    var rows = $(tableid + ' .row:lt(' + (count + 1) + '):gt(0)').show();

    if (currentCount > count) {
        // Hide any extras
        $(tableid + ' .row:gt(' + count + ')').hide();
    } else if (currentCount < count) {
        // Need to add more
        addRows(count - currentCount, tableid, columns);
        rows = $(tableid + ' .row:gt(0)');
    }

    return rows;
};

var initializeTable = function _initializeTable(containerid, tableid, statusHeader, columns) {
    var sh = (statusHeader === undefined) ? true : statusHeader;

    var tableLayout = StreamBrowser.Streams.getTableLayout(tableid, columns);
    var table = $(tableLayout);

    var container = $(containerid);
    container.empty();
    container.append(table);

    if (!sh) {
        return;
    }

    var serviceStatus = StreamBrowser.Background.getServiceStatusUi();
    console.log(serviceStatus);

    var header = $('#' + tableid + ' .statusheader');
    header.empty();
    header.append($(serviceStatus));
    header = null;
};

var favButtonClick = function _favButtonClick() {
    var row = $(this).parents('.row');
    var key = row.attr("data-key");
    var stream = row.data('stream');

    if (!stream) {
        stream = StreamBrowser.Streams.getStream(key);
        if (!stream) {
            return;
        }
    }

    stream.isFavorite = !stream.isFavorite;

    if (stream.isFavorite) {
        StreamBrowser.Favorites.setFavorite(key, true);

        analyticsEvent(key, 'StreamFavorite');
    }
    else {
        StreamBrowser.Favorites.setFavorite(key, false);

        analyticsEvent(key, 'StreamUnFavorite');
    }
};

var streamClicked = function _streamClicked(e) {
    var row = $(this).parents('.row');
    var key = row.attr("data-key");
    var stream = row.data('stream');
    
    if (!stream) {    
        stream = StreamBrowser.Streams.getStream(key);
        if (!stream) {
            return;
        }
    }

    analyticsEvent(key, 'StreamClick');

    var openFullPage = StreamBrowser.Storage.settings.sync.get('openToPage');
    var uri = stream.links.page;
    if ((openFullPage == "false" && stream.links.embed != undefined) || !uri) {
        uri = stream.links.embed;
    }

    StreamBrowser.Background.openWindow(uri, e);

    return false;
};

var contextMenuClicked = function _contextMenuClicked(e) {
    var row = $(this).parents('.row');
    var key = row.attr("data-key");
    var stream = row.data('stream');

    if (!stream) {
        stream = StreamBrowser.Streams.getStream(key);
        if (!stream) {
            return;
        }
    }

    StreamBrowser.Background.showContextMenu(stream, e.pageX, e.pageY);
};

var setupRow = function _setupRow(row) {
    // Set up fav button
    row.find('button.favbutton').click(favButtonClick);

    // Set up stream link
    row.find('a').click(streamClicked).bind("contextmenu", contextMenuClicked);

    return row;
};

var nameTrimStart = new RegExp("^[\n\r\t ]+");
var nameTrimEnd = new RegExp("[\n\r\t ]+$");

var setRow = function _setRow(row, stream, storestream, columns) {
    if (columns === undefined) {
        columns = StreamBrowser.Streams.defaultColumns;
    }

    row.attr('data-key', stream.key);
    if (storestream) {
        row.data('stream', stream);
    }

    // Get any settings
    var settings = {
        openFullPage: StreamBrowser.Storage.settings.sync.get('openToPage'),
        useAltName: StreamBrowser.Storage.settings.sync.get('useAltName')
    };

    row.removeClass('favstream stream').addClass(stream.isFavorite ? 'favstream' : 'stream');

    for (var i = 0; i < columns.length; i++) {
        var columnKey = columns[i];
        if (columnKey == 'fav') {
            var favbutton = row.find('div.cell_fav > button');
            favbutton.css('background-image', "url('" + stream.game.favButtonImg + "')");
            if (stream.game.isCustom) {
                favbutton.addClass('custom');
            } else {
                favbutton.removeClass('custom');
            }
            favbutton.removeClass('favstream stream').addClass(stream.isFavorite ? 'favstream' : 'stream');
            favbutton.attr('title', 'Favorite | ' + stream.game.Name);
        }
        else if (columnKey == 'service') {
            var serviceimg = row.find('div.cell_service > img').attr({
                src: stream.service.img,
                alt: stream.service.name,
                title: stream.service.name
            });
        }
        else if (columnKey == 'name') {
            var uri = stream.links.page;
            if ((settings.openFullPage == "false" && stream.links.embed !== undefined) || !uri)
                uri = stream.links.embed;

            var name = (settings.useAltName == 'true') ? stream.altname : stream.name;
            var altname = (settings.useAltName == 'true') ? stream.name : stream.altname;

            var tname = name.replace(nameTrimStart, "").replace(nameTrimEnd, "");
            var taname = altname.replace(nameTrimStart, "").replace(nameTrimEnd, "");

            row.find('div.cell_name > span > a').attr({
                href: uri,
                title: taname
            }).text(tname);
        }
        else if (columnKey == 'viewers') {
            row.find('div.cell_viewers').text(stream.viewers);
        }
    }

    row = null;
    stream = null;
};