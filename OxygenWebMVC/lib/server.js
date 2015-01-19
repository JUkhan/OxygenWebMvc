var http = require("http"),
 url = require("url"),
 util = require("./util.js"),
 qs = require("querystring"),
 path = require('path'),
 fs = require('fs'),
 tpl = require("./viewEngine.js"),
 session = require('./sessionManager/core').session;
_serverOpts = null;

exports.start = function (opts) {
    _serverOpts = opts;
    function onRequest(request, response) {
        session(request, response, function (request, response) {
            new router(request, response);
        });
    }
    opts.port = opts.port || 8888;
    opts.host = opts.host || "127.0.0.1";

    return http.createServer(onRequest)
	.listen(opts.port, opts.host, function () { console.log("server up and running."); });

};

var router = util.Class.extend({
    url: null,
    request: null,
    response: null,
    formData: {},
    queryData: {},
    ctrlName: '',
    actionName: '',
    con: null,
    header: {},
    init: function (request, response) {
        this.request = request;
        this.response = response;
        this.url = url.parse(request.url);
        request.session.redirect = false;
        var extname = path.extname(request.url);
        if (extname) {
            this.transferStaticFile(extname);
        } else {
            this.queryData = qs.parse(this.url.query);
            this.processTheRequest();
        }
    },
    processTheRequest: function () {
        try {
            var that = this;
            this.request.on('data', function (chunk) {
                var str = chunk.toString();
                try {
                    that.formData = JSON.parse(str);
                }
                catch (ex) {
                    that.formData = qs.parse(str);
                }

            });
            this.request.on('end', function () {
                that.getResponse();
            });
            if (this.url.pathname === '/') {
                this.ctrlName = _serverOpts.defaults.controller;
                this.actionName = _serverOpts.defaults.action;
            }
            else {

                var pathName = this.url.pathname;
                pathName = pathName.substring(1);
                if (pathName[pathName.index - 1] === '/') {
                    pathName = pathName.substring(0, pathName.index - 1);
                }
                var pathArr = pathName.split('/');
                if (pathArr) {
                    this.ctrlName = pathArr[0];
                    this.actionName = pathArr[1] || 'index';
                }
            }

        } catch (ex) { this.sendMessage('<h3>{0}</h3><p>{1}</p>'.format(ex.message, ex.stack)); }
    },
    getResponse: function () {
        try {
            var ctrl = require('../Controllers/{0}Ctrl.js'.format(this.ctrlName));
            var ctrlInstance = new ctrl[this.ctrlName + 'Ctrl']();
            this.con = ctrlInstance;
            this.setParentOpts(ctrlInstance);
            var that = this;
            ctrlInstance[this.actionName](function (data) { if (!that.con.session.redirect) { that.processResponseData(data || {}); } }, this.formData, this.queryData);

        } catch (ex) { this.sendMessage('<h3>{0}</h3><p>{1}</p>'.format(ex.message, ex.stack)); }
    },
    processResponseData: function (res) {
        res.type = res.type || 'html';
        res.view = res.view ? ('./Views/' + res.view + '.html') : ('./Views/{0}/{1}.html'.format(this.ctrlName, this.actionName));
        if (res.dispatch) {
            var arr = res.dispatch.split('/');
            if (arr.length == 1) {
                this.actionName = arr[0];
            }
            else if (arr.length == 2) {
                this.ctrlName = arr[0];
                this.actionName = arr[1];
            }
            this.formData = res.data;
            this.getResponse();
        }
        else {
            this.setContentType(res);
        }
    },
    setContentType: function (res) {
        var that = this;
        res.data = res.data || {};
        switch (res.type) {
            case 'json':
                that.header['Content-Type'] = 'application/json';
                that.sendData(JSON.stringify(res.data));
                break;

            default:
                that.header['Content-Type'] = 'text/html';                
                that.getTemplate(function (data) {
                    if (data.success) {
                        if (res.tpl) {
                            data.content = new tpl.ViewEngine().compile(data.content)(res.data, that.con);
                        }
                        if (res.layout) {
                            var layoutPath = './Views/Layouts/{0}.html'.format(res.layout);                            
                            that.getTemplate(function (layoutData) {
                                if (layoutData.success) {
                                    
                                    if (res.layoutAction) {
                                        that.getDynamicLayout(res, layoutData.content, function (res) {
                                            that.sendData(res.replace("@RenderBody()", data.content));
                                        });
                                    }
                                    else {
                                        that.sendData(layoutData.content.replace("@RenderBody()", data.content));
                                    }
                                }
                            }, layoutPath);
                        } else {that.sendData(data.content); }
                    }
                    
                }, res.view);


                break;
        }
    },
    getDynamicLayout: function (res, content, callback) {
        try {
            var arr = res.layoutAction.split('/');
            if (arr.length == 1) { callback(content); }
            else {
               
                var ctrl = require('../Controllers/{0}Ctrl.js'.format(arr[0]));
                var ctrlInstance = new ctrl[arr[0] + 'Ctrl']();                
                this.setParentOpts(ctrlInstance);
                
                ctrlInstance[arr[1]](function (res) {
                    callback(new tpl.ViewEngine().compile(content)(res.data, ctrlInstance));
                },  this.formData, res.data);
            }

        } catch (ex) { this.sendMessage('<h3>{0}</h3><p>{1}</p>'.format(ex.message, ex.stack)); }
    },
    getTemplate: function (callback, path) {        
        fs.exists(path, function (exists) {
            if (exists) {
                fs.readFile(path, 'utf8', function (error, content) {                    
                    if (error) {
                        that.sendData("<b>View: '{0}'</b><div>error: {1}</div>".format(path, error));
                    }
                    else {
                        callback({ success: true, content: content.toString() });
                    }
                });
            } else {
                that.sendData("<b>View: '{0}' not found</b>".format(res.view));
                callback({ success: false, content: null });
            }
        });
    },
    setParentOpts: function (ctrl) {
        ctrl.request = this.request;
        ctrl.response = this.response;
        ctrl.query = this.url.query;
        ctrl.url = this.url;
        ctrl.form = this.formData;
        ctrl.session = this.request.session;
        if (ctrl.session.redirectData) {
            this.formData = ctrl.session.redirectData;
            delete this.request.session.redirectData;
        }
        ctrl.redirect = ctrl.redirect || function (path, data) {
            this.session.redirect = true;
            if (path.indexOf('http://') >= 0 || path.indexOf('https://') >= 0) {
                this.response.writeHead(301, { Location: path });
            }
            else {
                if (data) { this.session.redirectData = data; }
                this.response.writeHead(301, { Location: (this.request.socket.encrypted ? 'https://' : 'http://') + this.request.headers.host + '/' + path });
            }
            this.response.end();

        };
    },
    sendData: function (data) {
        this.response.writeHead(200, this.header);
        this.response.write(data);
        this.response.end();
    },
    sendMessage: function (msgHtml) {
        this.response.writeHead(200, { "Content-Type": "text/html" });
        this.response.write(msgHtml);
        this.response.end();
    },
    transferStaticFile: function (ext) {
        try {
            var filePath = '.' + this.request.url;
			 //console.log(filePath);
			if(filePath.indexOf('?')>0){
				filePath=filePath.substring(0, filePath.indexOf('?'));
			}
            //console.log(filePath);
            var contentType ='application/octet-stream';// 'text/html';
            switch (ext) {
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
            }
            var res = this.response;

            fs.exists(filePath, function (exists) {

                if (exists) {
                    fs.readFile(filePath, function (error, content) {
                        if (error) {
                            res.writeHead(500);
                            res.end();
                        }
                        else {
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(content);
                        }
                    });
                }
                else {
				console.log("404 static file not loading error:", filePath);
                    res.writeHead(404);
                    res.end();
                }
            });

        } catch (ex) { this.sendMessage('<h3>{0}</h3><p>{1}</p>'.format(ex.message, ex.stack)); }
    }
});
//017895616093, 019222593858