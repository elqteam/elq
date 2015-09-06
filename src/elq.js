"use strict";

var packageJson                 = require("../package.json");
var BatchUpdater                = require("batch-updater");
var partial                     = require("lodash.partial");
var forEach                     = require("lodash.forEach");
var ElementResizeDetector       = require("element-resize-detector");
var PluginHandler               = require("./plugin-handler");
var Reporter                    = require("./reporter");
var IdGenerator                 = require("./id-generator");
var IdHandler                   = require("./id-handler");
var CycleDetector               = require("./cycle-detector");

module.exports = function Elq(options) {
    options = options || {};

    var elq                     = {};
    var reporter                = options.reporter || Reporter();
    var idGenerator             = IdGenerator();
    var idHandler               = IdHandler(idGenerator);
    var cycleDetector           = CycleDetector(idHandler);
    var pluginHandler           = PluginHandler(reporter);
    var elementResizeDetector   = ElementResizeDetector({ idHandler: idHandler, reporter: reporter, strategy: "scroll" });
    var createBatchUpdater      = createBatchUpdaterWithDefaultOptions({ reporter: reporter });

    function start(elements) {
        var elementsArray = elements;

        if (!elementsArray) {
            return;
        }

        if(elements.length === undefined) {
            elementsArray = [elements];
        }

        // Convert collection to array for plugins.
        if (!Array.isArray(elementsArray)) {
            elementsArray = [];

            forEach(elements, function (element) {
                elementsArray.push(element);
            });
        }

        if (elementsArray.length) {
            pluginHandler.callMethods("start", [elementsArray]);
        }
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
    elq.createBatchUpdater  = createBatchUpdater; //TODO: Rename to batch processor.
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

    for(var key in o) {
        if(o.hasOwnProperty(key)) {
            c[key] = o[key];
        }
    }

    return c;
}

function createBatchUpdaterWithDefaultOptions(globalOptions) {
    globalOptions = globalOptions || {};

    function createBatchUpdaterOptionsProxy(options) {
        options = options || globalOptions;

        for(var prop in globalOptions) {
            if(globalOptions.hasOwnProperty(prop) && !options.hasOwnProperty(prop)) {
                options[prop] = globalOptions[prop];
            }
        }

        return BatchUpdater(options);
    }

    return createBatchUpdaterOptionsProxy;
}
