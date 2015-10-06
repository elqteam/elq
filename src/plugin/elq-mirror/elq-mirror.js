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
        function mirrorElement(mirrorElement, targetElement) {
            //TODO: This should be made more general. Perhaps another breakpoint-parsing plugin is being used.
            if (mirrorElement.hasAttribute("elq-breakpoints")) {
                // An element can be a mirror and a breakpoints element at the same time, but then the mirror serialization overrides the breakpoints serialization.
                // Therefore, serialization must be disable for such elements.
                mirrorElement.elq.serialize = false;
            }

            elq.listenTo(targetElement, "breakpointStatesChanged", function mirrorNewBreakpointStates(targetElement, newBreakpointStates) {
                elq.pluginHandler.callMethods("serializeBreakpointStates", [mirrorElement, newBreakpointStates]);
            });
        }

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

            var breakpointElement = getElqParentElement(element);

            mirrorElement(element, breakpointElement);
        }

        return {
            start: start,
            mirror: mirrorElement
        };
    }
};
