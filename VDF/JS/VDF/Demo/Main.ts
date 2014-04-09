﻿module Main
{
	// methods
	// ==================

	function GetUrlVars(url)
	{
		if (!url.contains('?'))
			return { length: 0 };

		var vars = {};

		var urlVarStr = url.contains("?") ? url.slice(url.indexOf('?') + 1).split("#")[0] : "";
		var parts = urlVarStr.split("&");
		for (var i = 0; i < parts.length; i++)
			vars[parts[i].substring(0, parts[i].indexOf("="))] = parts[i].substring(parts[i].indexOf("=") + 1);

		return vars;
	}

	// startup
	// ==================
	
	$(() =>
	{
		var urlVars:any = GetUrlVars(window.location.href);
		if (urlVars.activeTab != null)
			$($("#tabs").children("div").children()[urlVars.activeTab]).addClass("active");
		else
			$($("#tabs").children("div").children()[0]).addClass("active");
		$("#tabs").VTabView();

		$("#makeOutputA").click((event, ui) =>
		{
			var testWorld = Test1.CreateWorld();

			// serialize it, and save it to file
			var vdf:string = VDF.Serialize(testWorld, new VDFSaveOptions()); //, null, null, namespaceAliasesByName, typeAliasesByType, true));
			$("#outputA").html(vdf);
		});
		$("#makeOutputB").click((event, ui) =>
		{
		});
	});
}

class StringBuilder
{
	public data: Array<string> = [];
	public counter: number = 0;
	Append(str) { this.data[this.counter++] = str; return this; } // adds string str to the StringBuilder
	Remove(i, j) { this.data.splice(i, j || 1); return this; } // removes j elements starting at i, or 1 if j is omitted
	Insert(i, str) { this.data.splice(i, 0, str); return this; } // inserts string str at i
	ToString(joinerString?) { return this.data.join(joinerString || ""); } // builds the string
}