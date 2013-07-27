var jstex = {
    findParenthesisMatch : function(input, openpar, closepar, idx){
	var parstack = 0;
	while(idx < input.length){
	    if(input[idx] == openpar)
		parstack++;
	    if(input[idx] == closepar)
		parstack--;
	    if(parstack == 0)
		return idx;
	    idx++;
	}
	return -1;
    },

    findNext : function(input, str, idx){
	var found = 0;
	while(idx+found < input.length){
	    if(input[idx+found] == str[found]){
		found++;
	    } else {
		idx++;
		found = 0;
	    }
	    if(found == str.length)
		return idx;
	}
	return -1;
    },

    findNextOf : function(input, str, idx){
	while(idx < input.length){
	    for(var i=0; i<str.length; i++){
		if(input[idx] == str[i]){
		    return idx;
		}
	    }
	    idx++;
	}
	return -1;
    },

    commands : new Object(),
	    
    tokenize : function(input){
	var idx = 0;
	var tokens = [];
	var respectblanks=false;
	var respectnewlines=2;
	while(idx < input.length){
	    if(input[idx] == ' '){
		if(respectblanks) tokens.push(' ');
		respectblanks = false;
		respectnewlines = 0;
		idx++;
		continue;
	    }
	    if(input[idx] == '\n' || input[idx] == '\r'){
		if(respectnewlines == 1) tokens.push('<br>');
		else if(respectblanks) tokens.push(' ');
		respectnewlines++;
		respectblanks = false;
		idx++;
		continue;
	    }
	    if(input[idx] == '\\'){
		if(input[idx+1]===','){
		    idx+=2;
		    tokens.push(" ");
		    respectblanks = false;
		    respectnewlines=0;
		    continue;
		} else if(input[idx+1]==='\\'){
		    idx+=2;
		    tokens.push("<br>");
		    respectblanks = false;
		    respectnewlines=0;
		    continue;
		}
		var endidx = jstex.findNextOf(input,"\\{[ \n\r%",idx+1);
		var cmdname = input.substr(idx+1,endidx-idx-1);
		var cmd = jstex.commands[cmdname];
		if(!cmd) tokens.push(jstex.undefcommand(cmdname));
		else tokens.push(cmd),
		respectblanks = false;
		respectnewlines=0;
		idx=endidx;
		continue;
	    }
	    if(input[idx] == '{'){
		var endidx = jstex.findParenthesisMatch(input,"{","}",idx);
		var token = jstex.tokenize(input.substr(idx+1,endidx-idx-1));
		token.optArg=false;
		tokens.push(token);
		respectblanks = true;
		respectnewlines=0;
		idx=endidx+1;
		continue;
	    }
	    if(input[idx] == '['){
		var endidx = jstex.findParenthesisMatch(input,"[","]",idx);
		var token = jstex.tokenize(input.substr(idx+1,endidx-idx-1));
		token.optArg=true;
		tokens.push(token);
		respectblanks = true;
		respectnewlines=0;
		idx=endidx+1;
		continue;
	    }
	    tokens.push(input[idx]);
	    idx++;
	    respectblanks = true;
	    respectnewlines=0;
	}
	return tokens;

    },
    undefcommand : function(name){
	var cmd = new Object();
	cmd.name = name;
	cmd.isUndefined = true;
	return cmd;
    },
    findenvbegin : function(source,envname){
	var s = "\\begin{"+envname+"}";
	var idx = source.indexOf(s);
	if(idx < 0) return idx;
	return idx+s.length;
    },
    
    findenvend : function(source,envname){
	return source.indexOf("\\end{"+envname+"}");
    },
    isArray : function(a){
	if( Object.prototype.toString.call( a ) === '[object Array]' ) {
	    return true;
	}
	return false;
    },
    texdoc:function(source){
	var begindocument = jstex.findenvbegin(source,"document");
	var enddocument   = jstex.findenvend(source,"document");
	if(begindocument >= 0 && enddocument >= 0){
	    return jstex.tex(source.substr(begindocument,enddocument-begindocument));
	}
	return "jsTeX error: missing begin/end document!"
    },
    tex2html:function(s){
	if(s=="~") return " ";
	return s;
    },
    process:function(tokens){
	var out = "";
	if(tokens === undefined)
	    return out;
	var tkn = undefined;
	var prev = " ";
	while(tokens.length > 0){
	    prev += tkn;
	    tkn = tokens.shift();
	    if(tkn === undefined){
		console.log("sorry, encountered invalid token after " + prev);
		continue;
	    }
	    if(tkn.isUndefined){
		console.log("undefined control sequence: " +tkn.name);
		out += jstex.unknownCSalias;
		continue;
	    } 
	    if(tkn.exec !== undefined){
		var result = tkn.exec(tokens);
		if(result === false)
		    return out;
		out += result;
	    } else {
		if(jstex.isArray(tkn))
		    out += jstex.process(tkn);
		else 
		    out += jstex.tex2html(tkn);
	    }
	}
	return out;
    },
    tex : function(source){
	var tokens;
	if( typeof source === 'string' ) {
	    tokens = jstex.tokenize(source);
	} else {
	    tokens = source;
	}
	return jstex.process(tokens);
    },

    newCommand : function(name,exec){
	var cmd = new Object();
	cmd.name = name;
	cmd.exec = exec;
	jstex.commands[name]=cmd;
    },
    
    tags : {
	section : "h1",
	subsection : "h2",
	subsubsection : "h3"
    },

    lengths : {
	frameborder : "1px"
    },
    beginsWith : function(str,begin){
	if(str.indexOf(begin) == 0)
	    return true;
	return false;
    },
    linkify : function(str){
	if(jstex.beginsWith(str,"http://") || jstex.beginsWith(str,"https://") || jstex.beginsWith(str,"mailto:"))
	    return str;
	return "http://"+str;
    },
    unknownCSalias : "&#65533;"
}

