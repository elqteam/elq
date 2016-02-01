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
