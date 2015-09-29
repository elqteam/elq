"use strict";

var packageJson = require("../../../package.json"); // In the future this plugin might be broken out to an independent repo. For now it has the same version number as elq.

module.exports = {
    getName: function () {
        return "elq-mirror";
    },
    getVersion: function () {
        return packageJson.version;
    },

    isCompatible: function (elq) {
        return true; // Since this plugin lives in the elq repo, it is assumed to always be compatible.
    },
    make: function (elq) {
        function start(element) {
            function getElqParentElement(mirrorElement) {
                var currentElement = mirrorElement.parentNode;

                while (currentElement && currentElement.hasAttribute) {
                    if (currentElement.hasAttribute("elq-breakpoints")) {
                        return currentElement;
                    }

                    currentElement = currentElement.parentNode;
                }

                //If this is reached, it means that there was no elq-breakpoints parent found.
                elq.reporter.error("Mirror elements require an elq-breakpoints ancestor. This error can probably be resolved by making body an elq-breakpoints element. Error caused by mirror element:", mirrorElement);
            }

            if (!element.hasAttribute("elq-mirror")) {
                return;
            }

            if (element.hasAttribute("elq-breakpoints")) {
                // An element can be a mirror and a breakpoints element at the same time, but then the mirror serialization overrides the breakpoints serialization.
                // Therefore, serialization must be disable for such elements.
                element.elq.serialize = false;
            }

            var breakpointElement = getElqParentElement(element);

            elq.listenTo(breakpointElement, "breakpointStatesChanged", function mirrorNewBreakpointStates(breakpointElement, newBreakpointStates) {
                elq.pluginHandler.callMethods("serializeBreakpointStates", [element, newBreakpointStates]);
            });
        }

        return {
            start: start
        };
    }
};
