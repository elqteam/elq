"use strict";

/* global console: false */

module.exports = function() {
    var noop = function () {
        //Does nothing.
    };

    var reporter = {
        log: noop,
        warn: noop,
        error: noop
    };

    if(window.console) {
        reporter.log = console.log;
        reporter.warn = console.warn;
        reporter.error = console.error;
    }

    return reporter;
};