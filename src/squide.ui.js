/*global define*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'json', 'jquery.lego'],
               function (jQuery, JSON, _$) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquideUi = factory(jQuery, JSON));
        });
    } else {
        // Browser globals
        root.SquideUi = factory(root.jQuery, root.JSON);
    }
}(this, function ($, JSON) {
    "use strict";
    var obj = {}, body = $("body"),
        itemSelected = "list-item-selected",
        itemSelectedCls = "." + itemSelected, keys;

    obj.keys = {
        ESC: 27,
        ENTER: 13,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        DEL: 46
    };

    keys = obj.keys;

    obj.inputToSearch = function (jqObj, onLiveSearch, onSearch, onClear, onQuit, onNavigation) {
        var onSearchEvent = function (event) {
            var query = jqObj.val();

            if (onNavigation && event.keyCode >= keys.LEFT && event.keyCode <= keys.DOWN) {
                onNavigation(event.keyCode);
            } else if (event.keyCode === keys.ESC) {
                if (onQuit) {
                    onQuit();
                    event.stopPropagation();
                    return false;
                }
            } else if (event.keyCode === keys.ENTER) {
                if (onSearch) {
                    onSearch(query);
                }
            } else if (query === "") {
                if (onClear) {
                    onClear(query);
                }
            } else if (onLiveSearch) {
                onLiveSearch(query);
            }
        };

        jqObj.keydown(onSearchEvent).on("search", onSearchEvent);
    };

    obj.contextMenu = function (options, top, left) {
        var cont = $("<div>"),
            list = $("<ul>"),
            filter = $("<input type='text' class='squim-context-filter'>");

        function onItemClick(item) {
            return function (event) {
                cont.remove();
                options.callback(item);
                event.preventDefault();
            };
        }

        function onClear() {
            list
                .children()
                .show()
                .removeClass(itemSelected)
                .filter(":first")
                    .addClass(itemSelected);
        }
        function onFilter(query) {
            list
                .children()
                .hide()
                .removeClass(itemSelected);

            list
                .children(":contains(" + query + ")")
                    .show()
                .filter(":visible:first")
                    .addClass(itemSelected);
        }

        function onQuit() {
            cont.remove();

            if (options.onQuit) {
                options.onQuit();
            }
        }

        function onEnter(query) {
            var first = list.children(itemSelectedCls), name;

            if (first.size() === 1) {
                name = first.data("name");

                cont.remove();
                options.callback(name);
            }
        }

        function onNavigation(keyCode) {
            var selected, newSelected;

            if (keyCode === keys.UP) {
                // up
                selected = list.children(itemSelectedCls);
                newSelected = selected.prev(":visible");
            } else if (keyCode === keys.DOWN) {
                // down
                selected = list.children(itemSelectedCls);
                newSelected = selected.next(":visible");
            }

            if (newSelected && newSelected.size() > 0) {
                selected.removeClass(itemSelected);
                newSelected.addClass(itemSelected);
            }
        }

        obj.inputToSearch(filter, onFilter, onEnter, onClear, onQuit, onNavigation);

        $.each(options.labels, function (index, item) {
            var value, label, listItem;

            if (typeof item === "string") {
                label = item;
                value = item;
            } else {
                label = item.label;
                value = item.value;
            }

            listItem = $.lego({
                "li": {
                    "$click": onItemClick(value),
                    "@name": value,
                    "$childs": {
                        "a": {
                            "href": "#",
                            "$childs": label
                        }
                    }
                }
            });

            if (index === 0) {
                listItem.addClass(itemSelected);
            }

            list.append(listItem);
        });

        cont.append(filter);
        cont.append(list);
        cont.addClass("squide-context-menu");

        cont.css({
            "position": "absolute",
            "top": top,
            "left": left,
            "z-index": 10000
        });

        body.append(cont);
        filter.focus().select();
    };

    window.SUI = obj;

    return obj;
}));
