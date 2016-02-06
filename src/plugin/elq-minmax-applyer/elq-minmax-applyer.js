"use strict";

var packageJson = require("../../../package.json");
var BreakpointStateApplyer = require("./breakpoint-state-applyer.js");
var StyleResolver = require("../../style-resolver.js"); // TODO: Not nice that this is fetching out of own structure like this.

module.exports = {
    getName: function () {
        return "elq-minmax-classes";
    },
    getVersion: function () {
        return packageJson.version;
    },
    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq, options) {
        var breakpointApplyer = BreakpointStateApplyer();

        function applyBreakpointStates(element, breakpointStates) {
            breakpointApplyer.applyBreakpointStates(element, breakpointStates);
        }

        return {
            applyBreakpointStates: applyBreakpointStates
        };
    }
};
