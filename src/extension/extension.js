//TODO: Borrowed from bookie.js. Should be removed and used as a dependency instead.
//https://github.com/backslashforward/bookie.js/tree/master/src/extension

"use strict";

module.exports = Extension;

/**
 * Represents an extension that will be applied to a system.
 * @constructor
 * @public
 * @param {string} name - The name of the extension. Must be unique in the context of used extensions in a system.
 * @param {function=} init - The function to be called to init the extension to the given system.
 */
function Extension(name, init) {
    function noop() {}

    this.name = name;
    this.init = init || noop;
}

/**
 * Inits the extension to the given system. Here extensions can alter properties and methods to the given system. This method should be overriden by extensions.
 * @param {object} target - The target system that this extension should be applied to.
 */
Extension.prototype.init = function(target) {
    this.init(target);
};
