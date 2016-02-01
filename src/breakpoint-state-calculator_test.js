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

var reporter = {
    error: function (e) {
        throw new Error(e);
    }
};

describe("BreakpointStateCalculator", function () {
    describe("getBreakpointStates", function () {
        it("should calculate breakpoint states correctly with pixelValue", function () {
            var breakpointStateCalculator = BreakpointStateCalculator({
                styleResolver: styleResolver,
                reporter: reporter
            });
            var breakpoints = [
                {
                    dimension: "width",
                    pixelValue: 200
                },
                {
                    dimension: "width",
                    value: 300,
                    type: "px"
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
                breakpoint: {
                    dimension: "width",
                    pixelValue: 200
                }
            });
            expect(breakpointStates.width[1]).toEqual({
                over: false,
                under: false,
                breakpoint: {
                    dimension: "width",
                    value: 300,
                    pixelValue: 300,
                    type: "px"
                }
            });
            expect(breakpointStates.width[2]).toEqual({
                over: false,
                under: true,
                breakpoint: {
                    dimension: "width",
                    pixelValue: 400
                }
            });
        });

        it("should calculate breakpoint states correctly for different types", function () {
            var breakpointStateCalculator = BreakpointStateCalculator({
                styleResolver: styleResolver,
                reporter: reporter
            });

            var breakpoints = [
                {
                    dimension: "width",
                    value: 200,
                    pixelValue: 200,
                    type: "px"
                },
                {
                    dimension: "width",
                    value: 400,
                    pixelValue: 400,
                    type: "px"
                },
                {
                    dimension: "width",
                    pixelValue: 16 * 15,
                    type: "em"
                },
                {
                    dimension: "width",
                    value: 30,
                    type: "em"
                },
                {
                    dimension: "width",
                    value: 10,
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
                breakpoint: {
                    dimension: "width",
                    value: 200,
                    pixelValue: 200,
                    type: "px"
                }
            });
            expect(breakpointStates.width[1]).toEqual({
                over: false,
                under: true,
                breakpoint: {
                    dimension: "width",
                    value: 400,
                    pixelValue: 400,
                    type: "px"
                }
            });
            expect(breakpointStates.width[2]).toEqual({
                over: true,
                under: false,
                breakpoint: {
                    dimension: "width",
                    pixelValue: 16 * 15,
                    type: "em"
                }
            });
            expect(breakpointStates.width[3]).toEqual({
                over: false,
                under: true,
                breakpoint: {
                    dimension: "width",
                    value: 30,
                    type: "em",
                    pixelValue: 16 * 30
                }
            });
            expect(breakpointStates.width[4]).toEqual({
                over: true,
                under: false,
                breakpoint: {
                    dimension: "width",
                    value: 10,
                    type: "rem",
                    pixelValue: 22 * 10
                }
            });
            expect(breakpointStates.width[5]).toEqual({
                over: false,
                under: true,
                breakpoint: {
                    dimension: "width",
                    pixelValue: 22 * 20,
                    type: "rem"
                }
            });
        });
    });
});
