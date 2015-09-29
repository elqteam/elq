/* global describe:false, it:false, expect:false */

"use strict";

var BreakpointStateCalculator = require("./breakpoint-state-calculator.js");

var styleResolver = {
    getComputedStyle: function (element) {
        return element.style;
    }
};

describe("BreakpointStateCalculator", function () {
    describe("getBreakpointStates", function () {
        it("should calculate breakpoint states correctly", function () {
            var breakpointStateCalculator = BreakpointStateCalculator();

            var breakpoints = [
                {
                    dimension: "width",
                    pixelValue: 200
                },
                {
                    dimension: "width",
                    pixelValue: 300
                },
                {
                    dimension: "width",
                    pixelValue: 400
                }
            ];

            var element = {
                offsetWidth: 300
            };

            var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

            expect(breakpointStates.width.length).toEqual(3)
            expect(breakpointStates.width[0]).toEqual({
                over: true,
                under: false,
                breakpoint: breakpoints[0]
            });
            expect(breakpointStates.width[1]).toEqual({
                over: false,
                under: false,
                breakpoint: breakpoints[1]
            });
            expect(breakpointStates.width[2]).toEqual({
                over: false,
                under: true,
                breakpoint: breakpoints[2]
            });
        });
    });
});
