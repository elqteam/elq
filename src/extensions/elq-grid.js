"use strict";

var Extension = require("../extension/extension");
var forEach = require("lodash.foreach");

module.exports = GridExtension;

function GridExtension() {
    Extension.call(this, "elq-grid");
}

GridExtension.prototype.start = function(elq, elements) {
    function onElementResize(element) {
        function getAttributeOrDefault(attr, defaultValue) {
            return element.hasAttribute(attr) ? parseInt(element.getAttribute(attr)) : defaultValue;
        }

        function calculateBreakpoints(value, min, max, step, msg) {
            var lowerBreakpoint = false;
            var higherBreakpoint = false;

            if(value >= min && value < max) {
                //In breakpoint range.
                lowerBreakpoint = ((value / step) | 0) * step;
                higherBreakpoint = lowerBreakpoint + step;
            }

            return {
                lower: lowerBreakpoint,
                higher: higherBreakpoint
            };
        }

        var minWidth = getAttributeOrDefault("elq-width-min", 0);
        var maxWidth = getAttributeOrDefault("elq-width-max", Infinity);
        var stepWidth = getAttributeOrDefault("elq-width-step", 50);

        var minHeight = getAttributeOrDefault("elq-height-min", 0);
        var maxHeight = getAttributeOrDefault("elq-height-max", Infinity);
        var stepHeight = getAttributeOrDefault("elq-height-step", 50);

        var width = element.offsetWidth;
        var height = element.offsetHeight;

        var widthBreakpoints = calculateBreakpoints(width, minWidth, maxWidth, stepWidth, "width");
        var heightBreakpoints = calculateBreakpoints(height, minHeight, maxHeight, stepHeight, "height");

        var classes = element.className;

        //Remove all old breakpoints.
        classes = classes.replace(/elq-(width|height)-[a-z]+-[0-9]+/g, "");

        //Add current breakpoints.
        if(widthBreakpoints.lower) {
            classes += " elq-width-above-" + widthBreakpoints.lower;
        }

        if(widthBreakpoints.higher) {
            classes += " elq-width-under-" + widthBreakpoints.higher;
        }

        if(heightBreakpoints.lower) {
            classes += " elq-height-above-" + heightBreakpoints.lower;
        }

        if(heightBreakpoints.higher) {
            classes += " elq-height-under-" + heightBreakpoints.higher;
        }

        element.className = classes;
    }

    forEach(elements, function(element) {
        if(element.hasAttribute("elq-breakpoints")) {
            elq.listenTo(element, onElementResize);
            onElementResize(element);
        }
    });
};
