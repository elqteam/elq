"use strict";

var packageJson                 = require("../package.json");
var BatchUpdater                = require("batch-updater");
var partial                     = require("lodash.partial");
var forEach                     = require("lodash.forEach");
var unique                      = require("lodash.uniq");
var ElementResizeDetector       = require("element-resize-detector");
var PluginHandler               = require("./plugin-handler");
var Reporter                    = require("./reporter");
var IdGenerator                 = require("./id-generator");
var IdHandler                   = require("./id-handler");
var CycleDetector               = require("./cycle-detector");
var BreakpointParser            = require("./breakpoint-parser");
var BreakpointStateCalculator   = require("./breakpoint-state-calculator");
var BreakpointStateSerializer   = require("./breakpoint-state-serializer");

module.exports = function Elq(options) {
    options = options || {};

    var elq                         = {};
    var reporter                    = options.reporter || Reporter();
    var idGenerator                 = IdGenerator();
    var idHandler                   = IdHandler(idGenerator);
    var cycleDetector               = CycleDetector(idHandler);
    var pluginHandler               = PluginHandler(reporter);
    var breakpointParser            = BreakpointParser({ reporter: reporter, defaultUnit: "px" }); //TODO
    var breakpointStateCalculator   = BreakpointStateCalculator({});
    var breakpointSerializer        = BreakpointStateSerializer();
    var elementResizeDetector       = ElementResizeDetector({ idHandler: idHandler, reporter: reporter, strategy: "scroll" });
    var BatchUpdater                = createBatchUpdaterConstructorWithDefaultOptions({ reporter: reporter });

    function start(elements) {
        var elementsArray = elements;

        if (!elementsArray) {
            return;
        }

        if (elements.length === undefined) {
            elementsArray = [elements];
        }

        // Convert collection to array for plugins.
        if (!Array.isArray(elementsArray)) {
            elementsArray = [];

            forEach(elements, function (element) {
                elementsArray.push(element);
            });
        }

        // Extract elq elements by plugins.

        // if (elementsArray.length) {
        //     pluginHandler.callMethods("start", [elementsArray]);
        // }

        forEach(elements, function (element) {
            var breakpoints = breakpointParser.parseBreakpoints(element);

            // TODO: Let plugins parse breakpoints also.

            breakpoints = unique(breakpoints, function uniqueFunction(bp) {
                return bp.dimension + bp.value + bp.type;
            });

            var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

            // TODO: Here it should be checked if the breakpoints have changed since last time.
            // TODO: Also, the cycle detector should perform the checks here so that the serialize step can be skipped if needed.

            // TODO: Let plugins serialize breakpoints also.

            breakpointSerializer.serializeBreakpointStates(element, breakpointStates);
        });
    }

    //Public
    elq.getVersion          = getVersion;
    elq.getName             = getName;
    elq.use                 = partial(pluginHandler.register, elq);
    elq.using               = pluginHandler.isRegistered;
    elq.start               = start;
    elq.listenTo            = elementResizeDetector.listenTo;

    //Create an object copy of the currently attached API methods, that will be exposed as the public API.
    var publicElq           = copy(elq);

    //Functions only accesible by plugins.
    elq.idHandler           = idHandler;
    elq.reporter            = reporter;
    elq.cycleDetector       = cycleDetector;
    elq.BatchUpdater        = BatchUpdater;
    elq.getPlugin           = pluginHandler.get;

    return publicElq;
};

function getVersion() {
    return packageJson.version;
}

function getName() {
    return packageJson.name;
}

function copy(o) {
    var c = {};

    for (var key in o) {
        if (o.hasOwnProperty(key)) {
            c[key] = o[key];
        }
    }

    return c;
}

function createBatchUpdaterConstructorWithDefaultOptions(globalOptions) {
    globalOptions = globalOptions || {};

    function createBatchUpdaterOptionsProxy(options) {
        options = options || globalOptions;

        for (var prop in globalOptions) {
            if (globalOptions.hasOwnProperty(prop) && !options.hasOwnProperty(prop)) {
                options[prop] = globalOptions[prop];
            }
        }

        return BatchUpdater(options);
    }

    return createBatchUpdaterOptionsProxy;
}
