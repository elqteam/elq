"use strict";

var forEach = require("lodash.foreach");

module.exports = function BreakpointStateCalculator() {
    function getBreakpointStates(element, breakpoints) {
        var width = element.offsetWidth;
        var height = element.offsetHeight;

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
