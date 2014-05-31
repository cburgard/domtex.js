var jstex = {
    /////////////////////////////////////////////////////////////
    // The Command class holds a single TeX primitive or command
    ////////////////////////////////////////////////////////////
    Command : function(name,expand){
	var cmd = new Object();
	cmd.name = name;
	cmd.expand = expand;
	jstex.commands[name]=cmd;
	return cmd;
    },
    /////////////////////////////////////////////////////////////
    // The Element class converts meta-information to an actual DOM
    // element
    ////////////////////////////////////////////////////////////
    extendDOM:function(obj){
	obj.createChild = jstex.createChild;
	obj.appendText = jstex.appendText;
    },
    appendText:function(text){
	if(jstex.aliases[text]) text = jstex.aliases[text];
	if(this.lastChild && this.lastChild.appendData !== undefined){
	    this.lastChild.appendData(text);
	} else {
	    this.appendChild(document.createTextNode(text));
	}
    },
    copyJSON:function(source,target){
	for(var key in source){
	    if(jstex.isString(source[key]) || !target[key]){
		target[key] = source[key];
	    } else {
		jstex.copyJSON(source[key],target[key]);
	    }
	}
    },
    cloneArray:function(a){
	var newArr = [];
	for(var i=0; i<a.length; i++){
	    var e = a[i];
	    if(jstex.isString(e)){
		newArr.push(e);
	    } else if(jstex.isArray(e)){
		newArr.push(jstex.cloneArray(e));
	    } else if(jstex.isDOM(e)){
		newArr.push(e.cloneNode());
	    } else {
		newArr.push(e);
	    }
	}
	return newArr;
    },
    createChild:function(type,properties){
	var child = document.createElement(type);
	this.appendChild(child);
	jstex.copyJSON(properties,child);
	jstex.extendDOM(child);
	return child;
    },
    commands : new Object(),
    environments : new Object(),
    tags : {
	section : "h1",
	subsection : "h2",
	subsubsection : "h3"
    },
    lengths : {
	frameborder : "1px"
    },
    aliases : {
	"~" : " "
    },
    buffer:document.createElement('div'),
    getHTMLAlias:function(code){
	if(!jstex.aliases[code]){
	    jstex.aliases[code] = jstex.decodeHTMLEntities(code);
	}
	return jstex.aliases[code];
    },
    counters : {
    },
    isParagraphOpen : false,
    inMathMode : false,
    unknownCSalias : "&#65533;",
    undefcommand : function(name){
	var cmd = jstex.Command(name,undefined);
	cmd.name = name;
	cmd.isUndefined = true;
	return cmd;
    },
    isArray : function(a) {
	return (!!a) && (a.constructor === Array);
    },
    isString : function(s) {
	return (typeof s == "string");
    },
    isDOM : function(elem){
	return (elem instanceof HTMLElement);
    },
    /////////////////////////////////////////////////////////////
    // basic functions for stringparsing
    ////////////////////////////////////////////////////////////
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
    // this prevents any overhead from creating the object each time
    decodeHTMLEntities:function(str) {
	if(str && typeof str === 'string') {
	    // strip script/html tags
	    str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
	    str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
	    jstex.buffer.innerHTML = str;
	    str = jstex.buffer.textContent;
	    jstex.buffer.textContent = '';
	}
	return str;
    },
    /////////////////////////////////////////////////////////////
    // tokenization is the first step of the processing
    // here, the input string is converted to an array of tokens
    // a token is either
    //   - a string
    //   - a command
    //   - an array of tokens
    ////////////////////////////////////////////////////////////
    tokenize : function(input){
	var idx = 0;
	var tokens = [];
	var respectblanks=false;
	var respectnewlines=2;
	while(idx < input.length){
	    if(input[idx] == ' '){
		if(respectblanks) tokens.push(' ');
		respectblanks = false;
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
		if(respectnewlines == 1){
		    tokens.push(jstex.commands['par']);
		} else if(respectblanks){
		    tokens.push(' ');
		}
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
		continue;
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
		    tokens.push(jstex.commands["newline"]);
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
    findenvbegin : function(source,envname){
	var s = "\\begin{"+envname+"}";
	var idx = source.indexOf(s);
	if(idx < 0) return idx;
	return idx+s.length;
    },
    findenvend : function(source,envname){
	return source.indexOf("\\end{"+envname+"}");
    },
    /////////////////////////////////////////////////////////////
    // expansion is the second step
    // here, tokens are replaced with their html manifestation
    /////////////////////////////////////////////////////////////
    readNumber:function(tokens){
	var buffer = document.createElement("div");
	buffer.innerHTML="";
	jstex.extendDOM(buffer);
	var lastresult = undefined;
	var lasttok = tokens[0];
	while(tokens.length > 0 && jstex.expandNext(tokens,buffer)){
	    var result = buffer.innerHTML;
	    if(isNaN(result) && !isNaN(lastresult)){
		tokens.unshift(lasttok);
		return lastresult;
	    }
	    lasttok = tokens[0];
	    lastresult = result;
	}
	console.log("number:",buffer.textContent);
	return result;
    },
    readNext:function(tokens,target){
	var buffer = document.createElement("div");
	jstex.extendDOM(buffer);
	jstex.expandNext(tokens,buffer);
	return buffer.innerHTML;
    },
    readUnit:function(tokens){
	var buffer = document.createElement("div");
	buffer.innerHTML="";
	jstex.extendDOM(buffer);
	var result = "";
	while(tokens.length > 0 && jstex.isString(tokens[0]) && jstex.expandNext(tokens,buffer)){
	    result = buffer.innerHTML;
	}
	return result;
    },
    readLength:function(tokens){
	var number = jstex.readNumber(tokens);
	var unit = jstex.readUnit(tokens);
	return number+unit;
    },
    readUntilEnd:function(tokens,end){
	var buffer = document.createElement("div");
	jstex.extendDOM(buffer);
	while(tokens.length > 0){
	    var tkn = tokens.shift();
	    if(tkn.name != "end"){
		jstex.expand(tkn,buffer);
		continue;
	    }
	    var nexttkn = tokens.shift();
	    if(jstex.isArray(nexttkn) && nexttkn[0] == end){
		return buffer.innerHTML;
	    } else {
		jstex.expand(nexttkn,buffer);
	    }
	}
	console.log("ERROR: missing \\end{"+end+"}");
	return buffer.innerHTML;
    },
    readUntilCommand:function(tokens,end){
	var buffer = document.createElement("div");
	jstex.extendDOM(buffer);
	while(tokens.length > 0){
	    if(tokens[0].name !== end){
		jstex.expandNext(tokens,buffer);
		continue;
	    }
	    jstex.expandNext(tokens,buffer);
	    return buffer.innerHTML;
	}
	console.log("ERROR: missing \\"+end);
	return buffer.innerHTML;
    },
    createDummy:function(title){
	var dummy = document.createElement("span");
	dummy.title=title;
	dummy.innerHTML = jstex.unknownCSalias;
	return dummy;
    },
    expandNext:function(tokens,target){
	if(!target || !target.createChild){
	    console.log("expandNext called with invalid target:",target);
	    return false;
	} 
	if(jstex.isArray(tokens)){
	    if(tokens.length < 1) return false;
	    var token = tokens.shift();
	}  else {
	    var token = tokens;
	}
	if(token === undefined || token === null || token === false){
	    target.appendChild(jstex.createDummy(token));
	    console.log("sorry, encountered invalid token");
	    return undefined;
	} else if(jstex.isArray(token)){
	    return jstex.expand(token,target);
	} else if(jstex.isString(token)){
	    target.appendText(token);
	    return true;
	} else if(token.isUndefined){
	    console.log("undefined control sequence: " +token.name);
	    target.appendChild(jstex.createDummy(token.name));
	    return true;
	} else if(token.expand !== undefined){
	    var retval = token.expand(tokens,target);
	    if(!retval){
		console.log("the command '"+token.name+"' reported an error during expansion!")
	    }
	    if(token.name == "end"){
		return false;
	    }
	    return true;
	} else {
	    console.log("ERROR: cannot process token of type '"+typeof token+"':",token);
	    return undefined;
	}
    },
    expand:function(token,target){
	if(jstex.isArray(token)){
	    var cnt = 0;
	    while(jstex.expandNext(token,target)){
		cnt++;
	    }
	    return true;
	}
	return jstex.expandNext(token,target);
    },
    /////////////////////////////////////////////////////////////
    // plugging it all together
    /////////////////////////////////////////////////////////////
    // texdoc runs jstex on an entire document
    texdoc:function(source){
	jstex.extendDOM(jstex.buffer);
	var begindocument = jstex.findenvbegin(source,"document");
	var enddocument   = jstex.findenvend(source,"document");
	if(begindocument >= 0 && enddocument >= 0){
	    var preamble = document.createElement("div");
	    jstex.extendDOM(preamble);
	    jstex.tex(source.substr(0,begindocument-16),preamble);
	    var container = document.createElement("div");
	    jstex.extendDOM(container);
	    jstex.tex(source.substr(begindocument,enddocument-begindocument),container);
	    container.className="jsTeX";
	    if(MathJax){
		var mathdivs = document.getElementsByClassName("MathJax");
		console.log("MathJax found - executing on "+mathdivs.length+" items!");
		for(var i=0; i<mathdivs.length; i++){
		    MathJax.Hub.Queue(["Typeset",MathJax.Hub,mathdivs[i].id]);
		}
	    }	
	    return container;
	}
	return "jsTeX error: missing begin/end document!"
    },
    tex:function(source,target){
	var tokens = jstex.tokenize(source);
	console.log(tokens);
	jstex.expand(tokens,target);
    },
    // a couple of TeX primitives need to be hardcoded
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
	expand = function(tokens,parent){for(var i=0; i<this.argc; i++) tokens.shift(); return true;};
	var cmd = jstex.Command(name,expand);
	cmd.argc = argc;
    },



}
jstex.Command.prototype.toString = function(){return this.name};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Here, the definition of TeX primitives, commands and functions begins
//  !!! No core engine code beyond this point !!!
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//// basic symbols
jstex.newCommand("par",      function(tokens,parent){ parent.appendChild(document.createElement("br")); return true; });
jstex.newCommand("newline",  function(tokens,parent){ parent.appendChild(document.createElement("br")); return true; });
jstex.newCommand("linebreak",function(tokens,parent){ parent.appendChild(document.createElement("br")); return true; });
jstex.newCommand("hline"    ,function(tokens,parent){ parent.appendChild(document.createElement("hr")); return true; });

//// extra symbols
jstex.newCommand("glqq",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&bdquo;" ));return true});
jstex.newCommand("grqq",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&ldquo;" ));return true});
jstex.newCommand("euro",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&euro;"  ));return true});
jstex.newCommand("textndash",function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&ndash;" ));return true});
jstex.newCommand("textmdash",function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&mdash;" ));return true});
jstex.newCommand("texttimes",function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&times;" ));return true});
jstex.newCommand("dots",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&#8230;" )); return true});
jstex.newCommand("&",        function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&amp;"   )); return true});

jstex.ignoreCommand("sloppy");
jstex.ignoreCommand("twocolumn");
jstex.ignoreCommand("onecolumn");
jstex.ignoreCommand("noindent");
jstex.ignoreCommand("tableofcontents");
jstex.ignoreCommand("newlength");
jstex.ignoreCommand("newcounter");
jstex.ignoreCommand("geometry",1);
		 

//// basic commmands
jstex.newCommand("url",function(tokens){ var link = tokens.shift().join(""); return "<a href='"+jstex.linkify(link)+"'>"+link+"</a>";});

//// sectioning
var sections = ["section","subsection","subsubsection"];
for(var i=0; i<sections.length; i++){
    var tag = jstex.tags[sections[i]];
    jstex.newCommand(sections[i],function(tokens,parent){
	return jstex.expandNext(tokens,parent.createChild(tag));
    });
};

//// font choices
jstex.newCommand("textit",    function(tokens,target){return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-style":"italic"}}))});
jstex.newCommand("textbf",    function(tokens,target){return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-weight":"bold"}}))});
jstex.newCommand("textsc",    function(tokens,target){return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-variant":"small-caps"}}))});
jstex.newCommand("itshape",   function(tokens,target){return jstex.expand    (tokens,target.createChild("span",{"style":{"font-style":"italic"}}))});
jstex.newCommand("twistshape",function(tokens,target){return jstex.expand    (tokens,target.createChild("span",{"style":{"font-style":"italic"}}))});
jstex.newCommand("bfseries",  function(tokens,target){return jstex.expand    (tokens,target.createChild("span",{"style":{"font-weight":"bold"}}))});
jstex.newCommand("sqrcfamily",function(tokens,target){return jstex.expand    (tokens,target.createChild("span",{"style":{"font-variant":"small-caps"}}))});

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
    jstex.newCommand(fontsizes[i],function(tokens,parent){return jstex.expand(tokens,parent.createChild("span",{"style":{"font-size":jstex.lengths[fs]}}));});
}
//
//
//// boxes
//jstex.newCommand("mbox",function(tokens){return "<span style='white-space:nowrap'>"+jstex.tex(tokens.shift())+"</span>"});
//jstex.newCommand("fbox",function(tokens){return "<span style='white-space:nowrap; border:"+jstex.lengths.frameborder+"'>"+jstex.tex(tokens.shift())+"</span>"});
//jstex.newCommand("parbox",function(tokens){return "<span'>"+jstex.tex(tokens.shift())+"</span>"});
//
//// spacing
jstex.setLength("bigskip","1em");
jstex.setLength("smallskip","0.5em");
jstex.newCommand("bigskip",  function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.lengths["bigskip"]  }}); return true;});
jstex.newCommand("smallskip",function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.lengths["smallskip"]}}); return true;});
jstex.newCommand("vspace",   function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.readLength(tokens)}}); return true});
jstex.newCommand("vskip",    function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.readLength(tokens)}}); return true});


