"use strict";

var ExtensionHandler = require("./extension/extension-handler");

module.exports = function() {
    var elq = {};
    var extensionHandler = new ExtensionHandler();

    elq.version = version;
    elq.use = extensionHandler.register.bind(extensionHandler, elq);
    elq.using = extensionHandler.isRegistered.bind(extensionHandler);
    elq.getExtension = extensionHandler.get.bind(extensionHandler);

    return elq;
}

var version = "v0.0.0";
