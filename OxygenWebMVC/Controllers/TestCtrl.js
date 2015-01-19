
var testCtrl = function(){    
    this.index=function (callback, form) {       
        callback({ type:'json',data:{ctl:'testCtrl', formData:form}});
    };
};

exports.TestCtrl = testCtrl;