//// non-trivial TeX primitives

jstex.newCommand("begin",function(tokens,target){
    jstex.buffer.innerHTML="";
    jstex.expandNext(tokens,jstex.buffer);
    var envname = jstex.buffer.innerHTML;
    var env = jstex.environments[envname];
    if(!env){
	console.log("warning: encountered unknown begin-environment '"+envname+"'");
	return jstex.expand(tokens,target.createChild("span",{"title":envname}));
    } else {
	console.log("entering environment '"+envname+"'");
	return env.expand(tokens,target);
    }
});

jstex.newCommand("end",function(tokens,target){
    var envname = jstex.readNext(tokens);
    var env = jstex.environments[envname];
    if(!env){
	console.log("warning: encountered unknown end-environment '"+envname+"'");
    } else {
	console.log("leaving environment '"+envname+"'");
    }
    return true;
});

jstex.newCommand("csname",function(tokens,parent){
    // TODO: IMPLEMENT THIS
    var csname = jstex.readUntilCommand(tokens,"endcsname");
    console.log("encountered csname '"+csname+"'");
    return true;
});

jstex.newCommand("endcsname",function(tokens,parent){
    return true;
});

jstex.newCommand("newenvironment",function(tokens,parent){
    var envname = jstex.readNext(tokens);
    if(jstex.environments[envname] != undefined){
	console.log("environment "+envname + " is already defined!");
	return true;
    }
    console.log("defining new environment '"+envname+"'");
    var env = new Object();
    env.name = envname;
    env.expand=expand;
    jstex.environments[envname]=env;
    env.beginTokens = undefined;
    while(!jstex.isArray(env.beginTokens)){
	env.beginTokens = tokens.shift();
    }
    env.endTokens = undefined;
    while(!jstex.isArray(env.endTokens)){
	env.endTokens = tokens.shift();
    }
    env.expand=function(tokens,target){
	var child = target.createChild("span",{"title":this.name});
	var beginToks = jstex.cloneArray(this.beginTokens);
	var endToks = jstex.cloneArray(this.endTokens);
	while(beginToks.length > 0){
	    tokens.unshift(beginToks[beginToks.length-1]);
	    beginToks.pop();
	}
	jstex.expand(tokens,child);
//	if(endToks)   jstex.expand(endToks,child);
	return true;
    }
    return true;
});

//// environments

jstex.newEnvironment("center",function(tokens,target){return jstex.expand(tokens,target.createChild("div",{"style":{"text-align":"center"}}))});
jstex.newEnvironment("verse",function(tokens,target){return jstex.expand(tokens,target.createChild("div",{"style":{"margin-top":"10px","margin-bottom":"10px","margin-left":"30px"}}))});

jstex.newEnvironment("$",function(tokens,target){
    if(MathJax){
	var d = new Date();
	var t_millis = d.getTime()
	var text = jstex.readUntilEnd(tokens,"$");
	var math = target.createChild("span",{"id":"MathOutput_"+t_millis,"class":"MathJax"});
	math.innerHTML = text;
	return true;
    } else {
	return jstex.expand(tokens,target.createChild("span",{"class":"Math"}));
    }
});

