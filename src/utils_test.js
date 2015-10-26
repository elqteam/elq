/* global describe:false, it:false, expect:false */

"use strict";

var utils = require("./utils");

describe("utils", function () {
    describe("forEach", function () {
        it("should iterate arrays and objects", function () {
            var outputString = "";
            utils.forEach(["foo", 2, 141, "bar"], function (e) {
                outputString += e;
            });
            expect(outputString).toEqual("foo2141bar");

            outputString = "";
            utils.forEach({ 0: "a", 2: "b", 1: 3, length: 3 }, function (e) {
                outputString += e;
            });
            expect(outputString).toEqual("a3b");
        });
    });

    describe("unique", function () {
        it("should return only unique values", function () {
            var breakpoints = [
                { dimension: "width", pixelValue: 500, value: 500, type: "px" },
                { dimension: "width", pixelValue: 500, value: 500, type: "px" },
                { dimension: "height", pixelValue: 500, value: 500, type: "px" },
                { dimension: "width", pixelValue: 500, value: 500, type: "em" },
                { dimension: "width", pixelValue: 499, value: 500, type: "px" },
                { dimension: "width", pixelValue: 500, value: 500, type: "em" },
                { dimension: "height", pixelValue: 300, value: 500, type: "em" },
                { dimension: "height", pixelValue: 300, value: 500, type: "em" }
            ];

            function hashFunction(bp) {
                return bp.dimension + bp.value + bp.type;
            }

            expect(utils.unique(breakpoints, hashFunction)).toEqual([
                { dimension: "width", pixelValue: 500, value: 500, type: "px" },
                { dimension: "height", pixelValue: 500, value: 500, type: "px" },
                { dimension: "width", pixelValue: 500, value: 500, type: "em" },
                { dimension: "height", pixelValue: 300, value: 500, type: "em" }
            ]);
        });
    });
});
