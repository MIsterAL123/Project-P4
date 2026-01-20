// Global error handler
module.exports = (err, req, res, next) => {
	console.error(err.stack);
	res.status(err.status || 500);
	res.render('errors/500', {
		title: 'Server Error',
		message: err.message || 'Internal Server Error',
		error: process.env.NODE_ENV === 'development' ? err : {}
	});
};