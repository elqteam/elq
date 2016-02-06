"use strict";

var packageJson = require("../../../package.json"); // In the future this plugin might be broken out to an independent repo. For now it has the same version number as elq.
var elementUtils = require("../../element-utils.js");

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
        function mirror(mirrorElement, targetElement) {
            // Mirror applyBreakpointStates overrides any applyBreakpointStates since a mirror element may have breakpoints as well (that doesn't get applied).
            // Therefore, applyBreakpointStates must be disable for mirror elements.
            mirrorElement.elq.applyBreakpoints = false;

            if (mirrorElement.elq.mirror) {
                // This element is already mirroring an element.

                if (mirrorElement.elq.mirror.targetId === targetElement.elq.id) {
                    // It is the same object, do nothing.
                    return;
                } else {
                    // A new object is to be mirrored. This is currently unsupported, but shall probably be supported in the future.
                    elq.reporter.error("Cannot change mirror target.", mirrorElement);
                }
            }

            mirrorElement.elq.mirror = {
                targetId: targetElement.elq.id
            };

            elq.listenTo(targetElement, "breakpointStatesChanged", function mirrorNewBreakpointStates(targetElement, newBreakpointStates) {
                elq.pluginHandler.callMethods("applyBreakpointStates", [mirrorElement, newBreakpointStates]);
            });
        }

        function activate(element) {
            function getElqParentElement(mirrorElement) {
                var currentElement = mirrorElement.parentNode;

                while (currentElement && currentElement.hasAttribute) {
                    if (elementUtils.hasAttribute(currentElement, "elq-breakpoints")) {
                        return currentElement;
                    }

                    currentElement = currentElement.parentNode;
                }

                //If this is reached, it means that there was no elq-breakpoints parent found.
                elq.reporter.error("Mirror elements require an elq-breakpoints ancestor. This error can probably be resolved by making body an elq-breakpoints element. Error caused by mirror element:", mirrorElement);
            }

            if (!elementUtils.hasAttribute(element, "elq-mirror")) {
                return;
            }

            var breakpointElement = getElqParentElement(element);

            mirror(element, breakpointElement);
        }

        return {
            activate: activate,
            mirror: mirror
        };
    }
};
