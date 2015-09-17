"use strict";

var packageJson = require("../../package.json"); // In the future this plugin might be broken out to an independent repo. For now it has the same version number as elq.
var forEach = require("lodash.foreach");
var unique = require("lodash.uniq");
var filter = require("lodash.filter");

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

module.exports = {
    getName: function () {
        return "elq-breakpoints";
    },
    getVersion: function () {
        return packageJson.version;
    },
    isCompatible: function (elq) {
        var versionParts = elq.getVersion().split(".");
        var lesser = parseInt(versionParts[1]);
        return lesser >= 3;
    },
    make: function (elq, options) {
        var cycleDetector           = elq.cycleDetector;
        var reporter                = elq.reporter;
        var idHandler               = elq.idHandler;
        var batchUpdater            = elq.BatchUpdater();

        var defaultUnit             = options.defaultUnit || "px";
        var cycleDetection          = !!cycleDetector; // Default is 'true' when there's a cycleDetector available.

        if (!isUnitTypeValid(defaultUnit)) {
            reporter.error("Invalid default unit: " + defaultUnit);
        }

        if (options.cycleDetection !== undefined) {
            if (options.cycleDetection && !cycleDetector) {
                reporter.error("Elq's cycleDetector subsystem is required when option cycleDetection is enabled.");
            }
            cycleDetection = !!options.cycleDetection;
        }

        var elementBreakpointsListeners = {};
        var currentElementBreakpointClasses = {};

        function start(elements) {
            function onElementResize(batchUpdater, element) {
                //Read breakpoints by the format elq-breakpoints-widths="300px 500em 200rem 100 ...".
                function getBreakpoints(element, dimension) {
                    function Breakpoint(string, value, valuePx, unit, element) {
                        var bp = {};
                        bp.string = string; // Can be either just value as a string or value + unit
                        bp.value = value;
                        bp.valuePx = valuePx;
                        bp.unit = unit;
                        bp.element = element;
                        return bp;
                    }

                    function getElementFontSizeInPixels(element) {
                        return parseFloat(getComputedStyle(element).fontSize.replace("px", ""));
                    }

                    var breakpointPixelValueConverters = {};

                    breakpointPixelValueConverters[BP_UNITS.PX] = function (value) {
                        return value;
                    };

                    var cachedRootFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times for the same resize of this element.
                    breakpointPixelValueConverters[BP_UNITS.REM] = function (value) {
                        function getRootElementFontSize() {
                            if (!cachedRootFontSize) {
                                cachedRootFontSize = getElementFontSizeInPixels(document.documentElement);
                            }
                            return cachedRootFontSize;
                        }
                        return value * getRootElementFontSize();
                    };

                    var cachedElementFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times for the same resize of this element.
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
                        var breakpoints = element.getAttribute("elq-breakpoints-" + dimension + "s");

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

                            return Breakpoint(breakpointString, value, valuePx, unit, element);
                        });
                        return breakpoints;
                    }

                    function uniqueBreakpoints(breakpoints) {
                        return unique(breakpoints, function uniqueFunction(bp) {
                            // Can not simply take breakpoint.string since unit is allowed to be omitted
                            return bp.value + bp.unit;
                        });
                    }

                    function sortBreakpoints(breakpoints) {
                        return breakpoints.sort(function (bp1, bp2) {
                            return bp1.valuePx - bp2.valuePx;
                        });
                    }

                    var breakpoints = getFromMainAttr(element, dimension);
                    breakpoints = uniqueBreakpoints(breakpoints);
                    // Sort for the visual aspect of having the classes in order in the html
                    breakpoints = sortBreakpoints(breakpoints);
                    return breakpoints;
                }

                function getClasses(breakpoints, dimension, value) {
                    var classes = [];

                    if (!breakpoints.length) {
                        return classes;
                    }

                    breakpoints.forEach(function (breakpoint) {
                        var dir = "max";

                        if (value >= breakpoint.valuePx) {
                            dir = "min";
                        }

                        classes.push("elq-" + dir + "-" + dimension + "-" + breakpoint.value + breakpoint.unit);
                    });

                    return classes;
                }

                var widthBreakpoints = getBreakpoints(element, "width");
                var heightBreakpoints = getBreakpoints(element, "height");

                var width = element.offsetWidth;
                var height = element.offsetHeight;

                var widthClasses = getClasses(widthBreakpoints, "width", width);
                var heightClasses = getClasses(heightBreakpoints, "height", height);
                var breakpointClasses = widthClasses.join(" ") + " " + heightClasses.join(" ");

                var id = idHandler.get(element);
                var elementOptions = getElementOptions(element);

                batchUpdater.update(id, function mutateElementBreakpointClasses() {
                    if (currentElementBreakpointClasses[id] !== breakpointClasses) {
                        if (cycleDetection && !elementOptions.notcyclic && cycleDetector.isUpdateCyclic(element, breakpointClasses)) {
                            reporter.warn("Cyclic rules detected! Breakpoint classes has not been updated. Element: ", element);
                            return;
                        }

                        if (!elementOptions.noclasses) {
                            updateBreakpointClasses(element, breakpointClasses);
                        }

                        currentElementBreakpointClasses[id] = breakpointClasses;
                        forEach(elementBreakpointsListeners[id], function (listener) {
                            listener(element);
                        });
                    }
                });
            }

            elements = filter(elements, function filterElements(element) {
                return element.hasAttribute("elq-breakpoints");
            });

            //Before listening to each element (which is a heavy task) it is important to apply the right classes
            //to the elements so that a correct render can occur before all objects are injected to the elements.
            var manualBatchUpdater = elq.BatchUpdater({ async: false, auto: false });
            forEach(elements, function onElementResizeLoop(element) {
                onElementResize(manualBatchUpdater, element);
            });

            function onElementResizeProxy(element) {
                return onElementResize(batchUpdater, element);
            }

            forEach(elements, function listenToLoop(element) {
                elq.listenTo({
                    callOnAdd: true,
                    batchUpdater: batchUpdater
                }, element, onElementResizeProxy);
            });

            //Force everything currently in the batch to execute synchronously.
            //Important that his is done after the listenToLoop since it reads the DOM style and the batch will write the DOM.
            manualBatchUpdater.force();
        }

        function listenToElementBreakpoints(element, callback) {
            var id = idHandler.get(element);

            elementBreakpointsListeners[id] = elementBreakpointsListeners[id] || [];
            elementBreakpointsListeners[id].push(callback);
        }

        function getBreakpointClasses(element) {
            var id = idHandler.get(element);
            return currentElementBreakpointClasses[id];
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

        function getElementOptions(element) {
            var elementOptions = {};

            var elementOptionsString = element.getAttribute("elq-breakpoints") || "";
            elementOptionsString = elementOptionsString.toLowerCase();

            elementOptions.noclasses = !!~elementOptionsString.indexOf("noclasses");
            elementOptions.notcyclic = !!~elementOptionsString.indexOf("notcyclic");

            return elementOptions;
        }

        return {
            start: start,
            listenToElementBreakpoints: listenToElementBreakpoints,
            getBreakpointClasses: getBreakpointClasses,
            updateBreakpointClasses: updateBreakpointClasses
        };
    }
};
