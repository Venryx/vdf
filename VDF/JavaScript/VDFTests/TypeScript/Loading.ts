﻿interface Object { Should(): { obj: any; Be(value, message?: string); BeExactly(value, message?: string); } }
/*window["oldTest"] = test;
window["test"] = (title: string, testFunc: ()=> any) => // overwrite/wrap actual test func
{
	Loading.Init();
	window["oldTest"](title, testFunc);
}*/
class TypeWithPostDeserializeMethod
{
	static typeInfo: VDFTypeInfo = new VDFTypeInfo(false, false,
	{
		flag: new VDFPropInfo("bool")
	});
	flag = false;
	VDFPostDeserialize(): void { this.flag = true; }
}
class TypeInstantiatedManuallyThenFilled
{
	static typeInfo: VDFTypeInfo = new VDFTypeInfo(false, false,
	{
		flag: new VDFPropInfo("bool")
	});
	flag: boolean;
}
class ToObject_Level1_Object_PoppedOutDictionaryPoppedOutThenPoppedOutBool_Class1
{
	static typeInfo: VDFTypeInfo = new VDFTypeInfo(false, false,
	{
		messages: new VDFPropInfo("Dictionary[string,string]"),
		otherProperty: new VDFPropInfo("bool")
	});

	messages = new Dictionary<string, string>();
	otherProperty: boolean;
}

class TypeWithPostDeserializeMethod_CustomMessageRequired
{
	static typeInfo: VDFTypeInfo = new VDFTypeInfo(false, false,
	{
		flag: new VDFPropInfo("bool", true)
	});
	flag = false;
	VDFPostDeserialize(message: any): void { if (message == "RequiredMessage") this.flag = true; }
}

