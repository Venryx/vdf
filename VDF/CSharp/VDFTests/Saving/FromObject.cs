﻿using System;
using System.Collections;
using System.Collections.Generic;
using FluentAssertions;
using VDFN;
using Xunit;

namespace VDFTests {
	public class Saving_FromObject {
		// from object
		// ==========

		[Fact] void D0_Null() { VDF.Serialize(null).Should().Be("null"); }
		[Fact] void D0_EmptyString() { VDF.Serialize("").Should().Be("\"\""); }

		[VDFType("")] class D1_IgnoreDefaultValues_Class {
			[D] bool bool1;
			[D(true)] bool bool2 = true;
			bool bool3 = true;
			[D] string string1;
			[D("value1")] string string2 = "value1";
			string string3 = "value1";
		}
		[Fact] void D1_IgnoreDefaultValues() { VDF.Serialize<D1_IgnoreDefaultValues_Class>(new D1_IgnoreDefaultValues_Class()).Should().Be("{bool3:true string3:\"value1\"}"); }
		class D1_NullValues_Class {
			[P] public object obj;
			[P] public List<string> strings;
			[P] public List<string> strings2 = new List<string>();
		}
		[Fact] void D1_NullValues() {
			var a = VDFSaver.ToVDFNode(new D1_NullValues_Class());
			a["obj"].metadata.Should().Be(null);
			a["obj"].primitiveValue.Should().Be(null);
			a["strings"].metadata.Should().Be(null);
			a["strings"].primitiveValue.Should().Be(null);
			//a["strings2"].metadata.Should().Be(null); // unmarked type
			a["strings2"].metadata.Should().Be(null); // old: auto-marked as list (needed, to specify sort of type, as required)
			a["strings2"].primitiveValue.Should().Be(null); // it's a List, so it shouldn't have a base-value
			a["strings2"].listChildren.Count.Should().Be(0);
			a.ToVDF().Should().Be("D1_NullValues_Class>{obj:null strings:null strings2:[]}");
		}
		class TypeWithList_PopOutItemData {
			[P(popOutL2: true)] List<string> list = new List<string> {"A", "B"};
		}
		[Fact] void D1_ListItems_PoppedOutChildren() {
			var a = VDFSaver.ToVDFNode<TypeWithList_PopOutItemData>(new TypeWithList_PopOutItemData());
			a.ToVDF().Should().Be(@"{list:[^]}
	""A""
	""B""".Replace("\r", ""));
		}
		[Fact] void D1_ListItems_Null() {
			var a = VDFSaver.ToVDFNode(new List<string> {null});
			a[0].metadata.Should().Be(null);
			a[0].primitiveValue.Should().Be(null);
			a.ToVDF().Should().Be("List(string)>[null]");
		}
		[Fact] void D1_SingleListItemWithAssemblyKnownTypeShouldStillSpecifySortOfType() {
			var a = VDFSaver.ToVDFNode<List<string>>(new List<string> {"hi"});
			a.ToVDF().Should().Be("[\"hi\"]");
		}
		[Fact] void D1_StringAndArraysInArray() { VDF.Serialize(new List<object> {"text", new List<string> {"a", "b"}}).Should().Be("[\"text\" List(string)>[\"a\" \"b\"]]"); }
		// probably todo: add support for this sort of thing (non-string map keys, that are serialized as strings, but declare their type inline) later
		/*class D1_MapWithNonStringKeys_Null_Class
		{
			[VDFSerialize] VDFNode Serialize() { return "ClassSerializedToString"; }
		}
        [Fact] void D1_MapWithNonStringKeys_Null()
		{
			var dictionary = new Dictionary<object, string>();
			dictionary.Add(new D1_MapWithNonStringKeys_Null_Class(), null);
			var a = VDFSaver.ToVDFNode(dictionary);
			a.mapChildren.ContainsKey()
			a.ToVDF().Should().Be("Dictionary(object string)>{D1_MapWithNonStringKeys_Null_Class>\"ClassSerializedToString\":null}");
		}*/
		[Fact] void D1_DictionaryValues_Null() {
			var dictionary = new Dictionary<string, string>();
			dictionary.Add("key1", null);
			var a = VDFSaver.ToVDFNode(dictionary);
			a["key1"].metadata.Should().Be(null);
			a["key1"].primitiveValue.Should().Be(null);
			a.ToVDF().Should().Be("Dictionary(string string)>{key1:null}");
		}
		[Fact] void TypeW() {
			var a = VDFSaver.ToVDFNode(new {Bool = false, Int = 5, Double = .5, String = "Prop value string."}, new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a["Bool"].primitiveValue.Should().Be(false);
			a["Int"].primitiveValue.Should().Be(5);
			a["Double"].primitiveValue.Should().Be(.5);
			a["String"].primitiveValue.Should().Be("Prop value string.");
			a.ToVDF().Should().Be("{Bool:false Int:5 Double:.5 String:\"Prop value string.\"}");
		}
		[Fact] void D1_AnonymousTypeProperties_MarkAllTypes() {
			var a = VDFSaver.ToVDFNode(new {Bool = false, Int = 5, Double = .5, String = "Prop value string."}, new VDFSaveOptions(typeMarking: VDFTypeMarking.External));
			a.ToVDF().Should().Be("{Bool:false Int:5 Double:.5 String:\"Prop value string.\"}");
		}
		class D1_PreSerialize_Class {
			[P] bool preSerializeWasCalled;
			[VDFPreSerialize] void VDFPreSerialize() { preSerializeWasCalled = true; }
		}
		[Fact] void D1_PreSerialize() {
			var a = VDFSaver.ToVDFNode<D1_PreSerialize_Class>(new D1_PreSerialize_Class());
			((bool)a["preSerializeWasCalled"]).Should().Be(true);
			a.ToVDF().Should().Be("{preSerializeWasCalled:true}");
		}
		class D1_SerializePropMethod_Class {
			[VDFSerializeProp] VDFNode SerializeProp(VDFNodePath propPath, VDFSaveOptions options) { return new VDFNode(1); }
			[P] object prop1 = 0;
		}
		[Fact] void D1_SerializePropMethod() {
			var a = VDF.Serialize<D1_SerializePropMethod_Class>(new D1_SerializePropMethod_Class());
			a.Should().Be("{prop1:1}");
		}
		class TypeWithPostSerializeCleanupMethod {
			[P] bool postSerializeWasCalled;
			[VDFPostSerialize] void VDFPostSerialize() { postSerializeWasCalled = true; }
		}
		[Fact] void D1_PostSerializeCleanup() {
			var a = VDFSaver.ToVDFNode<TypeWithPostSerializeCleanupMethod>(new TypeWithPostSerializeCleanupMethod());
			((bool)a["postSerializeWasCalled"]).Should().Be(false); // should be false for VDFNode, since serialization happened before method-call
			a.ToVDF().Should().Be("{postSerializeWasCalled:false}");
		}
		class TypeWithMixOfProps {
			[P] bool Bool = true;
			[P] int Int = 5;
			[P] double Double = .5;
			[P] string String = "Prop value string.";
			[P] List<string> list = new List<string> {"2A", "2B"};
			[P] List<List<string>> nestedList = new List<List<string>> {new List<string> {"1A"}};
		}
		[Fact] void D1_TypeProperties_MarkForNone() {
			var a = VDFSaver.ToVDFNode(new TypeWithMixOfProps(), new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a["Bool"].primitiveValue.Should().Be(true);
			a["Int"].primitiveValue.Should().Be(5);
			a["Double"].primitiveValue.Should().Be(.5);
			a["String"].primitiveValue.Should().Be("Prop value string.");
			a["list"][0].primitiveValue.Should().Be("2A");
			a["list"][1].primitiveValue.Should().Be("2B");
			a["nestedList"][0][0].primitiveValue.Should().Be("1A");
			a.ToVDF().Should().Be("{Bool:true Int:5 Double:.5 String:\"Prop value string.\" list:[\"2A\" \"2B\"] nestedList:[[\"1A\"]]}");
		}
		[Fact] void D1_TypeProperties_MarkForInternal() {
			var a = VDFSaver.ToVDFNode(new TypeWithMixOfProps(), new VDFSaveOptions(typeMarking: VDFTypeMarking.Internal));
			a.ToVDF().Should().Be("TypeWithMixOfProps>{Bool:true Int:5 Double:.5 String:\"Prop value string.\" list:[\"2A\" \"2B\"] nestedList:[[\"1A\"]]}");
		}
		[Fact] void D1_TypeProperties_MarkForExternal() {
			var a = VDFSaver.ToVDFNode(new TypeWithMixOfProps(), new VDFSaveOptions(typeMarking: VDFTypeMarking.External));
			a.ToVDF().Should().Be("TypeWithMixOfProps>{Bool:true Int:5 Double:.5 String:\"Prop value string.\" list:List(string)>[\"2A\" \"2B\"] nestedList:List(List(string))>[[\"1A\"]]}");
		}
		[Fact] void D1_TypeProperties_MarkForExternalNoCollapse() {
			var a = VDFSaver.ToVDFNode(new TypeWithMixOfProps(), new VDFSaveOptions(typeMarking: VDFTypeMarking.ExternalNoCollapse));
			a.ToVDF().Should().Be("TypeWithMixOfProps>{Bool:bool>true Int:int>5 Double:double>.5 String:string>\"Prop value string.\" list:List(string)>[string>\"2A\" string>\"2B\"] nestedList:List(List(string))>[List(string)>[string>\"1A\"]]}");
		}

		class D1_Object_DictionaryPoppedOutThenBool_Class1 {
			[P(popOutL2: true)] Dictionary<string, string> messages = new Dictionary<string, string> {
				{"title1", "message1"},
				{"title2", "message2"}
			};
			[P] bool otherProperty = true;
		}
		[Fact] void D1_DictionaryPoppedOutThenBool() {
			var a = VDFSaver.ToVDFNode(new D1_Object_DictionaryPoppedOutThenBool_Class1(), new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a.ToVDF().Should().Be(@"{messages:{^} otherProperty:true}
	title1:""message1""
	title2:""message2""".Replace("\r", ""));
		}
		[VDFType(popOutL1: true)] class D1_Map_PoppedOutDictionary_PoppedOutPairs_Class {
			[P(popOutL2: true)] Dictionary<string, string> messages = new Dictionary<string, string> {
				{"title1", "message1"},
				{"title2", "message2"}
			};
			[P] bool otherProperty = true;
		}
		[Fact] void D1_Map_PoppedOutDictionary_PoppedOutPairs() {
			var a = VDFSaver.ToVDFNode(new D1_Map_PoppedOutDictionary_PoppedOutPairs_Class(), new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a.ToVDF().Should().Be(@"{^}
	messages:{^}
		title1:""message1""
		title2:""message2""
	otherProperty:true".Replace("\r", ""));
		}

		class T1_Depth1 {
			[P] T1_Depth2 level2 = new T1_Depth2();
		}
		class T1_Depth2 {
			[P(popOutL2: true)] List<string> messages = new List<string> {"DeepString1_Line1\n\tDeepString1_Line2", "DeepString2"};
			[P] bool otherProperty = true;
		}
		[Fact] void D2_Map_ListThenBool_PoppedOutStringsWithOneMultiline() {
			var a = VDFSaver.ToVDFNode(new T1_Depth1(), new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a.ToVDF().Should().Be(@"{level2:{messages:[^] otherProperty:true}}
	""<<DeepString1_Line1
	DeepString1_Line2>>""
	""DeepString2""".Replace("\r", ""));
		}

		class Level1 {
			[P] public Level2 level2 = new Level2();
		}
		class Level2 {
			[P] Level3 level3_first = new Level3();
			[P] public Level3 level3_second = new Level3();
		}
		class Level3 {
			[P(popOutL2: true)] public List<string> messages = new List<string> {"DeepString1", "DeepString2"};
		}
		[Fact] void D3_Map_Map_Maps_Lists_PoppedOutStrings() {
			var a = VDFSaver.ToVDFNode(new Level1(), new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a.ToVDF().Should().Be(@"{level2:{level3_first:{messages:[^]} level3_second:{messages:[^]}}}
	""DeepString1""
	""DeepString2""
	^""DeepString1""
	""DeepString2""".Replace("\r", ""));
		}
		[Fact] void D3_Map_Map_Maps_ListsWithOneEmpty_PoppedOutStrings() {
			var obj = new Level1();
			obj.level2.level3_second.messages.Clear();
			var a = VDFSaver.ToVDFNode(obj, new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a.ToVDF().Should().Be(@"{level2:{level3_first:{messages:[^]} level3_second:{messages:[]}}}
	""DeepString1""
	""DeepString2""".Replace("\r", ""));
		}

		class T4_Depth1 {
			[P] T4_Depth2 level2 = new T4_Depth2();
		}
		class T4_Depth2 {
			[P] T4_Depth3 level3_first = new T4_Depth3();
			[P] T4_Depth3 level3_second = new T4_Depth3();
		}
		class T4_Depth3 {
			[P(popOutL2: true)] List<T4_Depth4> level4s = new List<T4_Depth4> {new T4_Depth4(), new T4_Depth4()};
		}
		class T4_Depth4 {
			[P(popOutL2: true)] List<string> messages = new List<string> {"text1", "text2"};
			[P] bool otherProperty = false;
		}
		[Fact] void D4_Map_Map_Maps_Lists_PoppedOutMaps_ListsThenBools_PoppedOutStrings() {
			var a = VDFSaver.ToVDFNode(new T4_Depth1(), new VDFSaveOptions(typeMarking: VDFTypeMarking.None));
			a.ToVDF().Should().Be(@"{level2:{level3_first:{level4s:[^]} level3_second:{level4s:[^]}}}
	{messages:[^] otherProperty:false}
		""text1""
		""text2""
	{messages:[^] otherProperty:false}
		""text1""
		""text2""
	^{messages:[^] otherProperty:false}
		""text1""
		""text2""
	{messages:[^] otherProperty:false}
		""text1""
		""text2""".Replace("\r", ""));
		}

		[VDFType(popOutL1: true)] class T5_Depth2 {
			[P] bool firstProperty = false;
			[P] bool otherProperty = false;
		}
		[Fact] void D4_List_Map_PoppedOutBools() {
			var a = VDFSaver.ToVDFNode(new List<T5_Depth2> {new T5_Depth2()}, new VDFSaveOptions(typeMarking: VDFTypeMarking.External));
			a.ToVDF().Should().Be(@"List(T5_Depth2)>[{^}]
	firstProperty:false
	otherProperty:false".Replace("\r", ""));
		}
	}
}