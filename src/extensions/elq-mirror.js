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

        while(currentElement) {
            if(currentElement.hasAttribute("elq-breakpoints")) {
                return currentElement;
            }

            currentElement = currentElement.parentNode;
        }
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
