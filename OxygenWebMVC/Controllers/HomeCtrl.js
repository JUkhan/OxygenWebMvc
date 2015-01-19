var util = require("../lib/util.js");

var homeCtrl = util.Controller.extend({    
    index: function (callback, form, query) {
        //this.session.data.isAuthenticated = true;
        callback({layout:'layout',tpl:true ,layoutAction:'Home/layout'});
    },
    getData: function (callback, form, query) {
         callback({ type: 'json', data: { form: form, query: query } });
    },
    add: function (callback, form, query){ 		
        //callback({ layout: 'layout', layoutAction: 'Home/layout', view: 'Home/temp', tpl: true, data: form });
		this.redirect('Test/index', form);
    },
    layout : function (callback) {
        var _data = {
            title: 'Oxygen-',
            menuList: [{ path: '/', name: 'Home' },{ path: '/Person', name: 'Person' }]
        };
        callback({ data: _data});
    },
    getMsg: function (str) {
        return 'Hello ' + str;
    }
});

exports.HomeCtrl = homeCtrl;