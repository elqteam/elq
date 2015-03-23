"use strict";

var ExtensionHandler = require("./extension/extension-handler");
var elementResizeDetectorMaker = require("element-resize-detector");
var reporterMaker = require("./reporter");

module.exports = function(options) {
    options = options || {};

    var reporter = options.reporter || reporterMaker();

    var elq = {};
    var extensionHandler = new ExtensionHandler();
    var elementResizeDetector = elementResizeDetectorMaker();

    function start(elements) {
        extensionHandler.callMethods("start", [elq, elements]);
    }

    elq.version = version;
    elq.use = extensionHandler.register.bind(extensionHandler, elq);
    elq.using = extensionHandler.isRegistered.bind(extensionHandler);
    elq.getExtension = extensionHandler.get.bind(extensionHandler);
    elq.start = start;
    elq.listenTo = elementResizeDetector.listenTo;

    return elq;
};

var version = "v0.0.0";
