/*global define require*/
require.config({
    baseUrl: "js/",
    paths: {
        "squim": "http://marianoguerra.github.com/squim/src/squim",
        "squim.types": "http://marianoguerra.github.com/squim/src/squim.types",
        "squim.parser": "http://marianoguerra.github.com/squim/src/squim.parser",
        "squim.error": "http://marianoguerra.github.com/squim/src/squim.error",
        "squim.ground": "http://marianoguerra.github.com/squim/src/squim.ground",
        "squim.util": "http://marianoguerra.github.com/squim/src/squim.util",

        "squide": "../src/squide",
        "squide.types": "../src/squide.types",
        "squide.ui": "../src/squide.ui",
        "jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min",
        "json": "http://cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2",
        "legoparser": "http://marianoguerra.github.com/legojs/src/legoparser",
        "jquery.lego": "http://marianoguerra.github.com/legojs/src/jquery.lego",

        "colorPicker": "../src/libs/colorPicker/colorPicker"
    },

    shim: {
        json: {
            exports: "JSON"
        },
        colorPicker: {
            exports: "colorPicker"
        }
    }
});

require(['squide', 'jquery', 'squim'], function (Squide, $, Squim) {
    "use strict";
    var obj = {}, demos, t = Squide.types;

    demos = [
        ["int", 4],
        ["float", 4.2],
        ["bool", false],
        ["inert", /#inert/],
        ["ignore", /#ignore/],
        ["str", "hello world"],
        ["symbol", /multiply-by-two/],
        ["pair", ["asd", 1, 1.2, false, /symbol/, ["lala", 3, true]]],
        ["block", [/$sequence/, [/write/, "asd", 1, 1.2, false], [/write/, "lala", 3, true]]],
        ["block", [/if/, [/<?/, 1, 2],
                          [/$sequence/, [/write/, "asd", 1, 1.2, false], [/write/, "lala", 3, true]],
                          [/$sequence/, [/write/, "asd", 1, 1.2, false], [/write/, "lala", 3, true]]]],

        [":one of", t.$oneOf()],
        ["(nil", "()"],
        ["(from squim", '(if (<? 1 2) ($sequence (write "asd" 1 1.2 #f) (write "lala" 3 #t)) ($sequence (write "asd") (+ 1 2)))'],
        ["(meta data", '(set color "#c00" :{format "color"})'],
        ["(meta data madness", '(set :{values "builtins"} color :{maxLenght 10} "#c00" :{format "color"})']
    ];

    $(function () {
        var cont = $("#container");

        $.each(demos, function (index, demo) {
            var name = demo[0],
                ast,
                value,
                demoCont = $("<div>"),
                getValueButton = $("<button>").html("get value");

            if (name.charAt(0) === ":") {
                value = demo[1];
                name = name.slice(1);
            } else if (name.charAt(0) === "(") {
                ast = Squim.parse(demo[1]);
                value = $.lego(t.fromValue(ast));
                name = name.slice(1);
            } else {
                value = $.lego(t.fromValue(demo[1]));
            }

            demoCont.append($("<h3>").text(name));
            demoCont.append(value);
            demoCont.append(getValueButton);

            getValueButton.click(function () {
                alert(Squide.types.collect(value).toString());
            });

            cont.append(demoCont);
        });
    });

    return obj;
});

