function AMFExplorerAMFLib() {}

(function() { with (FBL) { 
	
const NS_SEEK_SET = 0;
const NS_SEEK_CUR = 1;
const NS_SEEK_END = 2;

// AMF Version Constants
const AMF0_VERSION = 0;
const AMF1_VERSION = 1; // There is no AMF1 but FMS uses it for some reason, hence special casing.
const AMF3_VERSION = 3;

// AMF0 Constants
const AMF0_kNumberType        = 0;
const AMF0_kBooleanType       = 1;
const AMF0_kStringType        = 2;
const AMF0_kObjectType        = 3;
const AMF0_kMovieClipType     = 4;
const AMF0_kNullType          = 5;
const AMF0_kUndefinedType     = 6;
const AMF0_kReferenceType     = 7;
const AMF0_kECMAArrayType     = 8;
const AMF0_kObjectEndType     = 9;
const AMF0_kStrictArrayType   = 10;
const AMF0_kDateType          = 11;
const AMF0_kLongStringType    = 12; 
const AMF0_kUnsupportedType   = 13;
const AMF0_kRecordsetType     = 14;
const AMF0_kXMLObjectType     = 15;
const AMF0_kTypedObjectType   = 16;
const AMF0_kAvmPlusObjectType = 17;

// AMF3 Constants
const AMF3_kUndefinedType  = 0;
const AMF3_kNullType       = 1;
const AMF3_kFalseType      = 2;
const AMF3_kTrueType       = 3;
const AMF3_kIntegerType    = 4;
const AMF3_kDoubleType     = 5;
const AMF3_kStringType     = 6;
const AMF3_kXMLType        = 7;
const AMF3_kDateType       = 8;
const AMF3_kArrayType      = 9;
const AMF3_kObjectType     = 10;
const AMF3_kAvmPlusXmlType = 11;
const AMF3_kByteArrayType  = 12;
const AMF3_EMPTY_STRING    = "";
const AMF3_UINT29_MASK     = 0x1FFFFFFF; // 2^29 - 1
const AMF3_INT28_MAX_VALUE = 0x0FFFFFFF; // 2^28 - 1
const AMF3_INT28_MIN_VALUE = 0xF0000000; // -2^28 in 2^29 scheme

// AbstractMessage Constants
const HAS_NEXT_FLAG = 128;
const BODY_FLAG = 1;
const CLIENT_ID_FLAG = 2;
const DESTINATION_FLAG = 4;
const HEADERS_FLAG = 8;
const MESSAGE_ID_FLAG = 16;
const TIMESTAMP_FLAG = 32;
const TIME_TO_LIVE_FLAG = 64;
const CLIENT_ID_BYTES_FLAG = 1;
const MESSAGE_ID_BYTES_FLAG = 2;

//AsyncMessage Constants
const CORRELATION_ID_FLAG = 1;
const CORRELATION_ID_BYTES_FLAG = 2;

// Simplified implementaiton of the class alias registry 
var classAliasRegistry =
{	
	"DSK": "flex.messaging.messages.AcknowledgeMessageExt",
	"DSA": "flex.messaging.messages.AsyncMessageExt",
	"DSC": "flex.messaging.messages.CommandMessageExt"	
};

/* 
 * This is John Resig's Simple JavaScript Inheritance
 * See: http://ejohn.org/blog/simple-javascript-inheritance/
 */

var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

// The base Class implementation (does nothing)
Class = function(){};

// Create a new Class that inherits from this class
Class.extend = function(prop) {
	var _super = this.prototype;

	// Instantiate a base class (but only create the instance,
	// don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
    // Check if we're overwriting an existing function
    prototype[name] = typeof prop[name] == "function" &&
    	typeof _super[name] == "function" && fnTest.test(prop[name]) ?
    			(function(name, fn){
    				return function() {
    					var tmp = this._super;
   
    					// Add a new ._super() method that is the same method
    					// but on the super-class
    					this._super = _super[name];
   
    					// The method only need to be bound temporarily, so we
    					// remove it when we're done executing
    					var ret = fn.apply(this, arguments);       
    					this._super = tmp;
           
    					return ret;
    				};
    			})(name, prop[name]) : prop[name];
    }
    // The dummy class constructor
    function Class() {
    	// All construction is actually done in the init method
    	if ( !initializing && this.init )
    		this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
};	

// The base ArrayClass implementation (does nothing)
ArrayClass = function(){};
ArrayClass.prototype = new Array();

// Create a new Class that inherits from this class
ArrayClass.extend = function(prop) {
	var _super = this.prototype;

	// Instantiate a base class (but only create the instance,
	// don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
    // Check if we're overwriting an existing function
    prototype[name] = typeof prop[name] == "function" &&
    	typeof _super[name] == "function" && fnTest.test(prop[name]) ?
    			(function(name, fn){
    				return function() {
    					var tmp = this._super;
   
    					// Add a new ._super() method that is the same method
    					// but on the super-class
    					this._super = _super[name];
   
    					// The method only need to be bound temporarily, so we
    					// remove it when we're done executing
    					var ret = fn.apply(this, arguments);       
    					this._super = tmp;
           
    					return ret;
    				};
    			})(name, prop[name]) : prop[name];
    }
    // The dummy class constructor
    function ArrayClass() {
    	// All construction is actually done in the init method
    	if ( !initializing && this.init )
    		this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    ArrayClass.prototype = prototype;

    // Enforce the constructor to be what we expect
    ArrayClass.constructor = Class;

    // And make this class extendable
    ArrayClass.extend = arguments.callee;
   
    return ArrayClass;
};	

/**
 * @class JavaScript implementation of DataInputStream. 
 */	
DataInputStream = Class.extend(
/** @lends DataInputStream */	
{
	/**
     * @ignore
     */
	_stream: null,
	
	/**
     * @ignore
     */
	_mark: null,
	
	/**
     * @ignore
     */
	_readLimit: null,
	
	/**
	 * @constructor  
	 */	
	init: function(inputStream) {
	
		var binaryStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
		binaryStream.setInputStream(inputStream);
			
		this._stream = binaryStream;
	},
	
	getInputStream: function() {
		return this._stream;
	},
	
	/**
	 * Returns the number of bytes that can be read from this input stream without blocking.
	 */		
	available: function() {
		return this._stream.available();
	}, 
	
	/**
	 * Closes this input stream and releases any system resources associated with the stream.
	 */
	close: function() {
		this._stream.close();
	},
	
	/**
	 * Marks the current position in this input stream.
	 */
	mark: function(readLimit) {
		var seekableStream = this._stream.QueryInterface(Ci.nsISeekableStream);
		this._mark = seekableStream.tell();
		this._readLimit = readLimit;
	},
	
	/**
	 * Tests if this input stream supports the mark and reset methods.
	 */
	markSupported: function() {
		return true;
	},
	
	/**
	 * Reads the next byte of data from this input stream.
	 * Reads some number of bytes from the contained input stream and stores them into the buffer array b.
	 * Reads up to len bytes of data from the contained input stream into an array of bytes.
	 */
	read: function(b, off, len) {
		
		if(!b)
			return this._stream.read8();
		
		if(!off)
			var off = 0;
		
		if(!len)
			var len = b.length;
		
		var count = 0;
		
		while (off < len && this._stream.available() > 0) {
			b[off] = this._stream.read8();			
			off++;
			count++;
		}
		
		return count;
		
	},
	
	/**
	 * Reads one input byte and returns true if that byte is nonzero, false if that byte is zero.
	 */
	readBoolean: function() {
		return this._stream.readBoolean();
	},
	
	/**
	 * Reads and returns one input byte.
	 */
	readByte: function() {
		return this._stream.read8();
	},
	
	/**
	 * Reads an input char and returns the char value.
	 */
	readChar: function() {
		return String(this._stream.readBytes(2));
	},
	
	/**
	 * Reads eight input bytes and returns a double value.
	 */
	readDouble: function() {
		return this._stream.readDouble();
	},
	
	/**
	 * Reads four input bytes and returns a float value.
	 */
	readFloat: function() {
		return this._stream.readFloat();
	},
	
	/**
	 * Reads some bytes from an input stream and stores them into the buffer array b.
	 * Reads len bytes from an input stream.
	 */
	readFully: function(b, off, len) {
		if(!off)
			var off=0;
		
		if(!len)
			var len = b.length;
		
		this.read(b, off, len);
	},
	
	/**
	 * Reads four input bytes and returns an int value.
	 */
	readInt: function() {
		return this._stream.read32();
	},
	
	/**
	 * Reads the next line of text from the input stream.
	 */
	readLine: function () {
		var line = "";
		var size = this._stream.available();
		for (var i = 0; i < size; i++) {
			var c = this._stream.readCString();
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
	 * Reads eight input bytes and returns a long value.
	 */
	readLong: function() {
		return this._stream.read64();
	},
	
	/**
	 * Reads in a string that has been encoded using a modified UTF-8 format with a 32-bit string length.
	 */
	readLongUTF: function() {
		var length = this.readLong();
		return String(this._stream.readBytes(length));
	},
	
	/**
	 * Reads two input bytes and returns a short value.
	 */
	readShort: function() {
		return this._stream.read16();
	},
	
	/**
	 * Reads one input byte, zero-extends it to type int, and returns the result, which is therefore in the range 0 through 255.
	 */
	readUnsignedByte: function() {
		return this._stream.read8();
	},
	
	/**
	 * Reads two input bytes and returns an int value in the range 0 through 65535.
	 */
	readUnsignedShort: function() {
		return this._stream.read16();
	},
	
	/**
	 * Reads in a string that has been encoded using a modified UTF-8 format with a 16-bit string length.
	 */
	readUTF: function(length) {
		if(!length)
			var length = this.readUnsignedShort();
		return String(this._stream.readBytes(length));		
	},
	
	/**
	 *  Repositions this stream to the position at the time the mark method was last called on this input stream.
	 */
	reset: function() {
		var seekableStream = this._stream.QueryInterface(Ci.nsISeekableStream);
		if (this._mark + this._readLimit > seekableStream.tell())
			seekableStream.seek(NS_SEEK_SET,this._mark);		
	},
	
	/**
	 *  Skips over and discards n bytes of data from the input stream.
	 */
	skip: function(n){
		var seekableStream = this._stream.QueryInterface(Ci.nsISeekableStream);
		seekableStream.seek(NS_SEEK_CUR,n);	
	},
	
	/**
	 * Makes an attempt to skip over n bytes of data from the input stream, discarding the skipped bytes.
	 */
	skipBytes: function(n){
		this.skip(n);
	}	
	
});

/**
 * @class A deserializer of AMF protocol data.
 */
AbstractAmfInput = Class.extend(
/** @lends this.AbstractAmfInput */		
{
	/**
     * @ignore
     */
	_in: null,
	
	/**
	 * Construct a deserializer without connecting it to an input stream.
	 * @constructor  
	 */	
	init: function() {
		// do nothing
	},
	
	setInputStream: function(inputStream) {
        this._in = new DataInputStream(inputStream);
    },

    stringToDocument: function(xml) {
    	 if (xml && xml.indexOf('<') == -1)
             return xml;

    	 return new XML(xml);
    },
    
    available: function() {
        return this._in.available();
    },

    close: function() {
        this._in.close();
    },

    read: function(bytes, offset, length) {
    	
    	if(!bytes)
    		return this._in.read();
    	
    	if(!offset)
    		var offset=0;
    	
    	if(!length)
    		var length = bytes.length;
        
    	return this._in.read(bytes, offset, length);
    },

    skip: function(n) {
        return this._in.skip(n);
    },

    skipBytes: function(n) {
        return this._in.skipBytes(n);
    },

    readBoolean: function() {
        return this._in.readBoolean();
    },

    readByte: function() {
        return this._in.readByte();
    },

    readChar: function() {
        return this._in.readChar();
    },

    readDouble: function() {
        return this._in.readDouble();
    },

    readFloat: function() {
        return this._in.readFloat();
    },

    readFully: function(bytes, offset, length) {
        if (!offset)
        	var offset = 0;
        
        if(!length)
        	var length = bytes.length;
    	
    	this._in.readFully(bytes, offset, length);
    },

    readInt: function() {
        return this._in.readInt();
    },

    readLine: function() {
        return this._in.readLine();
    },

    readLong: function() {
        return this._in.readLong();
    },
    
    readLongUTF: function() {
		return this._in.readLongUTF();
	},

    readShort: function() {
        return this._in.readShort();
    },

    readUnsignedByte: function() {
        return this._in.readUnsignedByte();
    },

    readUnsignedShort: function() {
        return this._in.readUnsignedShort();
    },

    readUTF: function() {
        return this._in.readUTF();
    }
	
});

/**
 * @class An Amf0 input object.
 */
Amf0Input = AbstractAmfInput.extend(
/** @lends this.Amf0Input */		
{
	/**
     * Unfortunately the Flash Player starts AMF 3 messages off with the legacy
     * AMF 0 format and uses a type, AmfTypes.kAvmPlusObjectType, to indicate
     * that the next object in the stream is to be deserialized differently. The
     * original hope was for two independent encoding versions... but for now
     * we just keep a reference to objectInput here.
     * @ignore
     */
	_avmPlusInput: null,
	
	/**
     * @ignore
     */
	_objectsTable: null,
	
	/**
	 * @constructor  
	 */	
	init: function() {
		this._objectsTable = [];
	},
	
	/**
     * Clear all object reference information so that the instance
     * can be used to deserialize another data structure.
     *
     * Reset should be called before reading a top level object,
     * such as a new header or a new body.
     */	
	reset: function() {
        
        this._objectsTable = [];

        if (this._avmPlusInput != null)
            this._avmPlusInput.reset();
    },

    /**
     * Public entry point to read a top level AMF Object, such as
     * a header value or a message body.
     */
    readObject: function() {
        var type = this._in.readByte();

        var value = this.readObjectValue(type);
        return value;
    },

    readObjectValue: function(type) {
        var value = null;
        switch (type)
        {
            case AMF0_kNumberType:
                value = this.readDouble();

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kNumberType", value);

                break;

            case AMF0_kBooleanType:
                value = this.readBoolean();

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kBooleanType", value);

                break;

            case AMF0_kStringType:
                value = this.readString();
                break;

            case AMF0_kAvmPlusObjectType:

                if (this._avmPlusInput == null)
                {
                    this._avmPlusInput = new Amf3Input();
                    this._avmPlusInput.setInputStream(this._in.getInputStream());
                }

                value = this._avmPlusInput.readObject();
                break;

            case AMF0_kStrictArrayType:
                value = this.readArrayValue();
                break;

            case AMF0_kTypedObjectType:
                var typeName = this._in.readUTF();
                value = this.readScriptObject(typeName);
                break;

            case AMF0_kLongStringType:
                value = this.readLongUTF();
                
                // Debug                
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kLongStringType", value);
                
                break;

            case AMF0_kObjectType:
                value = this.readScriptObject(null);
                break;

            case AMF0_kXMLObjectType:
                value = this.readXml();
                break;

            case AMF0_kNullType:
            	
            	// Debug            	
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kNullType");
            	
                break;

            case AMF0_kDateType:
                value = this.readDate();
                break;

            case AMF0_kECMAArrayType:
                value = this.readECMAArrayValue();
                break;

            case AMF0_kReferenceType:
                var refNum = this._in.readUnsignedShort();

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kReferenceType",refNum);

                value = this._objectsTable[refNum];
                break;

            case AMF0_kUndefinedType:
                
            	// Debug                
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kUndefinedType");
            	
                break;

            case AMF0_kUnsupportedType:

            	// Debug
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kUnsupportedType");

                //Unsupported type found in AMF stream.
                var ex = new Error("10302: Unsupported type found in AMF stream.");
                throw ex;

            case AMF0_kObjectEndType:

            	// Debug
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kObjectEndType");

                //Unexpected object end tag in AMF stream.
            	var ex1 = new Error("10303: Unexpected object end tag in AMF stream.");
                throw ex1;

            case AMF0_kRecordsetType:

            	// Debug
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.kRecordsetType");

                //AMF Recordsets are not supported.
                var ex2 = new Error("1034: AMF Recordsets are not supported.");
                throw ex2;

            default:

            	// Debug
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf0Input.readObjectValue.unknownType");

                var ex3 = new Error("10301: Unknown type: " + type + ".");
                throw ex3;
        }
        return value;
    },

    readDate: function() {
        var time = this._in.readDouble();

        /*
            We read in the timezone but do nothing with the value as
            we expect dates to be written in the UTC timezone. Client
            and servers are responsible for applying their own
            timezones.
        */
        this._in.readShort();

        var d = new Date(time);
    
        // Debug    
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readDate",d);

        return d;
    },

    /**
     * Deserialize the bits of an ECMA array w/o a prefixing type byte.
     */
    readECMAArrayValue: function() {
        var size = this._in.readInt();
        var h = {};
        
        rememberObject(h);
        
        // Debug        
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readECMAArrayValue.startECMAArray",(objectsTable.length - 1));

        var name = this._in.readUTF();
        var type = this._in.readByte();
        while (type != AMF0_kObjectEndType)
        {
            if (type != AMF0_kObjectEndType)
            {
                // Debug                
            	if (AMFXTrace.DBG_AMFINPUT)
                	AMFXTrace.sysout("amf0Input.readECMAArrayValue.namedElement",name);

                // Always read value but be careful to ignore erroneous 'length' prop that is sometimes sent by the player.
                var value = this.readObjectValue(type);
                if (name != "length")
                    h[name] = value;
            }

            name = this._in.readUTF();
            type = this._in.readByte();
        }

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readECMAArrayValue.endECMAArray");

        return h;
    },

    readString: function() {
        var s = this.readUTF();

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readString", s);

        return s;
    },

    /**
     * Deserialize the bits of an array w/o a prefixing type byte.
     */
    readArrayValue: function() {
        var size = this._in.readInt();
        var l = [];
        this.rememberObject(l);

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readArrayValue.startAMFArray",(this._objectsTable.length - 1));

        for (var i = 0; i < size; ++i)
        {
            // Get element type
            var type = this._in.readByte();

            // Debug
            if (AMFXTrace.DBG_AMFINPUT)
    			AMFXTrace.sysout("amf0Input.readArrayValue.arrayElement",i);

            // Add value to the array
            l.push(this.readObjectValue(type));
        }

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readArrayValue.endAMFArray");

        return l;
    },

    /**
     * Deserialize the bits of a map w/o a prefixing type byte.
     * Method named changed for AMF Explorer.
     */
    readScriptObject: function(className) {
        
        //proxy object not implemented.
    	
    	if (typeof(className) === "undefined" || className == null || className.length == 0 ) {
            object = {};
        } else {
            object = {__className__: className};
        }

        var objectId = this.rememberObject(object);

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readScriptObject.startAMFObject" + (className ? "." + className : ""),(this._objectsTable.length - 1));

        var propertyName = this._in.readUTF();
        var type = this._in.readByte();
        while (type != AMF0_kObjectEndType)
        {
            // Debug            
        	if (AMFXTrace.DBG_AMFINPUT)
    			AMFXTrace.sysout("amf0Input.readScriptObject.namedElement",propertyName);
            
            var value = this.readObjectValue(type);
            
            object[propertyName]=value;
            
            propertyName = this._in.readUTF();
            type = this._in.readByte();
        }

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readScriptObject.endAMFObject");
       
        return object;
    },
    
    // readLongUTF: implemented in this.AbstractAmfInput
    
    readXml: function() {
        var xml = this.readLongUTF();

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf0Input.readXml",xml);

        return this.stringToDocument(xml);
    },

    /**
     * Remember a deserialized object so that you can use it later through a reference.
     */
    rememberObject: function(obj) {
        var id = this._objectsTable.length;
        this._objectsTable.push(obj);
        return id;
    }
	
});

/**
 * @class An Amf3 input object.
 */
Amf3Input = AbstractAmfInput.extend(
/** @lends this.Amf3Input */		
{
	
	/**
     * @ignore
     */
	_objectTable: null,
	
	/**
     * @ignore
     */
	_stringTable: null,
	
	/**
     * @ignore
     */
	_traitsTable: null,
	
	/**
	 * @constructor  
	 */	
	init: function() {
		this._stringTable = [];
		this._objectTable = [];
		this._traitsTable = [];
	},
	
	/**
     * Reset should be called before reading a top level object,
     * such as a new header or a new body.
     */
    reset: function() {
		this._stringTable = [];
		this._objectTable = [];
		this._traitsTable = [];
    },
    
    saveObjectTable: function() {
        var table = this._objectTable;
        this._objectTable = [];
        return table;
    },

    restoreObjectTable: function(table) {
    	this._objectTable = table;
    },

    saveTraitsTable: function() {
        var table = this._traitsTable;
        this._traitsTable = [];
        return table;
    },

    restoreTraitsTable: function(table) {
    	this._traitsTable = table;
    },

    saveStringTable: function() {
        var table = this._stringTable;
        this._stringTable = [];
        return table;
    },

    restoreStringTable: function(table) {
        this._stringTable = table;
    },
    
    /**
     * Public entry point to read a top level AMF Object, such as
     * a header value or a message body.
     */
    readObject: function() {
        var type = this._in.readByte();
        var value = this.readObjectValue(type);
        return value;
    },
    
    readObjectValue: function(type) {
        var value = null;

        switch (type)
        {
            case AMF3_kStringType:
                value = this.readString();

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kStringType", value);
                
                break;

            case AMF3_kObjectType:
                value = this.readScriptObject();
                break;

            case AMF3_kArrayType:
                value = this.readArray();
                break;

            case AMF3_kFalseType:
                value = false;

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kFalseType", value);
                
                break;

            case AMF3_kTrueType:
                value = true;

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kTrueType", value);
                
                break;

            case AMF3_kIntegerType:
                var i = this.readUInt29();
                // Symmetric with writing an integer to fix sign bits for negative values...
                i = (i << 3) >> 3;
                value = i;

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kIntegerType", value);
                
                break;

            case AMF3_kDoubleType:
                value = this._in.readDouble();

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kDoubleType", value);
                
                break;

            case AMF3_kUndefinedType:
                
            	// Debug                
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kUndefinedType", value);
            	
                break;

            case AMF3_kNullType:

            	// Debug
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kNullType", value);
            	
                break;

            case AMF3_kXMLType:
            case AMF3_kAvmPlusXmlType:
                value = this.readXml();
                break;

            case AMF3_kDateType:
                value = this.readDate();

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.kDateType", value);
                
                break;

            case AMF3_kByteArrayType:
                value = this.readByteArray();
                break;
                
            default:
            	
            	// Debug            	
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readObjectValue.unknownType");

                var ex = new Error("10301: Unknown type: " + type + ".");
                throw ex;
        }

        return value;
    },
    
    readString: function() {
        var ref = this.readUInt29();

        if ((ref & 1) == 0) 
        {
            // This is a reference
             return this.getStringReference(ref >> 1);
        } 
        else 
        {
            // Read the string in
            var len = (ref >> 1);

            // writeString() special cases the empty string
            // to avoid creating a reference.
            if (0 == len)
            {
                return AMF3_EMPTY_STRING;
            }

            var str = this.readUTF(len);

            // Remember String
            this._stringTable.push(str);

            return str;
        }
    },
    
    /**
     * Deserialize the bits of a date-time value w/o a prefixing type byte.
     */
    readDate: function() {
        var ref = this.readUInt29();

        if ((ref & 1) == 0)
        {
            // This is a reference
            return this.getObjectReference(ref >> 1);
        }
        else
        {
            var time = this._in.readDouble();

            var d = new Date(time);

            //Remember Date
            this._objectTable.push(d);

            // Debug
            if (AMFXTrace.DBG_AMFINPUT)
    			AMFXTrace.sysout("amf3Input.readDate",d);

            return d;
        }
    },
    
    readArray: function() {
        var ref = this.readUInt29();

        if ((ref & 1) == 0)
        {
            // This is a reference
            return this.getObjectReference(ref >> 1);
        }
        else
        {
            var len = (ref >> 1);
            var array = null;

            // First, look for any string based keys. If any
            // non-ordinal indices were used, or if the Array is
            // sparse, we represent the structure as a Map.
            var map = null;
            for (; ;)
            {
                var name = this.readString();
                if (name == null || name.length == 0) break;

                if (map == null)
                {
                    map = {};
                    array = map;

                    //Remember Object
                    this._objectTable.push(array);
          
                    // Debug          
                    if (AMFXTrace.DBG_AMFINPUT)
            			AMFXTrace.sysout("amf3Input.readArray.startECMAArray",(objectTable.length - 1));
                }

                var value = this.readObject();
                map[name] = value;
            }

            // If we didn't find any string based keys, we have a
            // dense Array, so we represent the structure as a Array.
            if (map == null)
            {
                
                var list = [];
                array = list;

                // Remember List
                this._objectTable.push(array);

                // Debug
                if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readArray.startAMFArray",(this._objectTable.length - 1));

                for (var i = 0; i < len; i++)
                {
                	// Debug                	
                	if (AMFXTrace.DBG_AMFINPUT)
            			AMFXTrace.sysout("amf3Input.readArray.arrayElement",i);

                    var item = this.readObject();
                    list.push(item);
                }
                
            }
            else
            {
                for (var i = 0; i < len; i++)
                {
                	// Debug                	
                	if (AMFXTrace.DBG_AMFINPUT)
            			AMFXTrace.sysout("amf3Input.readArray.arrayElement",i);

                    var item = this.readObject();
                    map[String(i)] = item;
                }
            }

            // Debug
            if (AMFXTrace.DBG_AMFINPUT)
    			AMFXTrace.sysout("amf3Input.readArray.endAMFArray",i);

            return array;
        }
    },
    
    readScriptObject: function() {
        var ref = this.readUInt29();

        if ((ref & 1) == 0)
        {
            return this.getObjectReference(ref >> 1);
        }
        else
        {
            var ti = this.readTraits(ref);
            className = ti.getClassName();
            externalizable = ti.isExternalizable();
            var object;
            // proxy not implemented
            
            // Check for any registered class aliases 
            var aliasedClass = classAliasRegistry[className];
            if (aliasedClass != null)
            	className = aliasedClass;

            if (className == null || className.length == 0) {
                object = {};
            } else if (className.indexOf(">") == 0) {
            	// Handle [RemoteClass] (no server alias)
            	object = {__className__: className};
            } else if (className.indexOf("flex.") == 0){
            	// Try to get a class
            	var classParts = className.split(".");
            	var unqualifiedClassName = classParts[(classParts.length - 1)];            	
            	if (unqualifiedClassName && flex[unqualifiedClassName]) {
            		object = new flex[unqualifiedClassName]();	
					object.__className__ = className;                    
            	} else {
            		object = {__className__: className};
            	}            	
            } else {
            	object = {__className__: className};
            }

            // Remember our instance in the object table
            var objectId = this._objectTable.length;
            this._objectTable.push(object);

            if (externalizable)
            {
                this.readExternalizable(className, object);
            }
            else
            {
            	// Debug            	
            	if (AMFXTrace.DBG_AMFINPUT)
        			AMFXTrace.sysout("amf3Input.readScriptObject.startAMFObject" + (className ? "." + className : ""),(this._objectTable.length - 1));

                var len = ti.getProperties().length;

                for (var i = 0; i < len; i++)
                {
                    var propName = ti.getProperty(i);

                    // Debug
                    if (AMFXTrace.DBG_AMFINPUT)
            			AMFXTrace.sysout("amf3Input.readScriptObject.namedElement",propName);

                    var value = this.readObject();
                    object[propName] = value;
                }

                if (ti.isDynamic()) {
                    for (; ;)
                    {
                        var name = this.readString();
                        if (name == null || name.length == 0) break;

                        // Debug
                        if (AMFXTrace.DBG_AMFINPUT)
                			AMFXTrace.sysout("amf3Input.readScriptObject.namedElement",name);

                        var value = this.readObject();
                        object[name] = value;
                    }
                }
            }

            // Debug
            if (AMFXTrace.DBG_AMFINPUT)
    			AMFXTrace.sysout("amf3Input.readScriptObject.endAMFObject");

            return object;
        }
    },
    
    readExternalizable: function(className, object) {         	
    	if (object.readExternal) {
    		object.readExternal(this);
    	} else {
    		var ex = new Error("10305: Class " + className + " must implement java.io.Externalizable to receive client IExternalizable instances.");
            throw ex;    		
    	}    	
    },
    
    readByteArray: function() {
        var ref = this.readUInt29();

        if ((ref & 1) == 0)
        {
            return this.getObjectReference(ref >> 1);
        }
        else
        {
            var len = (ref >> 1);

            var ba = [];

            // Remember byte array object
            this._objectTable.push(ba);

            this._in.readFully(ba, 0, len);

            // Debug
            if (AMFXTrace.DBG_AMFINPUT)
    			AMFXTrace.sysout("amf3Input.readByteArray.startByteArray",(this._objectTable.length - 1));

            return ba;
        }
    },
    
    readTraits: function(ref) {
        if ((ref & 3) == 1)
        {
            // This is a reference
            return this.getTraitReference(ref >> 2);
        }
        else
        {
            var externalizable = ((ref & 4) == 4);
            var dynamic = ((ref & 8) == 8);
            var count = (ref >> 4); /* uint29 */
            var className = this.readString();

            ti = new TraitsInfo(className, dynamic, externalizable, count);

            // Remember Trait Info
            this._traitsTable.push(ti);

            for (var i = 0; i < count; i++)
            {
                var propName = this.readString();
                ti.addProperty(propName);
            }

            return ti;
        }
    },
    
    readUTF: function(utflen) {
    	return this._in.readUTF(utflen);
    },
    
    /**
     * AMF 3 represents smaller integers with fewer bytes using the most
     * significant bit of each byte. The worst case uses 32-bits
     * to represent a 29-bit number, which is what we would have
     * done with no compression.
     * <pre>
     * 0x00000000 - 0x0000007F : 0xxxxxxx
     * 0x00000080 - 0x00003FFF : 1xxxxxxx 0xxxxxxx
     * 0x00004000 - 0x001FFFFF : 1xxxxxxx 1xxxxxxx 0xxxxxxx
     * 0x00200000 - 0x3FFFFFFF : 1xxxxxxx 1xxxxxxx 1xxxxxxx xxxxxxxx
     * 0x40000000 - 0xFFFFFFFF : throw range exception
     * </pre>
     *
     */
    readUInt29: function() {
        var value;

        // Each byte must be treated as unsigned
        var b = this._in.readByte() & 0xFF;

        if (b < 128)
        {
            return b;
        }

        value = (b & 0x7F) << 7;
        b = this._in.readByte() & 0xFF;

        if (b < 128)
        {
            return (value | b);
        }

        value = (value | (b & 0x7F)) << 7;
        b = this._in.readByte() & 0xFF;

        if (b < 128)
        {
            return (value | b);
        }

        value = (value | (b & 0x7F)) << 8;
        b = this._in.readByte() & 0xFF;

        return (value | b);
    },
    
    readXml: function() {
        var xml = null;

        var ref = this.readUInt29();

        if ((ref & 1) == 0)
        {
            // This is a reference
            xml = this.getObjectReference(ref >> 1);
        }
        else
        {
            // Read the string in
            var len = (ref >> 1);

            // writeString() special case the empty string
            // for speed.  Do add a reference
            if (0 == len)
                xml = AMF3_EMPTY_STRING;
            else
                xml = this.readUTF(len);

            //Remember Object
            this._objectTable.push(xml);

            // Debug
            if (AMFXTrace.DBG_AMFINPUT)
    			AMFXTrace.sysout("amf3Input.readXml",xml);
        }

        return this.stringToDocument(xml);
    },
    
    getObjectReference: function(ref) {
    	
    	// Debug    	
    	if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf3Input.getObjectReference",ref);
        
    	return this._objectTable[ref];
    },

    getStringReference: function(ref) {
    	
    	// Debug    	
    	if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf3Input.getStringReference",ref);
        
    	return this._stringTable[ref];
    },

    getTraitReference: function(ref) {

    	// Debug
    	if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amf3Input.getTraitReference",ref);
        
    	return this._traitsTable[ref];
    }
	
});

/**
 * AVM+ Serialization optimizes object serialization by
 * serializing the traits of a type once, and then
 * sending only the values of each instance of the type
 * as it occurs in the stream.
 * @class TraitsInfo.
 */
TraitsInfo = Class.extend(
/** @lends this.TraitsInfo */
{
	/**
     * @ignore
     */
	_className: null,
	
	/**
     * @ignore
     */
	_dynamic: null,
	
	/**
     * @ignore
     */
	_externalizable: null,
	
	/**
     * @ignore
     */
	_properties: null,
	
	/**
	 * @constructor  
	 */	
	init: function() {
		
		var className, dynamic, externalizalbe, properties
	
		switch(arguments.length)
		{
			case 1:
				className = arguments[0];
				dynamic = false;
				externalizable = false;
				properties = [];
				break;
				
			case 2:
				className = arguments[0];
				dynamic = false;
				externalizable = false;
				properties = [];
				break;
				
			case 4:
				className = arguments[0];
				dynamic = arguments[1];
				externalizable = arguments[2];
				
				if (arguments[3] instanceof Array) {					
					properties = arguments[4];
				} else {
					properties = [];
				}
				
				break;				
		}
		
		if (className == null)
            className = "";

        this._className = className;

        if (properties == null)
            properties = [];

        this._properties = properties;
        this._dynamic = dynamic;
        this._externalizable = externalizable;
	},
	
	isDynamic: function() {
        return this._dynamic;
    },

    isExternalizable: function() {
        return this._externalizable;
    },

    length: function() {
        return this._properties.length();
    },

    getClassName: function() {
        return this._className;
    },

    addProperty: function(name) {
        this._properties.push(name);
    },
    
    addAllProperties: function(props) {
        this._properties = this._properties.concat(props);
    },

    getProperty: function(i) {
        return this._properties[i];
    },
    
    getProperties: function() {
        return this._properties;
    },

    equals: function(obj) {
        if (obj === this)
        {
            return true;
        }

        if (obj instanceof TraitsInfo)
        {
            var other = obj;

            if (!(this._className == other._className))
            {
                return false;
            }

            if (!(this._dynamic == other._dynamic))
            {
                return false;
            }

            var thisProperties = this._properties;
            var otherProperties = other._properties;
            
            if (thisProperties != otherProperties)
            {
                var thisCount = thisProperties.length;

                if (thisCount != otherProperties.length)
                {
                    return false;
                }

                for (var i = 0; i < thisCount; i++)
                {
                    var thisProp = thisProperties[i];
                    var otherProp = otherProperties[i];
                    if (thisProp != null && otherProp != null)
                    {
                        if (!(thisProp == otherProp))
                        {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        return false;
    },

    /**
     * Instances of types with the same classname and number of properties may
     * return the same hash code, however, an equality test will fully
     * test whether they match exactly on individual property names.
     */
    hashCode: function() {
    	
    	var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";			
		var result = {};
		// data is an array of bytes
		var data = converter.convertToByteArray(this._className, result);
		
		var ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
		ch.init(ch.MD5);
		ch.update(data,data.length);
		
		var c = ch.finish(false);
        c = this._dynamic ? c << 2 : c << 1;
        c = c | (properties.length << 24);
        return c;
    }
	
});


/*
 * This is a package for dynamically instantiated classes.
 */

var flex = {};

flex.ArrayCollection = ArrayClass.extend(
{
	__className__: null,
	
	init: function() {},
	
	readExternal: function(input) {
		var obj = input.readObject();
		for (var i in obj) {
			this[i] = obj[i];
		}
	}
});

flex.ArrayList = flex.ArrayCollection.extend({init: function() {}});

flex.ObjectProxy = Class.extend(
{
	__className__: null,
	
	init: function() {},
	
	readExternal: function(input) {
		var obj = input.readObject();
		for (var i in obj) {
			this[i] = obj[i];
		}
	}
});

flex.ManagedObjectProxy = flex.ObjectProxy.extend({init: function() {}});

/**
 * This is the default implementation of Message, which
 * provides a convenient base for behavior and associations
 * common to all endpoints. 
 * 
 * Note: for AMF Explorer we are only using this class
 * to implement readExternal
 */
flex.AbstractMessage = Class.extend(
{
	
	__className__: null,
	
	clientId: null,
	destination:null,
	messageId: null,
	timestamp: null,
	timeToLive: null,
	headers: null,
	body: null,
	
	init: function() {},
	
	readExternal: function(input) {
        var flagsArray = this.readFlags(input);

        for (var i = 0; i < flagsArray.length; i++)
        {
            var flags = flagsArray[i];
            var reservedPosition = 0;

            if (i == 0)
            {
                if ((flags & BODY_FLAG) != 0)
                	this.readExternalBody(input);
        
                if ((flags & CLIENT_ID_FLAG) != 0)
                    this.clientId = input.readObject();
        
                if ((flags & DESTINATION_FLAG) != 0)
                    this.destination = input.readObject();
        
                if ((flags & HEADERS_FLAG) != 0)
                    this.headers = input.readObject();
        
                if ((flags & MESSAGE_ID_FLAG) != 0)
                    this.messageId = input.readObject();
        
                if ((flags & TIMESTAMP_FLAG) != 0)
                    this.timestamp = input.readObject();
        
                if ((flags & TIME_TO_LIVE_FLAG) != 0)
                    this.timeToLive = input.readObject();

                reservedPosition = 7;
            }
            else if (i == 1)
            {
                if ((flags & CLIENT_ID_BYTES_FLAG) != 0)
                {
                	var clientIdBytes = input.readObject();
                	this.clientId = clientIdBytes; 
                }
        
                if ((flags & MESSAGE_ID_BYTES_FLAG) != 0)
                {
                	var messageIdBytes = input.readObject();
                	this.clientId = messageIdBytes; 
                }

                reservedPosition = 2;
            }

            // For forwards compatibility, read in any other flagged objects to
            // preserve the integrity of the input stream...
            if ((flags >> reservedPosition) != 0)
            {
                for (var j = reservedPosition; j < 6; j++)
                {
                    if (((flags >> j) & 1) != 0)
                    {
                        input.readObject();
                    }
                }
            }
        }
    },
    
    readExternalBody: function(input) {
        this.body = input.readObject();
    },
    
    readFlags: function(input) {
        var hasNextFlag = true;
        flagsArray = [];
        var i = 0;

        while (hasNextFlag)
        {
            var flags = input.readUnsignedByte();
            
            flagsArray[i] = flags;

            if ((flags & HAS_NEXT_FLAG) != 0)
                hasNextFlag = true;
            else
                hasNextFlag = false;

            i++;
        }

        return flagsArray;
    }    

});

flex.AsyncMessage = flex.AbstractMessage.extend(
{	
	correlationId: null,	
	
	init: function() {},
	
	readExternal: function(input) {
        this._super(input);

        var flagsArray = this.readFlags(input);
        for (var i = 0; i < flagsArray.length; i++)
        {
            var flags = flagsArray[i];
            var reservedPosition = 0;

            if (i == 0)
            {
                if ((flags & CORRELATION_ID_FLAG) != 0)
                    this.correlationId = input.readObject();

                if ((flags & CORRELATION_ID_BYTES_FLAG) != 0)
                {
                    var correlationIdBytes = input.readObject();
                    this.correlationId = correlationIdBytes;
                }

                reservedPosition = 2;
            }

            // For forwards compatibility, read in any other flagged objects
            // to preserve the integrity of the input stream...
            if ((flags >> reservedPosition) != 0)
            {
                for (var j = reservedPosition; j < 6; j++)
                {
                    if (((flags >> j) & 1) != 0)
                    {
                        input.readObject();
                    }
                }
            }
        }
    }
		
});

flex.AcknowledgeMessage = flex.AsyncMessage.extend({init: function() {}});
flex.AcknowledgeMessageExt = flex.AcknowledgeMessage.extend({init: function() {}});
flex.ErrorMessage = flex.AcknowledgeMessage.extend({init: function() {}});
flex.AsnycMessageExt = flex.AsyncMessage.extend({init: function() {}});
flex.CommandMessage = flex.AsyncMessage.extend({init: function() {}});
flex.CommandMessageExt = flex.CommandMessage.extend({init: function() {}});


/**
 * This class can deserialize messages from an input stream
 * Multiple messages can be read from the same stream.
 * @class AmfMessageDeserializer.
 */
AmfMessageDeserializer = Class.extend(
/** @lends this.AmfMessageDeserializer */
{
	/**
	 * @ignore
	 */
	_amfIn: null,
	
	/**
	 * @constructor  
	 */	
	init: function() {
		// do nothing
	},
	
	initialize: function(inputStream) {
        this._amfIn = new Amf0Input();
        this._amfIn.setInputStream(inputStream);
    },
    
    /**
     * Deserializes a message from the input stream.
     * This message differs slightly from the BlazeDS implementation in that 
     * a message parameter is not required. If no message is passed in the 
     * function returns the newly created message.
     */
    readMessage: function(messageIn) {
    	
    	// TODO: implement ActionMesasge
    	// cheating a little here and not implementing full class for message.
    	if (!messageIn) {
    		var m = {};
    	} else {
    		var m = messageIn;
    	}
        
    	// Debug        
    	if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amfMessageDeserializer.deserializingMessage");

        // Read packet header
        var version = this._amfIn.readUnsignedShort();
        
        // Treat FMS's AMF1 as AMF0.
        if (version == AMF1_VERSION)
            version = AMF0_VERSION; 

        if (version != AMF0_VERSION && version != AMF3_VERSION)
        {
            //Unsupported AMF version {version}.
            var ex = new Error("Unsupported AMF version " + version);            
            throw ex;
        }

        m.version = version;
        
        // Debug        
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amfMessageDeserializer.version",version);

        // Read headers        
        m.headers = [];        
        var headerCount = this._amfIn.readUnsignedShort();
        for (var i = 0; i < headerCount; ++i)
        {
        	// TODO: implement MessageHeader
        	// cheating a little here and not implementing full class for header.
        	var header = {};
            m.headers.push(header);
            this.readHeader(header, i);
        }

        // Read bodies
        m.bodies = [];
        var bodyCount = this._amfIn.readUnsignedShort();
        for (var i = 0; i < bodyCount; ++i)
        {
        	// TODO: implement MessageBody
        	// cheating a little here and not implementing full class for body.
        	var body = {};
            m.bodies.push(body);
            this.readBody(body, i);
        }
        
        if (!messageIn)
        	return m;
    },
    
    /**
     * Deserialize a message header from the input stream.
     * A message header is structured as:
     * NAME kString
     * MUST UNDERSTAND kBoolean
     * LENGTH kInt
     * DATA kObject
     */
    readHeader: function(header, index) {
        
    	var name = this._amfIn.readUTF();
        header.name = name;
        var mustUnderstand = this._amfIn.readBoolean();
        header.mustUnderstand = mustUnderstand;

        this._amfIn.readInt(); // Length

        this._amfIn.reset();
        var data;

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amfMessageDeserializer.readHeader.startHeader",header);
        
        // no error handling here
        data = this.readObject();
        
        header.data = data;

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amfMessageDeserializer.readHeader.endHeader");
        
    },
    
    /**
     * Deserialize a message body from the input stream.
     */
    readBody: function(body, index) {
        var targetURI = this._amfIn.readUTF();
        body.targetURI = targetURI;
        var responseURI = this._amfIn.readUTF();
        body.responseURI = responseURI;

        this._amfIn.readInt(); // Length

        this._amfIn.reset();
        var data;

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amfMessageDeserializer.readBody.startBody",body);

        // no error handling here
        data = this.readObject();
        
        body.data = data;

        // Debug
        if (AMFXTrace.DBG_AMFINPUT)
			AMFXTrace.sysout("amfMessageDeserializer.readBody.endBody");
    },

    readObject: function() {
        return this._amfIn.readObject();
    }
    
});

this.AmfMessageDeserializer = AmfMessageDeserializer;
	
}}).apply(AMFExplorerAMFLib);

