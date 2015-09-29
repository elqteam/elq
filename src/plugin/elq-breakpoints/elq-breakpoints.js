"use strict";

var packageJson = require("../../../package.json");
var BreakpointsParser = require("./breakpoint-parser.js");
var StyleResolver = require("../../style-resolver.js"); // TODO: Not nice that this is fetching out of own structure like this.

module.exports = {
    getName: function () {
        return "elq-breakpoints";
    },
    getVersion: function () {
        return packageJson.version;
    },
    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq, options) {
        var styleResolver       = StyleResolver();
        var breakpointsParser   = BreakpointsParser({
            defaultUnit: options.defaultUnit,
            reporter: elq.reporter,
            styleResolver: styleResolver
        });

        function start(element) {
            if (!element.hasAttribute("elq-breakpoints")) {
                return;
            }

            // All elq-breakpoints elements need to detect resizes and also update breakpoints.
            element.elq.resizeDetection = true;
            element.elq.updateBreakpoints = true;
        }

        function getBreakpoints(element) {
            return breakpointsParser.parseBreakpoints(element);
        }

        return {
            start: start,
            getBreakpoints: getBreakpoints
        };
    }
};
