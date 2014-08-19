module.exports = {
	server: {
		files: ['application/**/*.js'],
		tasks: ['jshint:application','mochaTest','develop'],
		options: {
			interrupt:true,
			nospawn:true
		}
	},
	specs: {
		files: ['test/**/*.js'],
		tasks: ['jshint:specs', 'mochaTest']
	}
};