"use strict";

module.exports = function(grunt) {
    require("load-grunt-tasks")(grunt);

    var config = {
        pkg: grunt.file.readJSON("package.json"),
        banner: "/*!\n" +
                " * bookie.js <%= pkg.version %> (<%= grunt.template.today('yyyy-mm-dd, HH:MM') %>)\n" +
                " * <%= pkg.homepage %>\n" +
                " * Licensed under <%= pkg.license %>\n" +
                " */\n",
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
                        standalone: "elq",
                        debug: true
                    }
                }
            },
            grid: {
                src: "src/extensions/elq-grid-index.js",
                dest: "build/elq-grid.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqGrid",
                        debug: true
                    }
                }
            },
            dist: {
                src: ["src/index.js"],
                dest: "dist/elq.js",
                options: {
                    browserifyOptions: {
                        standalone: "elq"
                    }
                }
            },
            distGrid: {
                src: "src/extensions/elq-grid-index.js",
                dest: "dist/elq-grid.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqGrid"
                    }
                }
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask("build:dev", ["browserify:dev"]);
    grunt.registerTask("build:dist", ["browserify:dist", "browserify:distGrid"]);

    grunt.registerTask("build", ["build:dev", "browserify:grid"]);
    grunt.registerTask("dist", ["build:dist"]);

    grunt.registerTask("test:style", ["jshint", "jscs"]);
    grunt.registerTask("test", ["test:style", "build:dev"]); //TODO

    grunt.registerTask("default", ["test"]);
};
