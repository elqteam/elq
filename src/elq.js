"use strict";

var ExtensionHandler = require("./extension/extension-handler");
var elementResizeDetectorMaker = require("element-resize-detector");
var reporterMaker = require("./reporter");
var idGeneratorMaker = require("./id-generator");
var idHandlerMaker = require("./id-handler");

module.exports = function(options) {
    options = options || {};

    var reporter = options.reporter || reporterMaker();

    var idGenerator = idGeneratorMaker();
    var idHandler = idHandlerMaker(idGenerator);

    var elq = {};
    var extensionHandler = new ExtensionHandler();
    var elementResizeDetector = elementResizeDetectorMaker({
        idHandler: idHandler,
        reporter: reporter
    });

    function start(elements) {
        extensionHandler.callMethods("start", [elq, elements]);
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

    elq.version = version;
    elq.use = extensionHandler.register.bind(extensionHandler, elq);
    elq.using = extensionHandler.isRegistered.bind(extensionHandler);
    elq.getExtension = extensionHandler.get.bind(extensionHandler);
    elq.start = start;
    elq.listenTo = elementResizeDetector.listenTo;

    //Functions only accesible by plugins.
    elq.idHandler = idHandler;

    return createPublicApi(elq, publicFunctions);
};

var version = "v0.0.0";

function createPublicApi(elq, publicFunctions) {
    var publicElq = {};

    for(var i = 0; i < publicFunctions.length; i++) {
        var property = publicFunctions[i];

        publicElq[property] = elq[property];
    }

    return publicElq;
}
