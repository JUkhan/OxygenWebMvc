
       function loadData() {
           jQuery.post('/Home/getData', JSON.stringify({ name: 'ripon', address: 'tangail', msg: {dox:123} }), function (res) { console.log(res); });
       }
       function loadData2() {
           jQuery.get('/Home/getData?name=jasim&add=tan',  function (res) { console.log(res); });
       }
