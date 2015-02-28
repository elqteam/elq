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
            breakpoints: {
                src: "src/extensions/elq-breakpoints-index.js",
                dest: "build/elq-breakpoints.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqBreakpoints",
                        debug: true
                    }
                }
            },
            mirror: {
                src: "src/extensions/elq-mirror-index.js",
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
                        standalone: "elq"
                    }
                }
            },
            distBreakpoints: {
                src: "src/extensions/elq-breakpoints-index.js",
                dest: "dist/elq-breakpoints.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqBreakpoints"
                    }
                }
            },
            distMirror: {
                src: "src/extensions/elq-mirror-index.js",
                dest: "dist/elq-mirror.js",
                options: {
                    browserifyOptions: {
                        standalone: "elqMirror"
                    }
                }
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask("build:dev", ["browserify:dev"]);
    grunt.registerTask("build:dist", ["browserify:dist", "browserify:distBreakpoints", "browserify:distMirror"]);

    grunt.registerTask("build", ["build:dev", "browserify:breakpoints", "browserify:mirror"]);
    grunt.registerTask("dist", ["build:dist"]);

    grunt.registerTask("test:style", ["jshint", "jscs"]);
    grunt.registerTask("test", ["test:style", "build:dev"]); //TODO

    grunt.registerTask("default", ["test"]);
};
