"use strict";

module.exports = function CycleDetector(idHandler, options) {
    if (!idHandler) {
        throw new Error("IdHandler dependency required.");
    }

    options = options || {};
    options.numCyclesAllowed = options.numCyclesAllowed || 1;
    options.timeBetweenCyclesAllowed = options.timeBetweenCyclesAllowed || 100;

    var elements = {};

    function isUpdateCyclic(element, classes, time) {
        time = time !== undefined ? time : Date.now();

        var id = idHandler.get(element);

        var update = {
            classes: classes,
            time: time
        };

        if (!elements[id]) {
            elements[id] = [update];
            return false;
        }

        var updates = elements[id];

        var cycles = 0;

        for (var i = updates.length - 1; i >= 0; i--) {
            var prevUpdate = updates[i];

            if (update.time - prevUpdate.time > options.timeBetweenCyclesAllowed) {
                elements[id] = updates.slice(i + 1, updates.length);
                elements[id].push(update);
                return false;
            }

            if (prevUpdate.classes === update.classes) {
                cycles++;
            }

            if (cycles > options.numCyclesAllowed) {
                elements[id].push(update);
                return true;
            }
        }

        elements[id].push(update);

        return false;
    }

    return {
        isUpdateCyclic: isUpdateCyclic
    };
};
