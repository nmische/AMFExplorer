

const Cc = Components.classes;
const Ci = Components.interfaces;

const FB_CACHE_PREF = "cache.mimeTypes";
const AMF_MIME = "application/x-amf";

var Firebug;
var FBL;

var AMFExplorerConfDialog =
{
		
	initialize: function(dialog)
	{
		var args = window.arguments[0];
		FBL = args.FBL;
		Firebug = args.Firebug;		
		
		var msgEl = dialog.document.getElementById("amfExplorerCaptureMsg");
		if (this.responseCaptureEnabled()) {
			msgEl.textContent = FBL.$STR("amfexplorer.dialog.disable","strings_amfExplorer");
		} else {
			msgEl.textContent = FBL.$STR("amfexplorer.dialog.enable","strings_amfExplorer");
		}
		
		dialog.moveToAlertPosition();
	},
		
	responseCaptureEnabled: function() {
		var mimeTypes = Firebug.getPref(Firebug.prefDomain, FB_CACHE_PREF);
		if (mimeTypes.indexOf(AMF_MIME) != -1)
			return true;
		
		return false;
	},
		
	toggleCaptureResponses: function() {
		var mimeTypes = Firebug.getPref(Firebug.prefDomain, FB_CACHE_PREF).split(",");
		if (this.responseCaptureEnabled()){
			var i = mimeTypes.indexOf(AMF_MIME);
			this.arrayRemove(mimeTypes,i);
			Firebug.setPref(Firebug.prefDomain, FB_CACHE_PREF, mimeTypes.join(","));
		} else {
			mimeTypes.push(AMF_MIME);
			Firebug.setPref(Firebug.prefDomain, FB_CACHE_PREF, mimeTypes.join(","));
		}    	   	
	},
		
	onRestartFirefox: function()
    {
        // change our preference
		this.toggleCaptureResponses();
		
		// restart Firefox
		Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup).
            quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit);
    },
    
    // Array Remove - By John Resig (MIT Licensed)
    arrayRemove: function(array, from, to) {
    	var rest = array.slice((to || from) + 1 || array.length);
    	array.length = from < 0 ? array.length + from : from;
    	return array.push.apply(array, rest);
    }
		
};