jstex.newCommand("par",function(tokens){return "<br>"});
jstex.newCommand("glqq",function(tokens){return "&bdquo;"});
jstex.newCommand("grqq",function(tokens){return "&ldquo;"});
jstex.newCommand("euro",function(tokens){return "&euro;"});
jstex.newCommand("newline",function(tokens){return "<br>"});
jstex.newCommand("textit",function(tokens){return "<i>"+jstex.tex(tokens.shift())+"</i>"});
jstex.newCommand("url",function(tokens){ var link = tokens.shift().join(""); return "<a href='"+jstex.linkify(link)+"'>"+link+"</a>";});
jstex.newCommand("textbf",function(tokens){return "<b>"+jstex.tex(tokens.shift())+"</b>"});
jstex.newCommand("textsc",function(tokens){return "<span style='font-variant:small-caps'>"+jstex.tex(tokens.shift())+"</span>"});
jstex.newCommand("section",function(tokens){return "<"+jstex.tags["section"]+">"+jstex.tex(tokens.shift())+"</"+jstex.tags["section"]+">"});
jstex.newCommand("subsection",function(tokens){return "<"+jstex.tags["subsection"]+">"+jstex.tex(tokens.shift())+"</"+jstex.tags["subsection"]+">"});
jstex.newCommand("subsubsection",function(tokens){return "<"+jstex.tags["subsubsection"]+">"+jstex.tex(tokens.shift())+"</"+jstex.tags["subsubsection"]+">"});
jstex.newCommand("mbox",function(tokens){return "<span style='white-space:nowrap'>"+jstex.tex(tokens.shift())+"</span>"});
jstex.newCommand("fbox",function(tokens){return "<span style='white-space:nowrap; border:"+jstex.lengths.frameborder+"'>"+jstex.tex(tokens.shift())+"</span>"});
jstex.newCommand("parbox",function(tokens){return "<span'>"+jstex.tex(tokens.shift())+"</span>"});
jstex.newCommand("begin",function(tokens){
    tokens.shift();
    return jstex.process(tokens);
});
jstex.newCommand("end",function(tokens){
    tokens.shift();
    return false;
});
