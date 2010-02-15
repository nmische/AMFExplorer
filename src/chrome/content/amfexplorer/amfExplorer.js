FBL.ns(function() { with (FBL) { 

//	************************************************************************************************
//	Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

const NS_SEEK_SET = Ci.nsISeekableStream.NS_SEEK_SET;
const NS_SEEK_CUR = Ci.nsISeekableStream.NS_SEEK_CUR;
const NS_SEEK_END = Ci.nsISeekableStream.NS_SEEK_END;

//	List of AMF content types.
var contentTypes =
{
	"application/x-amf": 1
};

// The AMF parsing library.
var AMFLib = AMFExplorerAMFLib;

//	************************************************************************************************
//	Model implementation

Firebug.AMFViewerModel = {};

//	************************************************************************************************
//	AMF Request Model

Firebug.AMFViewerModel.AMFRequest = extend(Firebug.Module,
{
	dispatchName: "amfRequestViewer",
	initialize: function() 
	{
		Firebug.Module.initialize.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.addListener(this);

		// Used by Firebug.DOMPanel.DirTable domplate.
		this.toggles = {};
	},

	shutdown: function()
	{
		Firebug.Module.shutdown.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.removeListener(this);
	},

	initTabBody: function(infoBox, file)
	{

		if (FBTrace.DBG_AMFREQUEST)
			FBTrace.sysout("amfRequestViewer.initTabBody.infoBox", infoBox);

		if (FBTrace.DBG_AMFREQUEST)
			FBTrace.sysout("amfRequestViewer.initTabBody.file", file);		
		
		// The AMF request object is not there, check to see if it is an AMF request.
		if (!file.requestAMF && AMFUtils.isAmfRequest(file.request)) {			
			var postHeaders = this.parsePostHeaders(file);
			
			if (FBTrace.DBG_AMFREQUEST)
				FBTrace.sysout("amfRequestViewer.initTabBody.postHeaders",postHeaders);
									
			file.requestAMF = this.parseAMF(file.request,postHeaders['content-length'])
			
		}
		
		if (file.requestAMF && hasProperties(file.requestAMF)) {
			Firebug.NetMonitor.NetInfoBody.appendTab(infoBox, "RequestAMF",
		            $STR("amfexplorer.tab.amfRequest","strings_amfExplorer"));
			
			if (FBTrace.DBG_AMFREQUEST)
	            FBTrace.sysout("amfRequestViewer.initTabBody: AMF object available " +
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
			Firebug.DOMPanel.DirTable.tag.replace(
					{object: file.requestAMF, toggles: this.toggles}, tabBody);
		}
	},

	parseAMF: function(request, length)
	{
		
		if (FBTrace.DBG_AMFREQUEST)
			FBTrace.sysout("amfRequestViewer.parseAMF");
		
		try {
			var offset = parseInt(length) * -1;
			var is = request.QueryInterface(Ci.nsIUploadChannel).uploadStream;
			if (is) {
				var prevOffset;
				var ss = is.QueryInterface(Ci.nsISeekableStream);
				if (ss)  {
					prevOffset = ss.tell();
					ss.seek(NS_SEEK_END, offset);								
					var amfDeserializer = new AMFLib.AmfMessageDeserializer();
					amfDeserializer.initialize(ss);
					var obj = amfDeserializer.readMessage();								
					return obj;													
					if (prevOffest == 0)
						ss.seek(NS_SEEK_SET, 0);
				}
			}
		} catch (e) {
			if (FBTrace.DBG_AMFREQUEST)
				FBTrace.sysout("amfRequestViewer.parseAMF.error",e);
		}
		return null;
	},

	parsePostHeaders: function(file)
	{

		if (FBTrace.DBG_AMFREQUEST)
			FBTrace.sysout("amfRequestViewer.parsePostHeaders");

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
	initialize: function() 
	{
		Firebug.Module.initialize.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.addListener(this);

		// Used by Firebug.DOMPanel.DirTable domplate.
		this.toggles = {};
	},

	shutdown: function()
	{
		Firebug.Module.shutdown.apply(this, arguments);
		Firebug.NetMonitor.NetInfoBody.removeListener(this);
	},

	initTabBody: function(infoBox, file)
	{

		if (FBTrace.DBG_AMFRESPONSE)
			FBTrace.sysout("amfResponseViewer.initTabBody.infoBox", infoBox);

		if (FBTrace.DBG_AMFRESPONSE)
			FBTrace.sysout("amfResponseViewer.initTabBody.file", file);		
		
		// The AMF request object is not there, check to see if it is an AMF request.
		if (!file.responseAMF && AMFUtils.isAmfRequest(file.request)) {			
			file.responseAMF = this.parseAMF(file);
		}
		
		if (file.responseAMF && hasProperties(file.responseAMF)) {
			Firebug.NetMonitor.NetInfoBody.appendTab(infoBox, "ResponseAMF",
		            $STR("amfexplorer.tab.amfResponse","strings_amfExplorer"));
			
			if (FBTrace.DBG_AMFRESPONSE)
	            FBTrace.sysout("amfResponseViewer.initTabBody: AMF object available " +
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
			Firebug.DOMPanel.DirTable.tag.replace(
					{object: file.responseAMF, toggles: this.toggles}, tabBody);
		}
	},

	parseAMF: function(file)
	{
		
		if (FBTrace.DBG_AMFRESPONSE)
			FBTrace.sysout("amfResponseViewer.parseAMF");
		
		try {
			var is = getInputStreamFromString(file.responseText);
			if (is) {
				var prevOffset;
				var ss = is.QueryInterface(Ci.nsISeekableStream);
				if (ss)  {
					prevOffset = ss.tell();
					ss.seek(NS_SEEK_SET, 0);					
					var amfDeserializer = new AMFLib.AmfMessageDeserializer();
					amfDeserializer.initialize(ss);
					var obj = amfDeserializer.readMessage();								
					return obj;					
					if (prevOffest == 0)
						ss.seek(NS_SEEK_SET, 0);
				}
			}
		} catch (e) {
			if (FBTrace.DBG_AMFRESPONSE)
				FBTrace.sysout("amfResponseViewer.parseAMF.error",e);
		}
		return null;
	}

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

Firebug.registerModule(Firebug.AMFViewerModel.AMFRequest);
Firebug.registerModule(Firebug.AMFViewerModel.AMFResponse);

//	************************************************************************************************
}});

