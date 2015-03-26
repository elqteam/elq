"use strict";

var extensionHandlerMaker = require("./extension-handler");
var elementResizeDetectorMaker = require("element-resize-detector");
var reporterMaker = require("./reporter");
var idGeneratorMaker = require("./id-generator");
var idHandlerMaker = require("./id-handler");

var version = "v0.0.0";

module.exports = function(options) {
    options = options || {};

    var reporter = options.reporter || reporterMaker();

    var idGenerator = idGeneratorMaker();
    var idHandler = idHandlerMaker(idGenerator);

    var elq = {};
    var extensionHandler = extensionHandlerMaker(reporter);
    var elementResizeDetector = elementResizeDetectorMaker({
        idHandler: idHandler,
        reporter: reporter
    });

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
        "version",
        "use",
        "using",
        "getExtension",
        "start",
        "listenTo"
    ];

    elq.getVersion = function() {
        return version;
    };
    elq.getName = function() {
        return "ELQ";
    };

    elq.use = extensionHandler.register.bind(null, elq);
    elq.using = extensionHandler.isRegistered;
    elq.getExtension = extensionHandler.get;
    elq.start = start;
    elq.listenTo = elementResizeDetector.listenTo;

    //Functions only accesible by plugins.
    elq.idHandler = idHandler;
    elq.reporter = reporter;

    return createPublicApi(elq, publicFunctions);
};

function createPublicApi(elq, publicFunctions) {
    var publicElq = {};

    for(var i = 0; i < publicFunctions.length; i++) {
        var property = publicFunctions[i];

        publicElq[property] = elq[property];
    }

    return publicElq;
}
