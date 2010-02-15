<cfcomponent>

	<cffunction name="testEcho" access="remote" returntype="any">
    	<cfargument name="input" type="any" required="true">
        
        <cfreturn arguments.input />
    	
    </cffunction>

</cfcomponent>