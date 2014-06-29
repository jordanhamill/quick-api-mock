var should = require('should'),
    sinon = require('sinon'),
    apimock = require('../index');

describe('apimock.build()', function () {
    var api;
    var directory;
    var mockFs;
    describe('when the directory is null', function () {
        beforeEach(function () {
            directory = null;
        });

        it('throws an error', function () {
            (function(){
              apimock.build(directory);
            }).should.throw();
        });
    });

    describe('with a directory structure of', function () {
        before(function (done) {
            apimock.build('test/api').then(function (builtApi) {
                api = builtApi;
                done();
            });
        });

        describe('/test/get.json', function () {
            it('should have a handler for GET /test', function () {
                api.server.routes.should.have.property('gettest');
            });
            it('responds with JSON {"test": "Hello, World"} for GET /test', function (done) {
                var res = {send: function() {}};
                var mock = sinon.mock(res);
                mock.expects("send").withArgs({"test": "Hello, World"});
                var response = api.server.routes.gettest[0]({}, res, function() {
                    mock.verify();
                    done();
                });
            });
        });
        describe('/test2/{id}/get.json', function () {
            it('should have a handler for GET /test2/:id', function () {
                api.server.routes.should.have.property('gettest2id');
            });
            describe('/test2/{id}/message/get.json', function () {
                it('should have a handler for GET /test2/:id/message', function() {
                    api.server.routes.should.have.property('gettest2idmessage');
                });
                describe('/test2/{id}/message/get.json', function () {
                    it('responds with JSON {"test": 1234} for a GET /test2/1234/message', function(done) {
                        var res = {send: function() {}};
                        var mock = sinon.mock(res);
                        mock.expects("send").withArgs({"test":1234});
                        var response = api.server.routes.gettest2idmessage[0]({params: {id: 1234}}, res, function() {
                            mock.verify();
                            done();
                        });
                    });
                });
            });
        });
        describe('/test3/get.js', function () {
            describe('and when the route GET /test3 is called', function () {
                it('changes the user state variable "name" to "Jordan"', function(done) {
                    var res = {send: function() {}};
                    var fn = api.server.routes.gettest3[0];
                    var response = fn({}, res, function(nreq, nres, next) {
                        api.userState.name.should.equal('Jordan');
                        done();
                    });
                });
            });
        });
    });

    describe('api.listen()', function () {
        var api;
        var server;
        describe('when a server is given to apimock', function () {
            it('calls the servers listen method', function (done) {
                this.timeout(12000);
                server = {
                    listen: function() {},
                    get: function(rt, cb) {}
                };
                var mock = sinon.mock(server);
                mock.expects("listen").once();

                apimock.build('test/api', {server: server}).then(function (builtApi) {
                    builtApi.listen();
                    mock.verify();
                    done();
                });
            });
        });
    });
});
