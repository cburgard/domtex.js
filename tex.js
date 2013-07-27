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
    environments : new Object(),
	    
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
	    if(input[idx] == '%'){
		var i = jstex.findNextOf(input,"\n\r",idx+1);
		if(i > 0) idx = i;
		else idx++;
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
		} else if(input[idx+1]==='-'){
		    idx+=2;
		    respectblanks = false;
		    respectnewlines=0;
		    continue;
		} else if(input[idx+1]===' '){
		    idx+=2;
		    tokens.push(" ");
		    respectblanks = true
		    respectnewlines=0;
		    continue;
		} else if(input[idx+1]==='\\'){
		    idx+=2;
		    tokens.push("<br>");
		    respectblanks = false;
		    respectnewlines=0;
		    continue;
		}
		var endidx  = jstex.findNextOf(input,"\\{[-\t \n\r%",idx+1);
		if(endidx < 0) endidx = input.length;
		var cmdname = input.substr(idx+1,endidx-idx-1);
		var cmd     = jstex.commands[cmdname];
		if(!cmd) tokens.push(jstex.undefcommand(cmdname));
		else tokens.push(cmd),
		respectblanks = false;
		respectnewlines=0;
		idx=endidx;
		continue;
	    }
	    if(input[idx] == '{'){
		var endidx = jstex.findParenthesisMatch(input,"{","}",idx);
		if(endidx < 0){
		    console.log("WARNING: mismatched parenthesis at " + input.substr(idx-10,20));
		    idx++;
		    continue;
		}
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
	    var preamble = jstex.tokenize(source.substr(0,begindocument-16));
	    var spurious = jstex.process(preamble);
	    console.log("spurious symbols from preamble: " + spurious);
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
		out += "<span title='"+tkn.name+"'>"+jstex.unknownCSalias+"</span>";
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
    tex:function(source){
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
    newEnvironment : function(name,wrap){
	var env = new Object();
	env.name = name;
	env.wrap=wrap;
	jstex.environments[name]=env;
    },
    ignoreCommand : function(name,argc){
	if(!argc) argc=0;
	var cmd = new Object();
	cmd.name = name;
	cmd.exec = function(tokens){for(var i=0; i<argc; i++) tokens.shift();};
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

    counters : {
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

// basic symbols
jstex.newCommand("par",function(tokens){return "<br>"});
jstex.newCommand("newline",function(tokens){return "<br>"});

// basic commmands
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

// special commands

jstex.newCommand("usepackage",function(tokens){
    var arg = tokens.shift();
    if(arg.optArg){
	var pkgname = tokens.shift().join("");
    } else {
	var pkgname = arg.join("");
	arg = undefined;
    }
    console.log("including package: " +pkgname + (arg ? " with arguments: " + arg.join("") : ""));
    return "";
});

jstex.newCommand("documentclass",function(tokens){
    var arg = tokens.shift();
    if(arg.optArg){
	var pkgname = tokens.shift().join("");
    } else {
	var pkgname = arg.join("");
	arg = undefined;
    }
    console.log("using documentclass: " +pkgname + (arg ? " with arguments: " + arg.join("") : ""));
    return "";
});

jstex.newCommand("setlength",function(tokens){
    var lengthname = tokens.shift().shift().name;
    var lengthval = tokens.shift()
    jstex.lengths[lengthname]=lengthval;
    console.log("setting length "+lengthname+"="+lengthval);
    return "";
});

jstex.newCommand("setcounter",function(tokens){
    var cntname = tokens.shift().join("");
    var cntval = tokens.shift().join("");
    jstex.counters[cntname]=cntval;
    console.log("setting counter "+cntname+"="+cntval);
    return "";
});

jstex.newCommand("newcommand",function(tokens){
    var newcmd = tokens.shift();
    var cmdtkn = newcmd.shift();
    var arg = tokens.shift();
    if(arg.optArg){
	var argno = int(arg);
	arg = tokens.shift();
	if(arg.optArg){
	    var defoptarg = arg;
	    arg = tokens.shift();
	}
    }
    var cmd = arg;
    if(!cmdtkn.isUndefined){
	console.log(cmdtkn);
	console.log(cmdtkn.name + " is already defined!");
	return "";
    }
    console.log("\\newcommand\\"+cmdtkn.name+"... - call not yet implemented!");
    return "";
});

jstex.newCommand("begin",function(tokens){
    var envname = tokens.shift().join("");
    var env = jstex.environments[envname];
    if(!env){
	console.log("warning: encountered unknown begin-environment "+envname);
    } else {
	return env.wrap(tokens);
    }
    return jstex.process(tokens);
});

jstex.newCommand("csname",function(tokens){
    tokens.shift()
    return jstex.process(tokens);
});

jstex.newCommand("endcsname",function(tokens){
    return false;
});

jstex.newCommand("end",function(tokens){
    var envname = tokens.shift().join("");
    var env = jstex.environments[envname];
    var out = "";
    if(!env){
	console.log("warning: encountered unknown end-environment "+envname);
    }
    return false;
});

// extra symbols

jstex.newCommand("glqq",function(tokens){return "&bdquo;"});
jstex.newCommand("grqq",function(tokens){return "&ldquo;"});
jstex.newCommand("euro",function(tokens){return "&euro;"});
jstex.newCommand("texttimes",function(tokens){return "&times;"});
jstex.newCommand("dots",function(tokens){return "&hellip;"});
jstex.newCommand("bigskip",function(tokens){return "<div style='margin:1em'></div>"});
jstex.newCommand("&",function(tokens){return "&amp;"});



// ignored commands

jstex.ignoreCommand("sloppy");
jstex.ignoreCommand("twocolumn");
jstex.ignoreCommand("onecolumn");
jstex.ignoreCommand("noindent");
jstex.ignoreCommand("tableofcontents");
jstex.ignoreCommand("newlength");
jstex.ignoreCommand("newcounter");
jstex.ignoreCommand("geometry",1);


// environments

jstex.newEnvironment("center",function(tokens){return "<center>"+jstex.process(tokens)+"</center>"});
