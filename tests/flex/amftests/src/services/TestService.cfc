<cfcomponent>

	<cffunction name="testEcho" access="remote" returntype="any">
    	<cfargument name="input" type="any" required="true">
        
        <cfreturn arguments.input />
    	
    </cffunction>
    
    <cffunction name="testArrayCollection" access="remote" returntype="any">
    	<cfargument name="input" type="numeric" required="true">
    	
    	<cfset var i = "" />
    	<cfset var result = [] />
    	<cfset var obj = "" />
        
		<cfloop from="1" to="#input#" index="i">
		
			<cfset obj = CreateObject("component","amfexplorer.services.vo.TestVO") />
			<cfset obj.id = i />
			<cfset obj.name = "Item #i#" />
			
			<cfset ArrayAppend(result,obj) />
		
		</cfloop>
		
		<cfset ac = CreateObject("java","flex.messaging.io.ArrayCollection").init() />
		<cfset ac.setSource(result) />
		
		<cfreturn ac />
    	
    </cffunction>

</cfcomponent>