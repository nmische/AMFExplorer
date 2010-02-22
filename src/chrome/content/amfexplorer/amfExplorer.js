FBL.ns(function() { with (FBL) { 

//	************************************************************************************************
//	Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

const NS_SEEK_SET = Ci.nsISeekableStream.NS_SEEK_SET;
const NS_SEEK_CUR = Ci.nsISeekableStream.NS_SEEK_CUR;
const NS_SEEK_END = Ci.nsISeekableStream.NS_SEEK_END;

const FB_CACHE_PREF = "cache.mimeTypes";
const AMF_MIME = "application/x-amf";

// DOMPlate 
const ignoreVars =
{
	"__className__": 1,
	"_super": 1
};

const insertSliceSize = 18;
const insertInterval = 40;

//	List of AMF content types.
const contentTypes =
{
	"application/x-amf": 1
};

var reps = [];
var defaultRep = null;
var defaultFuncRep = null;

// The AMF parsing library.
var AMFLib = AMFExplorerAMFLib;


//	************************************************************************************************
//	Main extension implementation

Firebug.AMFExplorer = extend(Firebug.Module,
{
	
	initialize: function() 
	{
		Firebug.Module.initialize.apply(this, arguments);
		
		// Debug : Open new FB Tracing Console window for "extensions.amfexplorer" domain.
		Firebug.TraceModule.openConsole("extensions.amfexplorer");
	},
	
	shutdown: function()
	{
		Firebug.Module.shutdown.apply(this, arguments);
	},
	
	openAboutDialog: function()
	{
		var extensionManager = CCSV("@mozilla.org/extensions/manager;1", "nsIExtensionManager");
		openDialog("chrome://mozapps/content/extensions/about.xul", "",
				"chrome,centerscreen,modal", "urn:mozilla:item:amfexplorer@riaforge.org", extensionManager.datasource);
	},
	
	onMenuShowing: function(popup)
	{
		for (var child = popup.firstChild; child; child = child.nextSibling)
		{
			if (child.localName == "menuitem")
			{
				var option = child.getAttribute("option");
				if (option)
				{
					var checked = false;
					if (option == "cache.mimeTypes")
						checked = this.responseCaptureEnabled();
					
					child.setAttribute("checked", checked);
				}
			}
		}
	},
	
	responseCaptureEnabled: function() {
		var mimeTypes = Firebug.getPref(Firebug.prefDomain, FB_CACHE_PREF);
		if (mimeTypes.indexOf(AMF_MIME) != -1)
			return true;
		
		return false;
	},
	
	openCaptureDialog: function(){
		openDialog("chrome://amfexplorer/content/captureDialog.xul"
				,"AMFExplorerCaptureWin"
				,"dialog"
				,{FBL:FBL,Firebug:Firebug}); 
	},
	
	// CSS helper
	addStyleSheet: function(panel)
	{
		// Make sure the stylesheet isn't appended twice. 
		var doc = panel.document;
		if ($("amfExplorerStyles", doc))
			return;
		
		var styleSheet = createStyleSheet(doc, "chrome://amfexplorer/skin/amfExplorer.css");
		styleSheet.setAttribute("id", "amfExplorerStyles");
		addStyleSheet(doc, styleSheet);
	},
	
	showPanel: function(browser, panel) 
	{ 
		if (panel && panel.name == "net")
			this.addStyleSheet(panel);	   
	},
	
	// Reps
	
	registerRep: function()
	{
		reps.push.apply(reps, arguments);
	},
	
	unregisterRep: function()
	{
		for (var i = 0; i < arguments.length; ++i)
			remove(reps, arguments[i]);
	},
	
	getRep: function(object)
	{
		var type = typeof(object);
		if (type == 'object' && object instanceof String)
			type = 'string';
		
		for (var i = 0; i < reps.length; ++i)
		{
			var rep = reps[i];
			try
			{
				if (rep.supportsObject(object, type))
				{
					// Debug
					if (AMFXTrace.DBG_REP)
						AMFXTrace.sysout("amfExplorer.getRep type: " + type, {object:object, rep: rep});
					return rep;
				}
			}
			catch (exc)
			{
				if (FBTrace.DBG_REP)
				{
					// Debug
					AMFXTrace.sysout("amfExplorer.getRep FAILS: "+ exc, exc);
					// Debug
					AMFXTrace.sysout("amfExplorer.getRep reps["+i+"/"+reps.length+"]: "+(typeof(reps[i])), reps[i]);
				}
			}
		}
		
		// Debug
		if (AMFXTrace.DBG_REP)
			AMFXTrace.sysout("amfExplorer.getRep default type: " + type,{object:object, rep:rep});
		
		return (type == 'function')?defaultFuncRep:defaultRep;
	},
	
	setDefaultReps: function(funcRep, rep)
	{
		defaultRep = rep;
		defaultFuncRep = funcRep;
	}
	
});


//	************************************************************************************************
//	Viewer Model implementation

Firebug.AMFViewerModel = {};

//	Used by both viewer modules
var domBasePanel = new Firebug.DOMBasePanel();


//	************************************************************************************************
//	AMF Request Model

Firebug.AMFViewerModel.AMFRequest = extend(Firebug.Module,
{
	dispatchName: "amfRequestViewer",
	
	amfDeserializer: null,
	
	initialize: function() 
	{
		Firebug.Module.initialize.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.addListener(this);
	},
	
	shutdown: function()
	{
		Firebug.Module.shutdown.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.removeListener(this);
	},
	
	initTabBody: function(infoBox, file)
	{
		
		// Debug
		if (AMFXTrace.DBG_AMFREQUEST)
			AMFXTrace.sysout("amfRequestViewer.initTabBody.infoBox", infoBox);
		
		// Debug
		if (AMFXTrace.DBG_AMFREQUEST)
			AMFXTrace.sysout("amfRequestViewer.initTabBody.file", file);
		
		// The AMF request object is not there, check to see if it is an AMF request.
		if (!file.requestAMF && AMFUtils.isAmfRequest(file.request)) {
			var postHeaders = this.parsePostHeaders(file);
			
			// Debug
			if (AMFXTrace.DBG_AMFREQUEST)
				AMFXTrace.sysout("amfRequestViewer.initTabBody.postHeaders",postHeaders);
			
			file.requestAMF = this.parseAMF(file.request,postHeaders['content-length'])
			
		}
		
		if (file.requestAMF && hasProperties(file.requestAMF)) {
			Firebug.NetMonitor.NetInfoBody.appendTab(infoBox, "RequestAMF",
					$STR("amfexplorer.tab.amfRequest","strings_amfExplorer"));
			
			// Debug
			if (AMFXTrace.DBG_AMFREQUEST)
				AMFXTrace.sysout("amfRequestViewer.initTabBody: AMF object available " +
					(typeof(file.requestAMF) != "undefined"), file.requestAMF);
		}
		
	},
	
	// Update listener for TabView
	updateTabBody: function(infoBox, file, context)
	{
		var tab = infoBox.selectedTab;
		var tabBody = infoBox.getElementsByClassName("netInfoRequestAMFText").item(0);
		if (!hasClass(tab, "netInfoRequestAMFTab") || tabBody.updated)
			return;
		
		tabBody.updated = true;
		
		if (file.requestAMF) {
			Firebug.AMFViewerModel.Tree.tag.replace(
					{object: file.requestAMF, toggles: this.toggles, domPanel: domBasePanel}, tabBody);
		}	
	
	},
	
	parseAMF: function(request, length)
	{
		
		// Debug
		if (AMFXTrace.DBG_AMFREQUEST)
			AMFXTrace.sysout("amfRequestViewer.parseAMF");
		
		try {
			var offset = parseInt(length) * -1;
			var is = request.QueryInterface(Ci.nsIUploadChannel).uploadStream;
			if (is) {
				var prevOffset;
				var ss = is.QueryInterface(Ci.nsISeekableStream);
				if (ss)  {
					prevOffset = ss.tell();
					ss.seek(NS_SEEK_END, offset);
					
					if (!this.amfDeserializer) {
						// Debug
						if (AMFXTrace.DBG_AMFREQUEST)
							AMFXTrace.sysout("amfRequestViewer.createDeserializer");
						this.amfDeserializer = new AMFLib.AmfMessageDeserializer();
					}
					this.amfDeserializer.initialize(ss);
					var obj = this.amfDeserializer.readMessage();
					return obj;
					if (prevOffest == 0)
						ss.seek(NS_SEEK_SET, 0);
				}
			}
		} catch (e) {
			// Debug
			if (AMFXTrace.DBG_AMFREQUEST)
				AMFXTrace.sysout("amfRequestViewer.parseAMF.error",e);
		}
		return null;
	},
	
	parsePostHeaders: function(file)
	{
		
		// Debug
		if (AMFXTrace.DBG_AMFREQUEST)
			AMFXTrace.sysout("amfRequestViewer.parsePostHeaders");
		
		var text = file.postText;
		if (text == undefined)
			return null;	 
		
		var postHeaders = {};
		
		var divider = "\r\n\r\n";
		var headerEnd = text.indexOf(divider);
		var headers = text.substr(0,headerEnd);		
		
		var parts = headers.split("\r\n");
		for (var i=0; i<parts.length; i++)
		{
			var part = parts[i].split(":");
			if (part.length != 2)
				continue;
			
			postHeaders[trim(part[0].toLowerCase())] = trim(part[1].toLowerCase());
		}
		
		return postHeaders;
	}

});


//	************************************************************************************************
//	AMF Response Model

Firebug.AMFViewerModel.AMFResponse = extend(Firebug.Module,
{
	dispatchName: "amfResponseViewer",
	
	amfDeserializer: null,
	
	initialize: function() 
	{
		Firebug.Module.initialize.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.addListener(this);
	},
	
	shutdown: function()
	{
		Firebug.Module.shutdown.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.removeListener(this);
	},
	
	initTabBody: function(infoBox, file)
	{
		
		// Debug
		if (AMFXTrace.DBG_AMFRESPONSE)
			AMFXTrace.sysout("amfResponseViewer.initTabBody.infoBox", infoBox);
		
		// Debug
		if (AMFXTrace.DBG_AMFRESPONSE)
			AMFXTrace.sysout("amfResponseViewer.initTabBody.file", file);
		
		// The AMF request object is not there, check to see if it is an AMF request.
		if (!file.responseAMF && AMFUtils.isAmfRequest(file.request)) {
			file.responseAMF = this.parseAMF(file);
		}
		
		if (file.responseAMF && hasProperties(file.responseAMF)) {
			Firebug.NetMonitor.NetInfoBody.appendTab(infoBox, "ResponseAMF",
					$STR("amfexplorer.tab.amfResponse","strings_amfExplorer"));
			
			// Debug
			if (AMFXTrace.DBG_AMFRESPONSE)
				AMFXTrace.sysout("amfResponseViewer.initTabBody: AMF object available " +
					(typeof(file.requestAMF) != "undefined"), file.responseAMF);
		}
	
	},
	
	// Update listener for TabView
	updateTabBody: function(infoBox, file, context)
	{
		var tab = infoBox.selectedTab;
		var tabBody = infoBox.getElementsByClassName("netInfoResponseAMFText").item(0);
		if (!hasClass(tab, "netInfoResponseAMFTab") || tabBody.updated)
			return;
		
		tabBody.updated = true;
		
		if (file.responseAMF) {
			Firebug.AMFViewerModel.Tree.tag.replace(
					{object: file.responseAMF, toggles: this.toggles, domPanel: domBasePanel}, tabBody);
		}
	},
	
	parseAMF: function(file)
	{
		
		if (!file.responseText)
			return null;
		
		// Debug
		if (AMFXTrace.DBG_AMFRESPONSE)
			AMFXTrace.sysout("amfResponseViewer.parseAMF");

		try {
			var is = getInputStreamFromString(file.responseText);
			if (is) {
				var prevOffset;
				var ss = is.QueryInterface(Ci.nsISeekableStream);
				if (ss)  {
					prevOffset = ss.tell();
					ss.seek(NS_SEEK_SET, 0);
					if (!this.mfDeserializer) {
						// Debug
						if (AMFXTrace.DBG_AMFRESPONSE)
							AMFXTrace.sysout("amfResponseViewer.createDeserializer");
						this.amfDeserializer = new AMFLib.AmfMessageDeserializer();
					}
					this.amfDeserializer.initialize(ss);
					var obj = this.amfDeserializer.readMessage();
					return obj;
					if (prevOffest == 0)
						ss.seek(NS_SEEK_SET, 0);
				}
			}
		} catch (e) {
			// Debug
			if (AMFXTrace.DBG_AMFRESPONSE)
				AMFXTrace.sysout("amfResponseViewer.parseAMF.error",e);
		}
		return null;
	}

});

//	************************************************************************************************
//	Domplate 

const SizerRow =
	TR({role : 'presentation'},
		TD(),
		TD({width: "30%"}),
		TD({width: "70%"})
	);

Firebug.AMFViewerModel.Tree = domplate(Firebug.Rep,
{

	memberRowTag:
		TR({"class": "memberRow $member.open $member.type\\Row", 
			_domObject: "$member",
			$hasChildren: "$member.hasChildren",
			role: "presentation",
			level: "$member.level"},
			TD({"class": "memberHeaderCell"},
					DIV({"class": "sourceLine memberRowHeader"},
							"&nbsp;"
				)
			),
			TD({"class": "memberLabelCell", style: "padding-left: $member.indent\\px",
				role: 'presentation'},
				DIV({"class": "memberLabel $member.type\\Label"},
					SPAN({"class": "memberLabelPrefix"}, "$member.prefix"),
					SPAN("$member.name")
				)
			),
			TD({"class": "memberValueCell", role : 'presentation'},
				TAG("$member.tag", {object: "$member.value"})
			)
		),

	tag:
		TABLE({"class": "domTable", cellpadding: 0, cellspacing: 0, onclick: "$onClick", role: "tree", _domPanel: "$domPanel"},
			TBODY({role: "presentation"},
				SizerRow,
				FOR("member", "$object|memberIterator",
					TAG("$memberRowTag", {member: "$member"})
				)
			)
		),

	rowTag:
		FOR("member", "$members",
			TAG("$memberRowTag", {member: "$member"})
		),

	memberIterator: function(object) {
		return this.getMembers(object);
	},

	onClick: function(event) {
		if (!isLeftClick(event))
			return;

		var row = getAncestorByClass(event.target, "memberRow");
		var label = getAncestorByClass(event.target, "memberLabel");
		if (label && hasClass(row, "hasChildren"))
		this.toggleRow(row);
	},

	toggleRow: function(row)
	{
		var level = parseInt(row.getAttribute("level"));
		var toggles = row.parentNode.parentNode.toggles;

		var panel = row.parentNode.parentNode.domPanel;
		var target = row.lastChild.firstChild;
		var isString = hasClass(target,"objectBox-string");

		if (hasClass(row, "opened"))
		{
			removeClass(row, "opened");

			if (isString)
			{
				var rowValue = panel.getRowPropertyValue(row);
				row.lastChild.firstChild.textContent = '"' + cropMultipleLines(rowValue) + '"';
			}
			else
			{

				var rowTag = this.rowTag;
				var tbody = row.parentNode;

				setTimeout(function()
				{
					for (var firstRow = row.nextSibling; firstRow; firstRow = row.nextSibling)
					{
						if (parseInt(firstRow.getAttribute("level")) <= level)
							break;

						tbody.removeChild(firstRow);
					}
				}, row.insertTimeout ? row.insertTimeout : 0);
			}
		}
		else
		{
			setClass(row, "opened");
			if (isString)
			{
				var rowValue = panel.getRowPropertyValue(row);
				row.lastChild.firstChild.textContent = '"' + rowValue + '"';
			}
			else
			{

				var context = panel ? panel.context : null;
				var members = this.getMembers(target.repObject, level+1);

				var rowTag = this.rowTag;
				var lastRow = row;

				var delay = 0;
				var setSize = members.length;
				var rowCount = 1;
				while (members.length)
				{
					setTimeout(function(slice, isLast)
					{
						if (lastRow.parentNode)
						{
							var result = rowTag.insertRows({members: slice}, lastRow);
							lastRow = result[1];
							dispatch([Firebug.A11yModel], 'onMemberRowSliceAdded', [null, result, rowCount, setSize]);
							rowCount += insertSliceSize;
						}
						if (isLast)
							delete row.insertTimeout;
					}, delay, members.splice(0, insertSliceSize), !members.length);

					delay += insertInterval;
				}

				row.insertTimeout = delay;
			}
		}
	},

	getMembers: function(object, level)
	{
		if (!level)
			level = 0;

		var ordinals = [], userProps = [];

		try
		{
			// Special case for "arguments", which is not enumerable by for...in statement.
			if (this.isArguments(object))
				object = cloneArray(object);

			//var domMembers = getDOMMembers(object);
			var insecureObject = unwrapObject(object);

			for (var name in insecureObject)  // enumeration is safe
			{

				if (ignoreVars[name] == 1)
				{

					// Debug
					if (AMFXTrace.DBG_DOMPLATE)
						AMFXTrace.sysout("amfViewerModel.tree.getMembers: ignoreVars: " + name + ", " + level, object);
					continue;
				}

				var val;
				try
				{
					val = insecureObject[name];  // getter is safe
				}
				catch (exc)
				{
					// Debug
					// Sometimes we get exceptions trying to access certain members
					if (AMFXTrace.DBG_DOMPLATE)
						AMFXTrace.sysout("amfViewerModel.tree.getMembers cannot access "+name, exc);
				}

				var ordinal = parseInt(name);
				if (ordinal || ordinal == 0)
				{
					// Debug
					if (AMFXTrace.DBG_DOMPLATE)
						AMFXTrace.sysout("amfViewerModel.tree.getMembers: add ordinal " + name, val);

					this.addMember(object, "ordinal", ordinals, name, val, level);
				}
				else if (typeof(val) == "function")
				{
					// Debug
					if (AMFXTrace.DBG_DOMPLATE)
						AMFXTrace.sysout("amfViewerModel.tree.getMembers: ignore function " + name, val);
				}
				else
				{
					// Debug
					if (AMFXTrace.DBG_DOMPLATE)
						AMFXTrace.sysout("amfViewerModel.tree.getMembers: add object " + name, val);

					this.addMember(object, "user", userProps, name, val, level);
				}
			}
		}
		catch (exc)
		{
			// Debug
			// Sometimes we get exceptions just from trying to iterate the members
			// of certain objects, like StorageList, but don't let that gum up the works
			if (AMFXTrace.DBG_DOMPLATE)
				AMFXTrace.sysout("amfViewerModel.tree.getMembers FAILS: ", exc);
		}

		function sortName(a, b) { return a.name > b.name ? 1 : -1; }

		var members = [];

		members.push.apply(members, ordinals);

		userProps.sort(sortName);
		members.push.apply(members, userProps);

		return members;
	},

	addMember: function(object, type, props, name, value, level)
	{
		var rep = Firebug.AMFExplorer.getRep(value);	// do this first in case a call to instanceof reveals contents
		var tag = rep.shortTag ? rep.shortTag : rep.tag;

		var valueType = typeof(value);
		var hasChildren = hasProperties(value) && !(value instanceof ErrorCopy) &&
			(valueType == "function" || (valueType == "object" && value != null)
				|| (valueType == "string" && value.length > Firebug.stringCropLength));

		// Special case for "arguments", which is not enumerable by for...in statement
		// and so, hasProperties always returns false.
		if (!hasChildren && value) // arguments will never be falsy if the arguments exist
			hasChildren = this.isArguments(value);

		var member = {
			object: object,
			name: name,
			value: value,
			type: type,
			rowClass: "memberRow-"+type,
			open: "",
			level: level,
			indent: level*16,
			hasChildren: hasChildren,
			tag: tag
		};

		// If the property is implemented using a getter function (and there is no setter
		// implemented) use a "get" prefix that is displayed in the UI.
		var o = unwrapObject(object);
		member.prefix = (o.__lookupGetter__(name) && !o.__lookupSetter__(name)) ? "get " : "";

		props.push(member);
		return member;
	},

	isArguments: function(obj)
	{
		try
		{
			return isFinite(obj.length) && obj.length > 0 && typeof obj.callee === "function";
		} catch (exc) {}
		return false;
	}	

});

Firebug.AMFViewerModel.ParseError = domplate(Firebug.Rep, 
{
	tag:
		DIV({class: "xmlInfoError"},
			DIV({class: "xmlInfoErrorMsg"}, "$error.message")
		)
});

//	************************************************************************************************
//	Helpers

Firebug.AMFViewerModel.Utils =
{

	isAmfRequest: function(request) {
		if (!request.contentType)
			return false;

		var contentType = request.contentType.split(";")[0];
		contentType = trim(contentType);
		return contentTypes[contentType];
	}

};

var AMFUtils = Firebug.AMFViewerModel.Utils;

//	************************************************************************************************
//	Registration

Firebug.registerModule(Firebug.AMFExplorer);
Firebug.registerModule(Firebug.AMFViewerModel.AMFRequest);
Firebug.registerModule(Firebug.AMFViewerModel.AMFResponse);

//	************************************************************************************************
}});
