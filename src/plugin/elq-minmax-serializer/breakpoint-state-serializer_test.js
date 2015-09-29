/* global describe:false, it:false, expect:false */

"use strict";

var BreakpointStateSerializer = require("./breakpoint-state-serializer.js");

describe("BreakpointStateSerializer", function () {
    describe("serializeBreakpointStates", function () {
        it("should add classes to an element for the breakpoint states", function () {
            var breakpointStateSerializer = BreakpointStateSerializer();

            var element = {
                className: ""
            };

            var breakpointStates = {
                width: [
                    {
                        over: true,
                        under: false,
                        breakpoint: {
                            dimension: "width",
                            type: "em",
                            pixelValue: 500,
                            value: 10
                        }
                    },
                    {
                        over: true,
                        under: false,
                        breakpoint: {
                            dimension: "width",
                            type: "px",
                            pixelValue: 300,
                            value: 300
                        }
                    },
                    {
                        over: false,
                        under: true,
                        breakpoint: {
                            dimension: "width",
                            type: "rem",
                            pixelValue: 1000,
                            value: 20
                        }
                    }
                ],
                height: []
            };

            breakpointStateSerializer.serializeBreakpointStates(element, breakpointStates);

            expect(element.className).toEqual("elq-min-width-300px elq-min-width-10em elq-max-width-20rem");
        });
    });
});
