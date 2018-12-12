"use strict";

var packageJson = require("../../../package.json"); // In the future this plugin might be broken out to an independent repo. For now it has the same version number as elq.
var elementUtils = require("../../element-utils.js");

module.exports = {
    getName: function () {
        return "elq-resize";
    },
    getVersion: function () {
        return packageJson.version;
    },
    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq) {
        function activate(element) {
            if (!elementUtils.hasAttribute(element, "elq-resize")) {
                return;
            }

            // This is a very simple plugin indeed, it simply activates the element resize detection.
            element.elq.resizeDetection = true;
        }

        return {
            activate: activate
        };
    }
};
