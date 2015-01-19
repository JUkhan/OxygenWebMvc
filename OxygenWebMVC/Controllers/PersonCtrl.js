
var PersonCtrl = function(){ 
   
    this.index=function (callback) {       
        callback({layout:'Layout', layoutAction:'Home/layout', tpl:true,
		type:'html',data:{name:'', address:'', list:PersonCtrl.list}});
    };
	
	this.add=function(callback, person){
		person.id=PersonCtrl.list.length+1;
		PersonCtrl.list.push(person);
		callback({dispatch:'Person/index'});
	}
	
};
PersonCtrl.list=[];

exports.PersonCtrl = PersonCtrl;