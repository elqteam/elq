/* global describe:false, it:false, expect:false */

"use strict";

var BreakpointStateCalculator = require("./breakpoint-state-calculator.js");

var styleResolver = {
    getComputedStyle: function (element) {
        if (element.tagName === "HTML") {
            return {
                fontSize: "22px"
            };
        }
        return element.style;
    }
};

describe("BreakpointStateCalculator", function () {
    describe("getBreakpointStates", function () {
        it("should calculate breakpoint states correctly with pixelValue", function () {
            var breakpointStateCalculator = BreakpointStateCalculator({
                styleResolver: styleResolver
            });
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
                style: {
                    width: "300px",
                    height: "0px"
                }
            };

            var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

            expect(breakpointStates.width.length).toEqual(3);
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

        it("should calculate breakpoint states correctly for different types", function () {
            var breakpointStateCalculator = BreakpointStateCalculator({
                styleResolver: styleResolver
            });

            var breakpoints = [
                {
                    dimension: "width",
                    value: 200,
                    type: "px"
                },
                {
                    dimension: "width",
                    value: 400,
                    type: "px"
                },
                {
                    dimension: "width",
                    pixelValue: 16 * 15,
                    type: "em"
                },
                {
                    dimension: "width",
                    pixelValue: 16 * 30,
                    type: "em"
                },
                {
                    dimension: "width",
                    pixelValue: 22 * 10,
                    type: "rem"
                },
                {
                    dimension: "width",
                    pixelValue: 22 * 20,
                    type: "rem"
                }
            ];

            var element = {
                style: {
                    width: "300px",
                    height: "0px",
                    fontSize: "16px"
                }
            };

            var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

            expect(breakpointStates.width.length).toEqual(6);
            expect(breakpointStates.width[0]).toEqual({
                over: true,
                under: false,
                breakpoint: breakpoints[0]
            });
            expect(breakpointStates.width[1]).toEqual({
                over: false,
                under: true,
                breakpoint: breakpoints[1]
            });
            expect(breakpointStates.width[2]).toEqual({
                over: true,
                under: false,
                breakpoint: breakpoints[2]
            });
            expect(breakpointStates.width[3]).toEqual({
                over: false,
                under: true,
                breakpoint: breakpoints[3]
            });
            expect(breakpointStates.width[4]).toEqual({
                over: true,
                under: false,
                breakpoint: breakpoints[4]
            });
            expect(breakpointStates.width[5]).toEqual({
                over: false,
                under: true,
                breakpoint: breakpoints[5]
            });
        });
    });
});
