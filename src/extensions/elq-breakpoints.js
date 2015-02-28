"use strict";

var Extension = require("../extension/extension");
var forEach = require("lodash.foreach");
var unique = require("lodash.uniq");
var filter = require("lodash.filter");

module.exports = BreakpointsExtension;

function BreakpointsExtension() {
    Extension.call(this, "elq-breakpoints");

    this.config = {};
    this.config.postfix = "";

    this.elementBreakpointsListeners = {};
    this.previousElementBreakpointClasses = {};
}

BreakpointsExtension.prototype.start = function(elq, elements) {
    var self = this;

    function onElementResize(element) {
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

                classes.push("elq-" + dimension + "-" + dir + "-" + breakpoint + self.config.postfix);
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

        if(self.previousElementBreakpointClasses[getId(element)] !== breakpointClasses) {
            self.updateBreakpointClasses(element, breakpointClasses);
            self.previousElementBreakpointClasses[getId(element)] = breakpointClasses;
            forEach(self.elementBreakpointsListeners[getId(element)], function(listener) {
                listener(element);
            });
        }
    }

    forEach(elements, function(element) {
        if(element.hasAttribute("elq-breakpoints")) {
            elq.listenTo(element, onElementResize);
            onElementResize(element);
        }
    });
};

BreakpointsExtension.prototype.listenToElementBreakpoints = function(element, callback) {
    var id = getId(element);

    this.elementBreakpointsListeners[id] = this.elementBreakpointsListeners[id] || [];
    this.elementBreakpointsListeners[id].push(callback);
};

BreakpointsExtension.prototype.setConfig = function(config) {
    config = config || {};
    this.config.postfix = config.postfix || "";
};

BreakpointsExtension.prototype.getBreakpointClasses = function(element) {
    var classes = element.className;
    classes = classes.replace(/\s+/g, " ").trim();
    classes = classes.split(" ");

    return filter(classes, function(className) {
        return className.indexOf("elq-") === 0;
    });
};

BreakpointsExtension.prototype.updateBreakpointClasses = function updateElementClasses(element, breakpointClasses) {
    var classes = element.className;

    //Remove all old breakpoints.
    var breakpointRegexp = new RegExp("elq-(width|height)-[a-z]+-[0-9]+" + this.config.postfix, "g");
    classes = classes.replace(breakpointRegexp, "");

    //Add new classes
    classes += " " + breakpointClasses;

    //Format classes before putting it in.
    classes = classes.replace(/\s+/g, " ").trim();

    element.className = classes;
};

function getId(element, noThrow) {
    var id = element.getAttribute("elq-target-id");

    if(!noThrow && !id) {
        throw new Error("Element must be an ELQ element.");
    }

    return id;
}
