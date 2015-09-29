"use strict";

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

module.exports = function BreakpointParser(options) {
    options = options || {};
    var reporter = options.reporter;
    var defaultUnit = options.defaultUnit;
    var styleResolver = options.styleResolver;

    function parseBreakpoints(element) {
        function getBreakpoints(element, dimension) {
            function getElementFontSizeInPixels(element) {
                return parseFloat(styleResolver.getComputedStyle(element).fontSize.replace("px", ""));
            }

            var breakpointPixelValueConverters = {};

            breakpointPixelValueConverters[BP_UNITS.PX] = function (value) {
                return value;
            };

            var cachedRootFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times for the same element.
            breakpointPixelValueConverters[BP_UNITS.REM] = function (value) {
                function getRootElementFontSize() {
                    if (!cachedRootFontSize) {
                        cachedRootFontSize = getElementFontSizeInPixels(document.documentElement);
                    }
                    return cachedRootFontSize;
                }
                return value * getRootElementFontSize();
            };

            var cachedElementFontSize; // to avoid unnecessarily asking the DOM for the font-size multiple times for the same element.
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

                    return {
                        dimension: dimension,
                        pixelValue: valuePx,
                        value: value,
                        type: unit
                    };
                });

                return breakpoints;
            }

            var breakpoints = getFromMainAttr(element, dimension);
            return breakpoints;
        }

        var widthBreakpoints = getBreakpoints(element, "width");
        var heightBreakpoints = getBreakpoints(element, "height");

        return widthBreakpoints.concat(heightBreakpoints);
    }

    return {
        parseBreakpoints: parseBreakpoints
    };
};
