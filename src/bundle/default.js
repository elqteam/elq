"use strict";

var Elq = require("../elq");

// Core plugins
var elqBreakpoints    = require("../plugin/elq-breakpoints/elq-breakpoints.js");
var elqMinMaxApplyer  = require("../plugin/elq-minmax-applyer/elq-minmax-applyer.js");
var elqMirror         = require("../plugin/elq-mirror/elq-mirror.js");
var elqResize         = require("../plugin/elq-resize/elq-resize.js");

// Proxy the Constructor so that we can register plugins when an instance is created.
module.exports = function DefaultElq(options) {
    var elq = Elq.apply(null, arguments);

    // Intercept special plugin options.
    options         = options || {};
    var defaultUnit = options.defaultUnit || "px";

    elq.use(elqBreakpoints, {
        defaultUnit: defaultUnit
    });

    elq.use(elqMinMaxApplyer);
    elq.use(elqMirror);
    elq.use(elqResize);

    return elq;
};
