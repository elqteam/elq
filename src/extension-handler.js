//TODO: Borrowed from bookie.js. Should be removed and used as a dependency instead.
//https://github.com/backslashforward/bookie.js/tree/master/src/extension

"use strict";

var _ = {};

_.isFunction    = require("lodash.isfunction");
_.isObject      = require("lodash.isobject");
_.isString      = require("lodash.isString");
_.filter        = require("lodash.filter");
_.map           = require("lodash.map");
_.bind          = require("lodash.bind");

/**
 * Handles extensions of a system instance.
 * @constructor
 * @public
 * @param {Reporter} reporter Reporter instance that will be used for reporting errors.
 */
module.exports = function ExtensionHandler(reporter) {
    if(!reporter) {
        throw new Error("Reporter dependency required.");
    }

    var extensions = {};

    /**
     * Register an extension to the extension handler and inits it to the given system. All extensions in the extension handler context needs to have unique names.
     * @public
     * @param {object} target The target that the given extension should be applied to.
     * @param {Extension} extension TODO: Write me.
     * @returns the externsion instance registered to the target.
     * @throws On invalid extension input (bad extension format or not unique name).
     */
    function register(target, extension, options) {
        options = options || {};

        function checkExtensionMethod(method) {
            if(!_.isFunction(extension[method])) {
                reporter.error("Extension must provide the " + method + " method. Extension: ", extension);
                throw new Error("Invalid extension: missing method");
            }
        }

        if(!_.isObject(extension)) {
            reporter.error("Extension must be an object. Extension: ", extension);
            throw new Error("Invalid extension: not an object");
        }

        checkExtensionMethod("getName");
        checkExtensionMethod("getVersion");
        checkExtensionMethod("isCompatible");
        checkExtensionMethod("make");

        if(!extension.isCompatible(target)) {
            reporter.error("Extension " + extension.getName() + ":" + extension.getVersion() + " is incompatible with " + target.getName() + ":" + target.getVersion());
            throw new Error("Incompatible extension");
        }

        var name = extension.getName();

        if(extensions[name]) {
            throw new Error("Extension " + name + " is already being used.");
        }

        extensions[name] = extension.make(target, options);

        return extensions[name];
    }

    /**
     * Tells if an extension has been registered to the extension handler.
     * @public
     * @param {string|Extension} extension The extension to be checked if registered to the extension handler. If string, it will be used as name of the extension.
     * @returns {boolean} True if the extension has been registered.
     */
    function isRegistered(extension) {
        var name = _.isObject(extension) ? extension.getName() : extension;

        if(!_.isString(name)) {
            return false;
        }

        return !!extensions[name];
    }

    /**
     * Gets the extension by the given extension name.
     * @param {string} name The name of the extension to get.
     * @returns The extension object with the given name. Returns null if it doesn't exist.
     */
    function get(name) {
        return extensions[name] || null;
    }

    /**
     * Gets all extension methods that exists for the given method name.
     * @public
     * @param {string} method The name of the methods that should be extracted from the extensions.
     * @returns {function[]} A list of all extension methods that matched the given method name. The methods will have the context bound to the extension object.
     */
    function getMethods(method) {
        function filterer(extension) {
            return _.isFunction(extension[method]);
        }

        function mapper(extension) {
            var f = extension[method];
            return f ? _.bind(f, extension) : null;
        }

        return _.map(_.filter(extensions, filterer), mapper) || [];
    }

    /**
     * Calls all extension methods with given arguments by the given method name.
     * @public
     * @param {string} method The method name to be called for all extensions that has it.
     * @param {Array} args The arguments array to be applied to all extension methods.
     */
    function callMethods(method, args) {
        getMethods(method).forEach(function(extensionMethod) {
            extensionMethod.apply(null, args);
        });
    }

    return {
        register: register,
        isRegistered: isRegistered,
        get: get,
        getMethods: getMethods,
        callMethods: callMethods
    };
};
