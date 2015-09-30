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
var BreakpointStateCalculator   = require("./breakpoint-state-calculator");
var StyleResolver               = require("./style-resolver");

// Core plugins
var elqBreakpoints              = require("./plugin/elq-breakpoints/elq-breakpoints.js");
var elqMinMaxSerializer         = require("./plugin/elq-minmax-serializer/elq-minmax-serializer.js");
var elqMirror                   = require("./plugin/elq-mirror/elq-mirror.js");

module.exports = function Elq(options) {
    options = options || {};

    var elq                         = {};
    var reporter                    = options.reporter || Reporter();
    var defaultUnit                 = options.defaultUnit || "px";
    var cycleDetection              = options.cycleDetection || false;
    var idGenerator                 = IdGenerator();
    var idHandler                   = IdHandler(idGenerator);
    var cycleDetector               = CycleDetector(idHandler);
    var pluginHandler               = PluginHandler(reporter);
    var styleResolver               = StyleResolver();
    var breakpointStateCalculator   = BreakpointStateCalculator();
    var elementResizeDetector       = ElementResizeDetector({ idHandler: idHandler, reporter: reporter, strategy: "scroll" });
    var BatchUpdater                = createBatchUpdaterConstructorWithDefaultOptions({ reporter: reporter });

    var batchUpdater                = BatchUpdater();

    function notifyListeners(element, event, args) {
        var listeners = element.elq.listeners[event] || [];

        forEach(listeners, function (callback) {
            callback.apply(null, args);
        });
    }

    function updateBreakpoints(element, batchProcessor) {
        var breakpoints = [];

        forEach(pluginHandler.getMethods("getBreakpoints"), function (getBreakpoints) {
            breakpoints = breakpoints.concat(getBreakpoints(element));
        });

        // Filter so that we only got unique breakpoints.
        breakpoints = unique(breakpoints, function uniqueFunction(bp) {
            return bp.dimension + bp.value + bp.type;
        });

        var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

        // TODO: This should instead be hashed. Also, maybe there is a more effective way of doing this.
        var breakpointStatesHash = JSON.stringify(breakpointStates);

        if (element.elq.currentBreakpointStatesHash !== breakpointStatesHash) {
            if (cycleDetection && element.elq.cycleCheck) {
                if (cycleDetector.isUpdateCyclic(element, breakpointStatesHash)) {
                    reporter.warn("Cyclic rules detected! Breakpoint classes has not been updated. Element: ", element);
                    return;
                }
            }

            element.elq.currentBreakpointStatesHash = breakpointStatesHash;

            if (element.elq.serialize) {
                pluginHandler.callMethods("serializeBreakpointStates", [element, breakpointStates]);
            }

            notifyListeners(element, "breakpointStatesChanged", [element, breakpointStates]);
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

        if (!elements.length) {
            return;
        }

        forEach(elements, function (element) {
            element.elq = element.elq || {
                listeners: {},
                updateBreakpoints: false,
                resizeDetection: false
            };
            pluginHandler.callMethods("start", [element]);
        });

        var manualBatchUpdater = BatchUpdater({ async: false, auto: false });

        //Before listening to each element (which is a heavy task) it is important to apply the right classes
        //to the elements so that a correct render can occur before the installation.
        forEach(elements, function (element) {
            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, manualBatchUpdater);
            }
        });

        function onElementResizeProxy(element) {
            notifyListeners(element, "resize", [element]);

            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, batchUpdater);
            }
        }

        forEach(elements, function listenToLoop(element) {
            if (element.elq.resizeDetection) {
                elementResizeDetector.listenTo({
                    callOnAdd: true, // TODO: Shouldn't this be false?
                    batchUpdater: batchUpdater
                }, element, onElementResizeProxy);
            }
        });

        //Force everything currently in the batch to execute synchronously.
        //Important that his is done after the listenToLoop since it reads the DOM style and the batch will write to the DOM.
        manualBatchUpdater.force();
    }

    function listenTo(element, event, callback) {
        if (!element.elq) {
            // TODO: This could perhaps be removed, so that it is possible to add listeners before starting elements.
            return reporter.error("Can only listen to events of elq elements. Call 'start' before listening.");
        }

        // TODO: If event is "resize" but the element is current element.elq.resizeDetection = false,
        // it would perhaps be nice to start listening to this element.

        var listeners = element.elq.listeners;

        if (!listeners[event]) {
            listeners[event] = [];
        }

        listeners[event].push(callback);
    }

    //Public
    elq.getVersion          = getVersion;
    elq.getName             = getName;
    elq.use                 = partial(pluginHandler.register, elq);
    elq.using               = pluginHandler.isRegistered;
    elq.start               = start;
    elq.listenTo            = listenTo;

    //Create an object copy of the currently attached API methods, that will be exposed as the public API.
    var publicElq           = copy(elq);

    //Functions only accesible by plugins.
    elq.idHandler           = idHandler;
    elq.reporter            = reporter;
    elq.cycleDetector       = cycleDetector;
    elq.BatchUpdater        = BatchUpdater;
    elq.pluginHandler       = pluginHandler;

    // Register core plugins

    elq.use(elqBreakpoints, {
        defaultUnit: defaultUnit
    });

    elq.use(elqMinMaxSerializer);
    elq.use(elqMirror);

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
