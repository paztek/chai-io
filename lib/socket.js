/*!
 * chai-io - socket.io client helper
 * Copyright(c) 2019 Matthieu Balmes <matthieu.balmes@gmail.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var http = require('http')
    , https = require('https')
    , methods = require('methods')
    , superagent = require('superagent')
    , Agent = superagent.agent
    , Request = superagent.Request
    , util = require('util');

/**
 * ## Integration Testing
 *
 * Chai IO provides an interface for live integration
 * testing via [socket.io-client](https://github.com/socketio/socket.io-client).
 * To do this, you must first
 * construct a socket to an application or url.
 *
 * Upon construction you are provided a chainable api that
 * allows you to specify the events that you want to emit or subscribe to.
 *
 * #### Application / Server
 *
 * You must use a socket.io server as the foundation for your socket.
 * If the server is not running or if it not attached to a HTTP server yet,
 * chai-io will create a HTTP server on a suitable port to start the socket.io server.
 *
 * __Note:__ This feature is only supported on Node.js, not in web browsers.
 *
 * ```js
 * chai.socket(io)
 *   .emit('message', { foo: 'bar' })
 * ```
 *
 * #### URL
 *
 * You may also use a base url as the foundation of your socket.
 *
 * ```js
 * chai.socket('http://localhost:8080')
 *   .emit('message', { foo: 'bar' })
 * ```
 */

module.exports = function (app) {

    /*!
     * @param {Mixed} function or server
     * @returns {Object} API
     */

    var server = ('function' === typeof app)
        ? http.createServer(app)
        : app
        , obj = {};

    var keepOpen = false
    if (typeof server !== 'string' && server && server.listen && server.address) {
        if (!server.address()) {
            server = server.listen(0)
        }
    }
    obj.keepOpen = function() {
        keepOpen = true
        return this
    }
    obj.close = function(callback) {
        if (server && server.close) {
            server.close(callback);
        }
        else if(callback) {
            callback();
        }

        return this
    }
    methods.forEach(function (method) {
        obj[method] = function (path) {
            return new Test(server, method, path)
                .on('end', function() {
                    if(keepOpen === false) {
                        obj.close();
                    }
                });
        };
    });
    obj.del = obj.delete;
    return obj;
};

module.exports.Test = Test;
module.exports.Request = Test;
module.exports.agent = TestAgent;

/*!
 * Test
 *
 * An extension of superagent.Request,
 * this provides the same chainable api
 * as superagent so all things can be modified.
 *
 * @param {Object|String} server, app, or url
 * @param {String} method
 * @param {String} path
 * @api private
 */

function Test (app, method, path) {
    Request.call(this, method, path);
    this.app = app;
    this.url = typeof app === 'string' ? app + path : serverAddress(app, path);
    this.ok(function() {
        return true;
    });
}
util.inherits(Test, Request);

function serverAddress (app, path) {
    if ('string' === typeof app) {
        return app + path;
    }
    var addr = app.address();
    if (!addr) {
        throw new Error('Server is not listening')
    }
    var protocol = (app instanceof https.Server) ? 'https' : 'http';
    // If address is "unroutable" IPv4/6 address, then set to localhost
    if (addr.address === '0.0.0.0' || addr.address === '::') {
        addr.address = '127.0.0.1';
    }
    return protocol + '://' + addr.address + ':' + addr.port + path;
}


/*!
 * agent
 *
 * Follows the same API as superagent.Request,
 * but allows persisting of cookies between requests.
 *
 * @param {Object|String} server, app, or url
 * @param {String} method
 * @param {String} path
 * @api private
 */

function TestAgent(app) {
    if (!(this instanceof TestAgent)) return new TestAgent(app);
    if (typeof app === 'function') app = http.createServer(app);
    (Agent || Request).call(this);
    this.app = app;
    if (typeof app !== 'string' && app && app.listen && app.address && !app.address()) {
        this.app = app.listen(0)
    }
}
util.inherits(TestAgent, Agent || Request);

TestAgent.prototype.close = function close(callback) {
    if (this.app && this.app.close) {
        this.app.close(callback)
    }
    return this
}
TestAgent.prototype.keepOpen = function keepOpen() {
    return this
}

// override HTTP verb methods
methods.forEach(function(method){
    TestAgent.prototype[method] = function(url){
        var req = new Test(this.app, method, url)
            , self = this;

        if (Agent) {
            // When running in Node, cookies are managed via
            // `Agent._saveCookies()` and `Agent._attachCookies()`.
            req.on('response', function (res) { self._saveCookies(res); });
            req.on('redirect', function (res) { self._saveCookies(res); });
            req.on('redirect', function () { self._attachCookies(req); });
            this._attachCookies(req);
        }
        else {
            // When running in a web browser, cookies are managed via `Request.withCredentials()`.
            // The browser will attach cookies based on same-origin policy.
            // https://tools.ietf.org/html/rfc6454#section-3
            req.withCredentials();
        }

        return req;
    };
});

TestAgent.prototype.del = TestAgent.prototype.delete;
