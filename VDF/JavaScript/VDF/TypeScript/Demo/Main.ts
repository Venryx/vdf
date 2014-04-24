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
	
	VDF.RegisterTypeExporter_Inline("Vector3", point => point.x + "," + point.y + "," + point.z);
	VDF.RegisterTypeImporter_Inline("Vector3", str =>
	{
		var parts: string[] = str.split(',');
		return new Vector3(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
	});
	VDF.RegisterTypeExporter_Inline("Guid", id=>""); //id.toString());
	VDF.RegisterTypeImporter_Inline("Guid", str=>new Guid()); //new Guid(str)

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
			var vdf = VDF.Serialize(testWorld, new VDFSaveOptions(null, VDFTypeMarking.Assembly));
			$("#outputA").val(vdf);
		});
		$("#makeOutputB_asWorld").click((event, ui) =>
		{
			// load from output-a textbox
			var vdf = decodeURIComponent($("#outputA").val()).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
			var testWorld = VDF.Deserialize(vdf, "World");

			// reserialize it, and save it to second file, to check data
			var vdf2 = VDF.Serialize(testWorld, new VDFSaveOptions(null, VDFTypeMarking.Assembly));
			$("#outputB").val(vdf2);
		});
		$("#makeOutputB_asObject").click((event, ui) =>
		{
			// load from output-a textbox
			var vdf = decodeURIComponent($("#outputA").val()).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
			var testObj = VDF.Deserialize(vdf, "object");
			
			// reserialize it, and save it to second file, to check data
			var vdf2 = VDF.Serialize(testObj, new VDFSaveOptions(null, VDFTypeMarking.Assembly));
			$("#outputB").val(vdf2);
		});
	});
}