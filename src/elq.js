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
var StyleResolver               = require("./style-resolver");

module.exports = function Elq(options) {
    options = options || {};

    var elq                         = {};
    var reporter                    = options.reporter || Reporter();
    var defaultUnit                 = options.defaultUnit || "px";
    var idGenerator                 = IdGenerator();
    var idHandler                   = IdHandler(idGenerator);
    var cycleDetector               = CycleDetector(idHandler);
    var pluginHandler               = PluginHandler(reporter);
    var styleResolver               = StyleResolver();
    var breakpointParser            = BreakpointParser({ reporter: reporter, defaultUnit: defaultUnit, styleResolver: styleResolver });
    var breakpointStateCalculator   = BreakpointStateCalculator();
    var breakpointSerializer        = BreakpointStateSerializer();
    var elementResizeDetector       = ElementResizeDetector({ idHandler: idHandler, reporter: reporter, strategy: "scroll" });
    var BatchUpdater                = createBatchUpdaterConstructorWithDefaultOptions({ reporter: reporter });

    var batchUpdater                = BatchUpdater();

    function updateBreakpoints(element, batchProcessor) {
        var breakpoints = breakpointParser.parseBreakpoints(element);

        // TODO: Let plugins parse breakpoints also.

        // Filter so that we only got unique breakpoints.
        breakpoints = unique(breakpoints, function uniqueFunction(bp) {
            return bp.dimension + bp.value + bp.type;
        });

        var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

        // TODO: Here it should be checked if the breakpoints have changed since last time.

        // TODO: This should instead be hashed. Also, maybe there is a more effective way of doing this.
        var breakpointStatesHash = JSON.stringify(breakpointStates);

        if (element.elq.currentBreakpointStatesHash !== breakpointStatesHash) {
            // TODO: These should be read from the element instead.
            var cycleDetection = true;
            var elementOptions = {
                notcyclic: false,
                noclasses: false
            };

            if (cycleDetection && !elementOptions.notcyclic && cycleDetector.isUpdateCyclic(element, breakpointStatesHash)) {
                reporter.warn("Cyclic rules detected! Breakpoint classes has not been updated. Element: ", element);
                return;
            }

            element.elq.currentBreakpointStatesHash = breakpointStatesHash;

            if (!elementOptions.noclasses) {
                // TODO: Let plugins serialize breakpoints also.
                breakpointSerializer.serializeBreakpointStates(element, breakpointStates);
            }

            // TODO: Notify listerns of the element that it has changed breakpoints state.
            // forEach(elementBreakpointsListeners[id], function (listener) {
            //     listener(element);
            // });
            console.log("Updated", element);
        } else {
            console.log("Ignored", element);
        }
    }

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

        var manualBatchUpdater = BatchUpdater({ async: false, auto: false });

        //Before listening to each element (which is a heavy task) it is important to apply the right classes
        //to the elements so that a correct render can occur before the installation.
        forEach(elements, function (element) {
            element.elq = element.elq || {};
            updateBreakpoints(element, manualBatchUpdater);
        });

        function onElementResizeProxy(element) {
            return updateBreakpoints(element, batchUpdater);
        }

        forEach(elements, function listenToLoop(element) {
            elementResizeDetector.listenTo({
                callOnAdd: true, // TODO: Shouldn't this be false?
                batchUpdater: batchUpdater
            }, element, onElementResizeProxy);
        });

        //Force everything currently in the batch to execute synchronously.
        //Important that his is done after the listenToLoop since it reads the DOM style and the batch will write to the DOM.
        manualBatchUpdater.force();
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
