/*global define document alert*/
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
        strHintCompare = new Types.Str("compare"),

        activeCls = "squide-active",
        inactiveCls = "squide-inactive",
        editCls = "squide-editor",
        showCls = "squide-show";

    function error(msg) {
        alert(msg);
    }

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

    function escape(str) {
        // TODO: the one above is not completely safe, but the one below returns HTML entities in hex as their unicode character
        // which breaks if encodings change somewhere
        /*var el = document.createElement("textarea");
        el.innerHTML = text;

        return el.innerHTML;*/

        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function rawEdit(element) {
        var
            code = escape(obj.collect(element).toString()),
            $editor,
            editor = {
                "div": {
                    "class": "squide-raw-editor",
                    "$childs": [
                        {
                            "textarea": {
                                "rows": 4,
                                "$childs": code
                            }
                        },
                        {
                            "button": {
                                "class": "squide-raw-editor-save",
                                "$click": function () {
                                    var newCode = $editor.find("textarea").val(),
                                        ast, newElement;

                                    try {
                                        ast = Squim.parse(newCode);
                                        newElement = $.lego(obj.fromValue(ast));

                                        $editor.remove();
                                        element.replaceWith(newElement);
                                    } catch (err) {
                                        error("invalid code");
                                    }

                                },
                                "$childs": "Save"
                            }
                        }
                    ]
                }
            };

        $editor = $.lego(editor);
        element.hide();
        $editor.insertBefore(element);
    }

    function itemContextMenu(x, y, element) {
        Ui.contextMenu({
            labels: [
                {label: "Remove", value: "remove"},
                {label: "Replace", value: "replace"},
                {label: "Raw Edit", value: "rawedit"}
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
                case "rawedit":
                    rawEdit(element);
                    break;
                }
            }
        }, y, x);
    }

    function onValueKeyDown(event) {
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
                event.preventDefault();
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

    function makeInputPart(value, type) {
        return {
            "input": {
                "$focusout": onInputFocusOut,
                "$keydown": function (event) {
                    if (event.keyCode === Ui.keys.SPACE) {
                        event.stopPropagation();
                    }
                },
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

    function onRightClick(event) {
        if (!event.ctrlKey) {
            itemContextMenu(event.pageX, event.pageY, getValueElement($(event.target)));
            event.preventDefault();
            return false;
        }
    }

    function makeShowPart(value, onClick) {

        if (value === undefined) {
            value = "";
        } else {
            value = value.toString();
        }

        onClick = onClick || function () {
            switchActive($(this).parent());
        };

        return {
            "span": {
                "class": join(activeCls, showCls),
                "$childs": escape(value),
                "$click": onClick,
                "$contextmenu": onRightClick
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
        "Compare": "Comparison",
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
        "Assign": [/varName/, "value"],
        "Compare": [/var/, /</, 42]
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
                "$keydown": onValueKeyDown,
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

    obj.Compare = function (values, options) {
        return obj.Pair(values, options, {
            open: "(",
            close: ")",
            type: "compare",
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
                "$keydown": onValueKeyDown,
                "$mouseenter": onHover,
                "$mouseleave": onHover,
                "$contextmenu": onRightClick,
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
                "$keydown": onValueKeyDown,
                "$contextmenu": onRightClick,
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
        var builder, content, hint;

        if (value instanceof Types.Type) {

            if (value instanceof Types.Pair || value instanceof Types.Nil) {
                hint = value.getMetaData("hint");

                if (hint && obj.hintBuilders[hint.value]) {
                    builder = obj.hintBuilders[hint.value];
                } else if (obj.isSpecialPair(value)) {
                    builder = obj.getBuilderForSpecialPair(value);

                    if (!builder) {
                        throw "unknown builder for special pair " + value.toString();
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

    obj.makeIsSpecialPair = function (carName, hint) {
        return function (value) {
            var hintValue;

            if (value instanceof Types.Pair) {
                if (carName !== null) {
                    if (value.left instanceof Types.Symbol && value.left.value === carName) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (hint !== null) {
                    hintValue = value.getMetaData("hint");

                    if (hintValue && hintValue.value === hint) {
                        return true;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        };
    };

    function makeSpecialPairCollector(symbol, name) {
        var childFixer = obj.specialPairsChildOutputFixers[name];

        if (childFixer === undefined) {
            throw "no child fixer for special pair " + name;
        }

        return function (node) {
            var childs = obj.collectChilds(node);

            return childFixer(childs);
        };
    }

    // name of the special pair as key
    // and a two item array with the symbol that should appear as the car
    // (or null to avoid the check) as first element
    // and the metadata hint as second element (or null)
    // to check if a pair is of that type
    // recommendation: use one or the other to avoid weird logic
    obj.specialPairs = {
        "Block": ["$sequence", null],
        "List": ["list", null],
        "Assign": ["set", null],
        "Compare": [null, "compare"]
    };

    // build a function that when invoked with an array of squim types will
    // insert a symbol with value *symbol* as the first item and return
    // the resulting array
    obj.makeCarSymbolInserter = function (symbol) {
        return function (childs) {
            childs.unshift(new Types.Symbol(symbol));

            return Types.util.arrayToPair(childs);
        };
    };

    // put the second item as the first item, used to convert a infix expression
    // into a prefix expression, for example (a < 2) will become (< a 2)
    function makePrefixFromTriplet(childs) {
        var
            first = childs[0],
            second = childs[1],
            pair;

        childs[0] = second;
        childs[1] = first;

        pair = Types.util.arrayToPair(childs);

        pair.setMetaData("hint", strHintCompare);

        return pair;
    }

    function removeCar(items) {
        return items.slice(1);
    }

    function switchFirstTwo(items) {
        var
            first = items[0],
            second = items[1];

        items[0] = second;
        items[1] = first;

        return items;
    }

    obj.getSpecialPairCallValues = function (pair, items) {
        var type = obj.getSpecialPairType(pair);

        return obj.specialPairsChildInputFixers[type](items);
    };

    // functions that will manipulate the input items to generate the
    // valid input for the builder
    // the input is an array of items
    obj.specialPairsChildInputFixers = {
        "Block": removeCar,
        "List": removeCar,
        "Assign": removeCar,
        "Compare": switchFirstTwo
    };

    // functions that will manipulate the collected items to generate the
    // squim valid representation
    obj.specialPairsChildOutputFixers = {
        "Block": obj.makeCarSymbolInserter(obj.specialPairs.Block[0]),
        "List": obj.makeCarSymbolInserter(obj.specialPairs.List[0]),
        "Assign": obj.makeCarSymbolInserter(obj.specialPairs.Assign[0]),
        "Compare": makePrefixFromTriplet
    };

    // will be filled below
    obj.specialPairBuilder = {};

    // list of all the functions to check if a pair is special
    obj.specialPairsCheckers = {};

    $.map(obj.specialPairs, function (args, name) {
        var
            symbol = args[0],
            hint = args[1],
            // one of the two should be non null, if both are non null then
            // it will be weird
            builderName = symbol || hint,
            checker = obj.makeIsSpecialPair(symbol, hint),
            colectorName = name.toLowerCase();

        // build the checkers like obj.isBlock
        obj["is" + name] = checker;

        // build a map with the car symbol as key (like $sequence) and the
        // builder as value (used to find a builder for a special pair
        obj.specialPairBuilder[builderName] = obj[name];

        // add the checker to the list of all checkers to be used by isSpecialPair
        obj.specialPairsCheckers[name] = checker;

        // build the collector, it will be col[colectorName] (for example
        // col.block or col.list)
        col[colectorName] = makeSpecialPairCollector(symbol, name);

        // add the type name to the list of all types
        obj.allTypes.push(name);

        gens.push(name);
    });

    obj.getBuilderForSpecialPair = function (value) {
        var
            symbol,
            car = value.left,
            hint = value.getMetaData("hint");

        // if it has a hint and that hint has a builder
        if (hint && obj.specialPairBuilder[hint.value]) {
            return obj.specialPairBuilder[hint.value];
        } else if (value.left instanceof Types.Symbol) {
            // if the first item of the pair is a symbol and there's
            // a builder for the value of that symbol
            symbol = value.left.value;

            return obj.specialPairBuilder[symbol];
        } else {
            // not found
            return null;
        }
    };

    obj.isSpecialPair = function (value) {
        return !!obj.getSpecialPairType(value);
    };

    obj.getSpecialPairType = function (value) {
        var type, checker;

        for (type in obj.specialPairsCheckers) {
            checker = obj.specialPairsCheckers[type];

            if (checker(value)) {
                return type;
            }
        }

        return null;
    };

    obj.fromValue = function (value) {
        var callValue, items, opts, key, val, pair;

        if (value instanceof Types.Type) {
            if (value instanceof Types.Pair || value instanceof Types.Nil) {
                items = Types.util.pairToArray(value);

                if (obj.isSpecialPair(value)) {
                    callValue = obj.getSpecialPairCallValues(value, items);
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
