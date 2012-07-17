/*global define*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'json', 'squide.types'],
               function (jQuery, JSON, Types) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Squide = factory(jQuery, JSON, Types));
        });
    } else {
        // Browser globals
        root.Squide = factory(root.jQuery, root.JSON, root.SquideTypes);
    }
}(this, function ($, JSON, Types) {
    "use strict";
    var obj = {};

    obj.types = Types;

    return obj;
}));
