String.prototype.htmlescape = function () {
	return(
		this.replace(/&/g,'&amp;').
		     replace(/>/g,'&gt;').
		     replace(/</g,'&lt;').
		     replace(/"/g,'&quot;');
	);
};

String.prototype.startsWith = function (str){
  return this.indexOf(str) == 0;
};

String.prototype.endsWith = function (str){
  if(this.length < str.length) {
    // if this.length - str.length == -1, this could cause a false positive
    return false;
  }

  return this.lastIndexOf(str) == this.length - str.length;
}
