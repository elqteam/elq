"use strict";

var forEach = require("../../utils").forEach;

module.exports = function BreakpointStateApplyer() {
    function applyBreakpointStates(element, breakpointStates) {
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
        applyBreakpointStates: applyBreakpointStates
    };
};
