"use strict";

var elementResizeDetectorMaker  = require("element-resize-detector");
var batchUpdaterMaker           = require("batch-updater");
var extensionHandlerMaker       = require("./extension-handler");
var reporterMaker               = require("./reporter");
var idGeneratorMaker            = require("./id-generator");
var idHandlerMaker              = require("./id-handler");
var cycleDetectorMaker          = require("./cycle-detector");
var packageJson                 = require("../package.json");

module.exports = function(options) {
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

    //The public functions is a subset of all functions on the elq object.
    var publicFunctions = [
        "getVersion",
        "getName",
        "use",
        "using",
        "start",
        "listenTo"
    ];

    //Public
    elq.getVersion          = getVersion;
    elq.getName             = getName;
    elq.use                 = extensionHandler.register.bind(null, elq);
    elq.using               = extensionHandler.isRegistered;
    elq.start               = start;
    elq.listenTo            = elementResizeDetector.listenTo;

    //Functions only accesible by plugins.
    elq.idHandler           = idHandler;
    elq.reporter            = reporter;
    elq.cycleDetector       = cycleDetector;
    elq.createBatchUpdater  = createBatchUpdater; //TODO: Rename to batch processor.
    elq.getPlugin           = extensionHandler.get;

    return createPublicApi(elq, publicFunctions);
};

function getVersion() {
    return packageJson.version;
}

function getName() {
    return packageJson.name;
}

function createPublicApi(elq, publicFunctions) {
    var publicElq = {};

    for(var i = 0; i < publicFunctions.length; i++) {
        var property = publicFunctions[i];

        publicElq[property] = elq[property];
    }

    return publicElq;
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
