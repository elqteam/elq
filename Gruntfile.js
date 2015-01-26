"use strict";

module.exports = function(grunt) {
    require("load-grunt-tasks")(grunt);

    var config = {
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
                src: ["src/elq.js"],
                dest: "build/elq.js",
                options: {
                    browserifyOptions: {
                        standalone: "elq",
                        debug: true
                    }
                }
            },
            dist: {
                src: ["src/elq.js"],
                dest: "build/elq.js",
                options: {
                    browserifyOptions: {
                        standalone: "elq"
                    }
                }
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask("build:dev", ["browserify:dev"]);
    grunt.registerTask("build:dist", ["browserify:dist"]);

    grunt.registerTask("build", ["browserify"]);
    grunt.registerTask("dist", ["build:dist"]);

    grunt.registerTask("test:style", ["jshint", "jscs"]);
    grunt.registerTask("test", ["test:style", "build:dev"]); //TODO

    grunt.registerTask("default", ["test"]);
};
