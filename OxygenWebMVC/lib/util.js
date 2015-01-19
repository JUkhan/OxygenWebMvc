var jsClass = function () {
};
jsClass.extend = function (prop) {
    var _super = this.prototype;
    initializing = true;
    var prototype = new this;
    initializing = false;
    for (var name in prop) {
        prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && /\b_super\b/.test(prop[name]) ? function (name, fn) {
            return function () {
                var tmp = this._super;
                this._super = _super[name];
                var ret = fn.apply(this, arguments);
                this._super = tmp;
                return ret
            }
        }(name, prop[name]) : prop[name];
    }
    function jsClass() {
        if (!initializing && this.init) {
            this.init.apply(this, arguments);
        }
    }
    jsClass.prototype = prototype;
    jsClass.prototype.constructor = jsClass;
    jsClass.extend = arguments.callee;
    return jsClass;
};


exports.Class = jsClass;
exports.Controller = jsClass.extend({
    session: null,
    query: null,
    form: null,
    url: null,
    request: null,
    response: null,
    redirect: function (path, data) {
        this.session.redirect = true;
        if (path.indexOf('http://') >= 0 || path.indexOf('https://') >= 0) {
            this.response.writeHead(301, { Location: path });
        }
        else {
            if (data) { this.session.redirectData = data; }
            this.response.writeHead(301, { Location: (this.request.socket.encrypted ? 'https://' : 'http://') + this.request.headers.host + '/' + path });
        }
        this.response.end();

    }
});


String.prototype.format = function () {
    var str = this;
    for (var i = 0, len = arguments.length; i < len; i++) {
        str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), arguments[i]);
    }
    return str;
};