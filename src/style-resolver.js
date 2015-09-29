"use strict";

module.exports = function StyleResolver() {
    return {
        getComputedStyle: function (element) {
            return window.getComputedStyle(element);
        }
    };
};
