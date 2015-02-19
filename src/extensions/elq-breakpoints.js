"use strict";

var Extension = require("../extension/extension");
var forEach = require("lodash.foreach");
var unique = require("lodash.uniq");

module.exports = BreakpointsExtension;

function BreakpointsExtension() {
    Extension.call(this, "elq-breakpoints");
}

BreakpointsExtension.prototype.start = function(elq, elements) {
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

                classes.push("elq-" + dimension + "-" + dir + "-" + breakpoint);
            });

            return classes;
        }

        var widthBreakpoints = getBreakpoints(element, "width");
        var heightBreakpoints = getBreakpoints(element, "height");

        var width = element.offsetWidth;
        var height = element.offsetHeight;

        var widthClasses = getClasses(widthBreakpoints, "width", width);
        var heightClasses = getClasses(heightBreakpoints, "height", height);
        var classesString = widthClasses.join(" ") + " " + heightClasses.join(" ");

        var classes = element.className;

        //Remove all old breakpoints.
        classes = classes.replace(/elq-(width|height)-[a-z]+-[0-9]+/g, "");

        //Add new classes
        classes += " " + classesString;

        //Format classes before putting it in.
        classes = classes.replace(/\s+/g, " ").trim();

        element.className = classes;
    }

    forEach(elements, function(element) {
        if(element.hasAttribute("elq-breakpoints")) {
            elq.listenTo(element, onElementResize);
            onElementResize(element);
        }
    });
};
