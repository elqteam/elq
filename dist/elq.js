(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Elq = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var utils = require("./utils");

module.exports = function batchProcessorMaker(options) {
    options             = options || {};
    var reporter        = options.reporter;
    var asyncProcess    = utils.getOption(options, "async", true);
    var autoProcess     = utils.getOption(options, "auto", true);

    if(autoProcess && !asyncProcess) {
        reporter && reporter.warn("Invalid options combination. auto=true and async=false is invalid. Setting async=true.");
        asyncProcess = true;
    }

    var batch;
    var batchSize;
    var topLevel;
    var bottomLevel;

    clearBatch();

    var asyncFrameHandler;

    function addFunction(level, fn) {
        if(!fn) {
            fn = level;
            level = 0;
        }

        if(level > topLevel) {
            topLevel = level;
        } else if(level < bottomLevel) {
            bottomLevel = level;
        }

        if(!batch[level]) {
            batch[level] = [];
        }

        if(autoProcess && asyncProcess && batchSize === 0) {
            processBatchAsync();
        }

        batch[level].push(fn);
        batchSize++;
    }

    function forceProcessBatch(localAsyncProcess) {
        if(localAsyncProcess === undefined) {
            localAsyncProcess = asyncProcess;
        }

        if(asyncFrameHandler) {
            cancelFrame(asyncFrameHandler);
            asyncFrameHandler = null;
        }

        if(localAsyncProcess) {
            processBatchAsync();
        } else {
            processBatch();
        }
    }

    function processBatch() {
        for(var level = bottomLevel; level <= topLevel; level++) {
            var fns = batch[level];

            for(var i = 0; i < fns.length; i++) {
                var fn = fns[i];
                fn();
            }
        }
        clearBatch();
    }

    function processBatchAsync() {
        asyncFrameHandler = requestFrame(processBatch);
    }

    function clearBatch() {
        batch           = {};
        batchSize       = 0;
        topLevel        = 0;
        bottomLevel     = 0;
    }

    function cancelFrame(listener) {
        // var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
        var cancel = window.clearTimeout;
        return cancel(listener);
    }

    function requestFrame(callback) {
        // var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) { return window.setTimeout(fn, 20); };
        var raf = function(fn) { return window.setTimeout(fn, 0); };
        return raf(callback);
    }

    return {
        add: addFunction,
        force: forceProcessBatch
    };
};
},{"./utils":2}],2:[function(require,module,exports){
"use strict";

var utils = module.exports = {};

utils.getOption = getOption;

function getOption(options, name, defaultValue) {
    var value = options[name];

    if((value === undefined || value === null) && defaultValue !== undefined) {
        return defaultValue;
    }

    return value;
}

},{}],3:[function(require,module,exports){
"use strict";

var utils = require("./utils");

module.exports = function batchUpdaterMaker(options) {
    options = options || {};

    var reporter    = options.reporter;
    var async       = utils.getOption(options, "async", true);
    var autoUpdate  = utils.getOption(options, "auto", true);

    if(autoUpdate && !async) {
        reporter.warn("Invalid options combination. auto=true and async=false is invalid. Setting async=true.");
        async = true;
    }

    if(!reporter) {
        throw new Error("Reporter required.");
    }

    var batchSize = 0;
    var batch = {};
    var handler;

    function queueUpdate(element, updater) {
        if(autoUpdate && async && batchSize === 0) {
            updateBatchAsync();
        }

        if(!batch[element]) {
            batch[element] = [];
        }

        batch[element].push(updater);
        batchSize++;
    }

    function forceUpdateBatch(updateAsync) {
        if(updateAsync === undefined) {
            updateAsync = async;
        }

        if(handler) {
            cancelFrame(handler);
            handler = null;
        }

        if(async) {
            updateBatchAsync();
        } else {
            updateBatch();
        }
    }

    function updateBatch() {
        for(var element in batch) {
            if(batch.hasOwnProperty(element)) {
                var updaters = batch[element];

                for(var i = 0; i < updaters.length; i++) {
                    var updater = updaters[i];
                    updater();
                }
            }
        }
        clearBatch();
    }

    function updateBatchAsync() {
        handler = requestFrame(function performUpdate() {
            updateBatch();
        });
    }

    function clearBatch() {
        batchSize = 0;
        batch = {};
    }

    function cancelFrame(listener) {
        // var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
        var cancel = window.clearTimeout;
        return cancel(listener);
    }

    function requestFrame(callback) {
        // var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) { return window.setTimeout(fn, 20); };
        var raf = function(fn) { return window.setTimeout(fn, 0); };
        return raf(callback);
    }

    return {
        update: queueUpdate,
        force: forceUpdateBatch
    };
};
},{"./utils":4}],4:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],5:[function(require,module,exports){
"use strict";

var detector = module.exports = {};

detector.isIE = function(version) {
    function isAnyIeVersion() {
        var agent = navigator.userAgent.toLowerCase();
        return agent.indexOf("msie") !== -1 || agent.indexOf("trident") !== -1 || agent.indexOf(" edge/") !== -1;
    }

    if(!isAnyIeVersion()) {
        return false;
    }

    if(!version) {
        return true;
    }

    //Shamelessly stolen from https://gist.github.com/padolsey/527683
    var ieVersion = (function(){
        var undef,
            v = 3,
            div = document.createElement("div"),
            all = div.getElementsByTagName("i");

        do {
            div.innerHTML = "<!--[if gt IE " + (++v) + "]><i></i><![endif]-->";
        }
        while (all[0]);

        return v > 4 ? v : undef;
    }());

    return version === ieVersion;
};

detector.isLegacyOpera = function() {
    return !!window.opera;
};

},{}],6:[function(require,module,exports){
"use strict";

var utils = module.exports = {};

/**
 * Loops through the collection and calls the callback for each element. if the callback returns truthy, the loop is broken and returns the same value.
 * @public
 * @param {*} collection The collection to loop through. Needs to have a length property set and have indices set from 0 to length - 1.
 * @param {function} callback The callback to be called for each element. The element will be given as a parameter to the callback. If this callback returns truthy, the loop is broken and the same value is returned.
 * @returns {*} The value that a callback has returned (if truthy). Otherwise nothing.
 */
utils.forEach = function(collection, callback) {
    for(var i = 0; i < collection.length; i++) {
        var result = callback(collection[i]);
        if(result) {
            return result;
        }
    }
};

},{}],7:[function(require,module,exports){
/**
 * Resize detection strategy that injects objects to elements in order to detect resize events.
 * Heavily inspired by: http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
 */

"use strict";

var browserDetector = require("../browser-detector");

module.exports = function(options) {
    options             = options || {};
    var reporter        = options.reporter;
    var batchProcessor  = options.batchProcessor;
    var getState        = options.stateHandler.getState;

    if(!reporter) {
        throw new Error("Missing required dependency: reporter.");
    }

    /**
     * Adds a resize event listener to the element.
     * @public
     * @param {element} element The element that should have the listener added.
     * @param {function} listener The listener callback to be called for each resize event of the element. The element will be given as a parameter to the listener callback.
     */
    function addListener(element, listener) {
        if(!getObject(element)) {
            throw new Error("Element is not detectable by this strategy.");
        }

        function listenerProxy() {
            listener(element);
        }

        if(browserDetector.isIE(8)) {
            //IE 8 does not support object, but supports the resize event directly on elements.
            getState(element).object = {
                proxy: listenerProxy
            };
            element.attachEvent("onresize", listenerProxy);
        } else {
            var object = getObject(element);
            object.contentDocument.defaultView.addEventListener("resize", listenerProxy);
        }
    }

    /**
     * Makes an element detectable and ready to be listened for resize events. Will call the callback when the element is ready to be listened for resize changes.
     * @private
     * @param {element} element The element to make detectable
     * @param {function} callback The callback to be called when the element is ready to be listened for resize changes. Will be called with the element as first parameter.
     */
    function makeDetectable(element, callback) {
        function injectObject(element, callback) {
            var OBJECT_STYLE = "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; padding: 0; margin: 0; opacity: 0; z-index: -1000; pointer-events: none;";

            //The target element needs to be positioned (everything except static) so the absolute positioned object will be positioned relative to the target element.

            // Position altering may be performed directly or on object load, depending on if style resolution is possible directly or not.
            var positionCheckPerformed = false;

            // The element may not yet be attached to the DOM, and therefore the style object may be empty in some browsers.
            // Since the style object is a reference, it will be updated as soon as the element is attached to the DOM.
            var style = getComputedStyle(element);

            getState(element).startSizeStyle = {
                width: style.width,
                height: style.height
            };

            function mutateDom() {
                function alterPositionStyles() {
                    if(style.position === "static") {
                        element.style.position = "relative";

                        var removeRelativeStyles = function(reporter, element, style, property) {
                            function getNumericalValue(value) {
                                return value.replace(/[^-\d\.]/g, "");
                            }

                            var value = style[property];

                            if(value !== "auto" && getNumericalValue(value) !== "0") {
                                reporter.warn("An element that is positioned static has style." + property + "=" + value + " which is ignored due to the static positioning. The element will need to be positioned relative, so the style." + property + " will be set to 0. Element: ", element);
                                element.style[property] = 0;
                            }
                        };

                        //Check so that there are no accidental styles that will make the element styled differently now that is is relative.
                        //If there are any, set them to 0 (this should be okay with the user since the style properties did nothing before [since the element was positioned static] anyway).
                        removeRelativeStyles(reporter, element, style, "top");
                        removeRelativeStyles(reporter, element, style, "right");
                        removeRelativeStyles(reporter, element, style, "bottom");
                        removeRelativeStyles(reporter, element, style, "left");
                    }
                }

                function onObjectLoad() {
                    // The object has been loaded, which means that the element now is guaranteed to be attached to the DOM.
                    if (!positionCheckPerformed) {
                        alterPositionStyles();
                    }

                    /*jshint validthis: true */

                    function getDocument(element, callback) {
                        //Opera 12 seem to call the object.onload before the actual document has been created.
                        //So if it is not present, poll it with an timeout until it is present.
                        //TODO: Could maybe be handled better with object.onreadystatechange or similar.
                        if(!element.contentDocument) {
                            setTimeout(function checkForObjectDocument() {
                                getDocument(element, callback);
                            }, 100);

                            return;
                        }

                        callback(element.contentDocument);
                    }

                    //Mutating the object element here seems to fire another load event.
                    //Mutating the inner document of the object element is fine though.
                    var objectElement = this;

                    //Create the style element to be added to the object.
                    getDocument(objectElement, function onObjectDocumentReady(objectDocument) {
                        //Notify that the element is ready to be listened to.
                        callback(element);
                    });
                }

                // The element may be detached from the DOM, and some browsers does not support style resolving of detached elements.
                // The alterPositionStyles needs to be delayed until we know the element has been attached to the DOM (which we are sure of when the onObjectLoad has been fired), if style resolution is not possible.
                if (style.position !== "") {
                    alterPositionStyles(style);
                    positionCheckPerformed = true;
                }

                //Add an object element as a child to the target element that will be listened to for resize events.
                var object = document.createElement("object");
                object.style.cssText = OBJECT_STYLE;
                object.type = "text/html";
                object.onload = onObjectLoad;

                //Safari: This must occur before adding the object to the DOM.
                //IE: Does not like that this happens before, even if it is also added after.
                if(!browserDetector.isIE()) {
                    object.data = "about:blank";
                }

                element.appendChild(object);
                getState(element).object = object;

                //IE: This must occur after adding the object to the DOM.
                if(browserDetector.isIE()) {
                    object.data = "about:blank";
                }
            }

            if(batchProcessor) {
                batchProcessor.add(mutateDom);
            } else {
                mutateDom();
            }
        }

        if(browserDetector.isIE(8)) {
            //IE 8 does not support objects properly. Luckily they do support the resize event.
            //So do not inject the object and notify that the element is already ready to be listened to.
            //The event handler for the resize event is attached in the utils.addListener instead.
            callback(element);
        } else {
            injectObject(element, callback);
        }
    }

    /**
     * Returns the child object of the target element.
     * @private
     * @param {element} element The target element.
     * @returns The object element of the target.
     */
    function getObject(element) {
        return getState(element).object;
    }

    function uninstall(element) {
        if(browserDetector.isIE(8)) {
            element.detachEvent("onresize", getState(element).object.proxy);
        } else {
            element.removeChild(getObject(element));
        }
        delete getState(element).object;
    }

    return {
        makeDetectable: makeDetectable,
        addListener: addListener,
        uninstall: uninstall
    };
};

},{"../browser-detector":5}],8:[function(require,module,exports){
/**
 * Resize detection strategy that injects divs to elements in order to detect resize events on scroll events.
 * Heavily inspired by: https://github.com/marcj/css-element-queries/blob/master/src/ResizeSensor.js
 */

"use strict";

module.exports = function(options) {
    options             = options || {};
    var reporter        = options.reporter;
    var batchProcessor  = options.batchProcessor;
    var getState        = options.stateHandler.getState;

    // The injected container needs to have a class, so that it may be styled with CSS (pseudo elements).
    var detectionContainerClass = "erd_scroll_detection_container";

    if(!reporter) {
        throw new Error("Missing required dependency: reporter.");
    }

    //TODO: Could this perhaps be done at installation time?
    var scrollbarSizes = getScrollbarSizes();

    // Inject the scrollbar styling that prevents them from appearing sometimes in Chrome.
    var styleId = "erd_scroll_detection_scrollbar_style";
    injectScrollStyle(styleId, detectionContainerClass);

    /**
     * Adds a resize event listener to the element.
     * @public
     * @param {element} element The element that should have the listener added.
     * @param {function} listener The listener callback to be called for each resize event of the element. The element will be given as a parameter to the listener callback.
     */
    function addListener(element, listener) {
        var changed = function() {
            var elementStyle    = getComputedStyle(element);
            var width           = parseSize(elementStyle.width);
            var height          = parseSize(elementStyle.height);

            // Store the size of the element sync here, so that multiple scroll events may be ignored in the event listeners.
            // Otherwise the if-check in handleScroll is useless.
            storeCurrentSize(element, width, height);

            batchProcessor.add(function updateDetectorElements() {
                updateChildSizes(element, width, height);
            });

            batchProcessor.add(1, function updateScrollbars() {
                positionScrollbars(element, width, height);
                listener(element);
            });
        };

        function handleScroll() {
            var style = getComputedStyle(element);
            var width = parseSize(style.width);
            var height = parseSize(style.height);

            if (width !== element.lastWidth || height !== element.lastHeight) {
                changed();
            }
        }

        var expand = getExpandElement(element);
        var shrink = getShrinkElement(element);

        addEvent(expand, "scroll", handleScroll);
        addEvent(shrink, "scroll", handleScroll);
    }

    /**
     * Makes an element detectable and ready to be listened for resize events. Will call the callback when the element is ready to be listened for resize changes.
     * @private
     * @param {element} element The element to make detectable
     * @param {function} callback The callback to be called when the element is ready to be listened for resize changes. Will be called with the element as first parameter.
     */
    function makeDetectable(element, callback) {
        function isStyleResolved() {
            function isPxValue(length) {
                return length.indexOf("px") !== -1;
            }

            var style = getComputedStyle(element);

            return style.position && isPxValue(style.width) && isPxValue(style.height);
        }

        function install() {
            function getStyle() {
                // Some browsers only force layouts when actually reading the style properties of the style object, so make sure that they are all read here,
                // so that the user of the function can be sure that it will perform the layout here, instead of later (important for batching).
                var style                   = {};
                var elementStyle            = getComputedStyle(element);
                style.position              = elementStyle.position;
                style.width                 = parseSize(elementStyle.width);
                style.height                = parseSize(elementStyle.height);
                style.top                   = elementStyle.top;
                style.right                 = elementStyle.right;
                style.bottom                = elementStyle.bottom;
                style.left                  = elementStyle.left;
                style.widthStyle            = elementStyle.width;
                style.heightStyle           = elementStyle.height;
                return style;
            }

            // Style is to be retrieved in the first level (before mutating the DOM) so that a forced layout is avoided later.
            var style = getStyle();

            getState(element).startSizeStyle = {
                width: style.widthStyle,
                height: style.heightStyle
            };

            var readyExpandScroll       = false;
            var readyShrinkScroll       = false;
            var readyOverall            = false;

            function ready() {
                if(readyExpandScroll && readyShrinkScroll && readyOverall) {
                    callback(element);
                }
            }

            function mutateDom() {
                function alterPositionStyles() {
                    if(style.position === "static") {
                        element.style.position = "relative";

                        var removeRelativeStyles = function(reporter, element, style, property) {
                            function getNumericalValue(value) {
                                return value.replace(/[^-\d\.]/g, "");
                            }

                            var value = style[property];

                            if(value !== "auto" && getNumericalValue(value) !== "0") {
                                reporter.warn("An element that is positioned static has style." + property + "=" + value + " which is ignored due to the static positioning. The element will need to be positioned relative, so the style." + property + " will be set to 0. Element: ", element);
                                element.style[property] = 0;
                            }
                        };

                        //Check so that there are no accidental styles that will make the element styled differently now that is is relative.
                        //If there are any, set them to 0 (this should be okay with the user since the style properties did nothing before [since the element was positioned static] anyway).
                        removeRelativeStyles(reporter, element, style, "top");
                        removeRelativeStyles(reporter, element, style, "right");
                        removeRelativeStyles(reporter, element, style, "bottom");
                        removeRelativeStyles(reporter, element, style, "left");
                    }
                }

                function getContainerCssText(left, top, bottom, right) {
                    left = (!left ? "0" : (left + "px"));
                    top = (!top ? "0" : (top + "px"));
                    bottom = (!bottom ? "0" : (bottom + "px"));
                    right = (!right ? "0" : (right + "px"));

                    return "position: absolute; left: " + left + "; top: " + top + "; right: " + right + "; bottom: " + bottom + "; overflow: scroll; z-index: -1; visibility: hidden;";
                }

                alterPositionStyles(style);

                var scrollbarWidth          = scrollbarSizes.width;
                var scrollbarHeight         = scrollbarSizes.height;
                var containerStyle          = getContainerCssText(-1, -1, -scrollbarHeight, -scrollbarWidth);
                var shrinkExpandstyle       = getContainerCssText(0, 0, -scrollbarHeight, -scrollbarWidth);
                var shrinkExpandChildStyle  = "position: absolute; left: 0; top: 0;";

                var container               = document.createElement("div");
                var expand                  = document.createElement("div");
                var expandChild             = document.createElement("div");
                var shrink                  = document.createElement("div");
                var shrinkChild             = document.createElement("div");

                container.className         = detectionContainerClass;
                container.style.cssText     = containerStyle;
                expand.style.cssText        = shrinkExpandstyle;
                expandChild.style.cssText   = shrinkExpandChildStyle;
                shrink.style.cssText        = shrinkExpandstyle;
                shrinkChild.style.cssText   = shrinkExpandChildStyle + " width: 200%; height: 200%;";

                expand.appendChild(expandChild);
                shrink.appendChild(shrinkChild);
                container.appendChild(expand);
                container.appendChild(shrink);
                element.appendChild(container);
                getState(element).element = container;

                addEvent(expand, "scroll", function onFirstExpandScroll() {
                    removeEvent(expand, "scroll", onFirstExpandScroll);
                    readyExpandScroll = true;
                    ready();
                });

                addEvent(shrink, "scroll", function onFirstShrinkScroll() {
                    removeEvent(shrink, "scroll", onFirstShrinkScroll);
                    readyShrinkScroll = true;
                    ready();
                });

                updateChildSizes(element, style.width, style.height);
            }

            function finalizeDomMutation() {
                storeCurrentSize(element, style.width, style.height);
                positionScrollbars(element, style.width, style.height);
                readyOverall = true;
                ready();
            }

            if(batchProcessor) {
                batchProcessor.add(mutateDom);
                batchProcessor.add(1, finalizeDomMutation);
            } else {
                mutateDom();
                finalizeDomMutation();
            }
        }

        // Only install the strategy if the style has been resolved (this does not always mean that the element is attached).
        if (isStyleResolved()) {
            install();
        } else {
            // Need to perform polling in order to detect when the element has been attached to the DOM.
            var timeout = setInterval(function () {
                if (isStyleResolved()) {
                    install();
                    clearTimeout(timeout);
                }
            }, 50);
        }
    }

    function getExpandElement(element) {
        return getState(element).element.childNodes[0];
    }

    function getExpandChildElement(element) {
        return getExpandElement(element).childNodes[0];
    }

    function getShrinkElement(element) {
        return getState(element).element.childNodes[1];
    }

    function getExpandSize(size) {
        return size + 10;
    }

    function getShrinkSize(size) {
        return size * 2;
    }

    function updateChildSizes(element, width, height) {
        var expandChild             = getExpandChildElement(element);
        var expandWidth             = getExpandSize(width);
        var expandHeight            = getExpandSize(height);
        expandChild.style.width     = expandWidth + "px";
        expandChild.style.height    = expandHeight + "px";
    }

    function storeCurrentSize(element, width, height) {
        element.lastWidth   = width;
        element.lastHeight  = height;
    }

    function positionScrollbars(element, width, height) {
        var expand          = getExpandElement(element);
        var shrink          = getShrinkElement(element);
        var expandWidth     = getExpandSize(width);
        var expandHeight    = getExpandSize(height);
        var shrinkWidth     = getShrinkSize(width);
        var shrinkHeight    = getShrinkSize(height);
        expand.scrollLeft   = expandWidth;
        expand.scrollTop    = expandHeight;
        shrink.scrollLeft   = shrinkWidth;
        shrink.scrollTop    = shrinkHeight;
    }

    function addEvent(el, name, cb) {
        if (el.attachEvent) {
            el.attachEvent("on" + name, cb);
        } else {
            el.addEventListener(name, cb);
        }
    }

    function removeEvent(el, name, cb) {
        if(el.attachEvent) {
            el.detachEvent("on" + name, cb);
        } else {
            el.removeEventListener(name, cb);
        }
    }

    function parseSize(size) {
        return parseFloat(size.replace(/px/, ""));
    }

    function getScrollbarSizes() {
        var width = 500;
        var height = 500;

        var child = document.createElement("div");
        child.style.cssText = "position: absolute; width: " + width*2 + "px; height: " + height*2 + "px; visibility: hidden;";

        var container = document.createElement("div");
        container.style.cssText = "position: absolute; width: " + width + "px; height: " + height + "px; overflow: scroll; visibility: none; top: " + -width*3 + "px; left: " + -height*3 + "px; visibility: hidden;";

        container.appendChild(child);

        document.body.insertBefore(container, document.body.firstChild);

        var widthSize = width - container.clientWidth;
        var heightSize = height - container.clientHeight;

        document.body.removeChild(container);

        return {
            width: widthSize,
            height: heightSize
        };
    }

    function injectScrollStyle(styleId, containerClass) {
        function injectStyle(style, method) {
            method = method || function (element) {
                document.head.appendChild(element);
            };

            var styleElement = document.createElement("style");
            styleElement.innerHTML = style;
            styleElement.id = styleId;
            method(styleElement);
            return styleElement;
        }

        if (!document.getElementById(styleId)) {
            var style = "/* Created by the element-resize-detector library. */\n";
            style += "." + containerClass + " > div::-webkit-scrollbar { display: none; }";
            injectStyle(style);
        }
    }

    function uninstall(element) {
        var state = getState(element);
        element.removeChild(state.element);
        delete state.element;
    }

    return {
        makeDetectable: makeDetectable,
        addListener: addListener,
        uninstall: uninstall
    };
};

},{}],9:[function(require,module,exports){
"use strict";

var forEach                 = require("./collection-utils").forEach;
var elementUtilsMaker       = require("./element-utils");
var listenerHandlerMaker    = require("./listener-handler");
var idGeneratorMaker        = require("./id-generator");
var idHandlerMaker          = require("./id-handler");
var reporterMaker           = require("./reporter");
var browserDetector         = require("./browser-detector");
var batchProcessorMaker     = require("batch-processor");
var stateHandler            = require("./state-handler");

//Detection strategies.
var objectStrategyMaker     = require("./detection-strategy/object.js");
var scrollStrategyMaker     = require("./detection-strategy/scroll.js");

/**
 * @typedef idHandler
 * @type {object}
 * @property {function} get Gets the resize detector id of the element.
 * @property {function} set Generate and sets the resize detector id of the element.
 */

/**
 * @typedef Options
 * @type {object}
 * @property {boolean} callOnAdd    Determines if listeners should be called when they are getting added.
                                    Default is true. If true, the listener is guaranteed to be called when it has been added.
                                    If false, the listener will not be guarenteed to be called when it has been added (does not prevent it from being called).
 * @property {idHandler} idHandler  A custom id handler that is responsible for generating, setting and retrieving id's for elements.
                                    If not provided, a default id handler will be used.
 * @property {reporter} reporter    A custom reporter that handles reporting logs, warnings and errors.
                                    If not provided, a default id handler will be used.
                                    If set to false, then nothing will be reported.
 */

/**
 * Creates an element resize detector instance.
 * @public
 * @param {Options?} options Optional global options object that will decide how this instance will work.
 */
module.exports = function(options) {
    options = options || {};

    //idHandler is currently not an option to the listenTo function, so it should not be added to globalOptions.
    var idHandler = options.idHandler;

    if(!idHandler) {
        var idGenerator = idGeneratorMaker();
        var defaultIdHandler = idHandlerMaker({
            idGenerator: idGenerator,
            stateHandler: stateHandler
        });
        idHandler = defaultIdHandler;
    }

    //reporter is currently not an option to the listenTo function, so it should not be added to globalOptions.
    var reporter = options.reporter;

    if(!reporter) {
        //If options.reporter is false, then the reporter should be quiet.
        var quiet = reporter === false;
        reporter = reporterMaker(quiet);
    }

    //batchProcessor is currently not an option to the listenTo function, so it should not be added to globalOptions.
    var batchProcessor = getOption(options, "batchProcessor", batchProcessorMaker({ reporter: reporter }));

    //Options to be used as default for the listenTo function.
    var globalOptions = {};
    globalOptions.callOnAdd     = !!getOption(options, "callOnAdd", true);

    var eventListenerHandler    = listenerHandlerMaker(idHandler);
    var elementUtils            = elementUtilsMaker({
        stateHandler: stateHandler
    });

    //The detection strategy to be used.
    var detectionStrategy;
    var desiredStrategy = getOption(options, "strategy", "object");
    var strategyOptions = {
        reporter: reporter,
        batchProcessor: batchProcessor,
        stateHandler: stateHandler
    };

    if(desiredStrategy === "scroll" && browserDetector.isLegacyOpera()) {
        reporter.warn("Scroll strategy is not supported on legacy Opera. Changing to object strategy.");
        desiredStrategy = "object";
    }

    if(desiredStrategy === "scroll") {
        detectionStrategy = scrollStrategyMaker(strategyOptions);
    } else if(desiredStrategy === "object") {
        detectionStrategy = objectStrategyMaker(strategyOptions);
    } else {
        throw new Error("Invalid strategy name: " + desiredStrategy);
    }

    //Calls can be made to listenTo with elements that are still are being installed.
    //Also, same elements can occur in the elements list in the listenTo function.
    //With this map, the ready callbacks can be synchronized between the calls
    //so that the ready callback can always be called when an element is ready - even if
    //it wasn't installed from the function intself.
    var onReadyCallbacks = {};

    /**
     * Makes the given elements resize-detectable and starts listening to resize events on the elements. Calls the event callback for each event for each element.
     * @public
     * @param {Options?} options Optional options object. These options will override the global options. Some options may not be overriden, such as idHandler.
     * @param {element[]|element} elements The given array of elements to detect resize events of. Single element is also valid.
     * @param {function} listener The callback to be executed for each resize event for each element.
     */
    function listenTo(options, elements, listener) {
        function onResizeCallback(element) {
            var listeners = eventListenerHandler.get(element);
            forEach(listeners, function callListenerProxy(listener) {
                listener(element);
            });
        }

        function addListener(callOnAdd, element, listener) {
            eventListenerHandler.add(element, listener);

            if(callOnAdd) {
                listener(element);
            }
        }

        function isCollection(obj) {
            return Array.isArray(obj) || obj.length !== undefined;
        }

        function toArray(collection) {
            if (!Array.isArray(collection)) {
                var array = [];
                forEach(elements, function (element) {
                    array.push(element);
                });
                return array;
            } else {
                return collection;
            }
        }

        function isElement(obj) {
            return obj && obj.nodeType === 1;
        }

        //Options object may be omitted.
        if(!listener) {
            listener = elements;
            elements = options;
            options = {};
        }

        if(!elements) {
            throw new Error("At least one element required.");
        }

        if(!listener) {
            throw new Error("Listener required.");
        }

        if (isElement(elements)) {
            // A single element has been passed in.
            elements = [elements];
        } else if (isCollection(elements)) {
            // Convert collection to array for plugins.
            elements = toArray(elements);
        } else {
            return reporter.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
        }

        var elementsReady = 0;

        var callOnAdd = getOption(options, "callOnAdd", globalOptions.callOnAdd);
        var onReadyCallback = getOption(options, "onReady", function noop() {});

        forEach(elements, function attachListenerToElement(element) {
            var id = idHandler.get(element);

            if(!elementUtils.isDetectable(element)) {
                if(elementUtils.isBusy(element)) {
                    //The element is being prepared to be detectable. Do not make it detectable.
                    //Just add the listener, because the element will soon be detectable.
                    addListener(callOnAdd, element, listener);
                    onReadyCallbacks[id] = onReadyCallbacks[id] || [];
                    onReadyCallbacks[id].push(function onReady() {
                        elementsReady++;

                        if(elementsReady === elements.length) {
                            onReadyCallback();
                        }
                    });
                    return;
                }

                //The element is not prepared to be detectable, so do prepare it and add a listener to it.
                elementUtils.markBusy(element, true);
                return detectionStrategy.makeDetectable(element, function onElementDetectable(element) {
                    elementUtils.markAsDetectable(element);
                    elementUtils.markBusy(element, false);
                    detectionStrategy.addListener(element, onResizeCallback);
                    addListener(callOnAdd, element, listener);

                    // Since the element size might have changed since the call to "listenTo", we need to check for this change,
                    // so that a resize event may be emitted.
                    var style = getComputedStyle(element);
                    if (stateHandler.getState(element).startSizeStyle.width !== style.width || stateHandler.getState(element).startSizeStyle.height !== style.height) {
                        onResizeCallback(element);
                    }

                    elementsReady++;
                    if(elementsReady === elements.length) {
                        onReadyCallback();
                    }

                    if(onReadyCallbacks[id]) {
                        forEach(onReadyCallbacks[id], function(callback) {
                            callback();
                        });
                        delete onReadyCallbacks[id];
                    }
                });
            }

            //The element has been prepared to be detectable and is ready to be listened to.
            addListener(callOnAdd, element, listener);
            elementsReady++;
        });

        if(elementsReady === elements.length) {
            onReadyCallback();
        }
    }

    function uninstall(element) {
      eventListenerHandler.removeAllListeners(element);
      detectionStrategy.uninstall(element);
      stateHandler.cleanState(element);
    }

    return {
        listenTo: listenTo,
        removeListener: eventListenerHandler.removeListener,
        removeAllListeners: eventListenerHandler.removeAllListeners,
        uninstall: uninstall
    };
};

function getOption(options, name, defaultValue) {
    var value = options[name];

    if((value === undefined || value === null) && defaultValue !== undefined) {
        return defaultValue;
    }

    return value;
}

},{"./browser-detector":5,"./collection-utils":6,"./detection-strategy/object.js":7,"./detection-strategy/scroll.js":8,"./element-utils":10,"./id-generator":11,"./id-handler":12,"./listener-handler":13,"./reporter":14,"./state-handler":15,"batch-processor":1}],10:[function(require,module,exports){
"use strict";

module.exports = function(options) {
    var getState = options.stateHandler.getState;

    /**
     * Tells if the element has been made detectable and ready to be listened for resize events.
     * @public
     * @param {element} The element to check.
     * @returns {boolean} True or false depending on if the element is detectable or not.
     */
    function isDetectable(element) {
        return !!getState(element).isDetectable;
    }

    /**
     * Marks the element that it has been made detectable and ready to be listened for resize events.
     * @public
     * @param {element} The element to mark.
     */
    function markAsDetectable(element) {
        getState(element).isDetectable = true;
    }

    /**
     * Tells if the element is busy or not.
     * @public
     * @param {element} The element to check.
     * @returns {boolean} True or false depending on if the element is busy or not.
     */
    function isBusy(element) {
        return !!getState(element).busy;
    }

    /**
     * Marks the object is busy and should not be made detectable.
     * @public
     * @param {element} element The element to mark.
     * @param {boolean} busy If the element is busy or not.
     */
    function markBusy(element, busy) {
        getState(element).busy = !!busy;
    }

    return {
        isDetectable: isDetectable,
        markAsDetectable: markAsDetectable,
        isBusy: isBusy,
        markBusy: markBusy
    };
};

},{}],11:[function(require,module,exports){
"use strict";

module.exports = function() {
    var idCount = 1;

    /**
     * Generates a new unique id in the context.
     * @public
     * @returns {number} A unique id in the context.
     */
    function generate() {
        return idCount++;
    }

    return {
        generate: generate
    };
};

},{}],12:[function(require,module,exports){
"use strict";

module.exports = function(options) {
    var idGenerator     = options.idGenerator;
    var getState        = options.stateHandler.getState;

    /**
     * Gets the resize detector id of the element. If the element does not have an id, one will be assigned to the element.
     * @public
     * @param {element} element The target element to get the id of.
     * @param {boolean?} readonly An id will not be assigned to the element if the readonly parameter is true. Default is false.
     * @returns {string|number} The id of the element.
     */
    function getId(element, readonly) {
        if(!readonly && !hasId(element)) {
            setId(element);
        }

        return getState(element).id;
    }

    function setId(element) {
        var id = idGenerator.generate();

        getState(element).id = id;

        return id;
    }

    function hasId(element) {
        return getState(element).id !== undefined;
    }

    function removeId(element) {
        delete getState(element).id;
    }

    return {
        get: getId,
        remove: removeId
    };
};

},{}],13:[function(require,module,exports){
"use strict";

module.exports = function(idHandler) {
    var eventListeners = {};

    /**
     * Gets all listeners for the given element.
     * @public
     * @param {element} element The element to get all listeners for.
     * @returns All listeners for the given element.
     */
    function getListeners(element) {
        return eventListeners[idHandler.get(element)] || [];
    }

    /**
     * Stores the given listener for the given element. Will not actually add the listener to the element.
     * @public
     * @param {element} element The element that should have the listener added.
     * @param {function} listener The callback that the element has added.
     */
    function addListener(element, listener) {
        var id = idHandler.get(element);

        if(!eventListeners[id]) {
            eventListeners[id] = [];
        }

        eventListeners[id].push(listener);
    }

    function removeListener(element, listener) {
        var listeners = getListeners(element);
        for (var i = 0, len = listeners.length; i < len; ++i) {
            if (listeners[i] === listener) {
              listeners.splice(i, 1);
              break;
            }
        }
    }

    function removeAllListeners(element) {
      var listeners = eventListeners[idHandler.get(element)];
      if (!listeners) { return; }
      listeners.length = 0;
    }

    return {
        get: getListeners,
        add: addListener,
        removeListener: removeListener,
        removeAllListeners: removeAllListeners
    };
};

},{}],14:[function(require,module,exports){
"use strict";

/* global console: false */

/**
 * Reporter that handles the reporting of logs, warnings and errors.
 * @public
 * @param {boolean} quiet Tells if the reporter should be quiet or not.
 */
module.exports = function(quiet) {
    function noop() {
        //Does nothing.
    }

    var reporter = {
        log: noop,
        warn: noop,
        error: noop
    };

    if(!quiet && window.console) {
        var attachFunction = function(reporter, name) {
            //The proxy is needed to be able to call the method with the console context,
            //since we cannot use bind.
            reporter[name] = function reporterProxy() {
                console[name].apply(console, arguments);
            };
        };

        attachFunction(reporter, "log");
        attachFunction(reporter, "warn");
        attachFunction(reporter, "error");
    }

    return reporter;
};
},{}],15:[function(require,module,exports){
"use strict";

var prop = "_erd";

function initState(element) {
    element[prop] = {};
    return getState(element);
}

function getState(element) {
    return element[prop] || initState(element);
}

function cleanState(element) {
    delete element[prop];
}

module.exports = {
    initState: initState,
    getState: getState,
    cleanState: cleanState
};

},{}],16:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** `Object#toString` result shortcuts */
var stringClass = '[object String]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/**
 * Checks if `value` is a string.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
 * @example
 *
 * _.isString('fred');
 * // => true
 */
