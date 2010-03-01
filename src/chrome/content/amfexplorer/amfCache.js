FBL.ns(function() { with (FBL) { 

const Cc = Components.classes;
const Ci = Components.interfaces;

const NS_SEEK_SET = Ci.nsISeekableStream.NS_SEEK_SET;
const NS_SEEK_CUR = Ci.nsISeekableStream.NS_SEEK_CUR;
const NS_SEEK_END = Ci.nsISeekableStream.NS_SEEK_END;

const contentTypes =
{
	"application/x-amf": 1
};

const PR_UINT32_MAX = 0xffffffff;

//	************************************************************************************************
//	Module implementation

Firebug.AMFCacheListener = extend(Firebug.Module,
{
	initialize: function()
	{
		if (AMFXTrace.DBG_CACHELISTENER)
			AMFXTrace.sysout("Firebug.AMFCacheListener.initialize;");
		
		Firebug.Module.initialize.apply(this, arguments);
		
		// Register cache listener
		this.cacheListener = new CacheListener();
		Firebug.TabCacheModel.addListener(this.cacheListener);
	},
	
	shutdown: function()
	{
		if (AMFXTrace.DBG_CACHELISTENER)
			AMFXTrace.sysout("Firebug.AMFCacheListener.shutdown;");
		
		Firebug.Module.shutdown.apply(this, arguments);
		
		// Unregister cache listener
		Firebug.TabCacheModel.removeListener(this.cacheListener);
	}
});

// ************************************************************************************************
// Net Panel Listener

function CacheListener()
{
	this.cache = {};
	
	this.shouldCacheRequest = function(request){
		// Debug
		if (AMFXTrace.DBG_CACHELISTENER)
			AMFXTrace.sysout("cacheListener.shouldCacheRequest");
		
		request.QueryInterface(Ci.nsIHttpChannel);
		
 		// Cache only amf responses for now.
		var contentType = request.contentType;
		if (contentType)
			contentType = contentType.split(";")[0];
		
		contentType = trim(contentType);		
		
		if (contentTypes[contentType])
			return true;
		
		return false;
	};
}

CacheListener.prototype = 
{
	responses: [],
	
	getResponse: function(request, cacheKey)
	{
		
		if (!cacheKey)
			var cacheKey = getCacheKey(request);
		
		// Debug
		if (AMFXTrace.DBG_CACHELISTENER)
			AMFXTrace.sysout("cacheListener.getResponse: " + cacheKey);		
		
		if (!cacheKey)
			return;		
		
		var response = this.responses[cacheKey];
		if (!response)
		{
			
			// Debug
			if (AMFXTrace.DBG_CACHELISTENER)
				AMFXTrace.sysout("cacheListener.getResponseByKey.newResponse: " + cacheKey);
			
			this.invalidate(cacheKey);
			this.responses[cacheKey] = response = {
				request: request,
				size: 0
			};
		}
		
		return response;
	},
	
	invalidate: function(cacheKey)
	{
		
		// Debug
		if (AMFXTrace.DBG_CACHELISTENER)
			AMFXTrace.sysout("cacheListener.invalidate; " + cacheKey);

		delete this.cache[cacheKey];
	},
	
	onStartRequest: function(context, request, requestContext)
	{
		if (this.shouldCacheRequest(request)) {
			
			// Debug
			if (AMFXTrace.DBG_CACHELISTENER)
				AMFXTrace.sysout("cacheListener.onStartRequest");
			
			this.getResponse(request);
			
		}
	},
	
	onDataAvailable: function(context, request, requestContext, inputStream, offset, count)
	{
		
		
		if (this.shouldCacheRequest(request)) {
			
			try {
			
				var cacheKey = getCacheKey(request);
				
				// Debug
				if (AMFXTrace.DBG_CACHELISTENER)
					AMFXTrace.sysout("cacheListener.onDataAvailable: " + cacheKey + " count: " + count + " offset: " + offset);
				
				if (!cacheKey)
					return;
				
				if (!this.cache[cacheKey]) {
					var cacheStorageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
					cacheStorageStream.init(8192, PR_UINT32_MAX, null);
					var cacheOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
					cacheOutputStream.setOutputStream(cacheStorageStream.getOutputStream(0));
					this.cache[cacheKey] = {
						storageStream: cacheStorageStream,
						outputStream: cacheOutputStream
					};
				}
				
				var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
				var listenerStorageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
				var listenerOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
				
				binaryInputStream.setInputStream(inputStream.value);
				listenerStorageStream.init(8192, count, null);
				listenerOutputStream.setOutputStream(listenerStorageStream.getOutputStream(0));
				
				var data = binaryInputStream.readByteArray(count);
				listenerOutputStream.writeByteArray(data, count);
				this.cache[cacheKey].outputStream.writeByteArray(data, count);
				
				var response = this.getResponse(request, cacheKey);
				response.size += count;
				
				// Let other listeners use the stream.
				inputStream.value = listenerStorageStream.newInputStream(0);
				
				// Debug
				if (AMFXTrace.DBG_CACHELISTENER)
					AMFXTrace.sysout("cacheListener.onDataAvailable.dataCached: " + cacheKey +" size: " + response.size);
			} 
			catch (err) {
				if (AMFXTrace.DBG_CACHELISTENER) 
					AMFXTrace.sysout("cacheListener.onDataAvailable: ERROR " + safeGetName(request), err);
			}
		}
	
	
	},

	onStopRequest: function(context, request, requestContext, statusCode)
	{
		
		if (this.shouldCacheRequest(request)) {
			
			var cacheKey = getCacheKey(request);
			delete this.responses[request];
			
			// Debug
			if (AMFXTrace.DBG_CACHELISTENER)
				AMFXTrace.sysout("cacheListener.onStopRequest: " + cacheKey);
			
			var shouldSave = Firebug.getPref("extensions.amfexplorer","saveResponses");
			
			if (shouldSave) {
				var amfStream = this.cache[cacheKey].storageStream.newInputStream(0);
				var filename = cacheKey.replace(/\W/g,"");
				filename += "_res.amf";				

				// Debug
				if (AMFXTrace.DBG_CACHELISTENER)
					AMFXTrace.sysout("cacheListener.onStopRequest.callSaveStream: " + filename);
				
				saveStream( amfStream, filename );
			}
			
		}
	}
};

function safeGetName(request)
{
	try
	{
		return request.name;
	}
	catch (exc)
	{
		return null;
	}
}

function getCacheKey(request)
{
		var is = request.QueryInterface(Ci.nsIUploadChannel).uploadStream;
		var ss = is.QueryInterface(Ci.nsISeekableStream);
		ss.seek(NS_SEEK_SET,0);			
		var ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
		ch.init(ch.MD5);
		ch.updateFromStream(ss, ss.available());
		var hash = ch.finish(true);
		return hash;   
}

function saveStream(stream, filename)
{

	try {	
	
		var dirService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
		
		var aFile = dirService.get("ProfD", Ci.nsIFile);
		aFile.append("amfexplorer");
		aFile.append(filename);
		aFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 600);
			            
		var fos = Cc["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
		fos.init(aFile, 0x04 | 0x08 | 0x20, 0600, 0); // write, create, truncate
		
		var bos = Cc["@mozilla.org/network/buffered-output-stream;1"].createInstance(Ci.nsIBufferedOutputStream);
		bos.init(fos, 8192);            
		
		for (var count = stream.available(); count; count = stream.available())
	   		bos.writeFrom(stream, count);
		
		// Debug
		if (AMFXTrace.DBG_CACHELISTENER)
			AMFXTrace.sysout("saveResponse: " + filename);
	
	} catch (e) {
		// Debug
		if (AMFXTrace.DBG_CACHELISTENER)
			AMFXTrace.sysout("saveResponse ERROR: " + e.message);
		
	} finally {
		if (fos) {		
			if (fos instanceof Ci.nsISafeOutputStream) {
				fos.finish();
			} else {
				fos.close();
			}
		}
	}	
	
}

// ************************************************************************************************
// Registration

Firebug.registerModule(Firebug.AMFCacheListener);

// ************************************************************************************************
}});
