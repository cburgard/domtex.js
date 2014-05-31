var jstex = {
    shift:function(a1,a2){
	while(a1.length>0){
	    a2.unshift(a1.pop());
	}
    },
    Command : function(name,expand){
	var cmd = new Object();
	cmd.name = name;
	cmd.expand = expand;
	jstex.commands[name]=cmd;
	return cmd;
    },
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
		if(respectnewlines == 1) tokens.push(jstex.commands['par']);
		else if(respectblanks) tokens.push(' ');
		respectnewlines++;
		respectblanks = false;
		idx++;
		continue;
	    }
	    if(input[idx] == '#'){
		tokens.push({ name:"#localVariable", index:input[idx+1] }); 
		respectnewlines = 0;
		respectblanks = false;
		idx+=2;
		continue;
	    }
	    if(input[idx] == '$'){
		if(jstex.inMathMode){
		    var tkn = jstex.commands["end"];
		    jstex.inMathMode = false;
		    respectblanks = true;
		    respectnewlines = 0;
		} else {
		    var tkn = jstex.commands["begin"];
		    jstex.inMathMode = true;
		    respectblanks = false;
		    respectnewlines = 2;
		}
		tokens.push(tkn);
		tokens.push(["$"]);
		idx++;
	    }
	    if(input[idx] == '-'){
		if(input[idx+1] == '-'){
		    if(input[idx+2] == '-'){
			tokens.push(jstex.commands["textmdash"]);
			idx+=3;
		    } else {
			tokens.push(jstex.commands["textndash"]);
			idx+=2;
		    }
		    respectnewlines = 0;
		    respectblanks = true;
		    continue;
		}
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
		respectnewlines=2;
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
	var cmd = jstex.Command(name,undefined);
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
    isArray : function(a) {
	return (!!a) && (a.constructor === Array);
    },
    texdoc:function(source){
	var begindocument = jstex.findenvbegin(source,"document");
	var enddocument   = jstex.findenvend(source,"document");
	if(begindocument >= 0 && enddocument >= 0){
	    var preamble = jstex.tokenize(source.substr(0,begindocument-16));
	    var spurious = jstex.expand(preamble);
	    console.log("spurious symbols from preamble: " + spurious);
	    jstex.isParagraphOpen=false;
	    var content = document.createElement("div");
	    content.innerHTML=jstex.tex(source.substr(begindocument,enddocument-begindocument));
	    content.className="jsTeX";
	    jstex.cleanpars();
	    if(MathJax){
		var mathdivs = document.getElementsByClassName("MathJax");
		console.log("MathJax found - executing on "+mathdivs.length+" items!");
		for(var i=0; i<mathdivs.length; i++){
		    console.log(mathdivs[i].id);
		    MathJax.Hub.Queue(["Typeset",MathJax.Hub,mathdivs[i].id]);
		}
	    }	
	    return content;
	}
	return "jsTeX error: missing begin/end document!"
    },
    tex2html:function(s){
	if(s===undefined)return "<span title='undefined'>"+jstex.unknownCSalias+"</span>";
	if(s===false)    return "<span title='false'>"+jstex.unknownCSalias+"</span>";
	if(s=="~") return " ";
	return s;
    },
    expandNumber:function(tokens){
	var result = "";
	while(tokens.length > 0){
	    var tkn =  jstex.expandNext(tokens);
	    if(isNaN(result+tkn)){
		if(result.length < 1){
		    console.log("invalid numeric value: " +result+tkn);
		    return "0";
		} else break;
	    }
	    result += tkn;
	}
	return result;
    },
    expandUnit:function(tokens){
	var result = "";
	while(tokens.length > 0 && result.length < 2){
	    var tkn = jstex.expandNext(tokens);
	    result += tkn;
	}
	return result;
    },
    expandLength:function(tokens){
	var number = jstex.expandNumber(tokens);
	var unit = jstex.expandUnit(tokens);
	return number+unit;
    },
    expandNext:function(tokens){
	if(jstex.isArray(tokens)){
	    var tkn = tokens.shift();
	} else {
	    var tkn = tokens;
	}
	if(tkn === undefined){
	    console.log("sorry, encountered invalid token");
	    return undefined;
	}
	if(tkn.isUndefined){
	    console.log("undefined control sequence: " +tkn.name);
	    return "<span title='"+tkn.name+"'>"+jstex.unknownCSalias+"</span>";
	    return undefined;
	} 
	if(tkn.expand !== undefined){
	    var result = tkn.expand(tokens);
	    return result;
	} else {
	    if(jstex.isArray(tkn))
		return jstex.expand(tkn);
	    else 
		return jstex.tex2html(tkn);
	}
    },
    expand:function(tokens){
	var out = "";
	if(tokens === undefined)
	    return "";
	while(tokens.length > 0){
	    var result = jstex.expandNext(tokens);
	    if(result === false){
		return out;
	    }
	    if(result === undefined){
		continue;
	    }
	    out += result;
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
	return jstex.expand(tokens);
    },

    readUntilEnd:function(tokens,end){
	var out = [];
	while(tokens.length > 0){
	    var tkn = tokens.shift();
	    if(tkn.name != "end"){
		out.push(tkn);
		continue;
	    }
	    var nexttkn = tokens.shift();
	    if(jstex.expand(nexttkn) == end){
		return out;
	    } 
	    out.push(tkn);
	    out.push(nexttkn);
	}
	console.log("ERROR: missing \\end{"+end+"}")
	return out;
    },
    expandLocalCopy:function(tokens,local){
	var out = [];
	var i=0;
	while(i < tokens.length){
	    var tkn = tokens[i];
	    if(tkn.name == "#localVariable"){
		out.push(local[tkn.index]);
	    } else if(jstex.isArray(tkn)){
		out.push(jstex.expandLocal(tkn,local));
	    } else {
		out.push(tkn);
	    } 
	    i++;
	}
	return out;
    },
    setLength : function(name,val){
	jstex.lengths[name]=val;
	return "setting length "+name+"="+val;
    },

    newCommand : function(name,expand){
	return jstex.Command(name,expand);
    },
    newEnvironment : function(name,expand){
	var env = new Object();
	env.name = name;
	env.expand=expand;
	jstex.environments[name]=env;
	return env;
    },
    ignoreCommand : function(name,argc){
	if(!argc) argc=0;
	expand = function(tokens){for(var i=0; i<this.argc; i++) tokens.shift();};
	var cmd = jstex.Command(name,expand);
	cmd.argc = argc;
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
    isParagraphOpen : true,
    inMathMode : false,
    beginpar:function(){
	if(!jstex.isParagraphOpen){
	    jstex.isParagraphOpen = true;
	    return "<p name='texpar'>";
	}
	return "";
    },
    cleanpars:function(){
	var pars = document.getElementsByName('texpar');
	for(var i=0;i<pars.length; i++){
	    if(pars[i].innerHTML.trim().length == 0)
		pars[i].parentNode.removeChild(pars[i]);
	}
    },
    endpar:function(){
	if(jstex.isParagraphOpen){
	    jstex.isParagraphOpen = false;
	    return "</p>";
	}
	jstex.isParagraphOpen = false;
	return "";
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
jstex.Command.prototype.toString = function(){return this.name};


// basic symbols
jstex.newCommand("par",function(tokens){
    var retval = jstex.endpar();
//    retval += "<span style='color:#FF0000'>\\par"+jstex.isParagraphOpen+"</span>";
    retval += jstex.beginpar();
    return retval;
});
jstex.newCommand("newline",function(tokens){return "<br>"});

// basic commmands
jstex.newCommand("url",function(tokens){ var link = tokens.shift().join(""); return "<a href='"+jstex.linkify(link)+"'>"+link+"</a>";});

// sectioning
var sections = ["section","subsection","subsubsection"];
for(var i=0; i<sections.length; i++){
    var tag = jstex.tags[sections[i]];
    jstex.newCommand(sections[i],function(tokens){
	var retval = jstex.endpar();
	var retval = "<"+tag+">"+jstex.tex(tokens.shift())+"</"+tag+">";
	retval += jstex.beginpar();
	return retval;
    });
};


// font choices
jstex.newCommand("textit",function(tokens){return "<i>"+jstex.tex(tokens.shift())+"</i>"});
jstex.newCommand("textbf",function(tokens){return "<b>"+jstex.tex(tokens.shift())+"</b>"});
jstex.newCommand("textsc",function(tokens){return "<span style='font-variant:small-caps'>"+jstex.tex(tokens.shift())+"</span>"});
jstex.newCommand("bfseries",function(tokens){return "<b>"+jstex.expand(tokens)+"</b>"});
jstex.newCommand("itshape",function(tokens){return "<i>"+jstex.expand(tokens)+"</i>"});
jstex.newCommand("twistshape",function(tokens){return "<i>"+jstex.expand(tokens)+"</i>"});
jstex.newCommand("sqrcfamily",function(tokens){return "<span style='font-variant:small-caps'>"+jstex.expand(tokens)+"</span>"});

jstex.setLength("tiny","6pt");
jstex.setLength("footnotesize","8pt");
jstex.setLength("small","10pt");
jstex.setLength("normalsize","12pt");
jstex.setLength("large","14pt");
jstex.setLength("Large","16pt");
jstex.setLength("LARGE","18pt");
jstex.setLength("huge","20pt");
jstex.setLength("Huge","22pt");
jstex.setLength("HUGE","24pt");
var fontsizes = ["tiny","footnotesize","small","normalsize","large","Large","LARGE","huge","Huge","HUGE"];
for(var i=0; i<fontsizes.length; i++){
    var fs = fontsizes[i];
    jstex.newCommand(fontsizes[i],function(tokens){return "<span style='font-size:"+jstex.lengths[fs]+"'>"+jstex.expand(tokens)+"</span>"});
}


// boxes
jstex.newCommand("mbox",function(tokens){return "<span style='white-space:nowrap'>"+jstex.tex(tokens.shift())+"</span>"});
jstex.newCommand("fbox",function(tokens){return "<span style='white-space:nowrap; border:"+jstex.lengths.frameborder+"'>"+jstex.tex(tokens.shift())+"</span>"});
jstex.newCommand("parbox",function(tokens){return "<span'>"+jstex.tex(tokens.shift())+"</span>"});

// spacing
jstex.setLength("bigskip","1em");
jstex.setLength("smallskip","0.5em");
jstex.newCommand("bigskip",function(tokens){return "<div style='margin:"+jstex.lengths["bigskip"]+"'></div>"});
jstex.newCommand("smallskip",function(tokens){return "<div style='margin:"+jstex.lengths["smallskip"]+"'></div>"});
jstex.newCommand("vspace",function(tokens){return "<div style='margin:"+jstex.expandNext(tokens)+"'></div>"});
jstex.newCommand("vskip",function(tokens){return "<div style='margin:"+jstex.expandLength(tokens)+"'></div>"});




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
    console.log(jstex.setLength(tokens.shift().shift().name,jstex.expand(tokens.shift())));
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
    var argc = 0;
    if(arg.optArg){
	var argc = int(arg);
	arg = tokens.shift();
	if(arg.optArg){
	    var defoptarg = arg;
	    arg = tokens.shift();
	}
    }
    var cmddef = arg;
    var cmdname = cmdtkn.name;
    if(!cmdtkn.isUndefined){
	console.log(cmdname + " is already defined!");
	return "";
    }
    console.log("\\newcommand\\"+cmdname+"... - call not yet implemented!");
    console.log(argc,cmddef);
    var cmd = jstex.Command(cmdname,function(tkns){
	var argv=[];
	for(var i=0; i<this.argc; i++){
	    argv.push(tkns.shift());
	}
	var local = jstex.expandLocalCopy(this.definition);
	jstex.shift(local,tkns);
	return jstex.expand(tkns);
    });
    cmd.definition = cmddef;
    return "";
});

jstex.newCommand("newenvironment",function(tokens){
    var newenv = tokens.shift();
    var envname = newenv.join("");
    var arg = tokens.shift();
    if(arg.optArg){
	var argc = int(arg);
	arg = tokens.shift();
	if(arg.optArg){
	    var defoptarg = arg;
	    arg = tokens.shift();
	}
    }
    var begin = tokens.shift();
    while(end == undefined || end == false || end == ' ' || end == "\n"){
	var end = tokens.shift();
    }
    if(jstex.environments[envname] != undefined){
	console.log("environment "+envname + " is already defined!");
	return "";
    }
    var newenv = jstex.newEnvironment(envname,function(tkns){
	var mytokens = jstex.readUntilEnd(tkns,this.name);
	return "<span title='"+this.name+"'>"+jstex.expand(this.begin.concat(mytokens).concat(this.end))+"</span>";
    });
    newenv.begin=begin;
    newenv.end=end;
    return "";
});




jstex.newCommand("begin",function(tokens){
    var envname = tokens.shift().join("");
    var env = jstex.environments[envname];
    if(!env){
	console.log("warning: encountered unknown begin-environment "+envname);
	return "<span title='"+envname+"'>"+jstex.expand(tokens)+"</span>";
    } else {
	return env.expand(tokens);
    }
    return "";
});

jstex.newCommand("end",function(tokens){
    var envname = tokens.shift().join("");
    var env = jstex.environments[envname];
    var out = "";
    if(!env){
//	console.log("warning: encountered unknown end-environment "+envname);
    }
    return false;
});

jstex.newCommand("csname",function(tokens){
    var tkn = undefined;
    while(tkn != jstex.commands["endcsname"]){
	tkn = tokens.shift()
    }
    return "";
});

jstex.newCommand("endcsname",function(tokens){
    return false;
});

// extra symbols

jstex.newCommand("glqq",function(tokens){return "&bdquo;"});
jstex.newCommand("grqq",function(tokens){return "&ldquo;"});
jstex.newCommand("euro",function(tokens){return "&euro;"});
jstex.newCommand("textndash",function(tokens){return "&ndash;"});
jstex.newCommand("textmdash",function(tokens){return "&mdash;"});
jstex.newCommand("texttimes",function(tokens){return "&times;"});
jstex.newCommand("dots",function(tokens){return "&hellip;"});
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

jstex.newEnvironment("center",function(tokens){return "<center>"+jstex.expand(tokens)+"</center>"});
jstex.newEnvironment("$",function(tokens){
    if(MathJax){
	var d = new Date();
	var t_millis = d.getTime()
	var tkns = jstex.readUntilEnd(tokens,"$");
	return "<div id='MathOutput_"+t_millis+"' class='MathJax'>"+tkns.join("")+"</div>";
    } else {
	return "<i>"+jstex.expand(tokens)+"</i>";
    }
    return "";
});

jstex.newEnvironment("verse",function(tokens){return "<div style='margin-top:10px; margin-bottom:10px; margin-left:30px;'>"+jstex.expand(tokens)+"</div>"});

jstex.newCommand("includeversion",function(tokens){
    var envname = tokens.shift().join("");
    console.log("including version '" + envname +"'");
    jstex.newEnvironment(envname,function(tok){
	return "<span>"+jstex.expand(tok)+"<span>";
    });
});

jstex.newCommand("excludeversion",function(tokens){
    var envname = tokens.shift().join("");
    console.log("excluding version '" + envname +"'");
    jstex.newEnvironment(envname,function(tok){
	return "<span style='display=none'>"+jstex.expand(tok)+"<span>";
    });
});


// extra commands

jstex.newCommand("opening",function(){return "<div>";});
jstex.newCommand("closing",function(){return "</div>";});
				  
