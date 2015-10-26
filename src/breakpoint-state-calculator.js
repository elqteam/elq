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
