"use strict";

var ExtensionHandler = require("./extension/extension-handler");
var elementResizeDetectorMaker = require("element-resize-detector");

module.exports = function() {
    var elq = {};
    var extensionHandler = new ExtensionHandler();
    var elementResizeDetector = elementResizeDetectorMaker();

    function scan() {
        elementResizeDetector.listenTo(document.getElementsByClassName("elq"), function(element) {
            console.log("resized " + $(element).width() + "x" + $(element).height());
        });
    }

    elq.version = version;
    elq.use = extensionHandler.register.bind(extensionHandler, elq);
    elq.using = extensionHandler.isRegistered.bind(extensionHandler);
    elq.getExtension = extensionHandler.get.bind(extensionHandler);
    elq.scan = scan;

    return elq;
};

var version = "v0.0.0";
