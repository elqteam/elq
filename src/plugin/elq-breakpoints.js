"use strict";

var forEach = require("lodash.foreach");
var unique = require("lodash.uniq");
var filter = require("lodash.filter");

var BP_UNITS = {};
BP_UNITS.PX = "px";
BP_UNITS.EM = "em";
BP_UNITS.REM = "rem";

function isUnitTypeValid(val) {
    for(var prop in BP_UNITS) {
        if(BP_UNITS.hasOwnProperty(prop) && BP_UNITS[prop] === val) {
            return true;   
        }
    }
    return false;
}

module.exports = {
    getName: function() {
        return "elq-breakpoints";
    },
    getVersion: function() {
        return "0.1.0";
    },
    isCompatible: function() {
        return true; //TODO: Check elq version.
    },
    make: function(elq, globalOptions) {
        globalOptions.defaultUnit   = globalOptions.defaultUnit || "px";
        var reporter                = elq.reporter;
        var idHandler               = elq.idHandler;
        var cycleDetector           = elq.cycleDetector;
        var batchUpdater            = elq.createBatchUpdater();

        var elementBreakpointsListeners = {};
        var currentElementBreakpointClasses = {};

        if(!isUnitTypeValid(globalOptions.defaultUnit)) {
            reporter.error("The given default unit is not recognized: ", globalOptions.defaultUnit); 
        }

        function start(elements) {
            function onElementResize(batchUpdater, element) {
                //Read breakpoints by the format elq-breakpoints-widths="px300 500em 200 ...".
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

                    function getElementFontSize(element) {
                        return parseFloat(getComputedStyle(element).fontSize);
                    }

                    var breakpointPixelValueConverters = [];

                    breakpointPixelValueConverters[BP_UNITS.PX] = function(value) {
                        return value;
                    }

                    var cachedRootFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times
                    breakpointPixelValueConverters[BP_UNITS.REM] = function(value) {
                        function getRootElementFontSize() {
                            if(!cachedRootFontSize) {
                                cachedRootFontSize = getElementFontSize(document.documentElement);
                            }
                            return cachedRootFontSize;
                        }
                        function remValToPxVal() {
                            return value * getRootElementFontSize();
                        }
                        return remValToPxVal();
                    }

                    var cachedElementFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times
                    breakpointPixelValueConverters[BP_UNITS.EM] = function(value) {
                        function emValToPxVal() {
                            if(!cachedElementFontSize) {
                                cachedElementFontSize = getElementFontSize(element);
                            }
                            return value * cachedElementFontSize;
                        }
                        return emValToPxVal();
                    }

                    function getFromMainAttr(element, dimension) {
                        var breakpoints = element.getAttribute("elq-breakpoints-" + dimension + "s");

                        if(!breakpoints) {
                            return [];
                        }

                        breakpoints = breakpoints.replace(/\s+/g, " ").trim();
                        breakpoints = breakpoints.split(" ");

                        breakpoints = breakpoints.map( function(breakpointString) {
                            var valueMatch = breakpointString.match(/^([0-9]+)/g); 
                            // a breakpoint value must exist
                            if(!valueMatch) {
                                reporter.error("Elq breakpoint found with invalid input value: ", breakpointString);
                            }

                            var unitMatch = breakpointString.match(/([a-zA-Z]+)$/g); // the unit is allowed to be omitted
                            var unit =  (unitMatch) ? unitMatch[0] : globalOptions.defaultUnit;

                            if(!isUnitTypeValid(unit)) {
                                reporter.error("Elq breakpoint found with invalid unit: ", unit); 
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
                        return breakpoints.sort(function(bp1, bp2) {
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

                    if(!breakpoints.length) {
                        return classes;
                    }

                    breakpoints.forEach(function(breakpoint) {
                        var dir = "max";

                        if(value >= breakpoint.valuePx) {
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
                var options = getOptions(element);

                batchUpdater.update(id, function mutateElementBreakpointClasses() {
                    if(currentElementBreakpointClasses[id] !== breakpointClasses) {
                        if(cycleDetector.isUpdateCyclic(element, breakpointClasses)) {
                            reporter.warn("Cyclic rules detected! Breakpoint classes has not been updated. Element: ", element);
                            return;
                        }

                        if(!options.noclasses) {
                            updateBreakpointClasses(element, breakpointClasses);
                        }

                        currentElementBreakpointClasses[id] = breakpointClasses;
                        forEach(elementBreakpointsListeners[id], function(listener) {
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
            var manualBatchUpdater = elq.createBatchUpdater({ async: false, auto: false });
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

        function getOptions(element) {
            var options = {};

            var optionsString = element.getAttribute("elq-breakpoints") || "";
            optionsString = optionsString.toLowerCase();

            options.noclasses =  !!~optionsString.indexOf("noclasses");

            return options;
        }

        return {
            start: start,
            listenToElementBreakpoints: listenToElementBreakpoints,
            getBreakpointClasses: getBreakpointClasses,
            updateBreakpointClasses: updateBreakpointClasses
        };
    }
};
