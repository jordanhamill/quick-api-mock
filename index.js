var async = require('async')
  , Q = require('q')
  , path = require('path')
  , FS = require("q-io/fs")
  , restify = require('restify')
  , doT = require('dot');

doT.templateSettings = {
	varname: 'apimock',
	interpolate: /#\{([\s\S]+?)\}/g
};

function API(endpoints, options) {
	var self = this;
	options = options || {server: null};
	init();

	this.listen = function(port, callback) {
		this.server.listen(port || 8080);
		if(!port && typeof(port) === 'function') callback = port;
		if(callback)
			callback();
	};

	function init() {
		self.userState = {};

		if(!options.server) {
			self.server = restify.createServer();
		} else {
			self.server = options.server;
		}

		endpoints.forEach(function(endpoint, idx, arr) {
			var adjustedRoute = adjustRoute(endpoint.route);
			var adjustedVerb = adjustVerb(endpoint.verb);
			self.server[adjustedVerb](adjustedRoute, function(req, res, next) {
				getResponse(endpoint, req).then(function(response) {
					res.send(response);
					if(next)
						next();
				});
			});
		});
	}

	function getResponse(endpoint, req) {
		var deferred = Q.defer();
		if(endpoint.stateAdjust) {
			var c = require(endpoint.file);
			var response = c.execute(self.userState) || {};
			deferred.resolve(response);
		} else {
			FS.read(endpoint.file).then(function(text) {
				deferred.resolve (JSON.parse(replaceVars(req, text)));
			});
		}
		return deferred.promise;
	}

	function adjustVerb(verb) {
		verb = verb.toLowerCase();
		switch(verb) {
		case 'delete':
			return 'del';
		default:
			return verb;
		}
	}

	function adjustRoute(route) {
		return route.replace(/{(.+?)}/g, ':$1');
	}

	function replaceVars(req, response) {
		var vals = {
			req: req,
			state: self.userState
		};
		var t = doT.template(response);
		response = t(vals);
		return response;
	}
}

function buildApiAsync(baseDirectory, options) {
	if (typeof(baseDirectory) === 'undefined' || baseDirectory === null || baseDirectory === '') {
		throw new Error('Empty directory');
	}

	var deferred = Q.defer();
	FS.listTree(baseDirectory).then(function(directoryList) {
		async.map(directoryList, buildRoute, function(err, endpoints) {
			async.reject(endpoints, function(item, cb) { return cb(item === null); }, function(endpoints) {
				deferred.resolve(new API(endpoints, options));
			});
		});
	});

    function buildRoute(p, callback) {
        var ext = path.extname(p);
        var apiRoute = null;
        var routeName = path.dirname(p).replace(baseDirectory, '');
        if(routeName[0] != '/') {
            routeName = '/' + routeName;
        }

        if(ext === '.json') {
            apiRoute = {
                file: p,
                verb: path.basename(p, '.json'),
                route: routeName,
                stateAdjust: false
            };
        } else if(ext === '.js') {
            apiRoute = {
                file: './' + p,
                verb: path.basename(p, '.js'),
                route: routeName,

                stateAdjust: true
            };
        }
        callback(null, apiRoute);
    }


	return deferred.promise;
}


module.exports = { build: buildApiAsync };
