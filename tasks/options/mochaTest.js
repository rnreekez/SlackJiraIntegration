module.exports = {
    test : {
        options: {
            reporter: 'spec',
        },
        src: ['test/**/*.js'],
        require: 'coverage/blanket'
    },
    coverage: {
        options: {
            reporter: 'html-cov',
            quiet:true,
            captureFile:'coverage.html'
        },
        src: ['test/**/*.js']
    }
};