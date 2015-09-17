/* global describe:false, it:false, expect:false */

"use strict";

var PluginHandler = require("./plugin-handler.js");

var reporter = {
    error: function (error) {
        throw Error(error);
    }
};

describe("PluginHandler", function () {
    describe("get", function () {
        it("should retrieve a plugin instance by name or plugin definition", function () {
            var pluginHandler = PluginHandler(reporter);

            var plugin = {
                getName: function () {
                    return "test";
                },
                getVersion: function () {
                    return "0.1.0";
                },
                isCompatible: function () {
                    return true;
                },
                make: function () {
                    return {};
                }
            };

            var instance = pluginHandler.register({}, plugin);
            expect(pluginHandler.get(plugin.getName())).toEqual(instance);
            expect(pluginHandler.get(plugin)).toEqual(instance);
        });
    });
});