function isString(value) {
  return typeof value == 'string' ||
    value && typeof value == 'object' && toString.call(value) == stringClass || false;
}

module.exports = isString;

},{}],17:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Checks if `value` is a function.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 */
function isFunction(value) {
  return typeof value == 'function';
}

module.exports = isFunction;

},{}],18:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = require('lodash._objecttypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // check if the value is the ECMAScript language type of Object
  // http://es5.github.io/#x8
  // and avoid a V8 bug
  // http://code.google.com/p/v8/issues/detail?id=2291
  return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

},{"lodash._objecttypes":19}],19:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

module.exports = objectTypes;

},{}],20:[function(require,module,exports){
module.exports={
  "name": "elq",
  "description": "Element queries library. Solution to modular responsive components.",
  "homepage": "https://github.com/elqteam/elq",
  "repository": {
    "type": "git",
    "url": "git://github.com/elqteam/elq.git"
  },
  "version": "0.3.3",
  "private": false,
  "license": "MIT",
  "devDependencies": {
    "grunt": "^0.4.5",
    "grunt-banner": "^0.3.1",
    "grunt-browserify": "^3.3.0",
    "grunt-contrib-jshint": "^0.11.0",
    "grunt-contrib-watch": "^0.6.1",
    "grunt-jscs": "^1.2.0",
    "grunt-karma": "^0.10.1",
    "jasmine-core": "^2.2.0",
    "jasmine-expect": "^2.0.0-beta1",
    "jasmine-jquery": "^2.0.6",
    "jquery": "^1.11.2",
    "karma": "^0.12.31",
    "karma-chrome-launcher": "^0.1.7",
    "karma-firefox-launcher": "^0.1.4",
    "karma-jasmine": "^0.3.5",
    "karma-safari-launcher": "^0.1.1",
    "karma-sauce-launcher": "^0.2.10",
    "load-grunt-tasks": "^3.0.0",
    "lodash": "^3.3.1"
  },
  "dependencies": {
    "element-resize-detector": "^1.0.1",
    "batch-updater": "^0.1.0",
    "lodash.isfunction": "^2.4.1",
    "lodash.isobject": "^2.4.1",
    "lodash.isstring": "^2.4.1"
  },
  "scripts": {
    "build": "grunt build",
    "dist": "grunt dist",
    "test": "grunt test"
  }
}

},{}],21:[function(require,module,exports){
"use strict";

var forEach = require("./utils").forEach;

module.exports = function BreakpointStateCalculator(options) {
    var styleResolver = options.styleResolver;

    function parseSize(size) {
        return parseFloat(size.replace(/px/, ""));
    }

    function getBreakpointStates(element, breakpoints) {
        var style = styleResolver.getComputedStyle(element);
        var width = style.width;
        var height = style.width;

        if (width.indexOf("px") === -1 || height.indexOf("px") === -1) {
            // The style of the element could not be resolved, probably due to it being detached from the DOM.
            return false;
        }

        width = parseSize(width);
        height = parseSize(height);

        var dimensionValues = {
            width: width,
            height: height
        };

        var breakpointStates = {
            width: [],
            height: []
        };

        forEach(breakpoints, function (breakpoint) {
            var dimension = breakpoint.dimension;
            var elementValue = dimensionValues[dimension];

            var over = false;
            var under = false;

            if (elementValue > breakpoint.pixelValue) {
                over = true;
            } else if (elementValue < breakpoint.pixelValue) {
                under = true;
            }

            var breakpointState = {
                breakpoint: breakpoint,
                over: over,
                under: under
            };

            breakpointStates[dimension].push(breakpointState);
        });

        return breakpointStates;
    }

    return {
        getBreakpointStates: getBreakpointStates
    };
};

},{"./utils":36}],22:[function(require,module,exports){
"use strict";

module.exports = function CycleDetector(idHandler, options) {
    if (!idHandler) {
        throw new Error("IdHandler dependency required.");
    }

    options = options || {};
    options.numCyclesAllowed = options.numCyclesAllowed || 1;
    options.timeBetweenCyclesAllowed = options.timeBetweenCyclesAllowed || 100;

    var elements = {};

    function isUpdateCyclic(element, classes, time) {
        time = time !== undefined ? time : Date.now();

        var id = idHandler.get(element);

        var update = {
            classes: classes,
            time: time
        };

        if (!elements[id]) {
            elements[id] = [update];
            return false;
        }

        var updates = elements[id];

        var cycles = 0;

        for (var i = updates.length - 1; i >= 0; i--) {
            var prevUpdate = updates[i];

            if (update.time - prevUpdate.time > options.timeBetweenCyclesAllowed) {
                elements[id] = updates.slice(i + 1, updates.length);
                elements[id].push(update);
                return false;
            }

            if (prevUpdate.classes === update.classes) {
                cycles++;
            }

            if (cycles > options.numCyclesAllowed) {
                elements[id].push(update);
                return true;
            }
        }

        elements[id].push(update);

        return false;
    }

    return {
        isUpdateCyclic: isUpdateCyclic
    };
};

},{}],23:[function(require,module,exports){
"use strict";

var utils = module.exports = {};

utils.getAttribute = function (element, attr) {
    if (element.hasAttribute(attr)) {
        return element.getAttribute(attr);
    }

    return element.getAttribute("data-" + attr);
};

utils.hasAttribute = function (element, attr) {
    return utils.getAttribute(element, attr) !== null;
};

},{}],24:[function(require,module,exports){
"use strict";

var packageJson                 = require("../package.json");
var BatchUpdater                = require("batch-updater");
var forEach                     = require("./utils").forEach;
var unique                      = require("./utils").unique;
var ElementResizeDetector       = require("element-resize-detector");
var PluginHandler               = require("./plugin-handler");
var Reporter                    = require("./reporter");
var IdGenerator                 = require("./id-generator");
var IdHandler                   = require("./id-handler");
var CycleDetector               = require("./cycle-detector");
var BreakpointStateCalculator   = require("./breakpoint-state-calculator");
var StyleResolver               = require("./style-resolver");

// Core plugins
var elqBreakpoints              = require("./plugin/elq-breakpoints/elq-breakpoints.js");
var elqMinMaxSerializer         = require("./plugin/elq-minmax-serializer/elq-minmax-serializer.js");
var elqMirror                   = require("./plugin/elq-mirror/elq-mirror.js");

module.exports = function Elq(options) {
    options = options || {};

    var elq                         = {};
    var reporter                    = options.reporter || Reporter();
    var defaultUnit                 = options.defaultUnit || "px";
    var cycleDetection              = options.cycleDetection || false;
    var idGenerator                 = IdGenerator();
    var idHandler                   = IdHandler(idGenerator);
    var cycleDetector               = CycleDetector(idHandler);
    var pluginHandler               = PluginHandler(reporter);
    var styleResolver               = StyleResolver();
    var breakpointStateCalculator   = BreakpointStateCalculator({ styleResolver: styleResolver });
    var elementResizeDetector       = ElementResizeDetector({ idHandler: idHandler, reporter: reporter, strategy: "scroll" });
    var BatchUpdater                = createBatchUpdaterConstructorWithDefaultOptions({ reporter: reporter });

    var batchUpdater                = BatchUpdater();
    var globalListeners             = {};

    function notifyListeners(element, event, args) {
        var listeners = element.elq.listeners[event] || [];
        listeners = listeners.concat(globalListeners[event] || []);

        var listenerArguments = [element].concat(args || []);

        forEach(listeners, function (callback) {
            callback.apply(null, listenerArguments);
        });
    }

    function updateBreakpoints(element, batchProcessor) {
        var breakpoints = [];

        forEach(pluginHandler.getMethods("getBreakpoints"), function (getBreakpoints) {
            breakpoints = breakpoints.concat(getBreakpoints(element) || []);
        });

        if (!breakpoints.length) {
            return;
        }

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        // Filter so that we only get unique breakpoints.
        breakpoints = unique(breakpoints, function hash(bp) {
            return bp.dimension + bp.value + bp.type;
        });

        var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

        if (!breakpointStates) {
            // Unable to resolve style for element. Probably due to it being detached from the DOM.
            return;
        }

        // TODO: This should instead be hashed. Also, maybe there is a more effective way of doing this.
        var breakpointStatesHash = JSON.stringify(breakpointStates);

        if (element.elq.currentBreakpointStatesHash !== breakpointStatesHash) {
            if (cycleDetection && element.elq.cycleCheck) {
                if (cycleDetector.isUpdateCyclic(element, breakpointStatesHash)) {
                    reporter.warn("Cyclic rules detected! Breakpoint classes has not been updated. Element: ", element);
                    return;
                }
            }

            element.elq.currentBreakpointStatesHash = breakpointStatesHash;

            if (element.elq.serialize) {
                pluginHandler.callMethods("serializeBreakpointStates", [element, breakpointStates]);
            }

            notifyListeners(element, "breakpointStatesChanged", [breakpointStates]);
        }
    }

    function initElement(element) {
        element.elq = element.elq || {
            listeners: {},
            updateBreakpoints: false,
            resizeDetection: false,
            id: idGenerator.generate()
        };
    }

    function isInited(element) {
        return !!(element.elq && element.elq.id);
    }

    function activate(elements) {
        function isCollection(obj) {
            return Array.isArray(obj) || obj.length !== undefined;
        }

        function toArray(collection) {
            if (!Array.isArray(collection)) {
                var array = [];
                forEach(elements, function (element) {
                    array.push(element);
                });
                return array;
            } else {
                return collection;
            }
        }

        function isElement(obj) {
            return obj && obj.nodeType === 1;
        }

        if (!elements) {
            return;
        }

        if (isElement(elements)) {
            // A single element has been passed in.
            elements = [elements];
        } else if (isCollection(elements)) {
            // Convert collection to array for plugins.
            elements = toArray(elements);
        } else {
            return reporter.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
        }

        // Get possible extra elements by plugins.
        forEach(pluginHandler.getMethods("getExtraElements"), function (getExtraElements) {
            forEach(elements, function (element) {
                var extraElements = getExtraElements(element) || [];
                elements.push.apply(elements, extraElements);
            });
        });

        // Add the elq object to all elements before activating them, since a plugin may need to listen to elements
        // that has not yet been started.
        forEach(elements, function (element) {
            if (!isInited(elements)) {
                initElement(element);
            }
        });

        // Filter out possible duplicates.
        elements = unique(elements, function (element) {
            return element.elq.id;
        });

        forEach(elements, function (element) {
            pluginHandler.callMethods("activate", [element]);
        });

        var manualBatchUpdater = BatchUpdater({ async: false, auto: false });

        //Before listening to each element (which is a heavy task) it is important to apply the right classes
        //to the elements so that a correct render can occur before the installation.
        forEach(elements, function (element) {
            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, manualBatchUpdater);
            }
        });

        function onElementResizeProxy(element) {
            notifyListeners(element, "resize");

            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, batchUpdater);
            }
        }

        forEach(elements, function listenToLoop(element) {
            if (element.elq.resizeDetection) {
                elementResizeDetector.listenTo({
                    callOnAdd: true, // TODO: Shouldn't this be false?
                    batchUpdater: batchUpdater
                }, element, onElementResizeProxy);
            }
        });

        //Force everything currently in the batch to execute synchronously.
        //Important that his is done after the listenToLoop since it reads the DOM style and the batch will write to the DOM.
        manualBatchUpdater.force();
    }

    function listenTo(element, event, callback) {
        function attachListener(listeners) {
            if (!listeners[event]) {
                listeners[event] = [];
            }

            listeners[event].push(callback);
        }

        // The element parameter may be omitted, in order to setup a global listener (i.e., a listener that listens to the event of all elements).
        if (!callback) {
            callback = event;
            event = element;
            element = null;
        }

        if (element) {
            // A local element event listener.

            if (!isInited(element)) {
                initElement(element);
            }

            // TODO: If event is "resize" but the element is current element.elq.resizeDetection = false,
            // it would perhaps be nice to start listening to this element.

            attachListener(element.elq.listeners);
        } else {
            // A global event listener that emits for the event of all elements.
            attachListener(globalListeners);
        }
    }

    //Public
    elq.getVersion          = getVersion;
    elq.getName             = getName;
    elq.use                 = pluginHandler.register.bind(null, elq);
    elq.using               = pluginHandler.isRegistered;
    elq.activate            = activate;
    elq.listenTo            = listenTo;

    //Create an object copy of the currently attached API methods, that will be exposed as the public API.
    var publicElq           = copy(elq);

    //Functions only accesible by plugins.
    elq.idHandler           = idHandler;
    elq.reporter            = reporter;
    elq.cycleDetector       = cycleDetector;
    elq.BatchUpdater        = BatchUpdater;
    elq.pluginHandler       = pluginHandler;

    // Register core plugins
    // TODO: These should be registered at a higher level, such as index.js so that they can be omitted in a slim build.

    elq.use(elqBreakpoints, {
        defaultUnit: defaultUnit
    });

    elq.use(elqMinMaxSerializer);
    elq.use(elqMirror);

    return publicElq;
};

