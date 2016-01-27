/* global beforeAll:false, beforeEach:false, describe:false, it:false, expect:false, Elq:false, jasmine: false, _:false, spyOn: false */

"use strict";

var packageJson = require("../package.json");

function createDummyPlugin(name, make) {
    var makeFunction = make;

    if (!_.isFunction(make)) {
        makeFunction = function () {
            return make;
        };
    }

    var dummyPlugin = {
        getName: function () {
            return name;
        },
        getVersion: function () {
            return "1.33.7";
        },
        isCompatible: function () {
            return true;
        },
        make: makeFunction
    };

    return dummyPlugin;
}

describe("elq", function () {
    beforeAll(function () {
        var fixtures = document.createElement("div");
        fixtures.id = "fixtures";
        document.body.appendChild(fixtures);
    });

    beforeEach(function () {
        var test = document.createElement("div");
        test.id = "test";
        var fixtures = document.getElementById("fixtures");
        fixtures.innerHTML = "";
        fixtures.appendChild(test);
    });

    describe("Public API", function () {
        it("getName should return the name of the instance", function () {
            var elq = Elq();
            var name = elq.getName();
            expect(name).toEqual(packageJson.name); //TODO: This should be checked against the package.json file.
        });

        it("getVersion should return the version of the instance", function () {
            var elq = Elq();
            var version = elq.getVersion();
            expect(version).toEqual(packageJson.version); //TODO: This should be checked against the package.json file.
        });

        describe("use", function () {
            it("should be able to register plugins", function () {
                function checkPluginApi(elq) {
                    expect(elq.getVersion).toEqual(jasmine.any(Function));
                    expect(elq.getName).toEqual(jasmine.any(Function));
                    expect(elq.use).toEqual(jasmine.any(Function));
                    expect(elq.using).toEqual(jasmine.any(Function));
                    expect(elq.activate).toEqual(jasmine.any(Function));
                    expect(elq.listenTo).toEqual(jasmine.any(Function));
                    expect(elq.idHandler).toEqual(jasmine.any(Object));
                    expect(elq.reporter).toEqual(jasmine.any(Object));
                    expect(elq.cycleDetector).toEqual(jasmine.any(Object));
                    expect(elq.BatchUpdater).toEqual(jasmine.any(Function));
                    expect(elq.pluginHandler).toEqual(jasmine.any(Object));
                }

                var elq;
                var myPluginInstance;

                var myPlugin = {
                    getName: function () {
                        return "my-plugin";
                    },
                    getVersion: function () {
                        return "9.1.4";
                    },
                    isCompatible: function (elq) {
                        checkPluginApi(elq);
                        return true;
                    },
                    make: function (elq, options) {
                        checkPluginApi(elq);
                        return {
                            foo: function () {
                                options = options || {};
                                return elq.getName() + options.test;
                            }
                        };
                    }
                };

                spyOn(myPlugin, "getName").and.callThrough();
                spyOn(myPlugin, "getVersion").and.callThrough();
                spyOn(myPlugin, "isCompatible").and.callThrough();
                spyOn(myPlugin, "make").and.callThrough();

                //No options.
                elq = Elq();
                myPluginInstance = elq.use(myPlugin);
                expect(myPlugin.getName).toHaveBeenCalled();
                expect(myPlugin.isCompatible).toHaveBeenCalledWith(jasmine.any(Object));
                expect(myPlugin.make).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object));
                expect(myPluginInstance).toEqual(jasmine.any(Object));
                expect(myPluginInstance.foo()).toEqual(elq.getName() + undefined);

                //Plugin make options.
                elq = Elq();
                var options = {
                    test: "something"
                };
                myPluginInstance = elq.use(myPlugin, options);
                expect(myPlugin.getName).toHaveBeenCalled();
                expect(myPlugin.isCompatible).toHaveBeenCalledWith(jasmine.any(Object));
                expect(myPlugin.make).toHaveBeenCalledWith(jasmine.any(Object), options);
                expect(myPluginInstance).toEqual(jasmine.any(Object));
                expect(myPluginInstance.foo()).toEqual(elq.getName() + options.test);

                //Incompatible plugins should not be registered.
                elq = Elq({
                    reporter: {
                        error: function noop() {} //Squelch reporter error output.
                    }
                });
                myPlugin.isCompatible = function () {
                    return false;
                };
                expect(function () {
                    myPluginInstance = elq.use(myPlugin);
                }).toThrow();
            });
        });

        describe("using", function () {
            it("should tell if a plugin is being used or not, by string or plugin definition", function () {
                var myPlugin = createDummyPlugin("my-plugin", {});
                var elq = Elq();
                expect(elq.using(myPlugin)).toEqual(false);
                expect(elq.using(myPlugin.getName())).toEqual(false);
                elq.use(myPlugin);
                expect(elq.using(myPlugin)).toEqual(true);
                expect(elq.using(myPlugin.getName())).toEqual(true);
            });
        });

        // describe("activate", function () {
        //     it("should call all plugins that have a activate method", function () {
        //         var elq;
        //         var elements;

        //         var myPlugin = createDummyPlugin("my-plugin", {
        //             activate: function () {}
        //         });

        //         var myOtherPlugin = createDummyPlugin("my-other-plugin", {
        //             activate: function () {}
        //         });

        //         var myOtherExtraPlugin = createDummyPlugin("my-other-extra-plugin", {});

        //         elq = Elq();

        //         var myPluginInstance = elq.use(myPlugin);
        //         var myOtherPluginInstance = elq.use(myOtherPlugin);
        //         elq.use(myOtherExtraPlugin);

        //         spyOn(myPluginInstance, "activate");
        //         spyOn(myOtherPluginInstance, "activate");

        //         //Note that elements here can be anything. Not using strings because they are also enumerable, which makes the testing a bit hard.

        //         //Called with array.
        //         elements = [11, 22, 33, 44];
        //         elq.activate(elements);
        //         expect(myPluginInstance.activate).toHaveBeenCalledWith(elements);
        //         expect(myOtherPluginInstance.activate).toHaveBeenCalledWith(elements);
        //         myPluginInstance.activate.calls.reset();
        //         myOtherPluginInstance.activate.calls.reset();

        //         //Called with single element.
        //         elq.activate(11);
        //         expect(myPluginInstance.activate).toHaveBeenCalledWith([11]);
        //         expect(myOtherPluginInstance.activate).toHaveBeenCalledWith([11]);
        //         myPluginInstance.activate.calls.reset();
        //         myOtherPluginInstance.activate.calls.reset();

        //         //Called with an enumerable object which should be transformed to an array for plugins.
        //         elements = {
        //             length: 4,
        //             0: 11,
        //             1: 22,
        //             2: 33,
        //             3: 44
        //         };
        //         elq.activate(elements);
        //         expect(myPluginInstance.activate).toHaveBeenCalledWith([11, 22, 33, 44]);
        //         expect(myOtherPluginInstance.activate).toHaveBeenCalledWith([11, 22, 33, 44]);
        //         myPluginInstance.activate.calls.reset();
        //         myOtherPluginInstance.activate.calls.reset();

        //         // Called with falsy values should be okay.
        //         elq.activate(false);
        //         expect(myPluginInstance.activate).not.toHaveBeenCalled();
        //         expect(myOtherPluginInstance.activate).not.toHaveBeenCalled();
        //         myPluginInstance.activate.calls.reset();
        //         myOtherPluginInstance.activate.calls.reset();

        //         elq.activate([]);
        //         expect(myPluginInstance.activate).not.toHaveBeenCalled();
        //         expect(myOtherPluginInstance.activate).not.toHaveBeenCalled();
        //         myPluginInstance.activate.calls.reset();
        //         myOtherPluginInstance.activate.calls.reset();

        //         elq.activate({ length: 0 });
        //         expect(myPluginInstance.activate).not.toHaveBeenCalled();
        //         expect(myOtherPluginInstance.activate).not.toHaveBeenCalled();
        //         myPluginInstance.activate.calls.reset();
        //         myOtherPluginInstance.activate.calls.reset();
        //     });
        // });

        describe("breakpointStatesChanged", function () {
            it("should be triggered sync with the new breakpoint state when activating an element", function () {
                var elq = Elq();
                var test = document.getElementById("test");
                test.style.width = "200px";
                test.innerHTML = "<div elq-breakpoints elq-breakpoints-widths=\"100px 300px\"></div>";
                var el = test.children[0];

                var listener = jasmine.createSpy("listener");

                elq.listenTo(el, "breakpointStatesChanged", listener);
                elq.activate(el);

                expect(listener).toHaveBeenCalledWith(el, {
                    width: [{
                        breakpoint: {
                            dimension: "width",
                            pixelValue: 100,
                            value: 100,
                            type: "px"
                        },
                        over: true,
                        under: false
                    },
                    {
                        breakpoint: {
                            dimension: "width",
                            pixelValue: 300,
                            value: 300,
                            type: "px"
                        },
                        over: false,
                        under: true
                    }],
                    height: []
                });
            });
        });

        it("listenTo should be defined", function () {
            var elq = Elq();
            //Not tested more since this is a delegated function to the element-resize-detector project.
            expect(elq.listenTo).toEqual(jasmine.any(Function));
        });
    });

    describe("Plugin API", function () {
    });
});
