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

// Add setting plugin
var settingCreator = {};

// Info
settingCreator.info = function _info(setting) {
    var item = $('<li>' + (setting.title || '') + '<br /><p>' + setting.description + '</p></li>');
    return item;
};

// Image Button
settingCreator.img_button = function _img_button(setting) {
    // Create the item html
    var item = $('<li><img id="' + setting.id + '" src="' + setting.src + '" alt="' + (setting.alt || '') + '" class="img_button" />' + (setting.title || '') + '<br /><p>' + setting.description + '</p></li>');
    var settingName = setting.setting;

    // Set button
    var button = item.find('img');
    if (button === undefined || button.length === 0) {
        console.log('no button found for ' + setting.id);
    }

    var clickAction = setting.onclick;

    // Set button action
    button.click(function () {
        if (clickAction && $.isFunction(clickAction)) {
            clickAction();
        }
    });

    return item;
};

// Select
settingCreator.select = function _select(setting) {
    console.log(JSON.stringify(setting));
    // Create the item html
    var item = $('<li>' + setting.title + '<br /><select id="' + setting.id + '"></select>');

    // Get current setting
    var currentValue = StreamBrowser.Storage.settings.sync.get(setting.setting);
    if (!currentValue) {
        currentValue = setting.defaultValue;
        StreamBrowser.Storage.settings.sync.set(setting.setting, currentValue);
    }

    // Create options
    var select = item.find('select');

    console.log('creating options ' + setting.options.length);
    for (var i = 0; i < setting.options.length; i++) {
        var option = setting.options[i];
        console.log('creating option ' + option.id);
        select.append('<option value="' + option.id + '"' + (option.id === currentValue ? ' selected' : '') + '>' + option.name + '</option>');
    }

    item.change(function (e) {
        var newval = $('#' + setting.id).val();
        StreamBrowser.Storage.settings.sync.set(setting.setting, newval);
        setting.onchange(newval);
    });

    return item;
};

// Checkbox
settingCreator.checkbox = function _checkbox(setting) {
    // Create the item html
    var desc = (setting.description !== undefined) ? '<p>' + setting.description + '</p>' : '';
    var item = $('<li><button id="' + setting.id + '" class="checkbox"> </button> ' + setting.title + '<br />' + desc + '</li>');
    var settingName = setting.setting;
    var defaultValue = setting.defaultValue;
    var updateAfterChange = setting.updateAfterChange;
    var aggregate = setting.aggregate;

    // Get value and set default value if not set
    var settingValue = defaultValue;
    if (aggregate === undefined) {
        // Handle single value loading
        settingValue = StreamBrowser.Storage.settings.sync.get(settingName);

        console.log("loaded checkbox setting " + settingName + ": " + settingValue);

        if (settingValue === undefined) {
            StreamBrowser.Storage.settings.sync.set(settingName, defaultValue ? 'true' : 'false');
            settingValue = defaultValue ? 'true' : 'false';
        }
    } else {
        // Handle aggregate value loading (ignore default setting)
        console.log("setting \"" + settingName + "\" aggregated under [" + aggregate + "]");
        var aggregateValue = StreamBrowser.Storage.settings.sync.get(settingName);
        console.log("loaded aggregate: " + ((aggregateValue === undefined) ? 'undefined' : JSON.stringify(aggregateValue)));
        if (aggregateValue === undefined || !$.isArray(aggregateValue)) {
            aggregateValue = [];
        }

        var valueId = aggregateValue.indexOf(aggregate);
        settingValue = (valueId !== -1) ? 'true' : 'false';
    }

    // Set button
    var button = item.find('button');
    if (button === undefined || button.length === 0) {
        console.log('no button found for ' + setting.id);
    }

    // Set up UI
    if (settingValue === 'true') {
        button.addClass('checked');
    }

    // Set button action
    button.click(function () {
        button.toggleClass('checked');

        if (aggregate !== undefined) {
            // Aggregate an array of values
            var currentValue = StreamBrowser.Storage.settings.sync.get(settingName);
            if (currentValue === undefined || !$.isArray(currentValue)) {
                currentValue = [];
            }

            var valueId = currentValue.indexOf(aggregate);

            var removeValue = !button.hasClass('checked');

            // A bit wordy, but will behave as expected (follow checkbox check)
            if (removeValue) {
                if (valueId !== -1) {
                    currentValue.splice(valueId, 1);
                }
            } else {
                if (valueId === -1) {
                    currentValue.push(aggregate);
                }
            }

            StreamBrowser.Storage.settings.sync.set(settingName, currentValue);
        } else {
            // Simple true/false value
            StreamBrowser.Storage.settings.sync.set(settingName,
                button.hasClass('checked') ? 'true' : 'false');
        }

        if (updateAfterChange) {
            doUpdateTable();
        }
    });

    return item;
};

