module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        slim: {
            dev: {
                options: {
                    pretty: true
                },
                files: {
                    'views/settings/index.html': 'views/settings/index.html.slim',
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-slim');

    grunt.registerTask('default', ['slim:dev']);
};