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

		if (FBTrace.DBG_AMFEXPLORER)
			FBTrace.sysout("amfRequestViewer.initTabBody.infoBox", infoBox);

		if (FBTrace.DBG_AMFEXPLORER)
			FBTrace.sysout("amfRequestViewer.initTabBody.file", file);		
		
		// The AMF request object is not there, check to see if it is an AMF request.
		if (!file.requestAMF && AMFUtils.isAmfRequest(file.request)) {			
			var postHeaders = this.parsePostHeaders(file);
			
			if (FBTrace.DBG_AMFEXPLORER)
				FBTrace.sysout("amfRequestViewer.initTabBody.postHeaders",postHeaders);
									
			file.requestAMF = this.parseAMF(file.request,postHeaders['content-length'])
			
		}
		
		if (file.requestAMF && hasProperties(file.requestAMF)) {
			Firebug.NetMonitor.NetInfoBody.appendTab(infoBox, "RequestAMF",
		            $STR("amfexplorer.tab.amfRequest","strings_amfExplorer"));
			
			if (FBTrace.DBG_AMFEXPLORER)
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
		
		if (FBTrace.DBG_AMFEXPLORER)
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
					var ba = new Firebug.AMFViewerModel.ByteArray(ss);
					var amfReader = new Firebug.AMFViewerModel.AMF();
					var obj = amfReader.deserialize(ba);								
					return obj;					
					if (prevOffest == 0)
						ss.seek(NS_SEEK_SET, 0);
				}
			}
		} catch (e) {
			if (FBTrace.DBG_AMFEXPLORER)
				FBTrace.sysout("amfRequestViewer.parseAMF.error",e);
		}
		return null;
	},

	parsePostHeaders: function(file)
	{

		if (FBTrace.DBG_AMFEXPLORER)
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

		if (FBTrace.DBG_AMFEXPLORER)
			FBTrace.sysout("amfResponseViewer.initTabBody.infoBox", infoBox);

		if (FBTrace.DBG_AMFEXPLORER)
			FBTrace.sysout("amfResponseViewer.initTabBody.file", file);		
		
		// The AMF request object is not there, check to see if it is an AMF request.
		if (!file.responseAMF && AMFUtils.isAmfRequest(file.request)) {			
			file.responseAMF = this.parseAMF(file);
		}
		
		if (file.responseAMF && hasProperties(file.responseAMF)) {
			Firebug.NetMonitor.NetInfoBody.appendTab(infoBox, "ResponseAMF",
		            $STR("amfexplorer.tab.amfResponse","strings_amfExplorer"));
			
			if (FBTrace.DBG_AMFEXPLORER)
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
		
		if (FBTrace.DBG_AMFEXPLORER)
			FBTrace.sysout("amfResponseViewer.parseAMF");
		
		try {
			var is = getInputStreamFromString(file.responseText);
			if (is) {
				var prevOffset;
				var ss = is.QueryInterface(Ci.nsISeekableStream);
				if (ss)  {
					prevOffset = ss.tell();
					ss.seek(NS_SEEK_SET, 0);								
					var ba = new Firebug.AMFViewerModel.ByteArray(ss);
					var amfReader = new Firebug.AMFViewerModel.AMF();
					var obj = amfReader.deserialize(ba);								
					return obj;					
					if (prevOffest == 0)
						ss.seek(NS_SEEK_SET, 0);
				}
			}
		} catch (e) {
			if (FBTrace.DBG_AMFEXPLORER)
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
//	AMF Parsing 
//	AMF parsing code is from Flashbug (https://addons.mozilla.org/en-US/firefox/addon/14465)


Firebug.AMFViewerModel.ByteArray = function(inputStream) {

		// Init file stream
		var binaryStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
		binaryStream.setInputStream(inputStream);	

		// File Position
		this._position = 0;

		// File Stream
		this._stream = binaryStream;

		// Byte length
		this._length = this._stream.available();
};

Firebug.AMFViewerModel.ByteArray.prototype = {

	close: function() {
		this._stream.close();
	},

	/**
	Determine number of bytes available in the stream.  A non-blocking
	stream that does not yet have any data to read should return 0 bytes
	from this method (i.e., it must not throw the NS_BASE_STREAM_WOULD_BLOCK
	exception).

	In addition to the number of bytes available in the stream, this method
	also informs the caller of the current status of the stream.  A stream
	that is closed will throw an exception when this method is called.  That
	enables the caller to know the condition of the stream before attempting
	to read from it.  If a stream is at end-of-file, but not closed, then
	this method should return 0 bytes available.

	@return number of bytes currently available in the stream, or PR_UINT32_MAX 
	if the size of the stream exceeds PR_UINT32_MAX.
	 */
	getBytesAvailable: function() {
		return this._stream.available();
	},

	getPosition: function() {
		return this._position;
	},

	getLength: function() {
		return this._length;
	},

	/**
	Reads an 8-bit value from the stream, treating it as a Boolean value.
	 */
	readBoolean: function() {
		this._position++;
		return !!this._stream.readBoolean();
	},

	readByte: function() {
		return this.readUnsignedByte();
	},

	/**
	A double read from the stream.
	 */
	readDouble: function() {
		this._position += 8;
		return (+this._stream.readDouble());
	},

	/**
	A float read from the stream.
	 */
	readFloat: function() {
		this._position += 4;
		return (+this._stream.readFloat());
	},

	/**
	Reads a multibyte string of specified length from the byte stream using the specified character set. 
	 */
	readMultiByte: function(length, charSet) {
		this._position += length;
		return this._stream.readBytes(length);
	},

	/**
	An 8-bit integer read from the stream.
	 */
	readUnsignedByte: function() {
		this._position += 1;
		return this._stream.read8();
	},

	/**
	A 32-bit integer read from the stream.
	 */
	readUnsignedInt: function() {
		this._position += 4;
		return (+this._stream.read32());
	},

	/**
	A 16-bit integer read from the stream.
	 */
	readUnsignedShort: function() {
		this._position += 2;
		return (+this._stream.read16());
	},

	/**
	Reads a single ASCII character
	 */
	readCString: function() {
		this._position += 1;
		return String.fromCharCode(this.readByte());
	},

	/**
	Reads a line of ASCII characters
	 */
	readString: function() {
		var line = "";
		var size = this.getBytesAvailable();
		for (var i = 0; i < size; i++) {
			var c = this.readCString();
			if (c == '\r') {
				//
			} else if (c == '\n') {
				break;
			} else {
				line += c;
			}
		}
		return line;
	},

	/**
	Reads a UTF-8 string from the byte stream. The string is assumed to be 
	prefixed with an unsigned short indicating the length in bytes. 
	 */
	readUTF: function() {
		var length = this.readUnsignedShort();
		this._position += length;
		return String(this._stream.readBytes(length));
	},

	/**
	Reads a sequence of UTF-8 bytes specified by the length parameter from the byte stream and returns a string. 
	 */
	readUTFBytes: function(length) {
		this._position += length;
		return String(this._stream.readBytes(length));
	}

};

Firebug.AMFViewerModel.AMF = function() {	
	this._amf0 = new Firebug.AMFViewerModel.AMF0();	
};

Firebug.AMFViewerModel.AMF.prototype = {

	deserialize: function(ba) {
		var obj = { };
		obj.headers = [];
		obj.bodies = [];

		this.readHeader(obj, ba);
		this.readBody(obj, ba);

		return obj;
	},

	/**
	 * Similar to AMF 0, AMF 3 object reference tables, object trait reference tables and string reference 
	 * tables must be reset each time a new context header or message is processed.
	 * 
	 * Note that Flash Player 9 will always set the second byte to 0×03, regardless of whether the message was sent in AMF0 or AMF3.
	 * 
	 * @param	data
	 */
	readHeader: function(obj, ba) {
		var version = ba.readUnsignedShort();
		switch(version) {
		case 0:
			obj.versionInfo = "Flash Player 8 and Below";
			break;
		case 1:
			obj.versionInfo = "Flash Media Server";
			break;
		case 3:
			obj.versionInfo = "Flash Player 9+";
			break;
		}

		var numHeaders = ba.readUnsignedShort(); //  find the total number of header elements return
		while (numHeaders--) {
			this._amf0.clearCache();
			var name = ba.readUTF();
			var required = !!ba.readUnsignedByte(); // find the must understand flag
			var length = ba.readUnsignedInt(); // grab the length of the header element
			var content = this._amf0.readData(ba); // turn the element into real data

			obj.headers.push({ name:name, required:required, content:content }); // save the name/value into the headers array
		}
	},

	readBody: function(obj, ba) {
		var numBodies = ba.readUnsignedShort(); // find the total number of body elements
		while (numBodies--) {
			this._amf0.clearCache();
			var targetURI = ba.readUTF(); // When the message holds a response from a remote endpoint, the target URI specifies which method on the local client (i.e. AMF request originator) should be invoked to handle the response.
			var responseURI = ba.readUTF(); // The response's target URI is set to the request's response URI with an '/onResult' suffix to denote a success or an '/onStatus' suffix to denote a failure.
			var length = ba.readUnsignedInt(); // grab the length of the body element
			var data = this._amf0.readData(ba); // turn the element into real data

			obj.bodies.push({ targetURI:targetURI, responseIndex:responseURI, value:data }); // add the body element to the body object
		} 
	}
};

Firebug.AMFViewerModel.AMF0 = function() {

	// The actual object cache used to store references
	this.objCache = [];

	// The raw binary data
	this._rawData;

	// The decoded data
	this._data;

	this._amf3 = new Firebug.AMFViewerModel.AMF3();

};

Firebug.AMFViewerModel.AMF0.prototype = {

	deserialize: function(data) {
		this.clearCache();
		this._rawData = data;
		this._data = this.readData(this._rawData);
	},

	clearCache: function() {
		this.objCache = [];
		this._amf3.clearCache();
	},

	readData: function(ba) {
		var type = ba.readByte();
		return this.getDataByType(ba, type);
	},

	getDataByType: function(ba, type) {
		switch(type) {
		case 0x00 : return this.readNumber(ba); 		// Number
		case 0x01 : return this.readBoolean(ba); 		// Boolean
		case 0x02 : return this.readString(ba); 		// String
		case 0x03 : return this.readObject(ba); 		// Object
		case 0x04 : return null; 						// MovieClip; reserved, not supported
		case 0x05 : return null; 						// Null
		case 0x06 : return this.readUndefined(ba); 		// Undefined
		case 0x07 : return this.readReference(ba); 		// Reference
		case 0x08 : return this.readMixedArray(ba); 	// ECMA Array (associative)
		//case 0x09 : 									// Object End Marker
		case 0x0A : return this.readArray(ba); 			// Strict Array
		case 0x0B : return this.readDate(ba); 			// Date
		case 0x0C : return this.readLongString(ba); 	// Long String, string.length > 2^16
		case 0x0D : return null; 						// Unsupported
		case 0x0E : return null;						// Recordset; reserved, not supported
		case 0x0F : return this.readXML(ba); 			// XML Document
		case 0x10 : return this.readCustomClass(ba); 	// Typed Object (Custom Class)
		case 0x11 : return this._amf3.readData(ba);		// AMF3 Switch
		/*
			With the introduction of AMF 3 in Flash Player 9 to support ActionScript 3.0 and the 
			new AVM+, the AMF 0 format was extended to allow an AMF 0 encoding context to be 
			switched to AMF 3. To achieve this, a new type marker was added to AMF 0, the 
			avmplus-object-marker. The presence of this marker signifies that the following Object is 
			formatted in AMF 3.
		 */
		default: throw Error("AMF0::readData - Error : Undefined AMF0 type encountered '" + type + "'");
		}
	},

	readNumber: function(ba) {
		return ba.readDouble();
	},

	readBoolean: function(ba) {
		return ba.readBoolean();
	},

	readString: function(ba) {
		return ba.readUTF();
	},

	/**
	 * readObject reads the name/value properties of the amf message
	 */
	readObject: function(ba) {
		var obj = new Object();
		var varName = ba.readUTF();
		var type = ba.readByte();

		while(type != 0x09) {
			// Since readData checks type again
			/*ba.position--;

			obj[varName] = this.readData(ba);*/

			obj[varName] = this.getDataByType(ba, type);

			varName = ba.readUTF();
			type = ba.readByte();
		}

		this.objCache.push(obj);
		return obj;
	},

	readUndefined: function(ba) {
		return undefined;
	},

	/**
	 * readReference replaces the old readFlushedSO. It treats where there
	 * are references to other objects. Currently it does not resolve the
	 * object as this would involve a serious amount of overhead, unless
	 * you have a genius idea 
	 */
	readReference: function(ba) {
		var ref = ba.readUnsignedShort();
		return this.objCache[ref];
	},

	/**
	 * An ECMA Array or 'associative' Array is used when an ActionScript Array contains 
	 * non-ordinal indices. This type is considered a complex type and thus reoccurring 
	 * instances can be sent by reference. All indices, ordinal or otherwise, are treated 
	 * as string 'keys' instead of integers. For the purposes of serialization this type 
	 * is very similar to an anonymous Object.
	 */
	readMixedArray: function(ba) {
		var arr = [];

		var l = ba.readUnsignedInt();
		for(var i = 0; i < l; i++) {
			var key = ba.readUTF();
			var value = this.readData(ba);

			arr[key] = value;
		}

		this.objCache.push(arr);

		// End tag 00 00 09
		ba.readMultiByte(3); // ba.position += 3;

		return arr;
	},

	/**
	 * readArray turns an all numeric keyed actionscript array
	 */
	readArray: function(ba) {
		var arr = [];
		var l = ba.readUnsignedInt();
		for (var i = 0; i < l; i++) {
			arr.push(this.readData(ba));
		}

		this.objCache.push(arr);
		return arr;
	},

	/**
	 * readDate reads a date from the amf message
	 */
	readDate: function(ba) {
		var ms = ba.readDouble();
		var timezone = ba.readShort(); // reserved, not supported. should be set to 0x0000
		/*
		if (timezone > 720) {
			timezone = -(65536 - timezone);
		}
		timezone *= -60;*/

		var varVal = new Date();
		varVal.setTime(ms);

		return varVal;
	},

	readLongString: function(ba) {
		return ba.readUTFBytes(ba.readUnsignedInt());
	},

	readXML: function(ba) {
		var strXML = ba.readUTFBytes(ba.readUnsignedInt());
		return new XML(strXML);
	},

	/**
	 * If a strongly typed object has an alias registered for its class then the type name 
	 * will also be serialized. Typed objects are considered complex types and reoccurring 
	 * instances can be sent by reference.
	 */
	readCustomClass: function(ba) {
		var classID = ba.readUTF();
		var obj = this.readObject(ba);

		// Try to type it to the class def
		/*try {
			var classDef:Class = getClassByAlias(classID);
			obj = new classDef();
			obj.readExternal(ba);
		} catch (e) {
			obj = this.readData(ba);
		}*/

		return obj;
	}
};

Firebug.AMFViewerModel.AMF3 = function() {

	// The raw binary data
	this._rawData;

	// The decoded data
	this._data;

	this.arrObjCache = [];
	this.arrStrCache = [];
	this.arrDefCache = [];

};

Firebug.AMFViewerModel.AMF3.prototype = {

	// Reads the amf3 data
	deserialize: function(data) {
		this.clearCache();
		this._rawData = data;
		this._data = this.readData(this._rawData);
	},

	// Clears the object, string and definition cache
	clearCache: function() {
		this.arrObjCache = [];
		this.arrStrCache = [];
		this.arrDefCache = [];
	},

	readData: function(ba) {
		var type = ba.readByte();
		switch(type) {
		case 0x00 : return undefined;  				// Undefined
		case 0x01 : return null;					// Null
		case 0x02 : return false;					// Boolean false
		case 0x03 : return true;					// Boolean true
		case 0x04 : return this.readInt(ba);		// Integer
		case 0x05 : return this.readDouble(ba);		// Double
		case 0x06 : return this.readString(ba);		// String
		case 0x07 : return this.readXMLDoc(ba);		// XML Doc
		case 0x08 : return this.readDate(ba);		// Date
		case 0x09 : return this.readArray(ba);		// Array
		case 0x0A : return this.readObject(ba);		// Object
		case 0x0B : return this.readXML(ba); 		// XML
		case 0x0C : return this.readByteArray(ba); 	// Byte Array
		default: throw Error("AMF3::readData - Error : Undefined AMF3 type encountered '" + type + "'");
		}
	},

	readInt: function(ba) {
		var count = 0;
		var intRef = ba.readUnsignedByte();
		var result = 0;

		while ((intRef & 0x80) != 0 && count < 3) {
			result <<= 7;
			result |= (intRef & 0x7f);
			intRef = ba.readUnsignedByte();
			count++;
		}

		if (count < 3) {
			result <<= 7;
			result |= intRef;
		} else {
			// Use all 8 bits from the 4th byte
			result <<= 8;
			result |= intRef;

			// Check if the integer should be negative
			if ((result & 0x10000000) != 0) {
				// and extend the sign bit
				result |= 0xe0000000;
			}
		}

		return result;
	},

	readDouble: function(ba) {
		return ba.readDouble();
	},

	readString: function(ba) {
		var handle = this.readInt(ba);
		var str = "";

		// Is this referring to a previous string?
		if ((handle & 0x01) == 0) {
			handle = handle >> 1;
			if (handle >= this.arrStrCache.length) {
				throw Error("AMF3::readString - Error : Undefined string reference '" + handle + "'");
				return null;
			}
			return this.arrStrCache[handle];
		}

		var len = handle >> 1; 
		if (len > 0) {
			str = ba.readUTFBytes(len);
			this.arrStrCache.push(str);
		}

		return str;
	},

	readXMLDoc: function(ba) {
		var handle = this.readInt(ba);
		var xmldoc;
		var inline = ((handle & 1)  != 0 );
		handle = handle >> 1;

		if(inline) {
			xmldoc = new XML(ba.readUTFBytes(handle));
			this.arrObjCache.push(xmldoc);
		} else {
			xmldoc = this.arrObjCache[handle];
		}

		return xmldoc;
	},

	readDate: function(ba) {
		var handle = this.readInt(ba);
		var inline = ((handle & 1)  != 0 );
		handle >>= 1;

		// Is this referring to a previous date?
		if (inline) {
			var varVal = new Date();
			varVal.setTime(ba.readDouble());
			this.arrObjCache.push(varVal);
			return varVal;
		} else {
			if (handle >= this.arrObjCache.length) {
				ERROR("AMF3::readDate - Error : Undefined date reference '" + handle + "'");
				return null;
			}
			return this.arrObjCache[handle];
		}
	},

	readArray: function(ba) {
		var handle = this.readInt(ba);
		var inline = ((handle & 1)  != 0 );
		handle = handle >> 1;

		if (inline) {
			var arr = [];
			var strKey = this.readString(ba);

			while(strKey != "") {
				arr[strKey] = this.readData(ba);
				strKey = this.readString(ba);
			}

			for(var i = 0; i < handle; i++) {
				arr[i] = this.readData(ba);
			}

			this.arrObjCache.push(arr);
			return arr;
		} else {
			// return previously reference array
			return this.arrObjCache[handle];
		}
	},

	/**
	 * A single AMF 3 type handles ActionScript Objects and custom user classes. The term 'traits' 
	 * is used to describe the defining characteristics of a class. In addition to 'anonymous' objects 
	 * and 'typed' objects, ActionScript 3.0 introduces two further traits to describe how objects are 
	 * serialized, namely 'dynamic' and 'externalizable'.
	 * 
	 * Anonymous : an instance of the actual ActionScript Object type or an instance of a Class without 
	 * a registered alias (that will be treated like an Object on deserialization)
	 * 
	 * Typed : an instance of a Class with a registered alias
	 * 
	 * Dynamic : an instance of a Class definition with the dynamic trait declared; public variable members 
	 * can be added and removed from instances dynamically at runtime
	 * 
	 * Externalizable : an instance of a Class that implements flash.utils.IExternalizable and completely 
	 * controls the serialization of its members (no property names are included in the trait information).
	 * 
	 * @param	ba
	 * @return
	 */
	readObject: function(ba) {
		var handle = this.readInt(ba);
		var inline = (handle & 0x01) != 0;
		handle = handle >> 1;
		var classDefinition;
		var classMemberDefinitions;

		if(inline) {
			// An inline object
			var inlineClassDef = (handle & 0x01) != 0;
			handle = handle >> 1;
			if (inlineClassDef) {
				// Inline class-def
				var typeIdentifier = this.readString(ba);

				// Flags that identify the way the object is serialized/deserialized
				var externalizable = (handle & 0x01) != 0;
				handle = handle >> 1;

				var isDynamic = (handle & 0x01) != 0;
				handle = handle >> 1;

				var classMemberCount = handle;
				classMemberDefinitions = [];
				for(var i = 0; i < classMemberCount; i++) {
					classMemberDefinitions.push(this.readString(ba));
				}

				classDefinition = {type:typeIdentifier, members:classMemberDefinitions, externalizable:externalizable, dynamic:isDynamic};
				this.arrDefCache.push(classDefinition);
			} else {
				// A reference to a previously passed class-def
				if (!this.arrDefCache[handle]) throw new Error("AMF3::readObject - Error : Unknown Definition reference: '" + handle + "'");
				classDefinition = this.arrDefCache[handle];
			}
		} else {
			// An object reference
			if (!this.arrObjCache[handle]) throw new Error("AMF3::readObject - Error : Unknown Object reference: '" + handle + "'");
			return this.arrObjCache[handle];
		}

		//Add to references as circular references may search for this object
		this.arrObjCache.push(obj);

		var obj = {};
		if (classDefinition.externalizable) {
			try {
				obj = this.readData(ba);
			} catch (e) {
				ERROR("AMF3::readObject - Error : Unable to read externalizable data type '" + classDefinition.type + "'");
			}
		} else {
			var l = classDefinition.members.length;
			var key;

			for(var j = 0; j < l; j++) {
				var val = this.readData(ba);
				key = classDefinition.members[j];
				obj[key] = val;
			}

			if(classDefinition.dynamic/* && obj is ASObject*/) {
				key = this.readString(ba);
				while(key != "") {
					var value = this.readData(ba);
					obj[key] = value;
					key = this.readString(ba);
				}
			}
		}

		return obj;
	},

	readXML: function(ba) {
		var handle = this.readInt(ba);
		var xml;
		var inline = ((handle & 1)  != 0 );
		handle = handle >> 1;

		if(inline) {
			xml = new XML(ba.readUTFBytes(handle));
			this.arrObjCache[handle] = xml;
		} else {
			xml = this.arrObjCache[handle];
		}

		return xml;
	},

	readByteArray: function(ba) {
		var handle = this.readInt(ba);
		var inline = ((handle & 1) != 0 );
		var ba2 = [];
		handle = handle >> 1;

		if(inline) {
			//ba2 = new ByteArray();
			while(handle--) {
				ba2.push("0x" + ba.readByte().toString(16).toUpperCase());
			}
			//ba.readBytes(ba2, 0, handle);
			this.arrObjCache[handle] = ba2;
		} else {
			ba2 = this.arrObjCache[handle];
		}

		return ba2;
	}
};

//	************************************************************************************************
//	Registration

	Firebug.registerModule(Firebug.AMFViewerModel.AMFRequest);
	Firebug.registerModule(Firebug.AMFViewerModel.AMFResponse);

//	************************************************************************************************
}});

