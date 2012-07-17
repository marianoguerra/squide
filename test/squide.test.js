/*global require module test deepEqual ok equal*/
require.config({
    baseUrl: "../js/",
    paths: {
        "json": "http://cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2",
        "jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min",
        "qunit": "http://code.jquery.com/qunit/qunit-git",
        "legoparser": "http://marianoguerra.github.com/legojs/src/legoparser",
        "jquery.lego": "http://marianoguerra.github.com/legojs/src/jquery.lego",
        "Squide": "../src/squide"
    },

    shim: {
        json: {
            exports: "JSON"
        }
    }
});

require(["squide", "jquery", "qunit", "json"], function (Squide, $, Q, JSON) {
    "use strict";

    Q.module("squide.types");
});
