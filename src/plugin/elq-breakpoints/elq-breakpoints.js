"use strict";

var constants = require("../../constants");
var BreakpointsParser = require("./breakpoint-parser.js");
var StyleResolver = require("../../style-resolver.js"); // TODO: Not nice that this is fetching out of own structure like this.
var elementUtils = require("../../element-utils.js");

module.exports = {
    getName: function () {
        return "elq-breakpoints";
    },
    getVersion: function () {
        return constants.version;
    },
    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq, options) {
        var styleResolver       = StyleResolver();
        var breakpointsParser   = BreakpointsParser({
            defaultUnit: options.defaultUnit,
            reporter: elq.reporter,
            styleResolver: styleResolver,
            elementUtils: elementUtils
        });

        function activate(element) {
            if (!elementUtils.hasAttribute(element, "elq-breakpoints")) {
                return;
            }

            // All elq-breakpoints elements need to detect resizes and also update breakpoints.
            element.elq.resizeDetection = true;
            element.elq.updateBreakpoints = true;

            // Enable applyBreakpoints unless some other system explicitly has disabled it.
            if (element.elq.applyBreakpoints !== false) {
                element.elq.applyBreakpoints = true;
            }

            if (elementUtils.getAttribute(element, "elq-breakpoints").indexOf("notcyclic") !== -1) {
                element.elq.cycleCheck = false;
            } else {
                // Enable cycle check unless some other system explicitly has disabled it.
                if (element.elq.cycleCheck !== false) {
                    element.elq.cycleCheck = true;
                }
            }
        }

        function getBreakpoints(element) {
            return breakpointsParser.parseBreakpoints(element);
        }

        return {
            activate: activate,
            getBreakpoints: getBreakpoints
        };
    }
};
