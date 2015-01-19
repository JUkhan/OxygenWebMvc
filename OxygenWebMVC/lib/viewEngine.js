
exports.ViewEngine = function () {
    var str;
    this.compile = function (tplStr) {
        var htm = ['var res=[];'], len = 0, res = [], cs = "", dx;
        str = tplStr; len = str.length;
        var o3 = false, loopid = 0;

        for (var i = 0; i < len; i++) {
            if (_ch(i) === '<' && _ch(i + 1) === 't' && _ch(i + 2) === 'p' && _ch(i + 3) === 'l' && _ch(i + 4) === '>') {
                if (cs) { htm.push('res.push(\'' + cs + '\');'); cs = ""; } i = i + 5;
                while (!(_ch(i) === '<' && _ch(i + 1) === '/' && _ch(i + 2) === 't')) {
                    cs += _ch(i);
                    i++;
                }
                htm.push(cs); cs = "";
                i += 6;
            }
            else if (_ch(i) === '<' && _ch(i + 1) === '%') {
                if (cs) { htm.push('res.push(\'' + cs + '\');'); cs = ""; } i = i + 2;
                while (!(_ch(i) === '%' && _ch(i + 1) === '>')) {
                    cs += _ch(i);
                    i++;
                }
                htm.push('res.push(' + cs + ');'); cs = "";
                i++;
            }           
            else if (_ch(i) === '\n' || _ch(i) === '\r') { }
            else { dx = _ch(i); if (dx === "\'") { dx = "\\'"; } cs += dx; }
        }
        htm.push('res.push(\'' + cs + '\');');

        return new Function('model', 'con', htm.join('') + "return res.join('');");
    };
    function _ch(i) { return str.charAt(i); }
};
