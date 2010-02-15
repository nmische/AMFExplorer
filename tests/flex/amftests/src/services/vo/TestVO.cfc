<cfcomponent displayname="TestVO" output="false">
	
	<cfproperty name="id" type="numeric" default="0"/>
	<cfproperty name="name" type="string" default="" />
	
	<cfscript>
		this.id=0;
		this.name="";
	</cfscript>

</cfcomponent>