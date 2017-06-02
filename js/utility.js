/*
* Live Stream Browser is Copyright (C) 2011-2016 Kyle Schouviller <Kyle0654@hotmail.com>
* 
* You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
* You may not create derivative versions of the software without written permission of the author.
* This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
* without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/

var utility = new (function () {
    this.getAuthParams = function _getAuthParams(url) {
        var params = {}, key;
        var q = url.split('#')[1];
        if (q === undefined)
            return params;

        q = q.split('&');
        for (var i = 0; i < q.length; i++) {
            key = q[i].split('=');
            params[key[0]] = key[1];
        }

        return params;
    };
})();