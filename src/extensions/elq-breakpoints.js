"use strict";

var forEach = require("lodash.foreach");
var unique = require("lodash.uniq");
var filter = require("lodash.filter");

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
        globalOptions           = globalOptions || {};
        globalOptions.postfix   = globalOptions.postfix || "";
        var reporter            = elq.reporter;
        var idHandler           = elq.idHandler;
        var cycleDetector       = elq.cycleDetector;
        var batchUpdater        = elq.createBatchUpdater();

        var elementBreakpointsListeners = {};
        var currentElementBreakpointClasses = {};

        function start(elements) {
            function onElementResize(batchUpdater, element) {
                function getAttributeOrDefault(attr, defaultValue) {
                    return element.hasAttribute(attr) ? parseInt(element.getAttribute(attr)) : defaultValue;
                }

                //can either be in the attribute elq-breakpoints-width="300 500 ..." or in the elq-width-min, elq-width-max, elq-width-step or both.
                function getBreakpoints(element, dimension) {
                    function getFromMainAttr(element, dimension) {
                        var breakpoints = element.getAttribute("elq-breakpoints-" + dimension);

                        if(!breakpoints) {
                            return [];
                        }

                        breakpoints = breakpoints.replace(/\s+/g, " ").trim();
                        breakpoints = breakpoints.split(" ");
                        return breakpoints.map(function(value) {
                            return parseInt(value, 10);
                        });
                    }

                    function getFromMinMaxStep(element, dimension) {
                        var min = getAttributeOrDefault("elq-" + dimension + "-min", null);
                        var max = getAttributeOrDefault("elq-" + dimension + "-max", null);
                        var step = getAttributeOrDefault("elq-" + dimension + "-step", 50);

                        var breakpoints = [];

                        if(!min) {
                            return breakpoints;
                        }

                        if(!max) {
                            throw new Error("Max needs to be defined.");
                        }

                        if(!step) {
                            throw new Error("Step needs to be defined.");
                        }

                        for(var i = min; i <= max; i += step) {
                            breakpoints.push(i);
                        }

                        return breakpoints;
                    }

                    var breakpoints = [];
                    breakpoints = breakpoints.concat(getFromMainAttr(element, dimension));
                    breakpoints = breakpoints.concat(getFromMinMaxStep(element, dimension));
                    breakpoints = unique(breakpoints);
                    breakpoints = breakpoints.sort(function(a, b) {
                        return a - b;
                    });
                    return breakpoints;
                }

                function getClasses(breakpoints, dimension, value) {
                    var classes = [];

                    if(!breakpoints.length) {
                        return classes;
                    }

                    breakpoints.forEach(function(breakpoint) {
                        var dir = "under";

                        if(value >= breakpoint) {
                            dir = "above";
                        }

                        classes.push("elq-" + dimension + "-" + dir + "-" + breakpoint + globalOptions.postfix);
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
            var breakpointRegexp = new RegExp("elq-(width|height)-[a-z]+-[0-9]+" + globalOptions.postfix, "g");
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
