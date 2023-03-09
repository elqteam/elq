"use strict";

var constants                   = require("./constants");
var BatchProcessor              = require("batch-processor");
var forEach                     = require("./utils").forEach;
var unique                      = require("./utils").unique;
var ElementResizeDetector       = require("element-resize-detector");
var PluginHandler               = require("./plugin-handler");
var Reporter                    = require("./reporter");
var IdGenerator                 = require("./id-generator");
var IdHandler                   = require("./id-handler");
var CycleDetector               = require("./cycle-detector");
var BreakpointStateCalculator   = require("./breakpoint-state-calculator");
var StyleResolver               = require("./style-resolver");

module.exports = function Elq(options) {
    options     = options || {};
    var debug   = options.debug;

    var elq                         = {};
    var reporter                    = options.reporter || Reporter();
    var cycleDetection              = options.cycleDetection || false;
    var idGenerator                 = IdGenerator();
    var idHandler                   = IdHandler(idGenerator);
    var cycleDetector               = CycleDetector(idHandler);
    var pluginHandler               = PluginHandler(reporter);
    var styleResolver               = StyleResolver();
    var breakpointStateCalculator   = BreakpointStateCalculator({ styleResolver: styleResolver, reporter: reporter });
    var BatchProcessor              = createBatchProcessorConstructorWithDefaultOptions({ reporter: reporter });
    var batchProcessor              = BatchProcessor();
    var elementResizeDetector       = ElementResizeDetector({ debug: debug, idHandler: idHandler, reporter: reporter, strategy: "scroll", batchProcessor: batchProcessor });

    var globalListeners             = {};

    function notifyListeners(element, event, args) {
        var listeners = element.elq.listeners[event] || [];
        listeners = listeners.concat(globalListeners[event] || []);

        var listenerArguments = [element].concat(args || []);

        forEach(listeners, function (callback) {
            callback.apply(null, listenerArguments);
        });
    }

    function updateBreakpoints(element, batchProcessor) {
        var breakpoints = [];

        forEach(pluginHandler.getMethods("getBreakpoints"), function (getBreakpoints) {
            breakpoints = breakpoints.concat(getBreakpoints(element) || []);
        });

        if (!breakpoints.length) {
            return;
        }

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        // Filter so that we only get unique breakpoints.
        breakpoints = unique(breakpoints, function hash(bp) {
            return bp.dimension + bp.value + bp.type;
        });

        var breakpointStates = breakpointStateCalculator.getBreakpointStates(element, breakpoints);

        if (!breakpointStates) {
            // Unable to resolve style for element. Probably due to it being detached from the DOM.
            return;
        }

        // TODO: This should instead be hashed. Also, maybe there is a more effective way of doing this.
        // TODO: The problem with this is that if the order changes, then the hash changes.
        var breakpointStatesHash = JSON.stringify(breakpointStates);

        if (element.elq.currentBreakpointStatesHash !== breakpointStatesHash) {
            if (cycleDetection && element.elq.cycleCheck) {
                if (cycleDetector.isUpdateCyclic(element, breakpointStatesHash)) {
                    reporter.warn("Cyclic rules detected! Breakpoint classes has not been updated. Element: ", element);
                    return;
                }
            }

            element.elq.currentBreakpointStatesHash = breakpointStatesHash;

            if (element.elq.applyBreakpoints || element.elq.serialize) { // elq.serialize is deprecated. Will be removed in 1.0.0
                pluginHandler.callMethods("serializeBreakpointStates", [element, breakpointStates]); // Deprecated. Will be removed in 1.0.0
                pluginHandler.callMethods("applyBreakpointStates", [element, breakpointStates]);
            }

            notifyListeners(element, "breakpointStatesChanged", [breakpointStates]);
        }
    }

    function initElement(element) {
        element.elq = element.elq || {
            listeners: {},
            updateBreakpoints: false,
            resizeDetection: false,
            id: idGenerator.generate()
        };
    }

    function isInited(element) {
        return !!(element.elq && element.elq.id);
    }

    function isCollection(obj) {
        return Array.isArray(obj) || obj.length !== undefined;
    }

    function toArray(collection) {
        if (!Array.isArray(collection)) {
            var array = [];
            forEach(collection, function (e) {
                array.push(e);
            });
            return array;
        } else {
            return collection;
        }
    }

    function isElement(obj) {
        return obj && obj.nodeType === 1;
    }

    function activate(elements) {
        if (!elements) {
            return;
        }

        if (isElement(elements)) {
            // A single element has been passed in.
            elements = [elements];
        } else if (isCollection(elements)) {
            // Convert collection to array for plugins.
            elements = toArray(elements);
        } else {
            return reporter.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
        }

        // Get possible extra elements by plugins.
        forEach(pluginHandler.getMethods("getExtraElements"), function (getExtraElements) {
            forEach(elements, function (element) {
                var extraElements = getExtraElements(element) || [];
                elements.push.apply(elements, extraElements);
            });
        });

        // Add the elq object to all elements before activating them, since a plugin may need to listen to elements
        // that has not yet been started.
        forEach(elements, function (element) {
            if (!isInited(elements)) {
                initElement(element);
            }
        });

        // Filter out possible duplicates.
        elements = unique(elements, function (element) {
            return element.elq.id;
        });

        forEach(elements, function (element) {
            pluginHandler.callMethods("activate", [element]);
        });

        var manualBatchProcessor = BatchProcessor({ async: false, auto: false });

        //Before listening to each element (which is a heavy task) it is important to apply the right classes
        //to the elements so that a correct render can occur before the installation.
        forEach(elements, function (element) {
            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, manualBatchProcessor);
            }
        });

        function onElementResizeProxy(element) {
            notifyListeners(element, "resize");

            if (element.elq.updateBreakpoints) {
                updateBreakpoints(element, batchProcessor);
            }
        }

        forEach(elements, function listenToLoop(element) {
            if (element.elq.resizeDetection) {
                elementResizeDetector.listenTo({
                    callOnAdd: true // TODO: Shouldn't this be false?
                }, element, onElementResizeProxy);
            }
        });

        //Force everything currently in the batch to execute synchronously.
        //Important that his is done after the listenToLoop since it reads the DOM style and the batch will write to the DOM.
        manualBatchProcessor.force();
    }

    function deactivate(elements) {
        if (!elements) {
            return;
        }

        if (isElement(elements)) {
            // A single element has been passed in.
            elements = [elements];
        } else if (isCollection(elements)) {
            // Convert collection to array for plugins.
            elements = toArray(elements);
        } else {
            return reporter.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
        }

        // Only keep elq elements.
        elements = elements.filter(function (element) {
            return element.elq;
        });

        // Filter out possible duplicates.
        elements = unique(elements, function (element) {
            return element.elq.id;
        });

        forEach(elements, function (element) {
            // Let plugins deactivate themselves.
            pluginHandler.callMethods("deactivate", [element]);

            // Uninstall the resize event listener if any.
            if (element.elq.resizeDetection) {
                elementResizeDetector.uninstall(element);
            }

            // Delete the elq data of the element.
            delete element.elq;
        });
    }

    function listenTo(element, event, callback) {
        function attachListener(listeners) {
            if (!listeners[event]) {
                listeners[event] = [];
            }

            listeners[event].push(callback);
        }

        // The element parameter may be omitted, in order to setup a global listener (i.e., a listener that listens to the event of all elements).
        if (!callback) {
            callback = event;
            event = element;
            element = null;
        }

        if (element) {
            if (isCollection(element)) {
                element = element[0]; // To accept jQuery-styled element selector.
            }

            if (!isElement(element)) {
                return reporter.error("Invalid arguments. Element must be a DOM element, or a collection of a DOM element.");
            }

            // A local element event listener.

            if (!isInited(element)) {
                initElement(element);
            }

            // TODO: If event is "resize" but the element is current element.elq.resizeDetection = false,
            // it would perhaps be nice to start listening to this element.

            attachListener(element.elq.listeners);
        } else {
            // A global event listener that emits for the event of all elements.
            attachListener(globalListeners);
        }
    }

    //Public
    elq.getVersion          = getVersion;
    elq.getName             = getName;
    elq.use                 = pluginHandler.register.bind(null, elq);
    elq.using               = pluginHandler.isRegistered;
    elq.activate            = activate;
    elq.deactivate          = deactivate;
    elq.listenTo            = listenTo;

    //Create an object copy of the currently attached API methods, that will be exposed as the public API.
    var publicElq           = copy(elq);

    //Functions only accesible by plugins.
    elq.idHandler           = idHandler;
    elq.reporter            = reporter;
    elq.cycleDetector       = cycleDetector;
    elq.BatchUpdater        = BatchProcessor; // Deprecated. To be removed in 1.0.0
    elq.BatchProcessor      = BatchProcessor;
    elq.pluginHandler       = pluginHandler;

    return publicElq;
};

function getVersion() {
    return constants.version;
}

function getName() {
    return "elq";
}

function copy(o) {
    var c = {};

    for (var key in o) {
        if (o.hasOwnProperty(key)) {
            c[key] = o[key];
        }
    }

    return c;
}

function createBatchProcessorConstructorWithDefaultOptions(globalOptions) {
    globalOptions = globalOptions || {};

    function createBatchProcessorOptionsProxy(options) {
        options = options || globalOptions;

        for (var prop in globalOptions) {
            if (globalOptions.hasOwnProperty(prop) && !options.hasOwnProperty(prop)) {
                options[prop] = globalOptions[prop];
            }
        }

        return BatchProcessor(options);
    }

    return createBatchProcessorOptionsProxy;
}
