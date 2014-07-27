var jstex = {
    packages: {},
    /////////////////////////////////////////////////////////////
    // The following states form return values
    Status : {
	READING: true,
	ENDGROUP: false,
	ENDSTREAM: -1,
	ERROR: -2
    },
    /////////////////////////////////////////////////////////////
    // The Command class holds a single TeX primitive or command
    ////////////////////////////////////////////////////////////
    addCommand:function(cmd){
	jstex.scopes[0].commands[cmd.name] = cmd;
    },
    newCommand : function(name,expand){
	var cmd = jstex.getCommand(name);
	if(cmd){
	    if(cmd.isUndefined){
		cmd.isUndefined = false;
		cmd.expand = expand;
		return;
	    } else {
		console.log("command '"+name+"' is already defined!");
		return cmd;
	    }
	} else {
//	    console.log("creating command '"+name+"' in scope "+jstex.scopes.length);
	    cmd = new Object();
	    cmd.name = name;
	    if(expand){
		cmd.expand = expand;
		cmd.isUndefined = false;
	    } else {
		cmd.isUndefined = true;
	    }
	    cmd.toString = function(){return this.name};
	    jstex.addCommand(cmd);
	    return cmd;
	}
    },
    newInclude : function(name,resolve){
	var cmd = jstex.getCommand(name);
	if(cmd){
	    console.log("command '"+name+"' is already defined!");
	} else {
	    console.log("creating include command '"+name+"' in scope "+jstex.scopes.length);
	    cmd = new Object();
	    cmd.name = name;
	    if(resolve){
		cmd.resolve = resolve;
		cmd.isUnresolved = true;
		cmd.isUndefined = false;
	    } else {
		cmd.isUnresolved = false;
		cmd.isUndefined = true;
	    }
	    cmd.toString = function(){return this.name};
	    jstex.addCommand(cmd);
	    return cmd;
	}
    },
    getCommand:function(name){
	return jstex.scopes[0].commands[name];
    },
    getCounter:function(name){
	return jstex.scopes[0].counters[name];
    },
    newCounter:function(name){
	jstex.scopes[0].counters[name] = 0;
    },
    stepCounter:function(name){
	jstex.scopes[0].counters[name] = jstex.scopes[0].counters[name] + 1;
    },
    setLastRef:function(elem,info){
	jstex.scopes[0].lastRef = elem;
	elem.info = info;
    },
    getLastRef:function(elem){
	if(jstex.scopes[0].lastRef) return jstex.scopes[0].lastRef;
	else return jstex.container;
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
	if(jstex.scopes[0].aliases[text]) text = jstex.scopes[0].aliases[text];
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
    copyObject:function(obj){
	retval = {};
	for(key in obj){
	    retval[key] = obj[key];
	}
	return retval;
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
    scopes : [ {
	commands : {},
	environments : {},
	counters : {},
	lengths : {
	    frameborder : "1px"
	},
	lastRef : undefined,
	tags : {
	    section : "h1",
	    subsection : "h2",
	    subsubsection : "h3"
	},
	aliases : {
	    "~" : " "
	}
    } ],
    enterScope:function(){
	curscope = jstex.scopes[0];
	scope = {
	    commands :     jstex.copyObject(curscope.commands),
	    environments : jstex.copyObject(curscope.environments),
	    counters :     jstex.copyObject(curscope.counters),
	    lengths :      jstex.copyObject(curscope.lengths),
	    lastRef:       curscope.lastRef,
	    tags : curscope.tags,
	    aliases : curscope.aliases
	}
	jstex.scopes.unshift(scope);
//	console.log("entering scope "+jstex.scopes.length);
    },
    leaveScope:function(){
	if(jstex.scopes.length > 0){
//	    console.log("leaving scope "+jstex.scopes.length);
	    jstex.scopes.shift()
	} else {
	    console.log("ERROR in leaveScope: stack is empty!")
	}
    },
    getEnvironment:function(name){
	return jstex.scopes[0].environments[name];
    },
    addEnvironment:function(env){
	jstex.scopes[0].environments[env.name] = env;
    },
    getLength:function(name){
	return jstex.scopes[0].lengths[name];
    },
    buffer:document.createElement('div'),
    getHTMLAlias:function(code){
	if(!jstex.scopes[0].aliases[code]){
	    jstex.scopes[0].aliases[code] = jstex.decodeHTMLEntities(code);
	}
	return jstex.scopes[0].aliases[code];
    },
//    unknownCSalias : "&#65533;",
    unknownCSalias : "<svg width='1.5em' height='1.5em' preserveAspectRatio='xMinYMin meet' viewBox='0 0 240 240' style='font-size:12px;font-style:normal;font-weight:normal;fill:#000000;fill-opacity:1;stroke:#000000;stroke-width:1;stroke-linecap:square;stroke-linejoin:miter;stroke-miterlimit:10;stroke-opacity:1;stroke-dasharray:none;stroke-dashoffset:0;font-family:Dialog'> <g id='g5' transform='translate(-24.4688,-152.7188)'> <path  d='M 263.5312,272.25 144,391.7812 24.4688,272.25 144,152.7188 263.5312,272.25 z m -76.9218,-30.2344 q 0,-16.1718 -11.9532,-26.9297 -11.9531,-10.7578 -29.1093,-10.7578 -20.6719,0 -36,6.3281 l -2.5313,25.1719 q 11.6719,-7.4531 25.7344,-7.4531 10.5469,0 17.4375,5.7656 6.8906,5.7656 6.8906,15.1875 0,10.2657 -11.8828,25.9453 -11.8828,15.6797 -11.8828,31.9922 l 21.375,0 q 0,-7.5937 8.2969,-17.8594 14.0625,-17.4374 15.3281,-19.5468 8.2969,-13.2188 8.2969,-27.8438 z m -26.2969,110.1094 0,-29.5312 -32.625,0 0,29.5312 32.625,0 z'  style='stroke:none' /> </g> </svg>",
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
    makeid : function(){
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
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
		    tokens.push(jstex.getCommand('par'));
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
		    var tkn = jstex.getCommand("end");
		    jstex.inMathMode = false;
		    respectblanks = true;
		    respectnewlines = 0;
		} else {
		    var tkn = jstex.getCommand("begin");
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
			tokens.push(jstex.getCommand("textmdash"));
			idx+=3;
		    } else {
			tokens.push(jstex.getCommand("textndash"));
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
		    tokens.push(jstex.getCommand("newline"));
		    respectblanks = false;
		    respectnewlines=0;
		    continue;
		}
		var endidx  = jstex.findNextOf(input,"\\{}[]()-\t \n\r%1234567890.,#/",idx+2);
		if(endidx < 0) endidx = input.length;
		var cmdname = input.substr(idx+1,endidx-idx-1);
		var cmd     = jstex.getCommand(cmdname);
		if(cmd) tokens.push(cmd);
		else tokens.push(jstex.newCommand(cmdname,undefined));
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
    resolve : function(tokenstream){
	while(jstex.resolveNext(tokenstream)){
	    // do nothing
	}
	return true;
    },
    resolveNext : function(tokenstream){
	for(var i=0; i<tokenstream.length; i++){
	    if(jstex.isString(tokenstream[i])) 
		continue;
	    if(jstex.isArray(tokenstream[i])){
		if(jstex.resolveNext(tokenstream[i]))
		    return true;
		continue;
	    }
	    if(tokenstream[i].isUnresolved){
		var tkn = tokenstream[i];
		tokenstream[i] = tkn.resolve();
		return true;
	    }
	}
	return false;
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
    readNext:function(tokens){
	var buffer = document.createElement("div");
	jstex.extendDOM(buffer);
	jstex.expandNext(tokens,buffer);
	return buffer.innerHTML;
    },
    read:function(tokens){
	var buffer = document.createElement("div");
	jstex.extendDOM(buffer);
	jstex.expand(tokens,buffer);
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
    readUntilSymbol:function(tokens,end){
	var buffer = document.createElement("div");
	jstex.extendDOM(buffer);
	while(tokens.length > 0){
	    if(tokens[0] !== end){
		jstex.expandNext(tokens,buffer);
		continue;
	    }
	    jstex.expandNext(tokens,buffer);
	    return buffer.innerHTML;
	}
//	console.log("ERROR: no '"+end+"' found!");
	return buffer.innerHTML;
    },
    createDummy:function(title){
	var dummy = document.createElement("span");
	dummy.title=title;
	dummy.innerHTML = jstex.unknownCSalias;
	return dummy;b
    },
    expandNext:function(tokens,target){
	if(!target || !target.createChild){
	    console.log("expandNext called with invalid target:",target);
	    return jstex.Status.ERROR;
	} 
	if(jstex.isArray(tokens)){
	    if(tokens.length < 1) return jstex.Status.ENDSTREAM;
	    var token = tokens.shift();
	}  else {
	    var token = tokens;
	}
	if(token === undefined || token === null || token === false){
	    target.appendChild(jstex.createDummy(token));
	    return jstex.Status.ERROR;
	} else if(jstex.isArray(token)){
	    jstex.expand(token,target);
	    return jstex.Status.READING;
	} else if(jstex.isString(token)){
	    target.appendText(token);
	    return jstex.Status.READING;
	} else if(token.isUndefined){
	    console.log("undefined control sequence: " +token.name);
	    target.appendChild(jstex.createDummy(token.name));
	    return jstex.Status.READING;
	} else if(token.expand !== undefined){
//	    console.log("expanding '"+token.name+"'");
	    var retval = token.expand(tokens,target);
	    if(retval == jstex.Status.ERROR){
		console.log("the command '"+token.name+"' reported an error during expansion!")
	    }
	    return retval;
	} else if(token.name == "#localVariable"){
	    // todo: implement this
	    return jstex.Status.READING;
	} else {
	    console.log("ERROR: cannot process token of type '"+typeof token+"':",token);
	    return jstex.Status.ERROR;
	}
    },
    expand:function(token,target){
	if(jstex.isArray(token)){
	    var cnt = 0;
	    while(true){
		var retval = jstex.expandNext(token,target);
		cnt++;
		if(retval == jstex.Status.ENDSTREAM){
		    return jstex.Status.ENDSTREAM;
		}
		if(retval == jstex.Status.ENDGROUP){
		    return jstex.Status.ENDGROUP;
		}
		if(retval == jstex.Status.ERROR){
		    return jstex.Status.ERROR;
		}
	    }
	    return jstex.Status.ENDSTREAM;
	}
	return jstex.expandNext(token,target);
    },
    expandUntil:function(token,target,cmdname){
	if(jstex.isArray(token)){
	    var cnt = 0;
	    while(token.length>0){
		if(token[0].name == cmdname) return jstex.Status.READING;
		var retval = jstex.expandNext(token,target);
		cnt++;
		if(retval == jstex.Status.ENDSTREAM){
		    return jstex.Status.ENDSTREAM;
		}
		if(retval == jstex.Status.ENDGROUP){
		    return jstex.Status.ENDGROUP;
		}
		if(retval == jstex.Status.ERROR){
		    return jstex.Status.ERROR;
		}
	    }
	    return jstex.Status.ENDSTREAM;
	}
	return jstex.expandNext(token,target);
    },
    finalize:function(){
	// fill the contents of references
	var links = document.getElementsByClassName("jstex_refstyle");
	console.log("filling references for "+links.length+" items!");
	for(var i=0; i<links.length; i++){
	    var obj = links[i];
	    var id = obj.refid;
	    console.log(obj,id);
	    var refObj = document.getElementById(id);
	    if(refObj){
		obj.innerText=refObj.info;
	    } else {
		obj.innerText=jstex.unknownCSalias;
	    }
	}
	// execute math rendering
	if(MathJax){
	    var mathdivs = document.getElementsByClassName("MathJax");
	    console.log("MathJax found - executing on "+mathdivs.length+" items!");
	    for(var i=0; i<mathdivs.length; i++){
		MathJax.Hub.Queue(["Typeset",MathJax.Hub,mathdivs[i].id]);
	    }
	}	
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
	    jstex.container = container;
	    jstex.extendDOM(container);
	    jstex.tex(source.substr(begindocument,enddocument-begindocument),container);
	    container.className="jsTeX";
	    setTimeout(function() { jstex.finalize(); }, 100);
	    return container;
	}
	return "jsTeX error: missing begin/end document!"
    },
    tex:function(source,target){
	var tokens = jstex.tokenize(source);
	jstex.resolve(tokens,target);
	jstex.expand(tokens,target);
    },
    // a couple of TeX primitives need to be hardcoded
    setLength : function(name,val){
	jstex.scopes[0].lengths[name] = val;
	return "setting length "+name+"="+val;
    },
    newEnvironment : function(name,expand){
	var env = new Object();
	env.name = name;
	env.expand=expand;
	jstex.addEnvironment(env);
	return env;
    },
    ignoreCommand : function(name,argc){
	if(!argc) argc=0;
	expand = function(tokens,parent){for(var i=0; i<this.argc; i++) tokens.shift(); return true;};
	var cmd = jstex.newCommand(name,expand);
	cmd.argc = argc;
    },
    resources: {}
}

// general setup for TOC, LOF, LOT, etc...
jstex.resources.tableofcontents=document.createElement("div");
jstex.extendDOM(jstex.resources.tableofcontents);
jstex.resources.tableofcontents_title = jstex.resources.tableofcontents.createChild("div",{"id":"jstex_toctitle","className":"jstex_toctitle"})
jstex.resources.tableofcontents_title.innerHTML="Table of Contents";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Here, the definition of TeX primitives, commands and functions begins
//  !!! No core engine code beyond this point !!!
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//// basic symbols
//jstex.newCommand("par",      function(tokens,parent){ parent.appendChild(document.createElement("br")); return true; });
jstex.newCommand("par",      function(tokens,parent){ return jstex.expandUntil(tokens,parent.createChild("p"),"par"); });
jstex.newCommand("newline",  function(tokens,parent){ parent.createChild("br"); return true; });
jstex.newCommand("linebreak",function(tokens,parent){ parent.createChild("br"); return true; });
jstex.newCommand("hline"    ,function(tokens,parent){ parent.createChild("hr"); return true; });

//// extra symbols
jstex.newCommand("glqq",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&bdquo;" )); return true});
jstex.newCommand("grqq",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&ldquo;" )); return true});
jstex.newCommand("euro",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&euro;"  )); return true});
jstex.newCommand("textndash",function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&ndash;" )); return true});
jstex.newCommand("textmdash",function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&mdash;" )); return true});
jstex.newCommand("texttimes",function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&times;" )); return true});
jstex.newCommand("dots",     function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&#8230;" )); return true});
jstex.newCommand("&",        function(tokens,parent){parent.appendText(jstex.getHTMLAlias("&amp;"   )); return true});
jstex.newCommand("%",        function(tokens,parent){parent.appendText(jstex.getHTMLAlias("%"   )); return true});

jstex.ignoreCommand("sloppy");
jstex.ignoreCommand("makeatletter");
jstex.ignoreCommand("makeatother");
jstex.ignoreCommand("twocolumn");
jstex.ignoreCommand("onecolumn");
jstex.ignoreCommand("noindent");
jstex.ignoreCommand("newlength");
jstex.ignoreCommand("newcounter");
jstex.ignoreCommand("geometry",1);
jstex.ignoreCommand("appendix");
jstex.ignoreCommand("clearpage");
jstex.ignoreCommand("cleardoublepage");
jstex.ignoreCommand("newpage");
		 
//// some tricky things
jstex.newCommand("url",function(tokens,parent){ 
    var link = jstex.readNext(tokens);
    parent.createChild("a",{"href":jstex.linkify(link)}).innerHTML=link;
    return true;
});
jstex.newCommand("author",function(tokens,parent){ 
    var cmd = jstex.newCommand("theauthor",function(toks,p){
	jstex.expand(this.content,p);
	return true;
    });
    cmd.content=tokens.shift();
    return true;
});

jstex.newCommand("title",function(tokens,parent){ 
    var cmd = jstex.newCommand("thetitle",function(toks,p){
	jstex.expand(this.content,p);
	return true;
    });
    cmd.content=tokens.shift();
    return true;
});

jstex.newCommand("maketitle",function(tokens,parent){ 
    document.title = jstex.read(jstex.getCommand("thetitle").content);
    return true;
});

jstex.newCommand("tableofcontents",function(tokens,parent){
    parent.appendChild(jstex.resources.tableofcontents);
});

jstex.newCommand("@starttoc",function(tokens,parent){
    var arg = jstex.readNext(tokens);
    if(arg == "toc"){
	parent.appendChild(jstex.resources.tableofcontents);
	return true;
    } else {
	console.log("ERROR: cannot start toc of unknown type '"+arg+"'!");
	return false;
    }
});


jstex.newInclude("input",function(tokens,parent){
    return "";
});

jstex.newCommand("caption",function(tokens,target){return jstex.expandNext(tokens,target.createChild("div",{"style":{"text-align":"center"}}))});

jstex.newCommand("label",function(tokens,target){
    jstex.buffer.innerHTML="";
    var retval = jstex.expandNext(tokens,jstex.buffer);
    var label = jstex.buffer.innerText;
    var obj = jstex.getLastRef();
    var hook = document.createElement("span");
    hook.id=label,
    hook.info = obj.info;
    obj.insertBefore(hook,obj.firstChild);
    return retval;
});

jstex.newCommand("ref",function(tokens,target){
    jstex.buffer.innerHTML="";
    var retval = jstex.expandNext(tokens,jstex.buffer);
    var label = jstex.buffer.innerText;
    target.createChild("a",{
	"href":"#"+label,
	"refid":label,
	"className":"jstex_refstyle",
    })
    return retval;
});

jstex.provide_package=function(name,path){
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.async=false;
    script.src=path;
    document.head.appendChild(script);
    console.log("providing package '"+name+"' from path '"+path+"'");
    return true;
}

jstex.ignore_package=function(name){
    jstex.packages[name] = { load:function(args){ return true; } };
    return true;
}

jstex.parseKeyValArg=function(tokens){
    var tok = tokens.shift();
    var x = true;
    var obj = {};
    while(x){
	x = jstex.readUntilSymbol(tok,",").replace(/,+$/, "");
	var sep = x.indexOf("=");
	var key = x.substr(0,sep).trim();
	var val = x.substr(sep+1).trim();
	if(key){
	    obj[key]=val;
	}
    }
    return obj;
}

jstex.newCommand("usepackage",function(tokens,parent){
    jstex.buffer.innerHTML="";
    var optArg = "";
    if(tokens[0].optArg){
	jstex.expandNext(tokens,jstex.buffer);
	optArg = jstex.buffer.innerText;
    }
    jstex.buffer.innerHTML="";
    jstex.expandNext(tokens,jstex.buffer);
    var pkgname = jstex.buffer.innerText;
    if(jstex.packages[pkgname]){
	console.log("including package '"+pkgname+"' with options '"+optArg+"'");
	return jstex.packages[pkgname].load(optArg);
    } else {
	throw "Error: cannot load package '"+pkgname+"' - if this is an external package not provided by tex.js, you need to call 'jstex.provide_package(name,path)' to pre-load it!";
    }
});

//// sectioning
var sections = ["section","subsection","subsubsection"];
for(var i=0; i<sections.length; i++){
    var tag = jstex.scopes[0].tags[sections[i]];
    jstex.newCounter(sections[i]);
    jstex.newCommand(sections[i],function(tokens,parent){
	var id = jstex.makeid();
	var header = parent.createChild(tag,{"id":id});
	jstex.stepCounter(this.name);
	var thesec = jstex.getCounter(this.name);
	jstex.setLastRef(header,thesec);
	header.innerHTML=thesec + " ";
	var retval = jstex.expandNext(tokens,header);
	var tocentry = jstex.resources.tableofcontents.createChild("a",{"className":"jstex_tocstyle_"+this.name,"href":"#"+id});
	tocentry.innerHTML=header.innerHTML;
	return retval;
    });
    jstex.newCommand(sections[i]+"*",function(tokens,parent){
	var retval = jstex.expandNext(tokens,parent.createChild(tag));
	return retval;
    });
};
jstex.newCommand("paragraph",    function(tokens,target){return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-weight":"bold"}}))});

//// font choices
jstex.newCommand("textit",    function(tokens,target){return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-style":"italic"}}))});
jstex.newCommand("textbf",    function(tokens,target){return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-weight":"bold"}}))});
jstex.newCommand("textsc",    function(tokens,target){return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-variant":"small-caps"}}))});
jstex.newCommand("itshape",   function(tokens,target){return jstex.expand    (tokens,target.createChild("span",{"style":{"font-style":"italic"      }}))});
jstex.newCommand("twistshape",function(tokens,target){return jstex.expand    (tokens,target.createChild("span",{"style":{"font-style":"italic"      }}))});
jstex.newCommand("bfseries",  function(tokens,target){return jstex.expand    (tokens,target.createChild("span",{"style":{"font-weight":"bold"       }}))});
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
    jstex.newCommand(fontsizes[i],function(tokens,parent){return jstex.expand(tokens,parent.createChild("span",{"style":{"font-size":jstex.getLength(fs)}}));});
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
jstex.newCommand("bigskip",  function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.getLength("bigskip")  }}); return true;});
jstex.newCommand("smallskip",function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.getLength("smallskip")}}); return true;});
jstex.newCommand("vspace",   function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.readLength(tokens)}}); return true});
jstex.newCommand("vskip",    function(tokens,parent){parent.createChild("div",{"style":{"margin":jstex.readLength(tokens)}}); return true});


//// non-trivial TeX primitives

jstex.newCommand("begin",function(tokens,target){
    jstex.buffer.innerHTML="";
    jstex.expandNext(tokens,jstex.buffer);
    var envname = jstex.buffer.innerHTML;
    var env = jstex.getEnvironment(envname);
    jstex.enterScope();
    // it is important that the return-value is not forwarded
    // otherwise, the expander would return the ENDSTREAM/ENDGROUP
    // message all the way up to the body
    if(!env){
	console.log("warning: encountered unknown begin-environment '"+envname+"'");
	jstex.expand(tokens,target.createChild("span",{"title":envname}));
	return jstex.Status.READING;

    }
    if(env.beginTokens){
	var beginToks = jstex.cloneArray(env.beginTokens);
	while(beginToks.length > 0){
	    tokens.unshift(beginToks[beginToks.length-1]);
	    beginToks.pop();
	}
    }
//    console.log("entering environment '"+envname+"'");
    env.expand(tokens,target);
    return jstex.Status.READING;
});

jstex.newCommand("end",function(tokens,target){
    var envname = jstex.readNext(tokens);
    var env = jstex.getEnvironment(envname);
    if(!env){
	console.log("warning: encountered unknown end-environment '"+envname+"'");
    } else {
//	console.log("leaving environment '"+envname+"'");
	if(env.endTokens){
	    var endtokens = jstex.cloneArray(env.endTokens);
	    while(endtokens.length > 0){
		var tok = endtokens[endtokens.length-1];
		endtokens.pop();
		if(tok) tokens.unshift(tok);
	    }
	}
    }
    jstex.leaveScope();
    return jstex.Status.ENDGROUP;
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
    if(jstex.getEnvironment(envname) != undefined){
	console.log("environment "+envname + " is already defined!");
	return true;
    }
    console.log("defining new environment '"+envname+"'");
    var env = new Object();
    env.name = envname;
    env.expand=expand;
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
	return jstex.expand(tokens,child);
    }
    jstex.addEnvironment(env);
    return true;
});

//// environments

jstex.newEnvironment("center",function(tokens,target){return jstex.expand(tokens,target.createChild("div",{"style":{"text-align":"center"}}))});

jstex.newEnvironment("small",function(tokens,target){return jstex.expand(tokens,target.createChild("div",{"style":{"font-size":"0.7em"}}))});

jstex.newCounter("figure");
jstex.newEnvironment("figure",function(tokens,target){
    jstex.stepCounter("figure");
    return jstex.expand(tokens,target.createChild("div",{"style":{"text-align":"center"}}))
});

jstex.newEnvironment("table",function(tokens,target){
    jstex.stepCounter("table");
    return jstex.expand(tokens,target.createChild("div",{"style":{"text-align":"center"}}))
});


jstex.newEnvironment("minipage",function(tokens,target){return jstex.expand(tokens,target.createChild("div"))});


jstex.newEnvironment("quotation",function(tokens,target){return jstex.expand(tokens,target.createChild("div",{"style":{"margin-left":"1em"}}))});

jstex.newEnvironment("multicols",function(tokens,target){jstex.expandNext(tokens,jstex.buffer); return jstex.expand(tokens,target.createChild("div"))});

jstex.newEnvironment("itemize",function(tokens,target){
    jstex.newCommand("item",  function(tokens,target){return jstex.expandUntil    (tokens,target.createChild("li",{}),"item")});
    return jstex.expand(tokens,target.createChild("ul"));
});

// math

jstex.newEnvironment("$",function(tokens,target){
    if(MathJax){
	var id = jstex.makeid();
	var text = jstex.readUntilEnd(tokens,"$");
	var math = target.createChild("span",{"id":"MathOutput_"+id,"class":"MathJax"});
	math.innerHTML = text;
	return true;
    } else {
	return jstex.expand(tokens,target.createChild("span",{"class":"Math"}));
    }
});

jstex.newCommand("ensuremath",function(tokens,target){
    if(MathJax){
	var id = jstex.makeid();
	var text = jstex.readNext(tokens);
	var math = target.createChild("span",{"id":"MathOutput_"+id,"class":"MathJax"});
	math.innerHTML = text;
	return true;
    } else {
	return jstex.expandNext(tokens,target.createChild("span",{"style":{"font-style":"italic"}}));
    }

});

/// package emulation

jstex.packages.verse = { load:function(args){
    jstex.newEnvironment("verse",function(tokens,target){return jstex.expand(tokens,target.createChild("div",{"title":"verse","style":{"margin-top":"10px","margin-bottom":"10px","margin-left":"30px"}}))});
    return true;
}};

jstex.packages.babel = { load:function(args){
    var toctitle = jstex.resources.tableofcontents_title;
    if(args.indexOf("ngerman") != -1) toctitle.innerHTML="Inhaltsverzeichnis";
    return true;
}};

jstex.ignore_package("graphicx");
jstex.ignore_package("trajan");
jstex.ignore_package("microtype");
jstex.ignore_package("inputenc");
jstex.ignore_package("fontenc");
jstex.ignore_package("verse")
jstex.ignore_package("geometry");
jstex.ignore_package("hyperref");
jstex.ignore_package("vicent");
jstex.ignore_package("sqrcaps");
jstex.ignore_package("multicol");
jstex.ignore_package("color");
jstex.ignore_package("xcolor");
jstex.ignore_package("array");
jstex.ignore_package("caption");
jstex.ignore_package("titlesec");


var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML+= '.jstex_toctitle { font-weight:bold; font-size:1.17em; margin-bottom:1em; }';
style.innerHTML+= '.jstex_refstyle               { display:inline; text-decoration:none; color: black; font-weight:normal; }';
style.innerHTML+= '.jstex_tocstyle_section       { display:block; text-decoration:none; color: black; font-weight:bold; }';
style.innerHTML+= '.jstex_tocstyle_subsection    { display:block; text-decoration:none; color: black; margin-left:1em;}';
style.innerHTML+= '.jstex_tocstyle_subsubsection { display:block; text-decoration:none; color: black; font-style:italic; margin-left:2em;}';
document.getElementsByTagName('head')[0].appendChild(style);
