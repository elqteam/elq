"use strict";

module.exports = function batchUpdaterMaker(options) {
    options = options || {};

    var reporter = options.reporter;

    if(!reporter) {
        throw new Error("Reporter required.");
    }

    var batchSize = 0;
    var batch = {};

    function requestFrame(callback) {
        // var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) { return window.setTimeout(fn, 20); };
        var raf = function(fn) { return window.setTimeout(fn, 0); };
        return raf(callback);
    }

    function queueUpdate(element, updater) {
        if(batchSize === 0) {
            requestFrame(function performUpdate() {
                updateBatch();
                clearBatch();
            });
        }

        if(batch[element]) {
            reporter.warn("Batch updater received update for an element that already has an update in queue. Discarding old update...");
        }

        batch[element] = updater;
        batchSize++;
    }

    function updateBatch() {
        for(var element in batch) {
            if(batch.hasOwnProperty(element)) {
                var updater = batch[element];
                updater();
            }
        }
    }

    function clearBatch() {
        batchSize = 0;
        batch = {};
    }

    return {
        update: queueUpdate
    };
};