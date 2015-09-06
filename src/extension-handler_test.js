var ExtensionHandler = require("./extension-handler.js");

var reporter = {
    error: function (error) {
        throw Error(error);
    }
};

describe("ExtensionHandler", function () {
    describe("get", function () {
        it("should retrieve an extension instance by name or extension definition", function () {
            var extensionHandler = ExtensionHandler(reporter);

            var extension = {
                getName: function() {
                    return "test";
                },
                getVersion: function() {
                    return "0.1.0";
                },
                isCompatible: function() {
                    return true;
                },
                make: function(elq, globalOptions) {
                    return {};
                }
            };

            var instance = extensionHandler.register({}, extension);
            expect(extensionHandler.get(extension.getName())).toEqual(instance);
            expect(extensionHandler.get(extension)).toEqual(instance);
        });
    });
});