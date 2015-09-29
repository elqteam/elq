"use strict";

var packageJson = require("../../../package.json");
var BreakpointStateSerializer = require("./breakpoint-state-serializer.js");
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
        var breakpointSerializer = BreakpointStateSerializer();

        function serializeBreakpointStates(element, breakpointStates, options) {
            if (!options.noclasses) {
                breakpointSerializer.serializeBreakpointStates(element, breakpointStates);
            }
        }

        return {
            serializeBreakpointStates: serializeBreakpointStates
        };
    }
};
