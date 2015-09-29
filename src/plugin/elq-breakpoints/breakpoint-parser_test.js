/* global describe:false, it:false, expect:false */

"use strict";

var BreakpointParser = require("./breakpoint-parser.js");

function mockElement(elementData) {
    function getAttribute(attr) {
        return elementData.attributes[attr];
    }

    return {
        getAttribute: getAttribute,
        style: elementData.style
    };
}

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

describe("BreakpointParser", function () {
    describe("parseBreakpoints", function () {
        it ("should parse breakpoints correctly", function () {
            var parser = BreakpointParser({
                styleResolver: styleResolver
            });

            var elementData = {
                style: {
                    fontSize: "16px"
                },
                attributes: {
                    "elq-breakpoints-widths": "500px 300px"
                }
            };

            var element = mockElement(elementData);

            var breakpoints = parser.parseBreakpoints(element);

            expect(breakpoints.length).toEqual(2);

            expect(breakpoints[0].dimension).toEqual("width");
            expect(breakpoints[0].value).toEqual(500);
            expect(breakpoints[0].type).toEqual("px");
            expect(breakpoints[0].pixelValue).toEqual(500);

            expect(breakpoints[1].dimension).toEqual("width");
            expect(breakpoints[1].value).toEqual(300);
            expect(breakpoints[1].type).toEqual("px");
            expect(breakpoints[1].pixelValue).toEqual(300);
        });

        it("should parse different types of breakpoints", function () {
            var parser = BreakpointParser({
                styleResolver: styleResolver
            });

            var elementData = {
                style: {
                    fontSize: "16px"
                },
                attributes: {
                    "elq-breakpoints-widths": "500px 10rem 20em"
                }
            };

            var element = mockElement(elementData);

            var breakpoints = parser.parseBreakpoints(element);

            expect(breakpoints[0].dimension).toEqual("width");
            expect(breakpoints[0].value).toEqual(500);
            expect(breakpoints[0].type).toEqual("px");
            expect(breakpoints[0].pixelValue).toEqual(500);

            expect(breakpoints[1].dimension).toEqual("width");
            expect(breakpoints[1].value).toEqual(10);
            expect(breakpoints[1].type).toEqual("rem");
            expect(breakpoints[1].pixelValue).toEqual(10 * 22);

            expect(breakpoints[2].dimension).toEqual("width");
            expect(breakpoints[2].value).toEqual(20);
            expect(breakpoints[2].type).toEqual("em");
            expect(breakpoints[2].pixelValue).toEqual(20 * 16);
        });

        it("should allow unit to be left out and then use defaultUnit", function () {
            var parser = BreakpointParser({
                styleResolver: styleResolver,
                defaultUnit: "em"
            });

            var elementData = {
                style: {
                    fontSize: "16px"
                },
                attributes: {
                    "elq-breakpoints-widths": "10 30px"
                }
            };

            var element = mockElement(elementData);

            var breakpoints = parser.parseBreakpoints(element);

            expect(breakpoints[0].dimension).toEqual("width");
            expect(breakpoints[0].value).toEqual(10);
            expect(breakpoints[0].type).toEqual("em");
            expect(breakpoints[0].pixelValue).toEqual(10 * 16);

            expect(breakpoints[1].dimension).toEqual("width");
            expect(breakpoints[1].value).toEqual(30);
            expect(breakpoints[1].type).toEqual("px");
            expect(breakpoints[1].pixelValue).toEqual(30);
        });
    });
});
