"use strict";

var elementResizeDetectorMaker  = require("element-resize-detector");
var batchUpdaterMaker           = require("batch-updater");
var partial                     = require("lodash.partial");
var extensionHandlerMaker       = require("./extension-handler");
var reporterMaker               = require("./reporter");
var idGeneratorMaker            = require("./id-generator");
var idHandlerMaker              = require("./id-handler");
var cycleDetectorMaker          = require("./cycle-detector");
var packageJson                 = require("../package.json");

module.exports = function Elq(options) {
    options = options || {};

    var elq                     = {};
    var reporter                = options.reporter || reporterMaker();
    var idGenerator             = idGeneratorMaker();
    var idHandler               = idHandlerMaker(idGenerator);
    var cycleDetector           = cycleDetectorMaker(idHandler);
    var extensionHandler        = extensionHandlerMaker(reporter);
    var elementResizeDetector   = elementResizeDetectorMaker({ idHandler: idHandler, reporter: reporter, strategy: "scroll" });
    var createBatchUpdater      = createBatchUpdaterWithDefaultOptions({ reporter: reporter });

    function start(elements) {
        if(!elements) {
            throw new Error("Elements are required to start.");
        }

        if(elements.length === undefined) {
            elements = [elements];
        }

        extensionHandler.callMethods("start", [elements]);
    }

    //Public
    elq.getVersion          = getVersion;
    elq.getName             = getName;
    elq.use                 = partial(extensionHandler.register, elq);
    elq.using               = extensionHandler.isRegistered;
    elq.start               = start;
    elq.listenTo            = elementResizeDetector.listenTo;

    //Create an object copy of the currently attached API methods, that will be exposed as the public API.
    var publicElq           = copy(elq);

    //Functions only accesible by plugins.
    elq.idHandler           = idHandler;
    elq.reporter            = reporter;
    elq.cycleDetector       = cycleDetector;
    elq.createBatchUpdater  = createBatchUpdater; //TODO: Rename to batch processor.
    elq.getPlugin           = extensionHandler.get;

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

    function batchMakerOptionsProxy(options) {
        options = options || globalOptions;

        for(var prop in globalOptions) {
            if(globalOptions.hasOwnProperty(prop) && !options.hasOwnProperty(prop)) {
                options[prop] = globalOptions[prop];
            }
        }

        return batchUpdaterMaker(options);
    }

    return batchMakerOptionsProxy;
}
