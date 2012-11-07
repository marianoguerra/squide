/*global define*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'squide.types'],
               function (jQuery, Types) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Squide = factory(jQuery, Types));
        });
    } else {
        // Browser globals
        root.Squide = factory(root.jQuery, root.SquideTypes);
    }
}(this, function ($, Types) {
    "use strict";
    var obj = {};

    obj.types = Types;

    return obj;
}));
