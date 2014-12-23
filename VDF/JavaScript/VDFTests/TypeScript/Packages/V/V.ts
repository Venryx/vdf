﻿/// <reference path="../../../../VDF/TypeScript/VDF.ts"/>
/// <reference path="../../../../VDF/TypeScript/VDFLoader.ts"/>
/// <reference path="../../../../VDF/TypeScript/VDFNode.ts"/>
/// <reference path="../../../../VDF/TypeScript/VDFSaver.ts"/>
/// <reference path="../../../../VDF/TypeScript/VDFTokenParser.ts"/>
/// <reference path="../../../../VDF/TypeScript/VDFTypeInfo.ts"/>

var V = new function ()
{
    var self = this;

	/*function AddClosureFunctionsToX(newHolder)
	{
		var names = arguments.callee.caller.toString().matches(/function\s*([\w\d]+)\s*\(/g);
		for (var name in names.strings())
			try { newHolder[name] = eval(name); } catch(e) {}
	}
	AddClosureFunctionsToX(self);*/

	self.CloneObject = function(obj) { return $.extend({}, obj); }; //deep: JSON.parse(JSON.stringify(obj));
	self.CloneArray = function (array) { return Array.prototype.slice.call(array, 0); }; //array.slice(0); //deep: JSON.parse(JSON.stringify(array));

	//self.Multiline = function (functionWithInCommentMultiline) { return functionWithInCommentMultiline.toString().replace(/^[^\/]+\/\*!?/, '').replace(/\*\/[^\/]+$/, ''); };
	// example:
	// alert(V.Multiline(function()
	//{/*
	// Text that...
	// spans multiple...
	// lines.
	//*/}));
	//self.Multiline = function(functionWithInCommentMultiline) { return functionWithInCommentMultiline.toString().replace(/^[^\/]+\/\*/, '').replace(/\*\/(.|\n)*/, ''); };
	self.Multiline = function(functionWithInCommentMultiline)
	{
		var text = functionWithInCommentMultiline.toString().replace(/\r/g, "");
		var firstCharPos = text.indexOf("\n", text.indexOf("/*"));
		return text.substring(firstCharPos + 1, text.lastIndexOf("\n"));
	};

	self.ExtendWith = function(value) { $.extend(this, value); };

	self.timerStart = 0;
	self.StartTimer = function() { self.timerStart = new Date().getTime(); }
	self.StopTimerAndMarkTime = function() { console.log("Took (in ms): " + (new Date().getTime() - self.timerStart)); }
};

class VDebug
{
	static timerStart: number = 0;
	static StartTimer() { VDebug.timerStart = new Date().getTime(); }
	static StopTimerAndMarkTime(name?: string) { console.log("Time (in ms)" + (name ? " - " + name : "") + ": " + (new Date().getTime() - VDebug.timerStart)); }
	static sectionTotals: any = {};
	static waitTimerIDs: any = {};
	static StartSection() { VDebug.timerStart = new Date().getTime(); }
	static EndSection(name: string, waitTimeBeforeResults: number = 1000)
	{
		VDebug.sectionTotals[name] = (VDebug.sectionTotals[name] || 0) + (new Date().getTime() - VDebug.timerStart);
		var oldVal = VDebug.sectionTotals[name];
		clearTimeout(VDebug.waitTimerIDs[name]);
		VDebug.waitTimerIDs[name] = setTimeout(() =>
		{
			if (VDebug.sectionTotals[name] == oldVal)
				console.log("Time (in ms)" + (name ? " - " + name : "") + ": " + oldVal);
		}, waitTimeBeforeResults);
	}
}