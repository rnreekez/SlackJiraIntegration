module.exports = function (grunt) {
    grunt.registerTask('server',
        'Runs server in development mode and restarts on change.',
        function () {
            var commonTasks = ['develop', 'watch'];
            grunt.task.run(commonTasks);
        });
};