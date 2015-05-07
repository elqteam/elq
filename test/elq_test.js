/* global describe:false, it:false, expect:false, Elq:false, jasmine: false */

"use strict";

describe("elq", function() {
    it("should just work", function() {
        var elq = new Elq();
        expect(elq).toEqual(jasmine.any(Object));
    });
});
