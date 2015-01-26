"use strict";

var Extension = require("../extension/extension");

module.exports = function GridExtension() {
    Extension.call(this, "elq-grid", init);
}

function init(target) {
    console.log(target);
}
