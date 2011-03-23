/* global tracing object */

Components.utils.import("resource://firebug/firebug-trace-service.js");
var AMFXTrace = traceConsoleService.getTracer("extensions.amfexplorer");

AMFXTrace.setScope(window);
function clearAMFXTraceScope()
{
	window.removeEventListener('unload', clearAMFXTraceScope, true);
	AMFXTrace.setScope(null);
}
window.addEventListener('unload', clearAMFXTraceScope, true);
