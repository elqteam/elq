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

    var batch = Batch();
    var asyncFrameHandler;
    var isProcessing = false;

    function addFunction(level, fn) {
        if(!isProcessing && autoProcess && asyncProcess && batch.size() === 0) {
            // Since this is async, it is guaranteed to be executed after that the fn is added to the batch.
            // This needs to be done before, since we're checking the size of the batch to be 0.
            processBatchAsync();
        }

        batch.add(level, fn);
    }

    function processBatch() {
        // Save the current batch, and create a new batch so that incoming functions are not added into the currently processing batch.
        // Continue processing until the top-level batch is empty (functions may be added to the new batch while processing, and so on).
        isProcessing = true;
        while (batch.size()) {
            var processingBatch = batch;
            batch = Batch();
            processingBatch.process();
        }
        isProcessing = false;
    }

    function forceProcessBatch(localAsyncProcess) {
        if (isProcessing) {
            return;
        }

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
        var cancel = clearTimeout;
        return cancel(listener);
    }

    function requestFrame(callback) {
        // var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) { return window.setTimeout(fn, 20); };
        var raf = function(fn) { return setTimeout(fn, 0); };
        return raf(callback);
    }

    return {
        add: addFunction,
        force: forceProcessBatch
    };
};

function Batch() {
    var batch       = {};
    var size        = 0;
    var topLevel    = 0;
    var bottomLevel = 0;

    function add(level, fn) {
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

        batch[level].push(fn);
        size++;
    }

    function process() {
        for(var level = bottomLevel; level <= topLevel; level++) {
            var fns = batch[level];

            for(var i = 0; i < fns.length; i++) {
                var fn = fns[i];
                fn();
            }
        }
    }

    function getSize() {
        return size;
    }

    return {
        add: add,
        process: process,
        size: getSize
    };
}

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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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
     * @param {object} options Optional options object.
     * @param {element} element The element to make detectable
     * @param {function} callback The callback to be called when the element is ready to be listened for resize changes. Will be called with the element as first parameter.
     */
    function makeDetectable(options, element, callback) {
        if (!callback) {
            callback = element;
            element = options;
            options = null;
        }

        options = options || {};
        var debug = options.debug;

        function injectObject(element, callback) {
            var OBJECT_STYLE = "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; padding: 0; margin: 0; opacity: 0; z-index: -1000; pointer-events: none;";

            //The target element needs to be positioned (everything except static) so the absolute positioned object will be positioned relative to the target element.

            // Position altering may be performed directly or on object load, depending on if style resolution is possible directly or not.
            var positionCheckPerformed = false;

            // The element may not yet be attached to the DOM, and therefore the style object may be empty in some browsers.
            // Since the style object is a reference, it will be updated as soon as the element is attached to the DOM.
            var style = getComputedStyle(element);
            var width = element.offsetWidth;
            var height = element.offsetHeight;

            getState(element).startSize = {
                width: width,
                height: height
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

},{"../browser-detector":3}],6:[function(require,module,exports){
/**
 * Resize detection strategy that injects divs to elements in order to detect resize events on scroll events.
 * Heavily inspired by: https://github.com/marcj/css-element-queries/blob/master/src/ResizeSensor.js
 */

"use strict";

var forEach = require("../collection-utils").forEach;

module.exports = function(options) {
    options             = options || {};
    var reporter        = options.reporter;
    var batchProcessor  = options.batchProcessor;
    var getState        = options.stateHandler.getState;
    var idHandler       = options.idHandler;

    if (!batchProcessor) {
        throw new Error("Missing required dependency: batchProcessor");
    }

    if (!reporter) {
        throw new Error("Missing required dependency: reporter.");
    }

    //TODO: Could this perhaps be done at installation time?
    var scrollbarSizes = getScrollbarSizes();

    // Inject the scrollbar styling that prevents them from appearing sometimes in Chrome.
    // The injected container needs to have a class, so that it may be styled with CSS (pseudo elements).
    var styleId = "erd_scroll_detection_scrollbar_style";
    var detectionContainerClass = "erd_scroll_detection_container";
    injectScrollStyle(styleId, detectionContainerClass);

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
            var containerAnimationClass = containerClass + "_animation";
            var containerAnimationActiveClass = containerClass + "_animation_active";
            var style = "/* Created by the element-resize-detector library. */\n";
            style += "." + containerClass + " > div::-webkit-scrollbar { display: none; }\n\n";
            style += "." + containerAnimationActiveClass + " { -webkit-animation-duration: 0.1s; animation-duration: 0.1s; -webkit-animation-name: " + containerAnimationClass + "; animation-name: " + containerAnimationClass + "; }\n";
            style += "@-webkit-keyframes " + containerAnimationClass +  " { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }\n";
            style += "@keyframes " + containerAnimationClass +          " { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }";
            injectStyle(style);
        }
    }

    function addAnimationClass(element) {
        element.className += " " + detectionContainerClass + "_animation_active";
    }

    /**
     * Adds a resize event listener to the element.
     * @public
     * @param {element} element The element that should have the listener added.
     * @param {function} listener The listener callback to be called for each resize event of the element. The element will be given as a parameter to the listener callback.
     */
    function addListener(element, listener) {
        var listeners = getState(element).listeners;

        if (!listeners.push) {
            throw new Error("Cannot add listener to an element that is not detectable.");
        }

        getState(element).listeners.push(listener);
    }

    /**
     * Makes an element detectable and ready to be listened for resize events. Will call the callback when the element is ready to be listened for resize changes.
     * @private
     * @param {object} options Optional options object.
     * @param {element} element The element to make detectable
     * @param {function} callback The callback to be called when the element is ready to be listened for resize changes. Will be called with the element as first parameter.
     */
    function makeDetectable(options, element, callback) {
        if (!callback) {
            callback = element;
            element = options;
            options = null;
        }

        options = options || {};

        function debug() {
            if (options.debug) {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(idHandler.get(element), "Scroll: ");
                if (reporter.log.apply) {
                    reporter.log.apply(null, args);
                } else {
                    for (var i = 0; i < args.length; i++) {
                        reporter.log(args[i]);
                    }
                }
            }
        }

        function isDetached(element) {
            function isInDocument(element) {
                return element === element.ownerDocument.body || element.ownerDocument.body.contains(element);
            }
            return !isInDocument(element);
        }

        function isUnrendered(element) {
            // Check the absolute positioned container since the top level container is display: inline.
            var container = getState(element).container.childNodes[0];
            return getComputedStyle(container).width.indexOf("px") === -1; //Can only compute pixel value when rendered.
        }

        function getStyle() {
            // Some browsers only force layouts when actually reading the style properties of the style object, so make sure that they are all read here,
            // so that the user of the function can be sure that it will perform the layout here, instead of later (important for batching).
            var elementStyle            = getComputedStyle(element);
            var style                   = {};
            style.position              = elementStyle.position;
            style.width                 = element.offsetWidth;
            style.height                = element.offsetHeight;
            style.top                   = elementStyle.top;
            style.right                 = elementStyle.right;
            style.bottom                = elementStyle.bottom;
            style.left                  = elementStyle.left;
            style.widthCSS              = elementStyle.width;
            style.heightCSS             = elementStyle.height;
            return style;
        }

        function storeStartSize() {
            var style = getStyle();
            getState(element).startSize = {
                width: style.width,
                height: style.height
            };
            debug("Element start size", getState(element).startSize);
        }

        function initListeners() {
            getState(element).listeners = [];
        }

        function storeStyle() {
            debug("storeStyle invoked.");
            var style = getStyle();
            getState(element).style = style;
        }

        function storeCurrentSize(element, width, height) {
            getState(element).lastWidth = width;
            getState(element).lastHeight  = height;
        }

        function getExpandElement(element) {
            return getState(element).container.childNodes[0].childNodes[0].childNodes[0];
        }

        function getExpandChildElement(element) {
            return getExpandElement(element).childNodes[0];
        }

        function getShrinkElement(element) {
            return getState(element).container.childNodes[0].childNodes[0].childNodes[1];
        }

        function getWidthOffset() {
            return 2 * scrollbarSizes.width + 1;
        }

        function getHeightOffset() {
            return 2 * scrollbarSizes.height + 1;
        }

        function getExpandWidth(width) {
            return width + 10 + getWidthOffset();
        }

        function getExpandHeight(height) {
            return height + 10 + getHeightOffset();
        }

        function getShrinkWidth(width) {
            return width * 2 + getWidthOffset();
        }

        function getShrinkHeight(height) {
            return height * 2 + getHeightOffset();
        }

        function positionScrollbars(element, width, height) {
            var expand          = getExpandElement(element);
            var shrink          = getShrinkElement(element);
            var expandWidth     = getExpandWidth(width);
            var expandHeight    = getExpandHeight(height);
            var shrinkWidth     = getShrinkWidth(width);
            var shrinkHeight    = getShrinkHeight(height);
            expand.scrollLeft   = expandWidth;
            expand.scrollTop    = expandHeight;
            shrink.scrollLeft   = shrinkWidth;
            shrink.scrollTop    = shrinkHeight;
        }

        function addEvent(el, name, cb) {
            if (el.addEventListener) {
                el.addEventListener(name, cb);
            } else if(el.attachEvent) {
                el.attachEvent("on" + name, cb);
            } else {
                return reporter.error("[scroll] Don't know how to add event listeners.");
            }
        }

        function injectContainerElement() {
            var container = getState(element).container;

            if (!container) {
                container                   = document.createElement("div");
                container.className         = detectionContainerClass;
                container.style.cssText     = "visibility: hidden; display: inline; width: 0px; height: 0px; z-index: -1; overflow: hidden;";
                getState(element).container = container;
                addAnimationClass(container);
                element.appendChild(container);

                addEvent(container, "animationstart", function onAnimationStart () {
                    getState(element).onRendered && getState(element).onRendered();
                });
            }

            return container;
        }

        function injectScrollElements() {
            function alterPositionStyles() {
                var style = getState(element).style;

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

            function getTopBottomBottomRightCssText(left, top, bottom, right) {
                left = (!left ? "0" : (left + "px"));
                top = (!top ? "0" : (top + "px"));
                bottom = (!bottom ? "0" : (bottom + "px"));
                right = (!right ? "0" : (right + "px"));

                return "left: " + left + "; top: " + top + "; right: " + right + "; bottom: " + bottom + ";";
            }

            debug("Injecting elements");

            alterPositionStyles();

            var rootContainer = getState(element).container;

            if (!rootContainer) {
                rootContainer = injectContainerElement();
            }

            // Due to this WebKit bug https://bugs.webkit.org/show_bug.cgi?id=80808 (currently fixed in Blink, but still present in WebKit browsers such as Safari),
            // we need to inject two containers, one that is width/height 100% and another that is left/top -1px so that the final container always is 1x1 pixels bigger than
            // the targeted element.
            // When the bug is resolved, "containerContainer" may be removed.

            // The outer container can occasionally be less wide than the targeted when inside inline elements element in WebKit (see https://bugs.webkit.org/show_bug.cgi?id=152980).
            // This should be no problem since the inner container either way makes sure the injected scroll elements are at least 1x1 px.

            var scrollbarWidth          = scrollbarSizes.width;
            var scrollbarHeight         = scrollbarSizes.height;
            var containerContainerStyle = "position: absolute; overflow: hidden; z-index: -1; visibility: hidden; width: 100%; height: 100%; left: 0px; top: 0px;";
            var containerStyle          = "position: absolute; overflow: hidden; z-index: -1; visibility: hidden; " + getTopBottomBottomRightCssText(-(1 + scrollbarWidth), -(1 + scrollbarHeight), -scrollbarHeight, -scrollbarWidth);
            var expandStyle             = "position: absolute; overflow: scroll; z-index: -1; visibility: hidden; width: 100%; height: 100%;";
            var shrinkStyle             = "position: absolute; overflow: scroll; z-index: -1; visibility: hidden; width: 100%; height: 100%;";
            var expandChildStyle        = "position: absolute; left: 0; top: 0;";
            var shrinkChildStyle        = "position: absolute; width: 200%; height: 200%;";

            var containerContainer      = document.createElement("div");
            var container               = document.createElement("div");
            var expand                  = document.createElement("div");
            var expandChild             = document.createElement("div");
            var shrink                  = document.createElement("div");
            var shrinkChild             = document.createElement("div");

            containerContainer.style.cssText    = containerContainerStyle;
            containerContainer.className        = detectionContainerClass;
            container.className                 = detectionContainerClass;
            container.style.cssText             = containerStyle;
            expand.style.cssText                = expandStyle;
            expandChild.style.cssText           = expandChildStyle;
            shrink.style.cssText                = shrinkStyle;
            shrinkChild.style.cssText           = shrinkChildStyle;

            expand.appendChild(expandChild);
            shrink.appendChild(shrinkChild);
            container.appendChild(expand);
            container.appendChild(shrink);
            containerContainer.appendChild(container);
            rootContainer.appendChild(containerContainer);

            addEvent(expand, "scroll", function onExpandScroll() {
                getState(element).onExpand && getState(element).onExpand();
            });

            addEvent(shrink, "scroll", function onShrinkScroll() {
                getState(element).onShrink && getState(element).onShrink();
            });
        }

        function registerListenersAndPositionElements() {
            debug("registerListenersAndPositionElements invoked.");

            function updateChildSizes(element, width, height) {
                var expandChild             = getExpandChildElement(element);
                var expandWidth             = getExpandWidth(width);
                var expandHeight            = getExpandHeight(height);
                expandChild.style.width     = expandWidth + "px";
                expandChild.style.height    = expandHeight + "px";
            }

            function updateDetectorElements(done) {
                var width           = element.offsetWidth;
                var height          = element.offsetHeight;

                debug("Storing current size", width, height);

                // Store the size of the element sync here, so that multiple scroll events may be ignored in the event listeners.
                // Otherwise the if-check in handleScroll is useless.
                storeCurrentSize(element, width, height);

                batchProcessor.add(0, function performUpdateChildSizes() {
                    if (options.debug) {
                        var w = element.offsetWidth;
                        var h = element.offsetHeight;

                        if (w !== width || h !== height) {
                            reporter.warn(idHandler.get(element), "Scroll: Size changed before updating detector elements.");
                        }
                    }

                    updateChildSizes(element, width, height);
                });

                batchProcessor.add(1, function updateScrollbars() {
                    positionScrollbars(element, width, height);
                });

                if (done) {
                    batchProcessor.add(2, done);
                }
            }

            function areElementsInjected() {
                return !!getState(element).container;
            }

            function notifyListenersIfNeeded() {
                function isFirstNotify() {
                    return getState(element).lastNotifiedWidth === undefined;
                }

                debug("notifyListenersIfNeeded invoked");

                var state = getState(element);

                // Don't notify the if the current size is the start size, and this is the first notification.
                if (isFirstNotify() && state.lastWidth === state.startSize.width && state.lastHeight === state.startSize.height) {
                    return debug("Not notifying: Size is the same as the start size, and there has been no notification yet.");
                }

                // Don't notify if the size already has been notified.
                if (state.lastWidth === state.lastNotifiedWidth && state.lastHeight === state.lastNotifiedHeight) {
                    return debug("Not notifying: Size already notified");
                }


                debug("Current size not notified, notifying...");
                state.lastNotifiedWidth = state.lastWidth;
                state.lastNotifiedHeight = state.lastHeight;
                forEach(getState(element).listeners, function (listener) {
                    listener(element);
                });
            }

            function handleRender() {
                debug("startanimation triggered.");

                if (isUnrendered(element)) {
                    debug("Ignoring since element is still unrendered...");
                    return;
                }

                debug("Element rendered.");
                var expand = getExpandElement(element);
                var shrink = getShrinkElement(element);
                if (expand.scrollLeft === 0 || expand.scrollTop === 0 || shrink.scrollLeft === 0 || shrink.scrollTop === 0) {
                    debug("Scrollbars out of sync. Updating detector elements...");
                    updateDetectorElements(notifyListenersIfNeeded);
                }
            }

            function handleScroll() {
                debug("Scroll detected.");

                if (isUnrendered(element)) {
                    // Element is still unrendered. Skip this scroll event.
                    debug("Scroll event fired while unrendered. Ignoring...");
                    return;
                }

                var width = element.offsetWidth;
                var height = element.offsetHeight;

                if (width !== element.lastWidth || height !== element.lastHeight) {
                    debug("Element size changed.");
                    updateDetectorElements(notifyListenersIfNeeded);
                } else {
                    debug("Element size has not changed (" + width + "x" + height + ").");
                }
            }

            getState(element).onRendered = handleRender;
            getState(element).onExpand = handleScroll;
            getState(element).onShrink = handleScroll;

            var style = getState(element).style;
            updateChildSizes(element, style.width, style.height);
        }

        function finalizeDomMutation() {
            debug("finalizeDomMutation invoked.");

            var style = getState(element).style;
            storeCurrentSize(element, style.width, style.height);
            positionScrollbars(element, style.width, style.height);
        }

        function ready() {
            callback(element);
        }

        function install() {
            debug("Installing...");
            initListeners();
            storeStartSize();

            batchProcessor.add(0, storeStyle);
            batchProcessor.add(1, injectScrollElements);
            batchProcessor.add(2, registerListenersAndPositionElements);
            batchProcessor.add(3, finalizeDomMutation);
            batchProcessor.add(4, ready);
        }

        debug("Making detectable...");

        if (isDetached(element)) {
            debug("Element is detached");

            injectContainerElement();

            debug("Waiting until element is attached...");

            getState(element).onRendered = function () {
                debug("Element is now attached");
                install();
            };
        } else {
            install();
        }
    }

    function uninstall(element) {
        //TODO: This should also delete the added state object of the element.
        var state = getState(element);
        element.removeChild(state.container);
        delete state.container;
    }

    return {
        makeDetectable: makeDetectable,
        addListener: addListener,
        uninstall: uninstall
    };
};

},{"../collection-utils":4}],7:[function(require,module,exports){
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
 * @property {boolean} debug        If set to true, the the system will report debug messages as default for the listenTo method.
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
    globalOptions.debug         = !!getOption(options, "debug", false);

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
        stateHandler: stateHandler,
        idHandler: idHandler
    };

    if(desiredStrategy === "scroll") {
        if (browserDetector.isLegacyOpera()) {
            reporter.warn("Scroll strategy is not supported on legacy Opera. Changing to object strategy.");
            desiredStrategy = "object";
        } else if (browserDetector.isIE(9)) {
            reporter.warn("Scroll strategy is not supported on IE9. Changing to object strategy.");
            desiredStrategy = "object";
        }
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
            // TODO: May want to check so that all the elements in the collection are valid elements.
            elements = toArray(elements);
        } else {
            return reporter.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
        }

        var elementsReady = 0;

        var callOnAdd = getOption(options, "callOnAdd", globalOptions.callOnAdd);
        var onReadyCallback = getOption(options, "onReady", function noop() {});
        var debug = getOption(options, "debug", globalOptions.debug);

        forEach(elements, function attachListenerToElement(element) {
            var id = idHandler.get(element);

            debug && reporter.log("Attaching listener to element", id, element);

            if(!elementUtils.isDetectable(element)) {
                debug && reporter.log(id, "Not detectable.");
                if(elementUtils.isBusy(element)) {
                    debug && reporter.log(id, "System busy making it detectable");

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

                debug && reporter.log(id, "Making detectable...");
                //The element is not prepared to be detectable, so do prepare it and add a listener to it.
                elementUtils.markBusy(element, true);
                return detectionStrategy.makeDetectable({ debug: debug }, element, function onElementDetectable(element) {
                    debug && reporter.log(id, "onElementDetectable");

                    elementUtils.markAsDetectable(element);
                    elementUtils.markBusy(element, false);
                    detectionStrategy.addListener(element, onResizeCallback);
                    addListener(callOnAdd, element, listener);

                    // Since the element size might have changed since the call to "listenTo", we need to check for this change,
                    // so that a resize event may be emitted.
                    // Having the startSize object is optional (since it does not make sense in some cases such as unrendered elements), so check for its existance before.
                    if (stateHandler.getState(element).startSize) {
                        var width = element.offsetWidth;
                        var height = element.offsetHeight;
                        if (stateHandler.getState(element).startSize.width !== width || stateHandler.getState(element).startSize.height !== height) {
                            onResizeCallback(element);
                        }
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

            debug && reporter.log(id, "Already detecable, adding listener.");

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

},{"./browser-detector":3,"./collection-utils":4,"./detection-strategy/object.js":5,"./detection-strategy/scroll.js":6,"./element-utils":8,"./id-generator":9,"./id-handler":10,"./listener-handler":11,"./reporter":12,"./state-handler":13,"batch-processor":1}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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
                var f = console[name];
                if (f.apply) { //IE9 does not support console.log.apply :)
                    f.apply(console, arguments);
                } else {
                    for (var i = 0; i < arguments.length; i++) {
                        f(arguments[i]);
                    }
                }
            };
        };

        attachFunction(reporter, "log");
        attachFunction(reporter, "warn");
        attachFunction(reporter, "error");
    }

    return reporter;
};
},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{"lodash._objecttypes":14}],18:[function(require,module,exports){
module.exports={
  "name": "elq",
  "description": "Element queries library. Solution to modular responsive components.",
  "homepage": "https://github.com/elqteam/elq",
  "repository": {
    "type": "git",
    "url": "git://github.com/elqteam/elq.git"
  },
  "version": "0.4.2",
  "private": false,
  "license": "MIT",
  "main": "src/index.js",
  "devDependencies": {
    "grunt": "^0.4.5",
    "grunt-banner": "^0.3.1",
    "grunt-browserify": "^3.3.0",
    "grunt-contrib-jshint": "^0.11.0",
    "grunt-contrib-uglify": "^0.11.0",
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
    "element-resize-detector": "^1.1.0",
    "batch-processor": "^1.0.0",
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

},{}],19:[function(require,module,exports){
"use strict";

var forEach = require("./utils").forEach;

module.exports = function BreakpointStateCalculator(options) {
    var styleResolver = options.styleResolver;
    var reporter = options.reporter;
    var BP_UNITS = {};
    BP_UNITS.PX = "px";
    BP_UNITS.EM = "em";
    BP_UNITS.REM = "rem";

    function elementStyleCache(element) {
        function getElementFontSizeInPixels(element) {
            return parseFloat(styleResolver.getComputedStyle(element).fontSize.replace("px", ""));
        }

        var cache = {};
        return {
            getRootFontSize: function () {
                if (!cache.rootFontSize) {
                    cache.rootFontSize = getElementFontSizeInPixels(document.documentElement);
                }
                return cache.rootFontSize;
            },
            getElementFontSize: function () {
                if (!cache.elementFontSize) {
                    cache.elementFontSize = getElementFontSizeInPixels(element);
                }
                return cache.elementFontSize;
            }
        };
    }

    var breakpointPixelValueConverters = {
        px: function (value) {
            return value;
        },
        em: function (value, elementStyleCache) {
            return value * elementStyleCache.getElementFontSize();
        },
        rem: function (value, elementStyleCache) {
            return value * elementStyleCache.getRootFontSize();
        }
    };

    function parseSize(size) {
        return parseFloat(size.replace(/px/, ""));
    }

    function getBreakpointStates(element, breakpoints) {
        function cloneBreakpoint(bp) {
            var o = {};
            for (var key in bp) {
                if (bp.hasOwnProperty(key)) {
                    o[key] = bp[key];
                }
            }
            return o;
        }

        var style = styleResolver.getComputedStyle(element);
        var width = style.width;
        var height = style.width;

        if (width.indexOf("px") === -1 || height.indexOf("px") === -1) {
            // The style of the element could not be resolved, probably due to it being detached from the DOM or that is unrendered (display: none).
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

        var styleCache = elementStyleCache(element);

        forEach(breakpoints, function (breakpoint) {
            var dimension = breakpoint.dimension;
            var elementValue = dimensionValues[dimension];

            var over = false;
            var under = false;

            // The pixelValue shadows the value attribute, if set.
            var pixelValue;
            if (breakpoint.hasOwnProperty("pixelValue")) {
                pixelValue = breakpoint.pixelValue;
            } else {
                var converter = breakpointPixelValueConverters[breakpoint.type];
                if (!converter) {
                    reporter.error("Converter not found for breakpoint type '" + breakpoint.type + "'.");
                }
                pixelValue = converter(breakpoint.value, styleCache);
            }

            if (elementValue > pixelValue) {
                over = true;
            } else if (elementValue < pixelValue) {
                under = true;
            }

            // The breakpoint output should always have the pixelValue property.
            var computedBreakpoint = cloneBreakpoint(breakpoint);
            computedBreakpoint.pixelValue = pixelValue;

            var breakpointState = {
                breakpoint: computedBreakpoint,
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

},{"./utils":28}],20:[function(require,module,exports){
"use strict";

var Elq = require("../elq");

module.exports = Elq;

},{"../elq":22}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
"use strict";

var packageJson                 = require("../package.json");
var BatchProcessor              = require("batch-processor");
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

module.exports = function Elq(options) {
    options     = options || {};
    var debug   = options.debug;

    var elq                         = {};
    var reporter                    = options.reporter || Reporter();
    var cycleDetection              = options.cycleDetection || false;
    var idGenerator                 = IdGenerator();
    var idHandler                   = IdHandler(idGenerator);
    var cycleDetector               = CycleDetector(idHandler);
    var pluginHandler               = PluginHandler(reporter);
    var styleResolver               = StyleResolver();
    var breakpointStateCalculator   = BreakpointStateCalculator({ styleResolver: styleResolver, reporter: reporter });
    var BatchProcessor              = createBatchProcessorConstructorWithDefaultOptions({ reporter: reporter });
    var batchProcessor              = BatchProcessor();
    var elementResizeDetector       = ElementResizeDetector({ debug: debug, idHandler: idHandler, reporter: reporter, strategy: "scroll", batchProcessor: batchProcessor });

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
        // TODO: The problem with this is that if the order changes, then the hash changes.
        var breakpointStatesHash = JSON.stringify(breakpointStates);

        if (element.elq.currentBreakpointStatesHash !== breakpointStatesHash) {
            if (cycleDetection && element.elq.cycleCheck) {
                if (cycleDetector.isUpdateCyclic(element, breakpointStatesHash)) {
                    reporter.warn("Cyclic rules detected! Breakpoint classes has not been updated. Element: ", element);
                    return;
                }
            }

            element.elq.currentBreakpointStatesHash = breakpointStatesHash;

            if (element.elq.applyBreakpoints || element.elq.serialize) { // elq.serialize is deprecated. Will be removed in 1.0.0
                pluginHandler.callMethods("serializeBreakpointStates", [element, breakpointStates]); // Deprecated. Will be removed in 1.0.0
                pluginHandler.callMethods("applyBreakpointStates", [element, breakpointStates]);
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

    function isCollection(obj) {
        return Array.isArray(obj) || obj.length !== undefined;
    }

    function toArray(collection) {
        if (!Array.isArray(collection)) {
            var array = [];
            forEach(collection, function (e) {
                array.push(e);
            });
            return array;
        } else {
            return collection;
        }
    }

    function isElement(obj) {
        return obj && obj.nodeType === 1;
    }

    function activate(elements) {
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

        var manualBatchProcessor = BatchProcessor({ async: false, auto: false });

        //Before listening to each element (which is a heavy task) it is important to apply the right classes
        //to the elements so that a correct render can occur before the installation.
        forEach(elements, function (element) {
            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, manualBatchProcessor);
            }
        });

        function onElementResizeProxy(element) {
            notifyListeners(element, "resize");

            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, batchProcessor);
            }
        }

        forEach(elements, function listenToLoop(element) {
            if (element.elq.resizeDetection) {
                elementResizeDetector.listenTo({
                    callOnAdd: true // TODO: Shouldn't this be false?
                }, element, onElementResizeProxy);
            }
        });

        //Force everything currently in the batch to execute synchronously.
        //Important that his is done after the listenToLoop since it reads the DOM style and the batch will write to the DOM.
        manualBatchProcessor.force();
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
            if (isCollection(element)) {
                element = element[0]; // To accept jQuery-styled element selector.
            }

            if (!isElement(element)) {
                return reporter.error("Invalid arguments. Element must be a DOM element, or a collection of a DOM element.");
            }

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
    elq.BatchUpdater        = BatchProcessor; // Deprecated. To be removed in 1.0.0
    elq.BatchProcessor      = BatchProcessor;
    elq.pluginHandler       = pluginHandler;

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

function createBatchProcessorConstructorWithDefaultOptions(globalOptions) {
    globalOptions = globalOptions || {};

    function createBatchProcessorOptionsProxy(options) {
        options = options || globalOptions;

        for (var prop in globalOptions) {
            if (globalOptions.hasOwnProperty(prop) && !options.hasOwnProperty(prop)) {
                options[prop] = globalOptions[prop];
            }
        }

        return BatchProcessor(options);
    }

    return createBatchProcessorOptionsProxy;
}

},{"../package.json":18,"./breakpoint-state-calculator":19,"./cycle-detector":21,"./id-generator":23,"./id-handler":24,"./plugin-handler":25,"./reporter":26,"./style-resolver":27,"./utils":28,"batch-processor":1,"element-resize-detector":7}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{"./utils":28,"lodash.isString":15,"lodash.isfunction":16,"lodash.isobject":17}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
"use strict";

module.exports = function StyleResolver() {
    return {
        getComputedStyle: function (element) {
            return window.getComputedStyle(element);
        }
    };
};

},{}],28:[function(require,module,exports){
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

},{}]},{},[20])(20)
});