class Loading
{
	static RunTests()
	{
		// to VDFNode
		// ==========

		test("ToVDFNode_Level0_Comment", ()=>
		{
			var a = VDFLoader.ToVDFNode("// comment\n\
			Root string.");
			a.baseValue.Should().Be("			Root string.");
		});
		test("ToVDFNode_Level0_BaseValue", ()=>
		{
			var a = VDFLoader.ToVDFNode("Root string.");
			a.baseValue.Should().Be("Root string."); // note; remember that for ambiguous cases like this, the base-like-value is added both as the obj's base-value and as its solitary item
		});
		test("ToVDFNode_Level0_BaseValue_SaveThenLoad", ()=>
		{
			var vdf = VDF.Serialize("Root string.");
			var a = VDFLoader.ToVDFNode(vdf);
			a.baseValue.Should().Be("Root string.");
			a.items.length.Should().Be(0); // it should assume it's a base-value, unless indicated otherwise
			a.ToVDF().Should().Be("Root string.");
		});
		test("ToVDFNode_Level0_BaseValue_Literal", ()=>
		{
			var a = VDFLoader.ToVDFNode("@@Base-value string that {needs escaping}.@@");
			a.baseValue.Should().Be("Base-value string that {needs escaping}.");
		});
		test("ToVDFNode_Level0_Metadata_Type", ()=>
		{
			var a = VDFLoader.ToVDFNode("string>Root string.");
			a.metadata_type.Should().Be("string");
		});
		test("ToVDFNode_Level0_Array", ()=>
		{
			var a = VDFLoader.ToVDFNode("Root string 1.|Root string 2.");
			a[0].baseValue.Should().Be("Root string 1.");
			a[1].baseValue.Should().Be("Root string 2.");
		});
		test("ToVDFNode_Level0_Array_ExplicitStartAndEndMarkers", ()=>
		{
			var a = VDFLoader.ToVDFNode("{Root string 1.}|{Root string 2.}", "List[object]");
			a[0].baseValue.Should().Be("Root string 1.");
			a[1].baseValue.Should().Be("Root string 2.");
		});
		test("ToVDFNode_Level0_Array_Objects", ()=>
		{
			var a = VDFLoader.ToVDFNode("name{Dan}age{50}|name{Bob}age{60}", "List[object]");
			a[0]["name"].AsString.Should().Be("Dan");
			a[0]["age"].AsInt.Should().Be(50);
			a[1]["name"].AsString.Should().Be("Bob");
			a[1]["age"].AsInt.Should().Be(60);
		});
		test("ToVDFNode_Level0_Array_Literals", ()=>
		{
			var a = VDFLoader.ToVDFNode("first|@@second\n\
which is on two lines@@|@@third\n\
which is on\n\
three lines@@", "List[string]");
			a[0].AsString.Should().Be("first");
			a[1].AsString.Should().Be("second\n\
which is on two lines");
			a[2].AsString.Should().Be("third\n\
which is on\n\
three lines");
		});
		test("ToVDFNode_Level0_Array_Empty", ()=>
		{
			var a = VDFLoader.ToVDFNode("|", "List[object]");
			ok(a[0].baseValue == null);
			ok(a[1].baseValue == null);
		});
		test("ToVDFNode_Level0_Array_None", ()=>
		{
			var a = VDFLoader.ToVDFNode("", "List[object]");
			a.items.length.Should().Be(0);
			a = VDFLoader.ToVDFNode(">>");
			a.items.length.Should().Be(0);
		});
		test("ToVDFNode_Level0_ArrayMetadata1", ()=>
		{
			var a = VDFLoader.ToVDFNode("SpecialList[int]>>1|2");
			a.metadata_type.Should().Be("SpecialList[int]");
			ok(a[0].metadata_type == null);
			ok(a[1].metadata_type == null);
		});
		test("ToVDFNode_Level0_ArrayMetadata2", ()=>
		{
			var a = VDFLoader.ToVDFNode("SpecialList[int]>>int>1|int>2");
			a.metadata_type.Should().Be("SpecialList[int]");
			a[0].metadata_type.Should().Be("int");
			a[1].metadata_type.Should().Be("int");
		});
		test("ToVDFNode_Level0_DictionaryItems", ()=>
		{
			var a = VDFLoader.ToVDFNode("key1{Simple string.}key2{name{Dan}age{50}}");
			a["key1"].baseValue.Should().Be("Simple string.");
			a["key2"]["age"].AsFloat.Should().Be(50);
		});
		test("ToVDFNode_Level0_DictionaryItems_GetByKey", ()=>
		{
			var a = VDFLoader.ToVDFNode("key 1{value 1}key 2{value 2}");
			a["key 1"].baseValue.Should().Be("value 1");
			a["key 2"].baseValue.Should().Be("value 2");
		});
		test("ToVDFNode_Level0_InferDepth2", ()=>
		{
			var a = VDF.Deserialize(">>>false", "List[object]");
			a[0].Should().Be(false);
		});
		test("ToVDFNode_Level0_InferUnmarkedTypeToBeString", ()=>
		{
			var a = VDF.Deserialize(">>SimpleString", "IList");
			a[0].Should().Be("SimpleString");
		});
		test("ToVDFNode_Level0_KeepDeclaredType", ()=>
		{
			var a = VDF.Deserialize(">>SimpleString", "List[object]");
			a[0].GetType().Should().Be(typeof(object));
		});
		test("ToVDFNode_Level0_MultilineString", ()=>
		{
			var a = VDFLoader.ToVDFNode("@@This is a\nmultiline string\nof three lines in total.@@");
			a.baseValue.Should().Be("This is a\nmultiline string\nof three lines in total.");
		});

		test("ToVDFNode_Level1_BaseValuesWithExplicitCasting", ()=>
		{
			var a = VDFLoader.ToVDFNode("bool{false}int{5}float{.5}string{Prop value string.}");
			a["bool"].baseValue.Should().Be("false");
			a["int"].baseValue.Should().Be("5");
			a["float"].baseValue.Should().Be(".5");
			a["string"].baseValue.Should().Be("Prop value string.");

			a["bool"].AsBool.Should().Be(false);
			a["int"].AsInt.Should().Be(5);
			a["float"].AsFloat.Should().Be(.5);
			a["string"].AsString.Should().Be("Prop value string.");
		});
		test("ToVDFNode_Level1_BaseValuesWithMarkedTypes", ()=>
		{
			var a = VDFLoader.ToVDFNode("bool{bool>false}int{int>5}float{float>.5}string{string>Prop value string.}");
			a["bool"].AsBool.Should().Be(false);
			a["int"].AsInt.Should().Be(5);
			a["float"].AsFloat.Should().Be(.5);
			a["string"].AsString.Should().Be("Prop value string.");
		});
		test("ToVDFNode_Level1_Literal", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@}");
			a["string"].baseValue.Should().Be("Prop value string that {needs escaping}.");
		});
		test("ToVDFNode_Level1_TroublesomeLiteral1", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@@|@@}");
			a["string"].baseValue.Should().Be("Prop value string that {needs escaping}.@@");
		});
		test("ToVDFNode_Level1_TroublesomeLiteral2", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@||@@}");
			a["string"].baseValue.Should().Be("Prop value string that {needs escaping}.@@|");
		});
		test("ToVDFNode_Level1_VDFWithVDFWithVDF", ()=>
		{
			var a = VDFLoader.ToVDFNode("level1{@@level2{@@@level3{Base string.}@@@}@@}");
			a["level1"].baseValue.Should().Be("level2{@@level3{Base string.}@@}");
			VDFLoader.ToVDFNode(a["level1"].baseValue)["level2"].baseValue.Should().Be("level3{Base string.}");
			VDFLoader.ToVDFNode(VDFLoader.ToVDFNode(a["level1"].baseValue)["level2"].baseValue)["level3"].baseValue.Should().Be("Base string.");
		});
		test("ToVDFNode_Level1_ArraysInArrays", ()=>
		{
			var a = VDFLoader.ToVDFNode("{1A|1B}|{2A|2B}|{3A}");
			a[0][0].baseValue.Should().Be("1A");
			a[0][1].baseValue.Should().Be("1B");
			a[1][0].baseValue.Should().Be("2A");
			a[1][1].baseValue.Should().Be("2B");
			a[2].baseValue.Should().Be("3A");
		});
		test("ToVDFNode_Level1_ArraysInArrays_SecondsEmpty", ()=>
		{
			var a = VDFLoader.ToVDFNode("{1A|}|{2A|}");
			a[0][0].baseValue.Should().Be("1A");
			ok(a[0][1].baseValue == null);
			a[1][0].baseValue.Should().Be("2A");
			ok(a[1][1].baseValue == null);
		});
		test("ToVDFNode_Level1_ArraysInArrays_FirstsAndSecondsEmpty", ()=>
		{
			var a = VDFLoader.ToVDFNode("{|}|{|}");
			ok(a[0][0].baseValue == null);
			ok(a[0][1].baseValue == null);
			ok(a[1][0].baseValue == null);
			ok(a[1][1].baseValue == null);
		});
		test("ToVDFNode_Level1_Dictionary", ()=>
		{
			var a = VDFLoader.ToVDFNode("key1{value1}key2{value2}");
			a["key1"].baseValue.Should().Be("value1");
			a["key2"].baseValue.Should().Be("value2");
		});
		test("ToVDFNode_Level1_Dictionary_Complex", ()=>
		{
			var a = VDFLoader.ToVDFNode("uiPrefs{toolOptions{@@Select{}TerrainShape{showPreview{true}continuousMode{true}strength{.3}size{7}}TerrainTexture{textureName{>null}size{7}}@@}liveTool{Select}}");
			a["uiPrefs"]["toolOptions"].baseValue.Should().Be("Select{}TerrainShape{showPreview{true}continuousMode{true}strength{.3}size{7}}TerrainTexture{textureName{>null}size{7}}");
			a["uiPrefs"]["liveTool"].baseValue.Should().Be("Select");
		});
		test("ToVDFNode_Level1_Dictionary_TypesInferredFromGenerics", ()=>
		{
			var a = VDFLoader.ToVDFNode("vertexColors{Dictionary[string,Color]>>9,4,2.5{Black}1,8,9.5435{Gray}25,15,5{White}}");
			a["vertexColors"]["9,4,2.5"].baseValue.Should().Be("Black");
			a["vertexColors"]["1,8,9.5435"].baseValue.Should().Be("Gray");
			a["vertexColors"]["25,15,5"].baseValue.Should().Be("White");
		});

		// note: if only one item (when parsed as List), assume by default obj is an object; if more than one, assume by default obj is a List or Dictionary
		test("ToVDFNode_Level1_ArrayPoppedOut", ()=>
		{
			var a = VDFLoader.ToVDFNode("names:\n\
	Dan\n\
	Bob");
			a["names"][0].baseValue.Should().Be("Dan");
			a["names"][1].baseValue.Should().Be("Bob");
		});
		test("ToVDFNode_Level1_ArraysPoppedOut", ()=> // each 'group' is actually just the value-data of one of the parent's properties
		{
			var a = VDFLoader.ToVDFNode("names:\n\
	Dan\n\
	Bob\n\
^ages:\n\
	10\n\
	20");
			a["names"][0].baseValue.Should().Be("Dan");
			a["names"][1].baseValue.Should().Be("Bob");
			a["ages"][0].baseValue.Should().Be("10");
			a["ages"][1].baseValue.Should().Be("20");
		});
		test("ToVDFNode_Level1_InferredDictionaryPoppedOut", ()=>
		{
			var a = VDFLoader.ToVDFNode("messages:\n\
	title1{message1}\n\
	title2{message2}\n\
^otherProperty{false}");
			a["messages"].properties.Count.Should().Be(2);
			a["messages"]["title1"].baseValue.Should().Be("message1");
			a["messages"]["title2"].baseValue.Should().Be("message2");
			a["otherProperty"].baseValue.Should().Be("false");
		});
		test("ToVDFNode_Level1_DictionaryPoppedOut", ()=>
		{
/*
Written As:

messages:,>>
	title1{message1}
	title2{message2}
^otherProperty{false}

Parsed As:

messages:{,>>
	title1{message1}
	title2{message2}
}^otherProperty{false}
 */
			var a = VDFLoader.ToVDFNode("messages:,>>\n\
	title1{message1}\n\
	title2{message2}\n\
^otherProperty{false}");
			a["messages"].properties.Count.Should().Be(2);
			a["messages"]["title1"].baseValue.Should().Be("message1");
			a["messages"]["title2"].baseValue.Should().Be("message2");
			a["otherProperty"].baseValue.Should().Be("false");
		});

		test("ToVDFNode_Level1_MultilineStringThenProperty", ()=>
		{
			var a = VDFLoader.ToVDFNode("text{@@This is a\n\
multiline string\n\
of three lines in total.@@}bool{>true}");
			a["text"].baseValue.Should().Be("This is a\nmultiline string\nof three lines in total.");
			a["bool"].AsBool.Should().Be(true);
		});
		test("ToVDFNode_Level1_ArrayPoppedOutThenMultilineString", ()=>
		{
			var a = VDFLoader.ToVDFNode("childTexts:\n\
	text1\n\
	text2\n\
^text{@@This is a\n\
	multiline string\n\
	of three lines in total.@@}");
			a["childTexts"][0].baseValue.Should().Be("text1");
			a["childTexts"][1].baseValue.Should().Be("text2");
			a["text"].baseValue.Should().Be("This is a\n	multiline string\n	of three lines in total.");
		});

		test("ToVDFNode_Level5_DeepNestedPoppedOutData", ()=>
		{
			var vdf = "name{Main}worlds{string,object>>Test1{vObjectRoot{name{VObjectRoot}children:>>\n\
	id{System.Guid>025f28a5-a14b-446d-b324-2d274a476a63}name{#Types}children{}\n\
}}Test2{vObjectRoot{name{VObjectRoot}children:>>\n\
	id{System.Guid>08e84f18-aecf-4b80-9c3f-ae0697d9033a}name{#Types}children{}\n\
}}}";
			var livePackNode = VDFLoader.ToVDFNode(vdf);
			livePackNode["worlds"]["Test1"]["vObjectRoot"]["children"][0]["id"].baseValue.Should().Be("025f28a5-a14b-446d-b324-2d274a476a63");
			livePackNode["worlds"]["Test2"]["vObjectRoot"]["children"][0]["id"].baseValue.Should().Be("08e84f18-aecf-4b80-9c3f-ae0697d9033a");
		});

		// to object
		// ==================

		test("ToObject_Level0_Null", ()=>{ VDF.Deserialize(">null").Should().Be(null); });
		test("ToObject_Level0_Nothing", ()=>{ VDF.Deserialize("").Should().Be(null); });
		test("ToObject_Level0_Nothing_TypeSpecified", ()=>{ VDF.Deserialize("string>").Should().Be(null); });
		test("ToObject_Level0_EmptyString", ()=>{ VDF.Deserialize(">empty").Should().Be(""); });
		test("ToObject_Level0_Bool", ()=>{ VDF.Deserialize("true", "bool").Should().Be(true); });
		test("ToObject_Level0_Float", ()=>{ VDF.Deserialize("1.5", "float").Should().Be(1.5); });

		test("ToObject_Level1_EmptyStringInList", ()=>{ VDF.Deserialize("text1|", "List[string]")[1].Should().Be(null); });
		test("ToObject_Level1_PostDeserializeMethod", ()=>
		{
			var a = VDF.Deserialize("", "TypeWithPostDeserializeMethod");
			a.flag.Should().Be(true);
		});
		test("ToObject_Level1_PostDeserializeMethod_CustomMessageRequired", ()=>{ VDF.Deserialize("", "TypeWithPostDeserializeMethod_CustomMessageRequired", new VDFLoadOptions("WrongMessage")).flag.Should().Be(false); });
		test("ToObject_Level1_InstantiateTypeManuallyThenFill", ()=>
		{
			var a = new TypeInstantiatedManuallyThenFilled();
			VDF.DeserializeInto("flag{true}", a);
			a.flag.Should().Be(true);
		});
		test("ToObject_Level1_Object_PoppedOutDictionaryPoppedOutThenPoppedOutBool", ()=>
		{
			var a = VDF.Deserialize("\n\
	messages:\n\
		title1{message1}\n\
		title2{message2}\n\
	otherProperty{true}", "ToObject_Level1_Object_PoppedOutDictionaryPoppedOutThenPoppedOutBool_Class1");
			a.messages.Count.Should().Be(2);
			a.messages["title1"].Should().Be("message1");
			a.messages["title2"].Should().Be("message2");
			a.otherProperty.Should().Be(true);
		});

		// unique to JavaScript version
		// ==================

		test("ToVDFNode_Level0_InferCompatibleTypeForUnknownType_Object", ()=>
		{
			var a = VDFLoader.ToVDFNode("UnknownType>string{Prop value string.}", new VDFLoadOptions(null, true));
			a["string"].baseValue.Should().Be("Prop value string.");
		});
		test("ToVDFNode_Level0_InferCompatibleTypeForUnknownType_BaseValue", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{UnkownBaseType>Prop value string.}", new VDFLoadOptions(null, true));
			a["string"].baseValue.Should().Be("Prop value string.");
		});
		test("ToObject_AsObject", ()=>
		{
			var a = <any>VDF.Deserialize("bool{bool>false}float{float>3.5}", "object");
			a.bool.Should().Be(false);
			a.float.Should().BeExactly(3.5);
		});
		test("ToObject_AsObject_NestedList", ()=>
		{
			var a = <any>VDF.Deserialize("name{Soils}children{id{1.1.1.1}name{Grass}|id{1.1.1.2}name{Dirt}|id{1.1.1.3}name{Snow}}");
			a["children"].length.Should().Be(3);
		});
	}
}