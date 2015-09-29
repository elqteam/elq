"use strict";

var packageJson = require("../../package.json"); // In the future this plugin might be broken out to an independent repo. For now it has the same version number as elq.
var forEach = require("lodash.forEach");
var partial = require("lodash.partial");

var elqBreakpointsPlugin = require("./elq-breakpoints/elq-breakpoints.js");

module.exports = {
    getName: function () {
        return "elq-mirror";
    },
    getVersion: function () {
        return packageJson.version;
    },

    isCompatible: function (elq) {
        var versionParts = elq.getVersion().split(".");
        var lesser = parseInt(versionParts[1]);
        return lesser >= 3;
    },
    make: function (elq) {
        function start(elements) {
            var elqBreakpoints = elq.getPlugin(elqBreakpointsPlugin);

            function getElqParentElement(mirrorElement) {
                var currentElement = mirrorElement.parentNode;

                while (currentElement && currentElement.hasAttribute) {
                    if (currentElement.hasAttribute("elq-breakpoints")) {
                        return currentElement;
                    }

                    currentElement = currentElement.parentNode;
                }

                //If this is reached, it means that there was not elq-breakpoints parent found.
                elq.reporter.error("Mirror elements require an elq-breakpoints ancestor. This error can probably be resolved by making body and elq-breakpoints element. Error caused by mirror element:", mirrorElement);
                throw new Error("Mirror elements require an elq-breakpoints ancestor.");
            }

            function mirrorBreakpointClasses(destinationElement, sourceElement) {
                var breakpointClasses = elqBreakpoints.getBreakpointClasses(sourceElement);
                breakpointClasses = breakpointClasses.replace(/\s+/g, " ").trim();
                elqBreakpoints.updateBreakpointClasses(destinationElement, breakpointClasses);
            }

            if (!elqBreakpoints) {
                throw new Error("The elq-mirror plugin requires the elq-breakpoints plugin.");
            }

            forEach(elements, function (mirrorElement) {
                if (mirrorElement.hasAttribute("elq-mirror")) {
                    var sourceElement = getElqParentElement(mirrorElement);

                    if (!sourceElement) {
                        throw new Error("There is no parent elq-breakpoints element to mirror.");
                    }

                    elqBreakpoints.listenToElementBreakpoints(sourceElement, partial(mirrorBreakpointClasses, mirrorElement));
                    mirrorBreakpointClasses(mirrorElement, sourceElement);
                }
            });
        }

        return {
            start: start
        };
    }
};
