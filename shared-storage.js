function loadList(key){try{return JSON.parse(localStorage.getItem(key)||'[]');}catch(e){return [];}}
function saveList(key,list){localStorage.setItem(key,JSON.stringify(list));}
