var jstex = {
    findenvbegin : function(source,envname){
	var s = "\\begin{"+envname+"}";
	var idx = source.indexOf(s);
	if(idx < 0) return idx;
	return idx+s.length;
    },
    
    findenvend : function(source,envname){
	return source.indexOf("\\end{"+envname+"}");
    },
    
    texdoc:function(source){
	var begindocument = jstex.findenvbegin(source,"document");
	var enddocument   = jstex.findenvend(source,"document");
	if(begindocument >= 0 && enddocument >= 0){
	    return jstex.tex(source.substr(begindocument,enddocument-begindocument));
	}
	return "jsTeX error: missng begin/end document!"
    },
    
    tex : function(source){
	var idx = 0;
	var out = source;
	return out;
    }
}
