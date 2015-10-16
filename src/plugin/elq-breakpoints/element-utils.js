"use strict";

var utils = module.exports = {};

utils.getAttribute = function (element, attr) {
    if (element.hasAttribute(attr)) {
        return element.getAttribute(attr);
    }

    return element.getAttribute("data-" + attr);
};