function getVersion() {
    return packageJson.version;
}

function getName() {
    return packageJson.name;
}

function copy(o) {
    var c = {};

    for (var key in o) {
        if (o.hasOwnProperty(key)) {
            c[key] = o[key];
        }
    }

    return c;
}

function createBatchUpdaterConstructorWithDefaultOptions(globalOptions) {
    globalOptions = globalOptions || {};

    function createBatchUpdaterOptionsProxy(options) {
        options = options || globalOptions;

        for (var prop in globalOptions) {
            if (globalOptions.hasOwnProperty(prop) && !options.hasOwnProperty(prop)) {
                options[prop] = globalOptions[prop];
            }
        }

        return BatchUpdater(options);
    }

    return createBatchUpdaterOptionsProxy;
}

},{"../package.json":20,"./breakpoint-state-calculator":21,"./cycle-detector":22,"./id-generator":25,"./id-handler":26,"./plugin-handler":28,"./plugin/elq-breakpoints/elq-breakpoints.js":30,"./plugin/elq-minmax-serializer/elq-minmax-serializer.js":32,"./plugin/elq-mirror/elq-mirror.js":33,"./reporter":34,"./style-resolver":35,"./utils":36,"batch-updater":3,"element-resize-detector":9}],25:[function(require,module,exports){
"use strict";

module.exports = function () {
    var idCount = 1;

    /**
     * Generates a new unique id in the context.
     * @public
     * @returns {number} A unique id in the context.
     */
    function generate() {
        return idCount++;
    }

    return {
        generate: generate
    };
};

},{}],26:[function(require,module,exports){
"use strict";

module.exports = function (idGenerator) {
    var ID_PROP_NAME = "_erdTargetId";

    /**
     * Gets the resize detector id of the element. If the element does not have an id, one will be assigned to the element.
     * @public
     * @param {element} element The target element to get the id of.
     * @param {boolean?} readonly An id will not be assigned to the element if the readonly parameter is true. Default is false.
     * @returns {string|number} The id of the element.
     */
    function getId(element, readonly) {
        if (!readonly && !hasId(element)) {
            setId(element);
        }

        return element[ID_PROP_NAME];
    }

    function setId(element) {
        var id = idGenerator.generate();

        element[ID_PROP_NAME] = id;

        return id;
    }

    function hasId(element) {
        return element[ID_PROP_NAME] !== undefined;
    }

    return {
        get: getId,
        set: setId,
        has: hasId
    };
};

},{}],27:[function(require,module,exports){
"use strict";

var Elq = require("./elq");

module.exports = Elq;

},{"./elq":24}],28:[function(require,module,exports){
"use strict";

var _ = {};

_.isFunction    = require("lodash.isfunction");
_.isObject      = require("lodash.isobject");
_.isString      = require("lodash.isString");
var forEach     = require("./utils").forEach;

/**
 * Handles plugins of a system instance.
 * @constructor
 * @public
 * @param {Reporter} reporter Reporter instance that will be used for reporting errors.
 */
module.exports = function PluginHandler(reporter) {
    if (!reporter) {
        throw new Error("Reporter dependency required.");
    }

    var plugins = {};

    /**
     * Register an plugin to the plugin handler and inits it to the given system. All plugins in the plugin handler context needs to have unique names.
     * @public
     * @param {object} target The target that the given plugin should be applied to.
     * @param {Plugin} plugin TODO: Write me.
     * @returns the plugin instance registered to the target.
     * @throws On invalid plugin input (bad plugin format or not unique name).
     */
    function register(target, plugin, options) {
        options = options || {};

        function checkPluginMethod(method) {
            if (!_.isFunction(plugin[method])) {
                reporter.error("Plugin must provide the " + method + " method. Plugin: ", plugin);
                throw new Error("Invalid plugin: missing method");
            }
        }

        if (!_.isObject(plugin)) {
            reporter.error("Plugin must be an object. Plugin: ", plugin);
            throw new Error("Invalid plugin: not an object");
        }

        checkPluginMethod("getName");
        checkPluginMethod("getVersion");
        checkPluginMethod("isCompatible");
        checkPluginMethod("make");

        if (!plugin.isCompatible(target)) {
            reporter.error("Plugin " + plugin.getName() + ":" + plugin.getVersion() + " is incompatible with " + target.getName() + ":" + target.getVersion());
            throw new Error("Incompatible plugin");
        }

        var name = plugin.getName();

        if (plugins[name]) {
            throw new Error("Plugin " + name + " is already being used.");
        }

        plugins[name] = plugin.make(target, options);

        return plugins[name];
    }

    /**
     * Tells if an plugin has been registered to the plugin handler.
     * @public
     * @param {string|Plugin} plugin The plugin to be checked if registered to the plugin handler. If string, it will be used as name of the plugin.
     * @returns {boolean} True if the plugin has been registered.
     */
    function isRegistered(plugin) {
        var name = _.isObject(plugin) ? plugin.getName() : plugin;

        if (!_.isString(name)) {
            return false;
        }

        return !!plugins[name];
    }

    /**
     * Gets the plugin by the given plugin name.
     * @param {string|plugin} plugin The plugin to get.
     * @returns The plugin object with the given name. Returns null if it doesn't exist.
     */
    function get(plugin) {
        var name = _.isObject(plugin) ? plugin.getName() : plugin;

        return plugins[name] || null;
    }

    /**
     * Gets all plugin methods that exists for the given method name.
     * @public
     * @param {string} method The name of the methods that should be extracted from the plugins.
     * @returns {function[]} A list of all plugin methods that matched the given method name. The methods will have the context bound to the plugin object.
     */
    function getMethods(method) {
        function filterer(plugin) {
            return _.isFunction(plugin[method]);
        }

        function mapper(plugin) {
            var f = plugin[method];
            return f ? f.bind(plugin) : null;
        }

        var pluginObjects = [];

        for (var key in plugins) {
            if (plugins.hasOwnProperty(key)) {
                pluginObjects.push(plugins[key]);
            }
        }

        return pluginObjects.filter(filterer).map(mapper);
    }

    /**
     * Calls all plugin methods with given arguments by the given method name.
     * @public
     * @param {string} method The method name to be called for all plugins that has it.
     * @param {Array} args The arguments array to be applied to all plugin methods.
     */
    function callMethods(method, args) {
        forEach(getMethods(method), function (pluginMethod) {
            pluginMethod.apply(null, args);
        });
    }

    return {
        register: register,
        isRegistered: isRegistered,
        get: get,
        getMethods: getMethods,
        callMethods: callMethods
    };
};

},{"./utils":36,"lodash.isString":16,"lodash.isfunction":17,"lodash.isobject":18}],29:[function(require,module,exports){
"use strict";

var BP_UNITS = {};
BP_UNITS.PX = "px";
BP_UNITS.EM = "em";
BP_UNITS.REM = "rem";

function isUnitTypeValid(val) {
    for (var prop in BP_UNITS) {
        if (BP_UNITS.hasOwnProperty(prop) && BP_UNITS[prop] === val) {
            return true;
        }
    }
    return false;
}

module.exports = function BreakpointParser(options) {
    options = options || {};
    var reporter = options.reporter;
    var defaultUnit = options.defaultUnit;
    var styleResolver = options.styleResolver;
    var elementUtils = options.elementUtils;

    function parseBreakpoints(element) {
        function getBreakpoints(element, dimension) {
            function getElementFontSizeInPixels(element) {
                return parseFloat(styleResolver.getComputedStyle(element).fontSize.replace("px", ""));
            }

            var breakpointPixelValueConverters = {};

            breakpointPixelValueConverters[BP_UNITS.PX] = function (value) {
                return value;
            };

            var cachedRootFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times for the same element.
            breakpointPixelValueConverters[BP_UNITS.REM] = function (value) {
                function getRootElementFontSize() {
                    if (!cachedRootFontSize) {
                        cachedRootFontSize = getElementFontSizeInPixels(document.documentElement);
                    }
                    return cachedRootFontSize;
                }
                return value * getRootElementFontSize();
            };

            var cachedElementFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times for the same element.
            breakpointPixelValueConverters[BP_UNITS.EM] = function (value) {
                function getElementFontSize() {
                    if (!cachedElementFontSize) {
                        cachedElementFontSize = getElementFontSizeInPixels(element);
                    }
                    return cachedElementFontSize;
                }
                return value * getElementFontSize();
            };

            function getFromMainAttr(element, dimension) {
                var breakpoints = elementUtils.getAttribute(element, "elq-breakpoints-" + dimension + "s");

                if (!breakpoints) {
                    return [];
                }

                breakpoints = breakpoints.replace(/\s+/g, " ").trim();
                breakpoints = breakpoints.split(" ");

                breakpoints = breakpoints.map(function (breakpointString) {
                    var valueMatch = breakpointString.match(/^([0-9]+)/g);
                    // a breakpoint value must exist
                    if (!valueMatch) {
                        reporter.error("Invalid breakpoint: " + breakpointString + " for element ", element);
                    }

                    var unitMatch = breakpointString.match(/([a-zA-Z]+)$/g); // the unit is allowed to be omitted
                    var unit = unitMatch ? unitMatch[0] : defaultUnit;

                    if (!isUnitTypeValid(unit)) {
                        reporter.error("Elq breakpoint found with invalid unit: " + unit + " for element ", element);
                    }

                    var value = parseFloat(valueMatch[0]);
                    var valuePx = breakpointPixelValueConverters[unit](value);

                    return {
                        dimension: dimension,
                        pixelValue: valuePx,
                        value: value,
                        type: unit
                    };
                });

                return breakpoints;
            }

            var breakpoints = getFromMainAttr(element, dimension);
            return breakpoints;
        }

        var widthBreakpoints = getBreakpoints(element, "width");
        var heightBreakpoints = getBreakpoints(element, "height");

        return widthBreakpoints.concat(heightBreakpoints);
    }

    return {
        parseBreakpoints: parseBreakpoints
    };
};

},{}],30:[function(require,module,exports){
"use strict";

var packageJson = require("../../../package.json");
var BreakpointsParser = require("./breakpoint-parser.js");
var StyleResolver = require("../../style-resolver.js"); // TODO: Not nice that this is fetching out of own structure like this.
var elementUtils = require("../../element-utils.js");

module.exports = {
    getName: function () {
        return "elq-breakpoints";
    },
    getVersion: function () {
        return packageJson.version;
    },
    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq, options) {
        var styleResolver       = StyleResolver();
        var breakpointsParser   = BreakpointsParser({
            defaultUnit: options.defaultUnit,
            reporter: elq.reporter,
            styleResolver: styleResolver,
            elementUtils: elementUtils
        });

        function activate(element) {
            if (!elementUtils.hasAttribute(element, "elq-breakpoints")) {
                return;
            }

            // All elq-breakpoints elements need to detect resizes and also update breakpoints.
            element.elq.resizeDetection = true;
            element.elq.updateBreakpoints = true;

            // Enable serialization unless some other system explicitly has disabled it.
            if (element.elq.serialize !== false) {
                element.elq.serialize = true;
            }

            if (elementUtils.getAttribute(element, "elq-breakpoints").indexOf("notcyclic") !== -1) {
                element.elq.cycleCheck = false;
            } else {
                // Enable cycle check unless some other system explicitly has disabled it.
                if (element.elq.cycleCheck !== false) {
                    element.elq.cycleCheck = true;
                }
            }
        }

        function getBreakpoints(element) {
            return breakpointsParser.parseBreakpoints(element);
        }

        return {
            activate: activate,
            getBreakpoints: getBreakpoints
        };
    }
};

},{"../../../package.json":20,"../../element-utils.js":23,"../../style-resolver.js":35,"./breakpoint-parser.js":29}],31:[function(require,module,exports){
"use strict";

var forEach = require("../../utils").forEach;

module.exports = function BreakpointStateSerializer() {
    function serializeBreakpointStates(element, breakpointStates) {
        function sortBreakpointStates(breakpointStates) {
            return breakpointStates.sort(function (bp1, bp2) {
                return bp1.breakpoint.pixelValue - bp2.breakpoint.pixelValue;
            });
        }

        function getClasses(breakpointStates, dimension) {
            var dimensionBreakpointStates = breakpointStates[dimension];

            var classes = [];

            if (!dimensionBreakpointStates.length) {
                return classes;
            }

            // Sort for the visual aspect of having the classes in order in the html
            dimensionBreakpointStates = sortBreakpointStates(dimensionBreakpointStates);

            forEach(dimensionBreakpointStates, function (breakpointState) {
                // Direction "min" is inclusive, which means that it is active when the width is over or equal the breakpoint

                var dir = "min";

                if (breakpointState.under) {
                    dir = "max";
                }

                var dimension = breakpointState.breakpoint.dimension;
                var value = breakpointState.breakpoint.value;
                var type = breakpointState.breakpoint.type;

                classes.push("elq-" + dir + "-" + dimension + "-" + value + type);
            });

            return classes;
        }

        //TODO: This function should maybe take into consideration if the target element has the noclasses option set.
        function updateBreakpointClasses(element, breakpointClasses) {
            var classes = element.className;

            //Remove all old breakpoints.
            var breakpointRegexp = new RegExp("elq-(min|max)-(width|height)-[0-9]+[a-zA-Z]+" , "g");
            classes = classes.replace(breakpointRegexp, "");

            //Add new classes
            classes += " " + breakpointClasses;

            //Format classes before putting it in.
            classes = classes.replace(/\s+/g, " ").trim();

            element.className = classes;
        }

        var widthClasses = getClasses(breakpointStates, "width");
        var heightClasses = getClasses(breakpointStates, "height");
        var breakpointClasses = widthClasses.join(" ") + " " + heightClasses.join(" ");

        updateBreakpointClasses(element, breakpointClasses);
    }

    return {
        serializeBreakpointStates: serializeBreakpointStates
    };
};

},{"../../utils":36}],32:[function(require,module,exports){
"use strict";

var packageJson = require("../../../package.json");
var BreakpointStateSerializer = require("./breakpoint-state-serializer.js");
var StyleResolver = require("../../style-resolver.js"); // TODO: Not nice that this is fetching out of own structure like this.

module.exports = {
    getName: function () {
        return "elq-minmax-classes";
    },
    getVersion: function () {
        return packageJson.version;
    },
    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq, options) {
        var breakpointSerializer = BreakpointStateSerializer();

        function serializeBreakpointStates(element, breakpointStates) {
            breakpointSerializer.serializeBreakpointStates(element, breakpointStates);
        }

        return {
            serializeBreakpointStates: serializeBreakpointStates
        };
    }
};

},{"../../../package.json":20,"../../style-resolver.js":35,"./breakpoint-state-serializer.js":31}],33:[function(require,module,exports){
"use strict";

var packageJson = require("../../../package.json"); // In the future this plugin might be broken out to an independent repo. For now it has the same version number as elq.
var elementUtils = require("../../element-utils.js");

module.exports = {
    getName: function () {
        return "elq-mirror";
    },
    getVersion: function () {
        return packageJson.version;
    },

    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq) {
        function mirror(mirrorElement, targetElement) {
            // Mirror serialization overrides any serializations since a mirror element may have breakpoints as well (that doesn't get serialized).
            // Therefore, serialization must be disable for mirror elements.
            mirrorElement.elq.serialize = false;

            if (mirrorElement.elq.mirror) {
                // This element is already mirroring an element.

                if (mirrorElement.elq.mirror.targetId === targetElement.elq.id) {
                    // It is the same object, do nothing.
                    return;
                } else {
                    // A new object is to be mirrored. This is currently unsupported, but shall probably be supported in the future.
                    elq.reporter.error("Cannot change mirror target.", mirrorElement);
                }
            }

            mirrorElement.elq.mirror = {
                targetId: targetElement.elq.id
            };

            elq.listenTo(targetElement, "breakpointStatesChanged", function mirrorNewBreakpointStates(targetElement, newBreakpointStates) {
                elq.pluginHandler.callMethods("serializeBreakpointStates", [mirrorElement, newBreakpointStates]);
            });
        }

        function activate(element) {
            function getElqParentElement(mirrorElement) {
                var currentElement = mirrorElement.parentNode;

                while (currentElement && currentElement.hasAttribute) {
                    if (elementUtils.hasAttribute(currentElement, "elq-breakpoints")) {
                        return currentElement;
                    }

                    currentElement = currentElement.parentNode;
                }

                //If this is reached, it means that there was no elq-breakpoints parent found.
                elq.reporter.error("Mirror elements require an elq-breakpoints ancestor. This error can probably be resolved by making body an elq-breakpoints element. Error caused by mirror element:", mirrorElement);
            }

            if (!elementUtils.hasAttribute(element, "elq-mirror")) {
                return;
            }

            var breakpointElement = getElqParentElement(element);

            mirror(element, breakpointElement);
        }

        return {
            activate: activate,
            mirror: mirror
        };
    }
};

},{"../../../package.json":20,"../../element-utils.js":23}],34:[function(require,module,exports){
"use strict";

/* global console: false */

/**
 * Reporter that handles the reporting of logs, warnings and errors.
 * @public
 * @param {boolean} quiet Tells if the reporter should be quiet or not.
 */
module.exports = function (quiet) {
    function noop() {
        //Does nothing.
    }

    var reporter = {
        log: noop,
        warn: noop,
        error: noop
    };

    if (!quiet && window.console) {
        var attachFunction = function (reporter, name) {
            reporter[name] = function () {
                console[name].apply(console, arguments);
            };
        };

        attachFunction(reporter, "log");
        attachFunction(reporter, "warn");
        attachFunction(reporter, "error");
    }

    return reporter;
};

},{}],35:[function(require,module,exports){
"use strict";

module.exports = function StyleResolver() {
    return {
        getComputedStyle: function (element) {
            return window.getComputedStyle(element);
        }
    };
};

},{}],36:[function(require,module,exports){
"use strict";

var utils = module.exports = {};

utils.getOption = getOption;

function getOption(options, name, defaultValue) {
    var value = options[name];

    if ((value === undefined || value === null) && defaultValue !== undefined) {
        return defaultValue;
    }

    return value;
}

/**
 * Loops through the collection and calls the callback for each element. if the callback returns truthy, the loop is broken and returns the same value.
 * @public
 * @param {*} collection The collection to loop through. Needs to have a length property set and have indices set from 0 to length - 1.
 * @param {function} callback The callback to be called for each element. The element will be given as a parameter to the callback. If this callback returns truthy, the loop is broken and the same value is returned.
 * @returns {*} The value that a callback has returned (if truthy). Otherwise nothing.
 */
utils.forEach = function (collection, callback) {
    for (var i = 0; i < collection.length; i++) {
        var result = callback(collection[i]);
        if (result) {
            return result;
        }
    }
};

utils.unique = function (collection, hashFunction) {
    var output = [];
    var sieveObject = {};
    utils.forEach(collection, function (element) {
        var hash = hashFunction(element);
        if (!sieveObject[hash]) {
            output.push(element);
            sieveObject[hash] = true;
        }
    });

    return output;
};

},{}]},{},[27])(27)
});