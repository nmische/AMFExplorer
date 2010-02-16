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

//	List of AMF content types.
var contentTypes =
{
	"application/x-amf": 1
};

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
    }
    	
});

//	************************************************************************************************
//	Model implementation

Firebug.AMFViewerModel = {};

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
			Firebug.DOMPanel.DirTable.tag.replace(
					{object: file.requestAMF, toggles: this.toggles}, tabBody);
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
			Firebug.DOMPanel.DirTable.tag.replace(
					{object: file.responseAMF, toggles: this.toggles}, tabBody);
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