// Setting UI creation
var createCategoryDiv = function _createCategoryDiv(settingCategory) {
    return $('<div id="setting_cat_' + settingCategory.id + '" class="settingCategory"><h1>' + settingCategory.title + '</h1></div>');
};

var fillSettingCategory = function _fillSettingCategory(settingUl, settingCategory) {
    for (var s = 0; s < settingCategory.settings.length; s++) {
        var settingItem = settingCategory.settings[s];

        if (settingCreator[settingItem.type]) {
            settingUl.append(settingCreator[settingItem.type](settingItem));
        }
    }
};

var updateSetting = function _updateSetting(categoryId) {
    var settingsList = StreamBrowser.Settings.settingsList;

    // Find the setting category
    var settingCategory = undefined;
    for (var i = 0; i < settingsList.length; i++) {
        if (settingsList[i].id === categoryId) {
            settingCategory = settingsList[i];
            break;
        }
    }

    if (settingCategory === undefined) {
        return;
    }

    // Find the page element for the category
    var categoryDiv = $('#setting_cat_' + settingCategory.id);
    if (categoryDiv.length === 0) {
        // Create the div, since it doesn't exist
        categoryDiv = createCategoryDiv(settingCategory);
        $('#settingsSection').append(categoryDiv);
    }

    var categoryUl = categoryDiv.find('ul');
    if (categoryUl.length === 0 && settingCategory.settings) {
        categoryUl = $('<ul></ul>');
        categoryDiv.append(categoryUl);
    }

    categoryUl.empty();
    fillSettingCategory(categoryUl, settingCategory);
};

var updateAllSettings = function _updateAllSettings() {
    var settingsList = StreamBrowser.Settings.settingsList;

    var settingsSection = $('#settingsSection');
    settingsSection.empty();

    // Render each setting category
    for (var i = 0; i < settingsList.length; i++) {
        var settingCategory = settingsList[i];

        var settingDiv = createCategoryDiv(settingCategory);

        if (settingCategory.settings) {
            var settingUl = $('<ul></ul>');
            fillSettingCategory(settingUl, settingCategory);
            settingDiv.append(settingUl);
        }

        settingsSection.append(settingDiv);
    }

    settingsSection.find('a').click(function (e) {
        StreamBrowser.Background.openWindow($(this).attr('href'), e);
    });
};

var updateSettings = function _updateSettings(categoryId) {
    if (categoryId !== undefined) {
        updateSetting(categoryId);
    } else {
        updateAllSettings();
    }
};

$(function () {
    // Create settings panel
    StreamBrowser.Settings.updateCallback = updateSettings;
    updateSettings();

    // Settings panel
    $('#showsettings').click(function () {
        $('#settingspanel').fadeIn(400);// $('#mainpanel').height().toString() + 'px').fadeIn(400);
    });

    $('#hidesettings').click(function () {
        window.scrollTo(0, 0);
        $('#settingspanel').fadeOut(400);
    });

    // Get version info
    $.ajax({
        url: '/manifest.json',
        dataType: 'json',
        success: function (data) {
            $('#versioninfo').text('Version: ' + data.version);
        }
    });
});