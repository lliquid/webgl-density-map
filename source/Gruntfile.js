/**
 * Created by panpan on 5/24/14.
 */

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            src: 'js',
            dest: 'build'
        },
        concat: {
            options: {
                seperator: ';'
            },
           application: {
                src: ['js/lib/gl.js',
                        'js/lib/OrthographicZoomAndPanControls.js',
                        'js/config.js',
                        'js/shader.js',
                        'js/dm.js',
                        'js/app.js'],
                dest: 'build/app.build.js'
            },
           density_map: {
                src: ['js/lib/gl.js',
                        'js/lib/OrthographicZoomAndPanControls.js',
                        'js/config.js',
                        'js/shader.js',
                        'js/dm.js'],
                dest: 'build/density_map.js'
            }
        },
        jshint: {
            files: ['Gruntfile.js'],
            options: {}
        },
        watch :{
            scripts: {
                files: ['js/*.js', 'js/*/*.js', 'js/*/*/*.js'],
                tasks: ['concat']
            }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-bower-install");
    grunt.loadNpmTasks("grunt-contrib-jshint");

    grunt.registerTask('develop', ['concat', 'jshint', 'watch']);
};