"use strict";

var _ = {};

_.isFunction    = require("lodash.isfunction");
_.isObject      = require("lodash.isobject");
_.isString      = require("lodash.isString");
var forEach     = require("./utils").forEach;

/**
 * Handles plugins of a system instance.
 * @constructor
 * @public
 * @param {Reporter} reporter Reporter instance that will be used for reporting errors.
 */
module.exports = function PluginHandler(reporter) {
    if (!reporter) {
        throw new Error("Reporter dependency required.");
    }

    var plugins = {};

    /**
     * Register an plugin to the plugin handler and inits it to the given system. All plugins in the plugin handler context needs to have unique names.
     * @public
     * @param {object} target The target that the given plugin should be applied to.
     * @param {Plugin} plugin TODO: Write me.
     * @returns the plugin instance registered to the target.
     * @throws On invalid plugin input (bad plugin format or not unique name).
     */
    function register(target, plugin, options) {
        options = options || {};

        function checkPluginMethod(method) {
            if (!_.isFunction(plugin[method])) {
                reporter.error("Plugin must provide the " + method + " method. Plugin: ", plugin);
                throw new Error("Invalid plugin: missing method");
            }
        }

        if (!_.isObject(plugin)) {
            reporter.error("Plugin must be an object. Plugin: ", plugin);
            throw new Error("Invalid plugin: not an object");
        }

        checkPluginMethod("getName");
        checkPluginMethod("getVersion");
        checkPluginMethod("isCompatible");
        checkPluginMethod("make");

        if (!plugin.isCompatible(target)) {
            reporter.error("Plugin " + plugin.getName() + ":" + plugin.getVersion() + " is incompatible with " + target.getName() + ":" + target.getVersion());
            throw new Error("Incompatible plugin");
        }

        var name = plugin.getName();

        if (plugins[name]) {
            throw new Error("Plugin " + name + " is already being used.");
        }

        plugins[name] = plugin.make(target, options);

        return plugins[name];
    }

    /**
     * Tells if an plugin has been registered to the plugin handler.
     * @public
     * @param {string|Plugin} plugin The plugin to be checked if registered to the plugin handler. If string, it will be used as name of the plugin.
     * @returns {boolean} True if the plugin has been registered.
     */
    function isRegistered(plugin) {
        var name = _.isObject(plugin) ? plugin.getName() : plugin;

        if (!_.isString(name)) {
            return false;
        }

        return !!plugins[name];
    }

    /**
     * Gets the plugin by the given plugin name.
     * @param {string|plugin} plugin The plugin to get.
     * @returns The plugin object with the given name. Returns null if it doesn't exist.
     */
    function get(plugin) {
        var name = _.isObject(plugin) ? plugin.getName() : plugin;

        return plugins[name] || null;
    }

    /**
     * Gets all plugin methods that exists for the given method name.
     * @public
     * @param {string} method The name of the methods that should be extracted from the plugins.
     * @returns {function[]} A list of all plugin methods that matched the given method name. The methods will have the context bound to the plugin object.
     */
    function getMethods(method) {
        function filterer(plugin) {
            return _.isFunction(plugin[method]);
        }

        function mapper(plugin) {
            var f = plugin[method];
            return f ? f.bind(plugin) : null;
        }

        var pluginObjects = [];

        for (var key in plugins) {
            if (plugins.hasOwnProperty(key)) {
                pluginObjects.push(plugins[key]);
            }
        }

        return pluginObjects.filter(filterer).map(mapper);
    }

    /**
     * Calls all plugin methods with given arguments by the given method name.
     * @public
     * @param {string} method The method name to be called for all plugins that has it.
     * @param {Array} args The arguments array to be applied to all plugin methods.
     */
    function callMethods(method, args) {
        forEach(getMethods(method), function (pluginMethod) {
            pluginMethod.apply(null, args);
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
