/*global define*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'json', 'squide.ui', 'jquery.lego', 'squim', 'colorPicker'],
               function (jQuery, JSON, Ui, _$, Squim, mColorPicker) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Squide = factory(jQuery, JSON, Ui, Squim, mColorPicker));
        });
    } else {
        // Browser globals
        root.Squide = factory(root.jQuery, root.JSON, root.SquideUi, root.Squim, root.colorPicker);
    }
}(this, function ($, JSON, Ui, Squim, mColorPicker) {
    "use strict";
    var obj = {}, gens, col = {},
        Types = Squim.types,
        strHintKeyVal = new Types.Str("keyval"),

        activeCls = "squide-active",
        inactiveCls = "squide-inactive",
        editCls = "squide-editor",
        showCls = "squide-show",
        quoteItemHelper = $("<div>");

    function button(label, onClick) {
        return {
            "button": {
                "$childs": label,
                "$click": onClick
            }
        };
    }

    function switchActive(item) {
        var
            active = item.find("." + activeCls),
            inactive = item.find("." + inactiveCls),
            newActive;

        active.removeClass(activeCls).addClass(inactiveCls);
        newActive = inactive.removeClass(inactiveCls).addClass(activeCls);

        if (newActive.hasClass(editCls)) {
            newActive.focus().select();
        } else {
            newActive.parent().focus();
        }
    }

    function makeSeparator(separator) {
        return {
            span: {
                "class": "squide-sep",
                "$childs": separator
            }
        };
    }


    function onTypeSelected(type, element, removeElement, separator) {
        var jqElement = obj["$" + type](obj.defaultForType[type]);

        if (separator) {
            element.before($.lego(makeSeparator(separator)));
        }

        element.before(jqElement);

        if (removeElement) {
            element.remove();
        }

        switchActive(jqElement);
    }

    function typeSelectMenu(x, y, items, callback) {
        var listItems = obj.typesToListItems(items);

        Ui.contextMenu({
            labels: listItems,
            callback: callback
        }, y, x);
    }

    function typeSelectButton(label, onTypeSelected, values, separator) {
        values = values || obj.allTypes;

        return button(label, function (event) {
            var
                button = $(this),
                offset;

            if (values.length === 1) {
                onTypeSelected(values[0], button, false, separator);
            } else {
                offset = button.offset();

                typeSelectMenu(offset.left + button.width(), offset.top, values,
                    function (type) {
                        onTypeSelected(type, button, false, separator);
                    });
            }
        });
    }

    function onHover(event) {
        var root = $(this);

        if (event.type === "mouseenter") {
            root.children("button").removeClass("invisible");
        } else {
            root.children("button").addClass("invisible");
        }
    }


    function itemContextMenu(x, y, element) {
        Ui.contextMenu({
            labels: [
                {label: "Remove", value: "remove"},
                {label: "Replace", value: "replace"}
            ],
            callback: function (type) {
                switch (type) {
                case "remove":
                    element.remove();
                    break;
                case "replace":
                    typeSelectMenu(x, y, obj.allTypes,
                        function (type) {
                            onTypeSelected(type, element, true);
                        });
                    break;
                }
            }
        }, y, x);
    }

    function onValueKeyUp(event) {
        var
            showWidget,
            value,
            element = $(this),
            offset,
            active = element.find("." + activeCls + ":first");

        if (event.keyCode === Ui.keys.ENTER) {
            if (active.hasClass(editCls)) {
                value = active.val();

                showWidget = element.find("." + showCls);
                showWidget.text(value);
            }

            switchActive(element);

            // event propagating the event to parents
            event.stopPropagation();
            return false;
        } else if (event.keyCode === Ui.keys.ESC) {
            if (active.hasClass(editCls)) {
                switchActive(element);

                // event propagating the event to parents
                event.stopPropagation();
                return false;
            }
        } else if (event.keyCode === Ui.keys.DEL) {
            if (active.hasClass(showCls)) {
                if (element.hasClass("squide-value")) {
                    element.remove();
                } else {
                    element.parents(".squide-value:first").remove();
                }

                // event propagating the event to parents
                event.stopPropagation();
                return false;
            }
        } else if (event.keyCode === Ui.keys.SPACE) {
            offset = element.offset();

            itemContextMenu(offset.left + element.width(), offset.top, element);
            event.stopPropagation();
            return false;
        }
    }

    function onInputFocusOut(event) {
        var input = $(this), parent;

        if (input.hasClass(activeCls)) {
            parent = input.parent();
            switchActive(parent);
        }
    }

    function join() {
        return Array.prototype.join.apply(arguments, [" "]);
    }

    function quote(txt) {
        return quoteItemHelper.text(txt).html();
    }

    function makeInputPart(value, type) {
        return {
            "input": {
                "$focusout": onInputFocusOut,
                "class": join(inactiveCls, editCls),
                "value": value || "",
                "type": type
            }
        };
    }

    // return the element that has the class squide-value, either the passe
    // argument or the first parent that has it, element is a jquery object
    function getValueElement(element) {
        if (element.hasClass("squide-value")) {
            return element;
        } else {
            return element.parents(".squide-value:first");
        }
    }

    function makeShowPart(value, onClick) {
        onClick = onClick || function () {
            switchActive($(this).parent());
        };

        return {
            "span": {
                "class": join(activeCls, showCls),
                "$childs": quote(value || ""),
                "$click": onClick,
                "$contextmenu": function (event) {
                    if (!event.ctrlKey) {
                        itemContextMenu(event.pageX, event.pageY, getValueElement($(event.target)));
                        event.preventDefault();
                    }
                }
            }
        };
    }

    obj.typeLabels = {
        "Int": "Integer",
        "Float": "Decimal",
        "Bool": "Boolean",
        "Str": "String",
        "Symbol": "Symbol",
        "Pair": "Expression",
        "List": "List",
        "Obj": "Object",
        "Block": "Block",
        "Assign": "Assignment",
        "ObjAttrs": "Object Access"
    };

    obj.defaultForType = {
        "Int": 1,
        "Float": 1.2,
        "Bool": true,
        "Str": "...",
        "Symbol": "symbol",
        "Pair": [],
        "Obj": [],
        "List": [],
        "Block": [],
        "ObjAttrs": [/obj/],
        "KeyVal": [/key/, "val"],
        "Assign": [/varName/, "value"]
    };

    // more types will be added when building special pairs
    obj.allTypes = ["Int", "Float", "Bool", "Str", "Symbol", "Pair", "Obj", "ObjAttrs"];
    // specal pairs will be added when generating them
    gens = ["Int", "Float", "Bool", "Str", "Symbol", "Inert", "Ignore", "Pair", "fromValue", "Obj", "ObjAttrs", "KeyVal"];

    obj.typesToListItems = function (types) {
        return $.map(types, function (type, index) {
            return {
                label: obj.typeLabels[type] || type,
                value: type
            };
        });
    };

    obj.singleType = function (value, type, showPart) {
        if (showPart === undefined) {
            showPart = makeShowPart(value, function () {});
        }

        return {
            "span": {
                "tabindex": 0,
                "@type": type,
                "class": "squide-" + type + " squide-value",
                "$childs": [showPart]
            }
        };
    };

    obj.Inert = function () {
        return obj.singleType("#inert", "inert");
    };

    obj.Ignore = function () {
        return obj.singleType("#ignore", "ignore");
    };

    obj.valueType = function (value, type, inputType, meta, showPart, inputPart) {
        var result;

        if (showPart === undefined) {
            showPart = makeShowPart(value);
        }

        if (inputPart === undefined) {
            inputPart = makeInputPart(value, inputType);
        }

        result = {
            "span": {
                "tabindex": 0,
                "@type": type,
                "$keyup": onValueKeyUp,
                "class": "squide-" + type + " squide-value",
                "$childs": [showPart, inputPart]
            }
        };

        if (meta) {
            result.span["@meta"] = meta;
        }

        return result;
    };

    function option(value, selected) {
        var result = {
            "option": {
                "$focusout": onInputFocusOut,
                "value": value,
                "$childs": value
            }
        };

        if (selected) {
            result.option.selected = "selected";
        }

        return result;
    }

    function token(content /*, ...classes*/) {
        return {
            "span": {
                "class": join.apply(null, Array.prototype.slice.apply(arguments, [1]).concat("squide-token")),
                "$childs": content
            }
        };
    }

    obj.Float = function (value, opts) {
        return obj.valueType(value, "float", "number", opts);
    };

    obj.Int = function (value, opts) {
        return obj.valueType(value, "int", "number", opts);
    };

    obj.Bool = function (value, opts) {
        return obj.valueType(value.toString(), "bool", null, opts, undefined, {
            "select": {
                "@type": "bool",
                "class": join(inactiveCls, editCls),
                "$childs": [
                    option("true", value === true),
                    option("false", value === false)
                ]
            }
        });
    };

    obj.Str = function (value, opts) {
        var
            quote = token('"', "squide-quote"),
            valueType = obj.valueType(value, "str", "text"),
            span  = valueType.span.$childs[0].span,
            input = valueType.span.$childs[1].input,
            result;


        valueType.span["class"] = "squide-inner";

        result = {
            "span": {
                "@type": "str",
                "class": "squide-value squide-str",
                "$childs": [quote, valueType, quote]
            }
        };

        function copyColor($input) {
            var
                parent = $input.parent(),
                showItem = parent.find("." + showCls),
                text = $input.val(),
                bgColor = $input.css("background-color"),
                color = $input.css("color");

            showItem
                .text(text)
                .css({
                    "background-color": bgColor,
                    "color": color
                });

        }

        if (opts) {
            result.span["@meta"] = opts;

            if (opts.format === "color") {
                delete input.$focusout;
                input.$click = function (event) {
                    mColorPicker.size = 1;
                    mColorPicker(event);

                    var
                        $input = $(this),
                        parent = $input.parent(),
                        cpicker = parent.children(".cPSkin");

                    // if the click was done to hide the color picker then
                    // copy the color from input to the span
                    if (!cpicker.is(":visible")) {
                        copyColor($input);
                    }
                };
            }
        }


        return result;
    };

    obj.Symbol = function (value, opts) {
        return obj.valueType(value, "symbol", "text", opts);
    };

    obj.List = function (values, options) {
        return obj.Pair(values, options, {
            open: "[",
            close: "]",
            type: "list"
        });
    };

    obj.ObjAttrs = function (values, options) {
        options = options || {};
        options.allowedTypes = ["Symbol"];

        return obj.Pair(values, options, {
            open: " ",
            close: " ",
            type: "objattrs",
            separator: "."
        });
    };

    obj.Obj = function (values, options) {
        options = options || {};
        options.allowedTypes = ["KeyVal"];

        return obj.Pair(values, options, {
            open: "{",
            close: "}",
            type: "obj"
        });
    };

    obj.KeyVal = function (values, options) {
        return obj.Pair(values, options, {
            open: " ",
            close: " ",
            type: "keyval",
            separator: ":",
            hideAddButton: true
        });
    };

    obj.Assign = function (values, options) {
        return obj.Pair(values, options, {
            open: " ",
            close: " ",
            type: "assign",
            separator: "=",
            hideAddButton: true
        });
    };

    obj.Pair = function (values, options, buildOpts) {
        buildOpts = buildOpts || {};

        var
            i, value,
            open = token(buildOpts.open || '(', "squide-popen"),
            close = token(buildOpts.close || ')', "squide-pclose"),
            childs = [open],
            widget,
            addButton,
            result;

        options = options || {};

        for (i = 0; i < values.length; i += 1) {
            value = values[i];

            widget = obj.fromValue(value);

            if (i > 0 && buildOpts.separator) {
                childs.push(makeSeparator(buildOpts.separator));
            }

            childs.push(widget);
        }

        if (!buildOpts.hideAddButton) {
            addButton = typeSelectButton("+", onTypeSelected, options.allowedTypes, buildOpts.separator);
            addButton.button["class"] = "pair-add-button invisible";

            childs.push(addButton);
        }

        childs.push(close);

        result = {
            "span": {
                "tabindex": 0,
                "@type": buildOpts.type || "pair",
                "$keyup": onValueKeyUp,
                "$mouseenter": onHover,
                "$mouseleave": onHover,
                "class": "squide-pair squide-value",
                "$childs": childs
            }
        };

        return result;
    };

    obj.Block = function (values, options) {
        var
            i, value,
            open = token('{', "squide-bopen"),
            close = token('}', "squide-bclose"),
            childs = [open],
            widget, addButton, result;

        options = options || {};

        for (i = 0; i < values.length; i += 1) {
            value = values[i];

            widget = obj.fromValue(value);

            childs.push(widget);
        }

        addButton = typeSelectButton("+", onTypeSelected, options.allowedTypes);
        addButton.button["class"] = "block-add-button invisible";

        childs.push(addButton);
        childs.push(close);

        result = {
            "div": {
                "tabindex": 0,
                "@type": "block",
                "$mouseenter": onHover,
                "$mouseleave": onHover,
                "$keyup": onValueKeyUp,
                "class": "squide-block squide-value",
                "$childs": childs
            }
        };

        return result;
    };

    obj.hintBuilders = {
        "objattrs": obj.ObjAttrs,
        "keyval": obj.KeyVal
    };

    obj.builderFromValue = function (value) {
        var builder, content, hint, symbol;

        if (value instanceof Types.Type) {

            if (value instanceof Types.Pair || value instanceof Types.Nil) {
                hint = value.getMetaData("hint");

                if (hint && obj.hintBuilders[hint.value]) {
                    builder = obj.hintBuilders[hint.value];
                } else if (obj.isSpecialPair(value)) {
                    symbol = value.left.value;

                    builder = obj.specialPairBuilder[symbol];

                    if (!builder) {
                        throw "unknown builder for special pair " + symbol;
                    }

                } else if (obj.isList(value)) {
                    builder = obj.List;
                } else {
                    builder = obj.Pair;
                }

            } else if (value instanceof Types.Symbol) {
                builder = obj.Symbol;
            } else if (value instanceof Types.Str) {
                builder = obj.Str;
            } else if (value instanceof Types.Int) {
                builder = obj.Int;
            } else if (value instanceof Types.Float) {
                builder = obj.Float;
            } else if (value instanceof Types.Bool) {
                builder = obj.Bool;
            } else if (value instanceof Types.Inert) {
                builder = obj.Inert;
            } else if (value instanceof Types.Ignore) {
                builder = obj.Ignore;
            } else if (value instanceof Types.Obj) {
                builder = obj.Obj;
            } else {
                throw "unknown type for item: " + value.toString();
            }

        } else {

            if (typeof value === "boolean") {
                builder = obj.Bool;
            } else if (typeof value === "string") {
                builder = obj.Str;
            } else if (typeof value === "number") {
                builder = obj.Int;
            } else if ($.isArray(value)) {
                if (value[0] instanceof RegExp) {
                    // check if it's a special pair
                    builder = obj.specialPairBuilder[value[0].source];

                    // if not, set it to pair
                    if (builder === undefined) {
                        builder = obj.Pair;
                    }

                } else {
                    builder = obj.Pair;
                }
            } else if (value instanceof RegExp) {
                content = value.source;

                if (content.charAt(0) === "#") {
                    if (content === "#ignore") {
                        builder = obj.Ignore;
                    } else if (content === "#inert") {
                        builder = obj.Inert;
                    } else {
                        throw "unknown symbol: " + content;
                    }
                } else if (content.indexOf(".") !== -1) {
                    builder = obj.ObjAttrs;
                } else {
                    builder = obj.Symbol;
                }
            } else if ($.isPlainObject(value)) {
                builder = obj.Obj;
            } else {
                throw "unknown value type for: " + value;
            }

        }

        return builder;
    };

    obj.makeIsSpecialPair = function (carName) {
        return function (value) {
            if (value instanceof Types.Pair) {
                if (value.left instanceof Types.Symbol && value.left.value === carName) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        };
    };

    function makeSpecialPairCollector(symbol) {
        return function (node) {
            var childs = obj.collectChilds(node);
            childs.unshift(new Types.Symbol(symbol));

            return Types.util.arrayToPair(childs);
        };
    }

    // name of the special pair and symbol that should appear as the car to
    // be of that type
    obj.specialPairs = {
        "Block": "$sequence",
        "List": "list",
        "Assign": "set"
    };

    // will be filled below
    obj.specialPairBuilder = {};

    // list of all the functions to check if a pair is special
    obj.specialPairsCheckers = [];

    $.map(obj.specialPairs, function (symbol, name) {
        var
            checker = obj.makeIsSpecialPair(symbol),
            colectorName = name.toLowerCase();

        // build the checkers like obj.isBlock
        obj["is" + name] = checker;

        // build a map with the car symbol as key (like $sequence) and the
        // builder as value (used to find a builder for a special pair
        obj.specialPairBuilder[symbol] = obj[name];

        // add the checker to the list of all checkers to be used by isSpecialPair
        obj.specialPairsCheckers.push(checker);

        // build the collector, it will be col[colectorName] (for example
        // col.block or col.list)
        col[colectorName] = makeSpecialPairCollector(symbol);

        // add the type name to the list of all types
        obj.allTypes.push(name);

        gens.push(name);
    });

    obj.isSpecialPair = function (value) {
        var i, checker;

        for (i = 0; i < obj.specialPairsCheckers.length; i += 1) {
            checker = obj.specialPairsCheckers[i];

            if (checker(value)) {
                return true;
            }
        }

        return false;
    };

    obj.fromValue = function (value) {
        var callValue, items, opts, key, val, pair;

        if (value instanceof Types.Type) {
            if (value instanceof Types.Pair || value instanceof Types.Nil) {
                items = Types.util.pairToArray(value);

                if (obj.isSpecialPair(value)) {
                    callValue = items.slice(1);
                } else {
                    callValue = items;
                }

            } else if (value instanceof Types.Obj)  {
                callValue = [];

                for (key in value.attrs) {
                    val = value.attrs[key];
                    pair = new Types.Pair(
                        new Types.Symbol(key),
                        new Types.Pair(val, Types.nil));

                    pair.setMetaData("hint", strHintKeyVal);

                    callValue.push(pair);
                }

            } else {
                callValue = value.value;
            }

            if (value.meta) {
                // create a squim object with the metadata so we can convert the
                // attributes to javascript objects
                opts = (new Types.Obj(value.meta)).toJs();
            }
        } else {
            return obj.fromValue(Types.squimify(value));
        }

        return obj.builderFromValue(value)(callValue, opts);
    };

    obj.collect = function (node) {
        var type = node.data('type');

        if (type === undefined) {
            throw "invalid Code node";
        } else if (col[type] === undefined) {
            throw "no collector for type: " + type;
        } else {
            return col[type](node);
        }
    };

    obj.collectChilds = function (node) {
        return node
            .children(".squide-value")
            .map(function (index, valueNode) {
                return obj.collect($(valueNode));
            })
            .toArray();
    };

    // generate the functions that will return a jquery object with the
    // content of each type
    $.each(gens, function (index, item) {
        obj["$" + item] = function () {
            var result = obj[item].apply(null, $.makeArray(arguments));

            return $.lego(result);
        };
    });

    col.value = function (node) {
        var
            item = node.find("." + showCls),
            value = item.text(),
            meta = node.data("meta"),
            // TODO: check type is the expected one
            type = Squim.parse(value);

        if (meta) {
            type.meta = Types.Obj.fromJsObject(meta).attrs;
        }

        return type;
    };

    col.int = col.value;
    col.float = col.value;
    col.symbol = col.value;
    col.ignore = col.value;
    col.inert = col.value;
    col.str = function (node) {
        var
            value = node.find("." + showCls).text(),
            meta = node.data("meta"),
            // TODO: check type is the expected one
            type = Squim.parse(JSON.stringify(value));

        if (meta) {
            type.meta = Types.Obj.fromJsObject(meta).attrs;
        }

        return type;
    };

    col.bool = function (node) {
        var value = node.find("." + showCls).text();

        if (value === "true") {
            return Types.t;
        } else if (value === "false") {
            return Types.f;
        } else {
            throw "expected true or false in boolean field";
        }
    };

    col.obj = function (node) {
        var
            i,
            child,
            key, val,
            childs = obj.collectChilds(node),
            attrs = {};

        for (i = 0; i < childs.length; i += 1) {
            child = childs[i];
            key = child[0];
            val = child[1];

            if (key instanceof Types.Symbol && val instanceof Types.Type) {
                attrs[key.value] = val;
            }
            // TODO: signal error or log for invalid key value pairs
        }

        return new Types.Obj(attrs);
    };

    col.keyval = function (node) {
        var childs = obj.collectChilds(node);

        return [childs];
    };

    col.pair = function (node) {
        var childs = obj.collectChilds(node);
        return Types.util.arrayToPair(childs);
    };

    col.objattrs = function (node) {
        var
            childs = obj.collectChilds(node),
            pair = Types.util.arrayToPair(childs);

        pair.setMetaData("hint", "objattrs");

        return pair;
    };

    obj.collectors = col;

    return obj;
}));
