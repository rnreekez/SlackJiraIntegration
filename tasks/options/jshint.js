module.exports = {
    options: {
        jshintrc: '.jshintrc',
        ignores: []
    },
    all: [
        'Gruntfile.js',
        'application/{,*/}*.js',
        'test/{,*/}*.js'
    ],
    specs: [
        'test/**/*.js'
    ],
    application: [
        'application/{,*/}*.js'
    ]
};
