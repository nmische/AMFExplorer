/* global tracing object */

var AMFXTrace = Components.classes["@joehewitt.com/firebug-trace-service;1"]
		.getService(Components.interfaces.nsISupports)
		.wrappedJSObject.getTracer("extensions.amfexplorer");

AMFXTrace.setScope(window);
function clearAMFXTraceScope()
{
	window.removeEventListener('unload', clearAMFXTraceScope, true);
	AMFXTrace.setScope(null);
}
window.addEventListener('unload', clearAMFXTraceScope, true);
