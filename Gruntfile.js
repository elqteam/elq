"use strict";

module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt);

    var config = {
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            src: {
                src: ["src/**/*.js", "*.js"]
            },
            test: {
                src: "test/**/*.js"
            },
            options: {
                jshintrc: true
            }
        },
        jscs: {
            all: ["src/**/*.js", "test/**/*.js", "*.js"],
            options: {
                config: ".jscs.json"
            }
        },
        browserify: {
            dev: {
                src: ["src/index.js"],
                dest: "build/elq.js",
                options: {
                    browserifyOptions: {
                        standalone: "Elq",
                        debug: true
                    }
                }
            },
            breakpoints: {
                src: "src/plugin/elq-breakpoints-index.js",
                dest: "build/elq-breakpoints.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqBreakpoints",
                        debug: true
                    }
                }
            },
            mirror: {
                src: "src/plugin/elq-mirror-index.js",
                dest: "build/elq-mirror.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqMirror",
                        debug: true
                    }
                }
            },
            dist: {
                src: ["src/index.js"],
                dest: "dist/elq.js",
                options: {
                    browserifyOptions: {
                        standalone: "Elq"
                    }
                }
            },
            distBreakpoints: {
                src: "src/plugin/elq-breakpoints-index.js",
                dest: "dist/elq-breakpoints.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqBreakpoints"
                    }
                }
            },
            distMirror: {
                src: "src/plugin/elq-mirror-index.js",
                dest: "dist/elq-mirror.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqMirror"
                    }
                }
            },
            test: {
                src: ["test/**/*_test.js", "src/**/*_test.js"],
                dest: "build/tests.js"
            }
        },
        karma: {
            local: {
                configFile: "karma.conf.js",
                options: {
                    browsers: [
                        "Chrome",
                        "Safari",
                        "Firefox"
                        //"IE8 - Win7",
                        //"IE10 - Win7",
                        //"IE11 - Win8.1"
                    ],
                    singleRun: true
                }
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask("build:dev", ["browserify:dev"]);
    grunt.registerTask("build:test", ["browserify:test"]);
    grunt.registerTask("build:dist", ["browserify:dist", "browserify:distBreakpoints", "browserify:distMirror"]);

    grunt.registerTask("build", ["build:dev", "browserify:breakpoints", "browserify:mirror", "build:test"]);
    grunt.registerTask("dist", ["build:dist"]);

    grunt.registerTask("test:style", ["jshint", "jscs"]);
    grunt.registerTask("test", ["test:style", "build:dev", "build:test", "karma:local"]);

    grunt.registerTask("default", ["test"]);
};
