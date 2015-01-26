//TODO: Borrowed from bookie.js. Should be removed and used as a dependency instead.
//https://github.com/backslashforward/bookie.js/tree/master/src/extension

"use strict";

var _ = {};

_.isFunction = require("lodash.isfunction");
_.isObject = require("lodash.isobject");
_.isString = require("lodash.isString");

module.exports = ExtensionHandler;

/**
 * Handles extensions of a system instance.
 * @constructor
 * @public
 */
function ExtensionHandler() {
    this.extensions = {};
}

/**
 * Register an extension to the extension handler and inits it to the given system. All extensions in the extension handler context needs to have unique names.
 * @public
 * @param {object} target The target that the given extension should be applied to.
 * @param {Extension} extension The extension to be used.
 * @throws On invalid extension input (bad extension format or not unique name).
 */
ExtensionHandler.prototype.register = function(target, extension) {
    if(!_.isObject(extension) || !_.isString(extension.name) || !_.isFunction(extension.init)) {
        throw new Error("Invalid extension");
    }

    var name = extension.name;

    if(this.extensions[name]) {
        throw new Error("Extension " + name + " already exists.");
    }

    this.extensions[name] = extension;

    extension.init(target);
};

/**
 * Tells if an extension has been registered to the extension handler.
 * @public
 * @param {string|Extension} extension The extension to be checked if registered to the extension handler. If string, it will be used as name of the extension.
 * @returns {boolean} True if the extension has been registered.
 */
ExtensionHandler.prototype.isRegistered = function(extension) {
    var name = _.isObject(extension) ? extension.name : extension;

    if(!_.isString(name)) {
        return false;
    }

    return !!this.extensions[name];
};

/**
 * Gets the extension by the given extension name.
 * @param {string} name The name of the extension to get.
 * @returns The extension object with the given name. Returns null if it doesn't exist.
 */
ExtensionHandler.prototype.get = function(name) {
    return this.extensions[name] || null;
};

/**
 * Gets all extension methods that exists for the given method name.
 * @public
 * @param {string} method The name of the methods that should be extracted from the extensions.
 * @returns {function[]} A list of all extension methods that matched the given method name.
 */
ExtensionHandler.prototype.getMethods = function(method) {
    return this.extensions.filter(function(extension) {
        return _.isFunction(extension[method]);
    }).map(function(extension) {
        return extension[method];
    }) || [];
};

/**
 * Calls all extension methods with given arguments by the given method name.
 * @public
 * @param {string} method The method name to be called for all extensions that has it.
 * @param {Array} args The arguments array to be applied to all extension methods.
 */
ExtensionHandler.prototype.callMethods = function(method, args) {
    this.getMethods(method).forEach(function(extensionMethod) {
        extensionMethod.apply(null, args);
    });
};
