var tachyon = require('./index');
var proxyFile = require('./proxy-file');

exports.handler = function(event, context, callback) {
	var region = process.env.S3_REGION;
	var bucket = process.env.S3_BUCKET;
	var key = decodeURIComponent(event.path.substring(1));
	key = key.replace( '/uploads/tachyon/', '/uploads/' );
	var args = event.queryStringParameters || {};
	if ( typeof args.webp === 'undefined' ) {
		args.webp = !!event.headers['X-WebP'];
	}
	return tachyon.s3({ region: region, bucket: bucket }, key, args, function(
		err,
		data,
		info
	) {
		if (err) {
			if (err.message === 'fallback-to-original') {
				return proxyFile(region, bucket, key, callback);
			}
			return context.fail(err);
		}
		var resp = {
			statusCode: 200,
			headers: {
				'Content-Type': 'image/' + info.format,
				'Cache-Control': 'max-age=31536000',
				'Last-Modified': (new Date()).toUTCString(),
			},
			body: new Buffer(data).toString('base64'),
			isBase64Encoded: true,
		};
		callback(null, resp);

		data = null;
		info = null;
		err = null;
	});
};
