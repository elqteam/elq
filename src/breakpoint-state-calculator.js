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

            var equal = false;
            var above = false;
            var under = false;

            if (breakpoint.pixelValue > elementValue) {
                above = true;
            } else if (breakpoint.pixelValue < elementValue) {
                under = true;
            } else {
                equal = true;
            }

            var breakpointState = {
                breakpoint: breakpoint,
                equal: equal,
                above: above,
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
