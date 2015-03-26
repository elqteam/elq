"use strict";

var Extension = require("../extension/extension");
var forEach = require("lodash.forEach");

module.exports = MirrorExtension;

function MirrorExtension() {
    Extension.call(this, "elq-mirror");
}

MirrorExtension.prototype.start = function(elq, elements) {
    var elqBreakpoints = elq.getExtension("elq-breakpoints");

    function getElqParentElement(mirrorElement) {
        var currentElement = mirrorElement.parentNode;

        while(currentElement && currentElement.hasAttribute) {
            if(currentElement.hasAttribute("elq-breakpoints")) {
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
        breakpointClasses = breakpointClasses.join(" ");
        breakpointClasses = breakpointClasses.replace(/\s+/g, " ").trim();
        elqBreakpoints.updateBreakpointClasses(destinationElement, breakpointClasses);
    }

    if(!elqBreakpoints) {
        throw new Error("The elq-mirror extension requires the elq-breakpoints extension.");
    }

    forEach(elements, function(mirrorElement) {
        if(mirrorElement.hasAttribute("elq-mirror")) {
            var sourceElement = getElqParentElement(mirrorElement);

            if(!sourceElement) {
                throw new Error("There is no parent elq-breakpoints element to mirror.");
            }

            elqBreakpoints.listenToElementBreakpoints(sourceElement, mirrorBreakpointClasses.bind(null, mirrorElement));
            mirrorBreakpointClasses(mirrorElement, sourceElement);
        }
    });
};
