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
            dist: {
                src: ["src/index.js"],
                dest: "dist/elq.js",
                options: {
                    browserifyOptions: {
                        standalone: "Elq"
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
        },
        watch: {
            scripts: {
                files: ["src/**/*.js", "test/**/*.js"],
                tasks: ["build"],
                options: {
                    spawn: false
                }
            }
        },
        uglify: {
            dist: {
                src: "dist/elq.js",
                dest: "dist/elq.min.js"
            }
        },
    };

    grunt.initConfig(config);

    grunt.registerTask("build:dev", ["browserify:dev"]);
    grunt.registerTask("build:test", ["browserify:test"]);
    grunt.registerTask("build:dist", ["browserify:dist", "uglify:dist"]);

    grunt.registerTask("build", ["build:dev", "build:test"]);
    grunt.registerTask("dist", ["build:dist"]);

    grunt.registerTask("test:style", ["jshint", "jscs"]);
    grunt.registerTask("test", ["test:style", "build:dev", "build:test", "karma:local"]);

    grunt.registerTask("default", ["test"]);
};
