var domtex = {
    /////////////////////////////////////////////////////////////
    // basic functions for stringparsing
    ////////////////////////////////////////////////////////////
    beginsWith : function(str,begin){
	if(str.indexOf(begin) == 0)
	    return true;
	return false;
    },
    linkify : function(str){
	if(domtex.beginsWith(str,"http://") || domtex.beginsWith(str,"https://") || domtex.beginsWith(str,"mailto:"))
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
	    domtex.buffer.innerHTML = str;
	    str = domtex.buffer.textContent;
	    domtex.buffer.textContent = '';
	}
	return str;
    },
    /////////////////////////////////////////////////////////////
    // DOM elements created by domtex have a couple of additional
    // functions
    ////////////////////////////////////////////////////////////
    extendDOM:function(obj){
	obj.createChild = domtex.createChild;
	obj.appendText = domtex.appendText;
    },
    appendText:function(text){
	if(domtex.scopes[0].aliases[text]) text = domtex.scopes[0].aliases[text];
	if(this.lastChild && this.lastChild.appendData !== undefined){
	    this.lastChild.appendData(text);
	} else {
	    this.appendChild(document.createTextNode(text));
	}
    },
    copyJSON:function(source,target){
	for(var key in source){
	    if(domtex.isString(source[key]) || !target[key]){
		target[key] = source[key];
	    } else {
		domtex.copyJSON(source[key],target[key]);
	    }
	}
    },
    copyObject:function(obj,depth){
	var retval = {};
	for(key in obj){
	    if(depth > 0){
		retval[key] = domtex.copyObject(obj[key],depth-1);
	    } else {
		retval[key] = obj[key];
	    }
	}
	return retval;
    },
    prependArray:function(a,b){
	if(a){
	    var acopy = domtex.cloneArray(a);
	    while(acopy.length > 0){
		b.unshift(acopy[acopy.length-1]);
		acopy.pop();
	    }
	}
    },
    cloneArray:function(a){
	var newArr = [];
	for(var i=0; i<a.length; i++){
	    var e = a[i];
	    if(domtex.isString(e)){
		newArr.push(e);
	    } else if(domtex.isArray(e)){
		newArr.push(domtex.cloneArray(e));
	    } else if(domtex.isDOM(e)){
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
	domtex.copyJSON(properties,child);
	domtex.extendDOM(child);
	return child;
    },
    scopes : [ {
	commands : {},
	environments : {},
	counters : {},
	lengths : {
	    frameborder : "1px"
	},
	tags : {
	    section : "h1",
	    subsection : "h2",
	    subsubsection : "h3"
	},
	lastRef : undefined,
	aliases : {
	    "~" : " "
	}
    } ],
    counterswithin : [],
    createDummy:function(title){
	var dummy = document.createElement("span");
	dummy.title=title;
	dummy.innerHTML = domtex.unknownCSalias;
	return dummy;
    },
    getHTMLAlias:function(code){
	if(!domtex.scopes[0].aliases[code]){
	    domtex.scopes[0].aliases[code] = domtex.decodeHTMLEntities(code);
	}
	return domtex.scopes[0].aliases[code];
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
    // TeX requires scoping, which is emulated here
    ////////////////////////////////////////////////////////////
    enterScope:function(){
	curscope = domtex.scopes[0];
	scope = {
	    commands :     domtex.copyObject(curscope.commands,1),
	    environments : domtex.copyObject(curscope.environments,1),
	    counters :     domtex.copyObject(curscope.counters,1),
	    lengths :      domtex.copyObject(curscope.lengths,1),
	    lastRef:       curscope.lastRef,
	    tags :         curscope.tags,
	    aliases :      curscope.aliases
	}
	domtex.scopes.unshift(scope);
	console.log("entering scope "+domtex.scopes.length);
    },
    leaveScope:function(){
	if(domtex.scopes.length > 0){
	    console.log("leaving scope "+domtex.scopes.length);
	    domtex.scopes.shift()
	} else {
	    console.log("ERROR in leaveScope: stack is empty!")
	}
    },
    getCurrentScope:function(){
	return scopes[0];
    },
    /////////////////////////////////////////////////////////////
    // The following states form return values
    /////////////////////////////////////////////////////////////
    Status : {
	READING: true,
	ENDGROUP: false,
	ENDSTREAM: -1,
	ERROR: -2
    },
    buffer:document.createElement('div'),
    packages: {},
    resources: {},
    /////////////////////////////////////////////////////////////
    // The Command class holds a single TeX primitive or command
    ////////////////////////////////////////////////////////////
    addCommand:function(cmd){
	domtex.scopes[0].commands[cmd.name] = cmd;
    },
    getCommand:function(name){
	return domtex.scopes[0].commands[name];
    },
    newCommand : function(name,expand,force){
	var cmd = domtex.getCommand(name);
	if(cmd){
	    if(force || cmd.isUndefined){
		cmd.isUndefined = false;
		cmd.expand = expand;
		return;
	    } else {
		console.log("command '"+name+"' is already defined!");
		return cmd;
	    }
	} else {
	    cmd = new Object();
	    cmd.name = name;
	    if(expand){
		cmd.expand = expand;
		cmd.isUndefined = false;
	    } else {
		cmd.isUndefined = true;
	    }
	    cmd.toString = function(){return this.name};
	    domtex.addCommand(cmd);
	    return cmd;
	}
    },
    ignoreCommand : function(name,argc){
	if(!argc) argc=0;
	expand = function(tokens,parent){for(var i=0; i<this.argc; i++) tokens.shift(); return true;};
	var cmd = domtex.newCommand(name,expand);
	cmd.argc = argc;
    },
    setArgument:function(i,arg){
	domtex.scopes[0].args[i] = arg;
    },
    getArgument:function(i){
	return domtex.scopes[0].args[i];
    },
    /////////////////////////////////////////////////////////////
    // include commands are special because javascript does not allow
    // local file access
    /////////////////////////////////////////////////////////////
    newInclude : function(name,resolve){
	var cmd = domtex.getCommand(name);
	if(cmd){
	    console.log("command '"+name+"' is already defined!");
	} else {
	    console.log("creating include command '"+name+"' in scope "+domtex.scopes.length);
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
	    cmd.expand = function(){
		return true;
	    }
	    cmd.toString = function(){return this.name};
	    domtex.addCommand(cmd);
	    return cmd;
	}
    },
    createFileDialogue:function(){
	var hovercontainer = document.createElement("div");
	hovercontainer.className="domtex_hovercontainer";
	hovercontainer.id="domtex_fileDialogue";
	hovercontainer.style.display="none";
	document.body.appendChild(hovercontainer);
	var hover = document.createElement("div");
	hovercontainer.appendChild(hover);
	hover.className="domtex_hover";
	var header = document.createElement("div");
	header.style.fontWeight="bold";
	header.style.textAlign="center";
	header.innerHTML="Missing File";
	hover.appendChild(header);
	var text = document.createElement("div");
	text.innerHTML = ("A set of files has been requested by inclusion commands. However, domtex is unable to resolve the current location of these files. Would you like to manually provide them for domtex to find, or would you like to skip this process?");
	hover.appendChild(text);
	var tab = document.createElement("table");
	hover.appendChild(tab);
	tab.id="domtex_fileDialogueEntries";
	hover.appendChild(tab);
	var hr = document.createElement("tr");
	tab.appendChild(hr);
	var th = document.createElement("th");
	th.innerText="command";
	hr.appendChild(th);
	var th = document.createElement("th");
	th.innerText="name";
	hr.appendChild(th);
	var th = document.createElement("th");
	th.innerText="type";
	hr.appendChild(th);
	var accept = document.createElement("input");
	accept.id="domtex_fileDialogueAccept";
	accept.type="button";
	accept.value="Accept";
	hover.appendChild(accept);
    },
    addToFileDialogue:function(filename,info,type,handler){
	var tab = document.getElementById("domtex_fileDialogueEntries");
	var tr = document.createElement("tr");
	tab.appendChild(tr);
	var td = document.createElement("td");
	td.innerHTML=info;
	tr.appendChild(td);
	var td = document.createElement("td");
	td.innerHTML=filename;
	tr.appendChild(td);
	var td = document.createElement("td");
	td.innerHTML=type;
	tr.appendChild(td);
	var td = document.createElement("td");
	var input = document.createElement("input");
	input.type="file";
	input.addEventListener("change", handler, false);
	td.appendChild(input);
	tr.appendChild(td);
    },
    activateFileDialogue:function(callback){
	var dialogue = document.getElementById("domtex_fileDialogue");
	dialogue.style.display="block";
	var btn = document.getElementById("domtex_fileDialogueAccept");
	btn.onclick = function(){
	    dialogue.style.display="none";
	    callback();
	}
    },
    /////////////////////////////////////////////////////////////
    // for the same reasons, package inclusion needs to be treated
    // separately
    ////////////////////////////////////////////////////////////
    preload_package:function(name,path){
	var script= document.createElement('script');
	script.type= 'text/javascript';
	script.async=false;
	script.src=path;
	document.head.appendChild(script);
	console.log("providing package '"+name+"' from path '"+path+"'");
	return true;
    },
    add_package:function(name,pkg){
	domtex.packages[name] = pkg;
    },
    ignore_package:function(name){
	domtex.packages[name] = { load:function(args){ return true; } };
	return true;
    },
    /////////////////////////////////////////////////////////////
    // environments are handled analogously to commands
    ////////////////////////////////////////////////////////////
    getEnvironment:function(name){
	return domtex.scopes[0].environments[name];
    },
    addEnvironment:function(env){
	domtex.scopes[0].environments[env.name] = env;
    },
    newEnvironment : function(name,expand){
	var env = new Object();
	env.name = name;
	env.expand=expand;
	domtex.addEnvironment(env);
	return env;
    },
    /////////////////////////////////////////////////////////////
    // counters hold integer numbers
    ////////////////////////////////////////////////////////////
    getCounter:function(name){
	return domtex.scopes[0].counters[name];
    },
    newCounter:function(name){
	domtex.scopes[0].counters[name] = 0;
	domtex.counterswithin[name] = {};
    },
    stepCounter:function(name){
	domtex.scopes[0].counters[name] = domtex.scopes[0].counters[name] + 1;
	for(key in domtex.counterswithin[name]){
	    if(domtex.counterswithin[name][key]){
		domtex.resetCounter(key);
	    }
	}
    },
    setCounterWithin:function(name,within){
	domtex.counterswithin[name][within] = true;
    },
    setCounterWithout:function(name,without){
	domtex.counterswithin[name][without] = false;
    },
    resetCounter:function(name){
	domtex.scopes[0].counters[name] = 0;
    },
    setCounter:function(name,val){
	domtex.scopes[0].counters[name] = val;
    },
    /////////////////////////////////////////////////////////////
    // lengths hold numbers and units
    ////////////////////////////////////////////////////////////
    newLength:function(name){
	domtex.scopes[0].lengths[name]="0pt";
	domtex.newCommand(name,function(tokens,target){
	    target.appendText(domtex.getLength(this.name));
	});
    },
    getLength:function(name){
	return domtex.scopes[0].lengths[name];
    },
    setLength : function(name,val){
	domtex.scopes[0].lengths[name] = val;
    },
    /////////////////////////////////////////////////////////////
    // for TeXs 'label' mechanism, we need to track referencable
    // objects within scopes
    ////////////////////////////////////////////////////////////
    getLastRef:function(elem){
	if(domtex.scopes[0].lastRef) return domtex.scopes[0].lastRef;
	else return domtex.container;
    },
    setLastRef:function(elem,info){
	domtex.scopes[0].lastRef = elem;
	elem.info = info;
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
		var i = domtex.findNextOf(input,"\n\r",idx+1);
		if(i > 0) idx = i;
		else idx++;
		continue;
	    }
	    if(input[idx] == '\n' || input[idx] == '\r'){
		if(respectnewlines == 1){
		    tokens.push(domtex.getCommand("par"));
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
	    if(input[idx] == '&'){
		tokens.push(domtex.getCommand("cr"));
		idx++;
		continue;
	    }
	    if(input[idx] == '$'){
		if(domtex.inMathMode){
		    var tkn = domtex.getCommand("end");
		    domtex.inMathMode = false;
		    respectblanks = true;
		    respectnewlines = 0;
		} else {
		    var tkn = domtex.getCommand("begin");
		    domtex.inMathMode = true;
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
			tokens.push(domtex.getCommand("textmdash"));
			idx+=3;
		    } else {
			tokens.push(domtex.getCommand("textndash"));
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
		    tokens.push(domtex.getCommand("newline"));
		    respectblanks = false;
		    respectnewlines=0;
		    continue;
		}
		var endidx  = domtex.findNextOf(input,"\\{}[]()-\t \n\r%1234567890.,#/~*:",idx+2);
		if(endidx < 0) endidx = input.length;
		var cmdname = input.substr(idx+1,endidx-idx-1);
		var cmd     = domtex.getCommand(cmdname);
		if(cmd) tokens.push(cmd);
		else tokens.push(domtex.newCommand(cmdname,undefined));
		respectblanks = false;
		respectnewlines=2;
		idx=endidx;
		continue;
	    }
	    if(input[idx] == '{'){
		var endidx = domtex.findParenthesisMatch(input,"{","}",idx);
		if(endidx < 0){
		    console.log("WARNING: mismatched parenthesis at " + input.substr(idx-10,20));
		    idx++;
		    continue;
		}
		var token = domtex.tokenize(input.substr(idx+1,endidx-idx-1));
		token.optArg=false;
		tokens.push(token);
		respectblanks = true;
		respectnewlines=0;
		idx=endidx+1;
		continue;
	    }
	    if(input[idx] == '['){
		var endidx = domtex.findParenthesisMatch(input,"[","]",idx);
		var token = domtex.tokenize(input.substr(idx+1,endidx-idx-1));
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
    /////////////////////////////////////////////////////////////
    // resolving tokens is the second step. this is required in domtex
    // because include commands cannot be expanded trivially and might
    // need user interaction to provide a file handle
    ////////////////////////////////////////////////////////////
    resolve : function(tokenstream){
	var retval = false;
	while(domtex.resolveNext(tokenstream)){
	    retval = true;
	    // do nothing
	}
	return retval;
    },
    resolveNext : function(tokenstream){
	for(var i=0; i<tokenstream.length; i++){
	    if(domtex.isString(tokenstream[i])) 
		continue;
	    if(domtex.isArray(tokenstream[i])){
		if(domtex.resolveNext(tokenstream[i]))
		    return true;
		continue;
	    }
	    if(tokenstream[i].isUnresolved){
		var tkn = tokenstream[i];
		// read the argument of the input
		tkn.resolve(tokenstream,i);
		tokenstream[i] = domtex.getCommand("relax");
		return true;
	    }
	}
	return false;
    },
    /////////////////////////////////////////////////////////////
    // expansion is the third step. tokens are expanded and append
    // their HTML manifestation to the DOM.
    /////////////////////////////////////////////////////////////
    readNumber:function(tokens){
	var buffer = document.createElement("div");
	buffer.innerHTML="";
	domtex.extendDOM(buffer);
	var lastresult = undefined;
	var lasttok = tokens[0];
	while(tokens.length > 0 && domtex.expandNext(tokens,buffer)){
	    var result = buffer.innerHTML;
	    if(isNaN(result) && !isNaN(lastresult)){
		tokens.unshift(lasttok);
		return lastresult;
	    }
	    lasttok = tokens[0];
	    lastresult = result;
	}
	return result;
    },
    readNext:function(tokens){
	var buffer = document.createElement("div");
	domtex.extendDOM(buffer);
	domtex.expandNext(tokens,buffer);
	return buffer.innerHTML;
    },
    readStar:function(tokens){
	if(tokens[0]=="*"){
	    tokens.shift();
	    return true;
	}
	return false;
    },
    readOptArg:function(tokens){
	if(tokens[0].optArg){
	    return domtex.readNext(tokens);
	}
	return "";
    },
    removeSpaces:function(tokens){
	while(tokens[0] == " "){
	    tokens.shift();
	}
    },
    read:function(tokens){
	var buffer = document.createElement("div");
	domtex.extendDOM(buffer);
	domtex.expand(tokens,buffer);
	return buffer.innerHTML;
    },
    readUnit:function(tokens){
	var buffer = document.createElement("div");
	buffer.innerHTML="";
	domtex.extendDOM(buffer);
	var result = "";
	while(tokens.length > 0 && domtex.isString(tokens[0]) && domtex.expandNext(tokens,buffer)){
	    result = buffer.innerHTML;
	}
	return result;
    },
    readLength:function(tokens){
	return domtex.read(tokens);
    },
    readUntilEnd:function(tokens,end){
	var buffer = document.createElement("div");
	domtex.extendDOM(buffer);
	while(tokens.length > 0){
	    var tkn = tokens.shift();
	    if(tkn.name != "end" || tkn.name == "endgroup"){
		domtex.expand(tkn,buffer);
		continue;
	    }
	    var nexttkn = tokens.shift();
	    if(domtex.isArray(nexttkn) && nexttkn[0] == end){
		return buffer.innerHTML;
	    } else {
		domtex.expand(nexttkn,buffer);
	    }
	}
	console.log("ERROR: missing \\end{"+end+"}");
	return buffer.innerHTML;
    },
    shiftTokensUntil:function(tokens,stoptoks){
	// this 'black magic' envs counter is somewhat of a hack
	// it is required to avoid exiting out of nested environments all too quickly at the moment
	// however, at some point, this should be replaced by a cleaner solution
	var envs = 0;
	var newtoks = [];
	while(tokens.length > 0 && tokens[0]){
	    if(envs <= 0){
		for(var i=0; i<stoptoks.length; i++){
		    if(tokens[0] == stoptoks[i])
			return newtoks;
		    if(stoptoks[i] && tokens[0].name && stoptoks[i].name && tokens[0].name == stoptoks[i].name)
			return newtoks;
		}
	    }
	    if(tokens[0].name == "end")   envs--;
	    if(tokens[0].name == "endgroup")   envs--;
	    if(tokens[0].name == "begin") envs++;
	    if(tokens[0].name == "begingroup") envs++;
	    newtoks.push(tokens.shift());
	}
	return newtoks;
    },
    shiftTokensUntilCommand:function(tokens,stopcmds){
	if(domtex.isArray(stopcmds)){
	    var stoptoks = [];
	    for(var i=0; i<stopcmds.length; i++){
		stoptoks.push(domtex.getCommand(stopcmds[i]));
	    }
	    return domtex.shiftTokensUntil(tokens,stoptoks);
	} else if(domtex.isString(stopcmds)){
	    return domtex.shiftTokensUntil(tokens,[domtex.getCommand(stopcmds)]);
	} else if(stopcmds.expand){
	    return domtex.shiftTokensUntil(tokens,[stopcmds]);
	}
	console.log("ERROR in shiftTokensUntilCommand: unknown argument '"+stopcmds+"'!");
    },
    readUntilCommand:function(tokens,end){
	var buffer = document.createElement("div");
	domtex.extendDOM(buffer);
	var toks = domtex.shiftTokensUntilCommand(tokens,end);
	if(tokens.length < 1){
	    console.log("ERROR: missing \\"+end);
	}
	domtex.expand(toks,buffer);
	return buffer.innerHTML;
    },
    readUntilSymbol:function(tokens,end){
	var toks = domtex.shiftTokensUntil(tokens,end);
	var buffer = document.createElement("div");
	domtex.extendDOM(buffer);
	domtex.expand(toks,buffer);
	return buffer.innerHTML;
    },
    expandUntilCommand:function(tokens,target,cmdnames){
       if(domtex.isArray(tokens)){
	   var toks = domtex.shiftTokensUntilCommand(tokens,cmdnames);
//	   console.log("found "+toks.length + " tokens until "+cmdnames[0]+" and others");
	   var status = domtex.expand(toks,target);
	   if(tokens.length > 0){
	       return domtex.Status.READING;
	   }
	   return status;
       }
       return domtex.expandNext(tokens,target);  
    },
    expandUntilEnd:function(tokens,target){
	if(domtex.isArray(tokens)){
	    var toks = domtex.shiftTokensUntilCommand(tokens,["end","endgroup"]);
	    var status = domtex.expand(toks,target);
	    if(tokens.length > 0){
		return domtex.Status.READING;
	    }
	    return status;
	}
	return domtex.expandNext(tokens,target);  
    },
    expandNext:function(tokens,target){
	if(!target || !target.createChild){
	    console.log("expandNext called with invalid target:",target);
	    return domtex.Status.ERROR;
	} 
	if(domtex.isArray(tokens)){
	    if(tokens.length < 1) return domtex.Status.ENDSTREAM;
	    var token = tokens.shift();
	}  else {
	    var token = tokens;
	}
	if(token === undefined || token === null || token === false){
	    target.appendChild(domtex.createDummy(token));
	    return domtex.Status.ERROR;
	} else if(domtex.isArray(token)){
	    domtex.expand(token,target);
	    return domtex.Status.READING;
	} else if(domtex.isString(token)){
	    target.appendText(token);
	    return domtex.Status.READING;
	} 
	if(!token.name){
	    console.log("ERROR: cannot process token of type '"+typeof token+"':",token);
	    return domtex.Status.ERROR;
	}
	var cmd = domtex.getCommand(token.name);
	if(!cmd){
	    console.log("missing definition of control sequence "+token.name+" in scope "+domtex.scopes.length);
	    console.log(domtex.scopes[0]);
	    return true;
	}
	if(cmd.isUndefined){
	    console.log("undefined control sequence: " +cmd.name);
	    target.appendChild(domtex.createDummy(cmd.name));
	    return domtex.Status.READING;
	} else if(cmd.expand !== undefined){
	    var retval = cmd.expand(tokens,target);
	    if(retval == domtex.Status.ERROR){
		console.log("the command '"+cmd.name+"' reported an error during expansion!")
	    }
	    return retval;
	} else if(cmd.name == "#localVariable"){
	    return domtex.expand(domtex.cloneArray(domtex.getArgument(cmd.index)));
	} else {
	    console.log("ERROR: command '"+token.name+"' is missing an expand method!");
	    return false;
	}
    },
    expand:function(token,target){
	if(domtex.isArray(token)){
	    var cnt = 0;
	    while(true){
		var retval = domtex.expandNext(token,target);
		cnt++;
		if(retval == domtex.Status.ENDSTREAM){
		    return domtex.Status.ENDSTREAM;
		}
		if(retval == domtex.Status.ENDGROUP){
		    return domtex.Status.ENDGROUP;
		}
		if(retval == domtex.Status.ERROR){
		    return domtex.Status.ERROR;
		}
	    }
	    return domtex.Status.ENDSTREAM;
	}
	return domtex.expandNext(token,target);
    },
    /////////////////////////////////////////////////////////////
    // finalization is the last step. this step replaces the
    // neccessity to rerun TeX in that it resolves any open issues
    // (like references, etc) in one go
    /////////////////////////////////////////////////////////////
    finalize:function(){
	// fill the contents of references
	var links = document.getElementsByClassName("domtex_refstyle");
	console.log("filling references for "+links.length+" items!");
	for(var i=0; i<links.length; i++){
	    var obj = links[i];
	    var id = obj.refid;
	    var refObj = document.getElementById(id);
	    if(refObj){
		obj.innerText=refObj.info;
	    } else {
		obj.innerHTML=domtex.unknownCSalias;
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
    // some special parsing functions need to be defined as glue code
    /////////////////////////////////////////////////////////////
    findenvbegin : function(source,envname){
	var s = "\\begin{"+envname+"}";
	var idx = source.indexOf(s);
	if(idx < 0) return idx;
	return idx+s.length;
    },
    findenvend : function(source,envname){
	return source.indexOf("\\end{"+envname+"}");
    },
    parseKeyValArg:function(token){
	var x = true;
	var obj = {};
	while(token.length > 0){
	    x = domtex.readUntilSymbol(token,[","]).replace(/,+$/, "");
	    var sep = x.indexOf("=");
	    var key = x.substr(0,sep).trim();
	    var val = x.substr(sep+1).trim();
	    if(key){
		obj[key]=val;
	    }
	    token.shift();
	}
	return obj;
    },
    parseColumnArg:function(defs){
	var retval = []
	var idx = -1;
	var borderwidth = "1px";
	var bordercolor = "black";
	var i = -1;
	var nVerts = 0;
	for(var i=0; i<defs.length; i++){
	    if(defs[i] == ' ') continue;
	    if(defs[i] == '|'){
		nVerts++;
		continue;
	    }
	    if(defs[i] == '>'){
		i++;
		retval[idx+1] = {prefixTokens:defs[i]};
		continue;
	    }
	    idx++;
	    if(!retval[idx])
		retval[idx] = new Object();
	    if(nVerts > 0){
		if(nVerts == 1)
		    retval[idx]["border-left"]=borderwidth + " solid " + bordercolor;
		if(nVerts > 1)
		    retval[idx]["border-left"]=borderwidth + " double " + bordercolor;
		nVerts = 0;
	    }
	    if(defs[i] == 'c'){
		retval[idx]["text-align"] = "center";
	    }
	    if(defs[i] == 'r'){
		retval[idx]["text-align"] = "right";
	    }
	    if(defs[i] == 'l'){
		retval[idx]["text-align"] = "left";
	    }
	    if(defs[i] == 'p'){
		retval[idx]["width"] = domtex.read(defs[i+1]);
		i++;
	    }
	}
	if(nVerts > 0){
	    if(nVerts == 1)
		retval[idx]["border-right"]=borderwidth + " solid " + bordercolor;
	    if(nVerts > 1)
		retval[idx]["border-right"]=borderwidth + " double " + bordercolor;
	    nVerts = 0;
	}
	return retval;
    },
    /////////////////////////////////////////////////////////////
    // in the end, we just need to plug it all together
    /////////////////////////////////////////////////////////////
    // texdoc runs domtex on an entire document
    texdoc:function(source){
	domtex.createFileDialogue();
	domtex.extendDOM(domtex.buffer);
	var begindocument = domtex.findenvbegin(source,"document");
	var enddocument   = domtex.findenvend(source,"document");
	if(begindocument >= 0 && enddocument >= 0){
	    var preamble = document.createElement("div");
	    domtex.extendDOM(preamble);
	    domtex.tex(source.substr(0,begindocument-16),preamble);
	    var container = document.createElement("div");
	    domtex.container = container;
	    domtex.extendDOM(container);
	    domtex.tex(source.substr(begindocument,enddocument-begindocument),container);
	    container.className="domtex";
	    setTimeout(function() { domtex.finalize(); }, 100);
	    return container;
	}
	return "domtex error: missing begin/end document!"
    },
    tex:function(source,target){
	var tokens = domtex.tokenize(source);
	if(domtex.resolve(tokens,target)){
	    domtex.activateFileDialogue(function(){domtex.expand(tokens,target);})
	} else {
	    domtex.expand(tokens,target);
	}
    },
    // a couple of TeX primitives need to be hardcoded
}

// general setup for TOC, LOF, LOT, etc...
domtex.resources.tableofcontents=document.createElement("div");
domtex.extendDOM(domtex.resources.tableofcontents);
domtex.resources.tableofcontents_title = domtex.resources.tableofcontents.createChild("div",{"id":"domtex_toctitle","className":"domtex_toctitle"})
domtex.resources.tableofcontents_title.innerHTML="Table of Contents";
domtex.resources.listoffigures=document.createElement("div");
domtex.extendDOM(domtex.resources.listoffigures);
domtex.resources.listoffigures_title = domtex.resources.listoffigures.createChild("div",{"id":"domtex_loftitle","className":"domtex_loftitle"})
domtex.resources.listoffigures_title.innerHTML="List of Figues";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Here, the definition of TeX primitives, commands and functions begins
//  !!! No core engine code beyond this point !!!
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//// basic symbols
//domtex.newCommand("par",      function(tokens,parent){ parent.appendChild(document.createElement("br")); return true; });
domtex.newCommand("par",      function(tokens,parent){ 
    if(tokens.length > 0) domtex.expandUntilCommand(tokens,parent.createChild("p"),["par"]);
    return domtex.Status.READING;
});
domtex.newCommand("newline",  function(tokens,parent){ parent.createChild("br"); return true; });
domtex.newCommand("linebreak",function(tokens,parent){ parent.createChild("br"); return true; });
domtex.newCommand("rule"    ,function(tokens,parent){ 
    parent.createChild("span",{"style":{"content":" ","display":"inline-block","background-color":"black","width":domtex.readLength(tokens.shift()),"height":domtex.readLength(tokens.shift())}}); 
    return true;
});

//// extra symbols
domtex.newCommand("glqq",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&bdquo;" )); return true});
domtex.newCommand("grqq",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&ldquo;" )); return true});
domtex.newCommand("guillemotleft",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&laquo;" )); return true});
domtex.newCommand("guillemotright",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&raquo;" )); return true});
domtex.newCommand("euro",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&euro;"  )); return true});
domtex.newCommand("textndash",function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&ndash;" )); return true});
domtex.newCommand("textmdash",function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&mdash;" )); return true});
domtex.newCommand("texttimes",function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&times;" )); return true});
domtex.newCommand("times",function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&times;" )); return true});
domtex.newCommand("infty",function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&infin;" )); return true});
domtex.newCommand("textinfty",function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&infin;" )); return true});
domtex.newCommand("dots",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&#8230;" )); return true});
domtex.newCommand("&",        function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&amp;"   )); return true});
domtex.newCommand("%",        function(tokens,parent){parent.appendText(domtex.getHTMLAlias("%"   )); return true});
domtex.newCommand("_",        function(tokens,parent){parent.appendText("_"); return true});
domtex.newCommand("heartsuit",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&hearts;"  )); return true});
domtex.newCommand("diamondsuit",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&diams;"  )); return true});
domtex.newCommand("clubsuit",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&clubs;"  )); return true});
domtex.newCommand("spadesuit",     function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&spades;"  )); return true});

//// greek
domtex.newCommand("textmu",function(tokens,parent){parent.appendText(domtex.getHTMLAlias("&mu;" )); return true});

//// 'special' ignored commands
domtex.ignoreCommand("relax");
domtex.ignoreCommand("cr");

//// ignored commands
domtex.ignoreCommand("sloppy");
domtex.ignoreCommand("makeatletter");
domtex.ignoreCommand("makeatother");
domtex.ignoreCommand("twocolumn");
domtex.ignoreCommand("onecolumn");
domtex.ignoreCommand("noindent");
domtex.ignoreCommand("geometry",1);
domtex.ignoreCommand("pagestyle",1);
domtex.ignoreCommand("hypthenation",1);
domtex.ignoreCommand("let",2);
domtex.ignoreCommand("addtokomafont",2);
domtex.ignoreCommand("appendix");
domtex.ignoreCommand("clearpage");
domtex.ignoreCommand("cleardoublepage");
domtex.ignoreCommand("newpage");
		 
//// document setup
domtex.newCommand("author",function(tokens,parent){ 
    var cmd = domtex.newCommand("theauthor",function(toks,p){
	domtex.expand(this.content,p);
	return true;
    });
    cmd.content=tokens.shift();
    return true;
});

domtex.newCommand("title",function(tokens,parent){ 
    var cmd = domtex.newCommand("thetitle",function(toks,p){
	domtex.expand(this.content,p);
	return true;
    });
    cmd.content=tokens.shift();
    return true;
});

domtex.newCommand("maketitle",function(tokens,parent){ 
    var thetitle = domtex.getCommand("thetitle");
    if(thetitle){
	document.title = domtex.read(thetitle.content);
    } else {
	document.title = "Unnamed domtex document";
    }
    return true;
});

domtex.newCommand("tableofcontents",function(tokens,parent){
    parent.appendChild(domtex.resources.tableofcontents);
});

domtex.newCommand("listoffigures",function(tokens,parent){
    parent.appendChild(domtex.resources.listoffigures);
});

domtex.newCommand("@starttoc",function(tokens,parent){
    var arg = domtex.readNext(tokens);
    if(arg == "toc"){
	parent.appendChild(domtex.resources.tableofcontents);
	return true;
    } else {
	console.log("ERROR: cannot start toc of unknown type '"+arg+"'!");
	return false;
    }
});

///// include commands

domtex.newCommand("usepackage",function(tokens,parent){
    domtex.buffer.innerHTML="";
    var optArg = "";
    if(tokens[0].optArg){
	domtex.expandNext(tokens,domtex.buffer);
	optArg = domtex.buffer.innerText;
    }
    domtex.buffer.innerHTML="";
    domtex.expandNext(tokens,domtex.buffer);
    var pkgname = domtex.buffer.innerText;
    if(domtex.packages[pkgname]){
	console.log("including package '"+pkgname+"' with options '"+optArg+"'");
	return domtex.packages[pkgname].load(optArg);
    } else {
	throw "Error: cannot load package '"+pkgname+"' - if this is an external package not provided by tex.js, you need to call 'domtex.preload_package(name,path)' to pre-load it!";
    }
});

domtex.newInclude("input",function(tokenstream,position){
    var fname = domtex.read(tokenstream[position+1]);
    console.log(fname);
    var handler = function(evt){
	var files = evt.target.files; 
	for (var i = 0, f; f = files[i]; i++) {
	    if (!f.type.match("text.*")) {
		continue;
	    }
	    var reader = new FileReader();
	    reader.onload = (function(theFile) {
		return function(e) {
		    var tokens = domtex.tokenize(e.target.result);
		    domtex.resolve(tokens);
		    tokenstream[position] = tokens;
		    console.log("input file '"+fname+"' loaded");
		};
	    })(f);
	    reader.readAsText(f);
	};
    };
    domtex.addToFileDialogue(fname,"input","text",handler);
});

domtex.newInclude("includegraphics",function(tokenstream,position){
    var hasOptArg = tokenstream[position+1].optArg;
    var fname = domtex.read(tokenstream[position+hasOptArg+1]);
    if(hasOptArg){
	var args = domtex.parseKeyValArg(tokenstream[position+1]);
    }
    console.log(fname);
    var handler = function(evt){
	var files = evt.target.files; 
	for (var i = 0, f; f = files[i]; i++) {
	    if (!f.type.match("image.*")) {
		continue;
	    }
	    var reader = new FileReader();
	    reader.onload = (function(theFile) {
		return function(e) {
		    var cmd = {content:e.target.result};
		    tokenstream[position] = cmd;
		    cmd.expand = function(tokens,parent){parent.createChild("img",this.properties).src = this.content; return true;};
		    cmd.properties={"style":{}};
		    // TODO: figure out how to handle these things ("\columnwidth" etc.)
//		    if(args["width"]) cmd.properties.style["width"] = args["width"];
//		    if(args["height"]) cmd.properties.width = args["height"];
		    console.log("input file '"+fname+"' loaded");
		};
	    })(f);
	    reader.readAsDataURL(f);
	};
    };
    domtex.addToFileDialogue(fname,"includegraphics","image",handler);
});

///// tricky things

domtex.newCommand("url",function(tokens,parent){ 
    var link = domtex.readNext(tokens);
    parent.createChild("a",{"href":domtex.linkify(link)}).innerHTML=link;
    return true;
});

domtex.newCommand("href",function(tokens,parent){ 
    var link = domtex.readNext(tokens);
    var content = parent.createChild("a",{"href":domtex.linkify(link)});
    return domtex.expandNext(tokens,content);
});

domtex.newCommand("footnote",function(tokens,parent){ 
    var content = domtex.readNext(tokens);
    parent.createChild("span",{"title":content}).innerHTML="*";
    return true;
});

domtex.newCommand("label",function(tokens,target){
    domtex.buffer.innerHTML="";
    var retval = domtex.expandNext(tokens,domtex.buffer);
    var label = domtex.buffer.innerText;
    var obj = domtex.getLastRef();
    var hook = document.createElement("span");
    hook.id=label,
    hook.info = obj.info;
    obj.insertBefore(hook,obj.firstChild);
    return retval;
});

domtex.newCommand("ref",function(tokens,target){
    domtex.buffer.innerHTML="";
    var retval = domtex.expandNext(tokens,domtex.buffer);
    var label = domtex.buffer.innerText;
    target.createChild("a",{
	"href":"#"+label,
	"refid":label,
	"className":"domtex_refstyle",
    })
    return retval;
});

domtex.newCommand("documentclass",function(tokens,target){
    var optArg = domtex.readOptArg(tokens);
    var docclass = domtex.readNext(tokens);
    console.log("using document class '"+docclass+"' with arguments '"+optArg+"'");
    domtex.setupDocumentClass(docclass);
    return true;
});

domtex.setupDocumentClass = function(docclass){
    if(docclass == "book"){
	domtex.getCurrentScope().tags.chapter="h1";
	var sections = ["chapter","section","subsection","subsubsection"];
    } else {
	var sections = ["section","subsection","subsubsection"];
    }
    for(var i=0; i<sections.length; i++){
	var tag = domtex.scopes[0].tags[sections[i]];
	domtex.newCounter(sections[i]);
	var seccmd = domtex.newCommand(sections[i],function(tokens,parent){
	    var id = domtex.makeid();
	    var header = parent.createChild(tag,{"id":id,"className":"domtex_secstyle_"+this.name});
	    domtex.stepCounter(this.name);
	    var thesec = this.getSecNum();
	    domtex.setLastRef(header,thesec);
	    if(this.depth < domtex.getCounter("secnumdepth")){
		header.innerHTML=thesec + " ";
	    } else {
		header.innerHTML = "";
	    }
	    var retval = domtex.expandNext(tokens,header);
	    var tocentry = domtex.resources.tableofcontents.createChild("a",{"className":"domtex_tocstyle_"+this.name,"href":"#"+id});
	    tocentry.innerHTML=header.innerHTML;
	    return retval;
	});
	seccmd.depth = i;
	if(i>0){
	    domtex.setCounterWithin(sections[i-1],sections[i]);
	    seccmd.parentSectionName = sections[i-1];
	    seccmd.getSecNum = function(){
		return domtex.getCommand(this.parentSectionName).getSecNum()+"."+domtex.getCounter(this.name);
	    }
	} else {
	    seccmd.getSecNum = function(){
		return domtex.getCounter(this.name);
	    }
	}
	domtex.newCommand(sections[i]+"*",function(tokens,parent){
	    var retval = domtex.expandNext(tokens,parent.createChild(tag));
	    return retval;
	});
    }
};
domtex.newCommand("paragraph",    function(tokens,target){return domtex.expandNext(tokens,target.createChild("span",{"style":{"font-weight":"bold"}}))});

//// font choices
domtex.newCommand("textit",    function(tokens,target){return domtex.expandNext(tokens,target.createChild("span",{"style":{"font-style":"italic"}}))});
domtex.newCommand("textbf",    function(tokens,target){return domtex.expandNext(tokens,target.createChild("span",{"style":{"font-weight":"bold"}}))});
domtex.newCommand("texttt",    function(tokens,target){return domtex.expandNext(tokens,target.createChild("span",{"style":{"font-family":"monospace"}}))});
domtex.newCommand("textsc",    function(tokens,target){return domtex.expandNext(tokens,target.createChild("span",{"style":{"font-variant":"small-caps"}}))});
domtex.newCommand("itshape",   function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("span",{"style":{"font-style":"italic"      }}))});
domtex.newCommand("twistshape",function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("span",{"style":{"font-style":"italic"      }}))});
domtex.newCommand("bfseries",  function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("span",{"style":{"font-weight":"bold"       }}))});
domtex.newCommand("mdseries",  function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("span",{"style":{"font-weight":"normal"       }}))});
domtex.newCommand("sffamily",  function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("span",{"style":{"font-family":"sans-serif"       }}))});

domtex.newCommand("centering",  function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("div",{"style":{"text-align":"center"       }}))});
domtex.newCommand("flushleft",  function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("div",{"style":{"text-align":"left"       }}))});
domtex.newCommand("flushright", function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("div",{"style":{"text-align":"right"       }}))});

domtex.setLength("tiny","6pt");
domtex.setLength("footnotesize","8pt");
domtex.setLength("small","10pt");
domtex.setLength("normalsize","12pt");
domtex.setLength("large","14pt");
domtex.setLength("Large","16pt");
domtex.setLength("LARGE","18pt");
domtex.setLength("huge","20pt");
domtex.setLength("Huge","22pt");
domtex.setLength("HUGE","24pt");
var fontsizes = ["tiny","footnotesize","small","normalsize","large","Large","LARGE","huge","Huge","HUGE"];
for(var i=0; i<fontsizes.length; i++){
    var fs = fontsizes[i];
    domtex.newCommand(fontsizes[i],function(tokens,parent){return domtex.expand(tokens,parent.createChild("span",{"style":{"font-size":domtex.getLength(fs)}}));});
}

domtex.newCommand("fontsize",function(tokens,parent){
    var size = domtex.readLength(tokens.shift());
    domtex.setLength("_fontsize",size);
    var space = domtex.readLength(tokens.shift());
    domtex.setLength("_linespace",space);
    return true;
});

domtex.newCommand("selectfont",function(tokens,parent){
    var size = domtex.getLength("_fontsize");
    return domtex.expand    (tokens,parent.createChild("span",{"style":{"font-size":size}}));
});

domtex.newCommand("setcounter",function(tokens,parent){
    var name = domtex.readNext(tokens);
    var val = parseInt(domtex.readNext(tokens));
    domtex.setCounter(name,val);
    return true;
});

domtex.newCommand("setlength",function(tokens,parent){
    var name = domtex.readNext(tokens);
    var val = domtex.readNext(tokens);
    domtex.setLength(name,val);
    return true;
});

//// boxes
//domtex.newCommand("mbox",function(tokens){return "<span style='white-space:nowrap'>"+domtex.tex(tokens.shift())+"</span>"});
//domtex.newCommand("fbox",function(tokens){return "<span style='white-space:nowrap; border:"+domtex.lengths.frameborder+"'>"+domtex.tex(tokens.shift())+"</span>"});
//domtex.newCommand("parbox",function(tokens){return "<span'>"+domtex.tex(tokens.shift())+"</span>"});

//// spacing
domtex.setLength("bigskip","1em");
domtex.setLength("smallskip","0.5em");
domtex.newCommand("bigskip",  function(tokens,parent){parent.createChild("div",{"style":{"margin":domtex.getLength("bigskip")  }}); return true;});
domtex.newCommand("smallskip",function(tokens,parent){parent.createChild("div",{"style":{"margin":domtex.getLength("smallskip")}}); return true;});
domtex.newCommand("vspace",   function(tokens,parent){var space = domtex.readLength(tokens.shift()); parent.createChild("br",{"style":{"content":" ","display":"block","margin":space}});return true;});
domtex.newCommand("vskip",    function(tokens,parent){parent.createChild("div",{"style":{"margin":domtex.readLength(tokens)}}); return true});


//// non-trivial TeX primitives
domtex.newCommand("begin",function(tokens,target){
    domtex.buffer.innerHTML="";
    domtex.expandNext(tokens,domtex.buffer);
    var envname = domtex.buffer.innerHTML;
    if(envname[envname.length-1] == "*"){
	console.log("found starred version of "+envname);
	var starred = true;
	var env = domtex.getEnvironment(envname.substr(0,envname.length-1));
    } else {
	console.log("found unstarred version of "+envname);
	var starred = false;
	var env = domtex.getEnvironment(envname);
    }
    domtex.enterScope();
    // it is important that the return-value is not forwarded
    // otherwise, the expander would return the ENDSTREAM/ENDGROUP
    // message all the way up to the body
    if(!env){
	console.log("warning: encountered unknown begin-environment '"+envname+"'");
	domtex.expand(tokens,target.createChild("span",{"title":envname}));
	return domtex.Status.READING;

    }
    domtex.prependArray(env.beginTokens,tokens);
    console.log("entering environment '"+envname+"'");
    env.expand(tokens,target,starred);
    return domtex.Status.READING;
});

domtex.newCommand("end",function(tokens,target){
    var envname = domtex.readNext(tokens);
    if(envname[envname.length-1] == "*"){
	console.log("found starred version of "+envname);
	var starred = true;
	var env = domtex.getEnvironment(envname.substr(0,envname.length-1));
    } else {
	console.log("found unstarred version of "+envname);
	var starred = false;
	var env = domtex.getEnvironment(envname);
    }
    if(!env){
	console.log("warning: encountered unknown end-environment '"+envname+"'");
    } else {
	console.log("leaving environment '"+envname+"'");
	domtex.prependArray(env.endTokens,tokens);
    }
    domtex.leaveScope();
    return domtex.Status.ENDGROUP;
});

domtex.newCommand("begingroup",function(tokens,target){
    domtex.buffer.innerHTML="";
    console.log("begingroup");
    domtex.enterScope();
    // it is important that the return-value is not forwarded
    // otherwise, the expander would return the ENDSTREAM/ENDGROUP
    // message all the way up to the body
    domtex.expand(tokens,target.createChild("span"));
    return domtex.Status.READING;
});

domtex.newCommand("endgroup",function(tokens,target){
    console.log("endgroup");
    domtex.leaveScope();
    return domtex.Status.ENDGROUP;
});

domtex.newCommand("csname",function(tokens,parent){
    // TODO: IMPLEMENT THIS
    var csname = domtex.readUntilCommand(tokens,"endcsname");
    console.log("encountered csname '"+csname+"'");
    return true;
});

domtex.newCommand("endcsname",function(tokens,parent){
    return true;
});

domtex.newCommand("newenvironment",function(tokens,parent){
    var envname = domtex.readNext(tokens);
    if(domtex.getEnvironment(envname) != undefined){
	console.log("environment "+envname + " is already defined!");
	return true;
    }
    console.log("defining new environment '"+envname+"'");
    var env = new Object();
    env.name = envname;
    env.expand=expand;
    env.beginTokens = undefined;
    while(!domtex.isArray(env.beginTokens)){
	env.beginTokens = tokens.shift();
    }
    env.endTokens = undefined;
    while(!domtex.isArray(env.endTokens)){
	env.endTokens = tokens.shift();
    }
    env.expand=function(tokens,target){
	var child = target.createChild("span",{"title":this.name});
	console.log("expanding environment '"+this.name+"'");
	return domtex.expand(tokens,child);
    }
    domtex.addEnvironment(env);
    return true;
});


domtex.newCommand("providecommand",function(tokens,parent){
    var next = tokens.shift();
    var cmd = undefined;
    if(domtex.isArray(next)) cmd = next.shift();
    else cmd = next;
    var cmdtoks = tokens.shift();
    var cmdargc = 0;
    if(tokens[0].optArg){
	cmd.nArgs = parseInt(domtex.readNext(tokens));
    }
    if(cmd.isUndefined){
	cmd.isUndefined = false;
	cmd.expand = function(tkns,prnt){
	    for(var i=0; i<this.nArgs; i++){
		domtex.setArgument(i,tkns.shift());
	    }
	    domtex.prependArray(this.tokens,tkns);
	    return domtex.expand(tkns,prnt);
	};
	cmd.tokens = cmdtoks;
        cmd.nArgs = cmdargc;
    }
    console.log("providing command",cmd);
    return true;
});
domtex.newCommand("newcommand",domtex.getCommand("providecommand").expand);
domtex.newCommand("def",domtex.getCommand("providecommand").expand);
domtex.newCommand("renewcommand",domtex.getCommand("providecommand").expand);

domtex.newCommand("newlength",function(tokens,parent){
    domtex.newLength(domtex.readNext(tokens));
    return true;
});

domtex.newCommand("newcounter",function(tokens,parent){
    domtex.newCounter(domtex.readNext(tokens));
    return true;
});

//// environments

domtex.newEnvironment("center",function(tokens,target){return domtex.expand(tokens,target.createChild("div",{"style":{"text-align":"center"}}))});
domtex.newEnvironment("abstract",function(tokens,target){return domtex.expand(tokens,target.createChild("div",{"style":{"margin":"2cm","text-align":"justify"}}))});
domtex.newEnvironment("small",function(tokens,target){return domtex.expand(tokens,target.createChild("div",{"style":{"font-size":"0.7em"}}))});
domtex.newEnvironment("minipage",function(tokens,target){var width = domtex.readNext(tokens); return domtex.expand(tokens,target.createChild("div",{"style":{"width":width}}))});
domtex.newEnvironment("quotation",function(tokens,target){return domtex.expand(tokens,target.createChild("div",{"style":{"margin-left":"1em"}}))});
domtex.newEnvironment("multicols",function(tokens,target,starred){
    domtex.expandNext(tokens,domtex.buffer); 
    return domtex.expand(tokens,target.createChild("div"))
});
domtex.newEnvironment("itemize",function(tokens,target){
    domtex.newCommand("item",  function(tokens,target){
	var bullet = domtex.readOptArg(tokens);
	if(!bullet) bullet="•";
	domtex.removeSpaces(tokens);
	var item = target.createChild("li",{});
	domtex.expandUntilCommand(tokens,item,["item"]); 
	item.setAttribute("data-item",bullet);
	return domtex.Status.READING;
    },true);
    return domtex.expand(tokens,target.createChild("ul",{"className":"domtex_itemize"}));
});
domtex.newEnvironment("description",function(tokens,target){
    domtex.newCommand("item",  function(tokens,target){
	var itemtext = domtex.readOptArg(tokens);
	domtex.removeSpaces(tokens);
	var item = target.createChild("li",{});
	domtex.expandUntilCommand(tokens,item,["item"]); 
	item.setAttribute("data-item",itemtext);
	return domtex.Status.READING;
    },true);
    return domtex.expand(tokens,target.createChild("ul",{"className":"domtex_description"}));
});
domtex.newCommand("caption",function(tokens,target){
    return domtex.expandNext(tokens,target.createChild("div",{"style":{"text-align":"center"}}))
});
domtex.newCounter("figure");
domtex.newEnvironment("figure",function(tokens,target){
    domtex.readOptArg(tokens);
    domtex.newCommand("caption",function(tokens,target){
	return domtex.expandNext(tokens,target.createChild("div",{"style":{"text-align":"center"}}))
    },true);
    if(tokens[0].optArg) tokens[0].shift();
    domtex.stepCounter("figure");
    return domtex.expand(tokens,target.createChild("div",{"style":{"text-align":"center"}}))
});

domtex.newEnvironment("table",function(tokens,target,starred){
    domtex.readOptArg(tokens);
    domtex.newCommand("caption",function(tokens,target){
	return domtex.expandNext(tokens,target.createChild("div",{"style":{"text-align":"center"}}))
    },true);
    if(tokens[0].optArg) tokens[0].shift();
    domtex.stepCounter("table");
    return domtex.expand(tokens,target.createChild("div",{"style":{"text-align":"center"}}))
});

domtex.newEnvironment("subtable",function(tokens,target){
    domtex.readOptArg(tokens);
    domtex.stepCounter("table");
    var width = domtex.readLength(tokens[0]);
    return domtex.expand(tokens,target.createChild("div",{"style":{"display":"inline-block","text-align":"center","width":width}}))
});

domtex.printArray=function(arr,indent){
    if(!indent) indent = "";
    for(var i=0; i<arr.length; i++){
	if(domtex.isArray(arr[i])) domtex.printArray(arr[i],indent+" ");
	else if(domtex.isString(arr[i])) console.log(indent+arr[i]);
	else  console.log(indent+arr[i].name);
    }
}

domtex.newEnvironment("tabular",function(tokens,target){
    var defs = tokens.shift();
    var cols = domtex.parseColumnArg(defs);
    var colcnt = 0;
    var tab = target.createChild("table",{"style":{"border-collapse":"collapse"}});
    var status = domtex.Status.READING;
    while(status == domtex.Status.READING){
	var row = tab.createChild("tr");
	while(colcnt < cols.length){
	    var cell = row.createChild("td",{"style":cols[colcnt]});
	    domtex.prependArray(cols[colcnt].prefixTokens,tokens);
	    status = domtex.expandUntilCommand(tokens,cell,["end","cr","newline","tabularnewline"]);
	    colcnt++;
	    var next = tokens.shift();
	    if(!next){
		return domtex.Status.READING;
	    }
	    if(next.name == "cr"){
		continue;
	    } else if(next.name == "end"){
		// TODO: what happens if this is not the end that belongs to the table?
		return next.expand(tokens,target);
	    } else {
		break;
	    }
	}
	var nlines = 0;
	while(tokens[0].name=="hline"){
	    tokens.shift();
	    nlines++;
	}
	if(nlines > 0){
	    row.style["border-bottom"]="1px solid black";
	}
	colcnt = 0;
    }
    return domtex.Status.READING;
});
domtex.newEnvironment("longtable",domtex.getEnvironment("tabular").expand);

//// math commands
domtex.newEnvironment("$",function(tokens,target){
    if(MathJax){
	var id = domtex.makeid();
	var text = domtex.readUntilEnd(tokens,"$");
	var math = target.createChild("span",{"id":"MathOutput_"+id,"class":"MathJax"});
	math.innerHTML = text;
	return true;
    } else {
	return domtex.expand(tokens,target.createChild("span",{"class":"Math"}));
    }
});

domtex.newCommand("ensuremath",function(tokens,target){
    if(MathJax){
	var id = domtex.makeid();
	var text = domtex.readNext(tokens);
	var math = target.createChild("span",{"id":"MathOutput_"+id,"class":"MathJax"});
	math.innerHTML = text;
	return true;
    } else {
	return domtex.expandNext(tokens,target.createChild("span",{"style":{"font-style":"italic"}}));
    }

});

//// ignored packages that make no sense for domtex
domtex.ignore_package("inputenc");
domtex.ignore_package("fontenc");
domtex.ignore_package("geometry");
domtex.ignore_package("a4wide");
domtex.ignore_package("multicol");
domtex.ignore_package("flafter");
domtex.ignore_package("placeins");
domtex.ignore_package("fancyhdr");

//// ignored packages that are already inside the default implementation
domtex.ignore_package("hyperref");
domtex.ignore_package("array");
domtex.ignore_package("color");
domtex.ignore_package("xcolor");
domtex.ignore_package("url");

//// special font packages that will probably never be implemented anyway
domtex.ignore_package("trajan");
domtex.ignore_package("vicent");
domtex.packages.sqrcaps = { load:function(args){
    domtex.newCommand("sqrcfamily",function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("span",{"style":{"font-variant":"small-caps"}}))});
}};
domtex.packages.auncial = { load:function(args){
    domtex.newCommand("aunclfamily",function(tokens,target){return domtex.expandUntilEnd(tokens,target.createChild("span",{"style":{"font-variant":"small-caps"}}))});
}};

//// packages that have not yet been implemented
domtex.ignore_package("graphicx");
domtex.ignore_package("microtype");
domtex.ignore_package("textcomp");
domtex.ignore_package("caption");
domtex.ignore_package("titlesec");
domtex.ignore_package("enumitem");
domtex.ignore_package("subcaption");
domtex.ignore_package("longtable");
domtex.ignore_package("chngcntr");

/// package emulation

domtex.packages.verse = { load:function(args){
    domtex.newEnvironment("verse",function(tokens,target){return domtex.expand(tokens,target.createChild("div",{"title":"verse","style":{"margin-top":"10px","margin-bottom":"10px","margin-left":"30px"}}))});
    return true;
}};

domtex.packages.calligra = { load:function(args){
    domtex.newCommand("calligra",  function(tokens,target){return domtex.expand    (tokens,target.createChild("span",{"style":{"font-family":"cursive"       }}))});
    return true;
}};

domtex.packages.pgothic = { load:function(args){
    domtex.newCommand("pgothfamily",  function(tokens,target){return domtex.expand    (tokens,target.createChild("span",{"style":{"font-family":"Fantasy"       }}))});
    return true;
}};

domtex.packages.ccicons = { load:function(args){
    domtex.newCommand("ccLogo",           function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/cc.svg","alt":"CC"});             return true;});
    domtex.newCommand("ccAttribution",    function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/by.svg","alt":"BY"});             return true;});
    domtex.newCommand("ccShareAlike",     function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/sa.svg","alt":"SA"});             return true;});
    domtex.newCommand("ccNoDerivatives",  function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/nd.svg","alt":"ND"});             return true;});
    domtex.newCommand("ccNonCommercial",  function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/ncu.svg","alt":"NC"});            return true;});
    domtex.newCommand("ccNonCommercialEU",function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/nc-eu.svg","alt":"NCEU"});        return true;});
    domtex.newCommand("ccNonCommercialJP",function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/by-jp.svg","alt":"NCJP"});        return true;}); 
    domtex.newCommand("ccZero",           function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/zero.svg","alt":"0"});            return true;});
    domtex.newCommand("ccPublicDomain",   function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/publicdomain.svg","alt":"PD"});   return true;});
    domtex.newCommand("ccSampling",       function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/sampling.svg","alt":"SAMPLING"}); return true;});
    domtex.newCommand("ccShare",          function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/share.svg","alt":"SHARE"});       return true;});
    domtex.newCommand("ccRemix",          function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/remix.svg","alt":"REMIX"});       return true;}); 
    domtex.newCommand("ccCopy",           function(tokens,target){target.createChild("img",{"style":{"height":"1em","width":"1em"},"src":"http://mirrors.creativecommons.org/presskit/icons/copy.svg","alt":"COPY"});         return true;}); 
    domtex.newCommand("ccby",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	return true;
    });
    domtex.newCommand("ccbysa",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccShareAlike").expand(tokens,target); 
	return true;
    });
    domtex.newCommand("ccbynd",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target);
	domtex.getCommand("ccNoDerivatives").expand(tokens,target);  
	return true;
    });
    domtex.newCommand("ccbync",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccNonCommercial").expand(tokens,target);  
	return true;
    });
    domtex.newCommand("ccbynceu",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccNonCommercialEU").expand(tokens,target);  
	return true;
    });
    domtex.newCommand("ccbyncjp",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccNonCommercialJP").expand(tokens,target);  
	return true;
    });
    domtex.newCommand("ccbyncsa",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccShareAlike").expand(tokens,target); 
	domtex.getCommand("ccNonCommercial").expand(tokens,target);  
	return true;
    });
    domtex.newCommand("ccbyncsaeu",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target);
	domtex.getCommand("ccShareAlike").expand(tokens,target);  
	domtex.getCommand("ccNonCommercialEU").expand(tokens,target);  
	return true;
    });
    domtex.newCommand("ccbyncsajp",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccShareAlike").expand(tokens,target); 
	domtex.getCommand("ccNonCommercialJP").expand(tokens,target);  
	return true;
    });
    domtex.newCommand("ccbyncnd",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccNonCommercial").expand(tokens,target);  
	domtex.getCommand("ccNoDerivatives").expand(tokens,target); 
	return true;
    });
    domtex.newCommand("ccbyncndeu",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccNonCommercialEU").expand(tokens,target);  
	domtex.getCommand("ccNoDerivatives").expand(tokens,target); 
	return true;
    });
    domtex.newCommand("ccbyncndjp",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccAttribution").expand(tokens,target); 
	domtex.getCommand("ccNonCommercialJP").expand(tokens,target);  
	domtex.getCommand("ccNoDerivatives").expand(tokens,target); 
	return true;
    });
    domtex.newCommand("cczero",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccZero").expand(tokens,target); 
	return true;
    });
    domtex.newCommand("ccpd",function(tokens,target){
	domtex.getCommand("ccLogo").expand(tokens,target);
	domtex.getCommand("ccPublicDomain").expand(tokens,target); 
	return true;
    });
}};


domtex.packages.babel = { load:function(args){
    var toctitle = domtex.resources.tableofcontents_title;
    if(args.indexOf("ngerman") != -1) toctitle.innerHTML="Inhaltsverzeichnis";
    var loftitle = domtex.resources.listoffigures_title;
    if(args.indexOf("ngerman") != -1) loftitle.innerHTML="Abbildungsverzeichnis";
    return true;
}};

//// css styles for various elements
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML+= '.domtex_toctitle { font-weight:bold; font-size:1.17em; margin-bottom:1em; }';
style.innerHTML+= '.domtex_refstyle               { display:inline; text-decoration:none; color: black; font-weight:normal; }';
style.innerHTML+= '.domtex_tocstyle_section       { display:block; text-decoration:none; color: black; font-weight:bold; }';
style.innerHTML+= '.domtex_tocstyle_subsection    { display:block; text-decoration:none; color: black; margin-left:1em;}';
style.innerHTML+= '.domtex_tocstyle_subsubsection { display:block; text-decoration:none; color: black; font-style:italic; margin-left:2em;}';
style.innerHTML+= '.domtex_loftitle { font-weight:bold; font-size:1.17em; margin-bottom:1em; }';
style.innerHTML+= '.domtex_hovercontainer         { position:fixed; text-align:center; display:block; width:100%; height:100%; top:0px; left:0px; z-index:10 }';
style.innerHTML+= '.domtex_hover                  { position:absolute; background:white; text-align:center; display:block; border:10px solid #C8C8C8; -moz-border-radius: 15px; border-radius: 15px; opacity: 0.9; z-index: 10; padding-bottom:10px; padding-left:10px; padding-right:10px; width:80%; top:10%; left:10%; max-height:80%; overflow:scroll; }';
document.head.appendChild(style);
style.innerHTML+= '.domtex_secstyle_chapter       { display:block; text-decoration:none; color: black; font-weight:bold; text-align:center;}';
style.innerHTML+= 'ul.domtex_itemize              { list-style: none outside; padding-left:1em; }';
style.innerHTML+= 'ul.domtex_itemize li           { padding-left: .7em; position: relative; }';
style.innerHTML+= 'ul.domtex_itemize li:before    { position: absolute; left:0pt; content: attr(data-item); }';
style.innerHTML+= 'ul.domtex_description           { list-style: none inside; padding-left:1em; }';
style.innerHTML+= 'ul.domtex_description li        { }';
style.innerHTML+= 'ul.domtex_description li:before { position: initial; font-weight:bold; content: attr(data-item); padding-right:1ex; }';

try {
    if(MathJax) console.log("using MathJax");
} catch(ReferenceError){
    MathJax = false;
    console.log("not using MathJax");
}

domtex.newCounter("secnumdepth");
domtex.setCounter("secnumdepth",3);
domtex.newLength("linewidth");
domtex.setLength("linewidth","100%");


// TODO: paragraph handling!
