FBL.ns(function() { with (FBL) {

// ************************************************************************************************
// Common Tags

var OBJECTBOX = FirebugReps.OBJECTBOX =
	SPAN({"class": "objectBox objectBox-$className", role : "presentation"});

var OBJECTBLOCK = FirebugReps.OBJECTBLOCK =
	DIV({"class": "objectBox objectBox-$className focusRow subLogRow", role : "listitem"});

var OBJECTLINK = FirebugReps.OBJECTLINK =
	A({
		"class": "objectLink objectLink-$className a11yFocus",
		_repObject: "$object"
	});

this.Class = domplate(Firebug.Rep,
{
	tag:
		OBJECTLINK(
			SPAN({"class": "objectTitle"}, "$object|getTitle "),
			SPAN({"class": "objectLeftBrace", role: "presentation"}, "{"),
			FOR("prop", "$object|propIterator",
				" $prop.name",
				SPAN({"class": "objectEqual", role: "presentation"}, "$prop.equal"),
				TAG("$prop.tag", {object: "$prop.object"}),
				SPAN({"class": "objectComma", role: "presentation"}, "$prop.delim")
			),
			SPAN({"class": "objectRightBrace"}, "}")
		),

	titleTag:
		SPAN({"class": "objectTitle"}, "$object|getTitle"),

	propIterator: function (object)
	{
		if (!object)
			return [];

		try 
		{
			var props = [];
			var value = object["__className__"];	   
			
			var t = typeof(value);
			
			// Debug
			if (AMFXTrace.DBG_REP)
				AMFXTrace.sysout("reps.class.propIterator", {type: t, value: value});

			if (t == "boolean" || t == "number" || (t == "string" && value)
				|| (t == "object" && value && value.toString))
			{
				var rep = Firebug.AMFExplorer.getRep(value);
				var tag = rep.shortTag || rep.tag;
				if (t == "object")
				{
					value = rep.getTitle(value);
					tag = rep.titleTag;
				}
				props.push({tag: tag, name: "className", object: value, equal: "=", delim: ", "});			
			} 
		}
		catch (exc)
		{
			// Debug
			if (AMFXTrace.DBG_REP)
				AMFXTrace.sysout("reps.class.propIterator.error", exc);
		}
			
		props.push({
			object: "more...", //xxxHonza localization
			tag: FirebugReps.Caption.tag,
			name: "",
			equal:"",
			delim:""
		});
			
		return props;
	},

	className: "object",

	supportsObject: function(object, type)
	{
		return (object instanceof AMFExplorerAMFLib.Class && object.__className__)
	}
	
});

this.ArrayClass = domplate(Firebug.Rep,
{
	tag:
		OBJECTLINK(
			SPAN({"class": "objectTitle"}, "$object|getTitle "),
			SPAN({"class": "objectLeftBrace", role: "presentation"}, "{"),
			FOR("prop", "$object|propIterator",
				" $prop.name",
				SPAN({"class": "objectEqual", role: "presentation"}, "$prop.equal"),
				TAG("$prop.tag", {object: "$prop.object"}),
				SPAN({"class": "objectComma", role: "presentation"}, "$prop.delim")
			),
			SPAN({"class": "objectRightBrace"}, "}")
		),

	titleTag:
		SPAN({"class": "objectTitle"}, "$object|getTitle"),

	propIterator: function (object)
	{
		if (!object)
			return [];

		try 
		{
			var props = [];
			var value = object["__className__"];	   

			var t = typeof(value);

			// Debug
			if (AMFXTrace.DBG_REP)
				AMFXTrace.sysout("reps.class.propIterator", {type: t, value: value});

			if (t == "boolean" || t == "number" || (t == "string" && value)
				|| (t == "object" && value && value.toString))
			{
				var rep = Firebug.AMFExplorer.getRep(value);
				var tag = rep.shortTag || rep.tag;
				if (t == "object")
				{
					value = rep.getTitle(value);
					tag = rep.titleTag;
				}
				props.push({tag: tag, name: "className", object: value, equal: "=", delim: ", "});			
			} 
		}
		catch (exc)
		{
			// Debug
			if (AMFXTrace.DBG_REP)
				AMFXTrace.sysout("reps.class.propIterator.error", exc);
		}

		props.push({
			object: "more...", //xxxHonza localization
			tag: FirebugReps.Caption.tag,
			name: "",
			equal:"",
			delim:""
		});

		return props;
	},

	className: "object",

	supportsObject: function(object, type)
	{
		return (object instanceof AMFExplorerAMFLib.ArrayClass && object.__className__)
	},
	
	getTitle: function(object, context)
	{
		return "Object";
	}
	
});

this.Date = domplate(Firebug.Rep,
{
	tag: OBJECTBOX("$object|getTitle"),

	className: "object",

	supportsObject: function(object, type)
	{
		return (object instanceof Date);
	},
	
	getTitle: function(object, context)
	{
		return object.toString();
	}
});

Firebug.AMFExplorer.registerRep(	   
		FirebugReps.nsIDOMHistory, // make FirebugReps.early to avoid exceptions
		FirebugReps.Undefined,
		FirebugReps.Null,
		this.Date,
		FirebugReps.Number,
		FirebugReps.RegExp,
		FirebugReps.String,
		FirebugReps.Window,
		FirebugReps.ApplicationCache, // must come before Arr (array) else exceptions.
		FirebugReps.ErrorMessage,
		FirebugReps.Element,
		FirebugReps.TextNode,
		FirebugReps.Document,
		FirebugReps.StyleSheet,
		FirebugReps.Event,
		FirebugReps.SourceLink,
		FirebugReps.SourceFile,
		FirebugReps.StackTrace,
		FirebugReps.StackFrame,
		FirebugReps.jsdStackFrame,
		FirebugReps.jsdScript,
		FirebugReps.NetFile,
		FirebugReps.Property,
		FirebugReps.Except,		
		this.Class,
		this.ArrayClass,
		FirebugReps.XML,
		FirebugReps.Arr
	);

Firebug.AMFExplorer.setDefaultReps(FirebugReps.Func, FirebugReps.Obj);

}});
