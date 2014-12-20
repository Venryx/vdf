﻿interface Object { Should(): { obj: any; Be(value, message?: string); BeExactly(value, message?: string); } }
/*window["oldTest"] = test;
window["test"] = (title: string, testFunc: ()=> any) => // overwrite/wrap actual test func
{
	Loading.Init();
	window["oldTest"](title, testFunc);
}*/

class TypeWithPreDeserializeMethod
{
	static typeInfo: VDFTypeInfo = new VDFTypeInfo(false, false,
	{
		flag: new VDFPropInfo("bool")
	});
	flag = false;
	VDFPreDeserialize(): void { this.flag = true; }
}
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
class Depth1_Object_PoppedOutDictionaryPoppedOutThenPoppedOutBool_Class1
{
	static typeInfo: VDFTypeInfo = new VDFTypeInfo(false, true,
	{
		messages: new VDFPropInfo("Dictionary[string,string]", true, true),
		otherProperty: new VDFPropInfo("bool")
	});

	messages = new Dictionary<string, string>("string", "string");
	otherProperty: boolean;
}

class TypeWithPostDeserializeMethod_CustomMessageRequired
{
	static typeInfo: VDFTypeInfo = new VDFTypeInfo(false, false,
	{
		flag: new VDFPropInfo("bool")
	});
	flag = false;
	VDFPostDeserialize(message: any): void { if (message == "RequiredMessage") this.flag = true; }
}

class Loading
{
	static initialized: boolean;
	static Init()
	{
		if (this.initialized)
			return;
		this.initialized = true;
		Object.prototype._AddFunction_Inline = function Should()
		{
			return 0 || // fix for auto-semicolon-insertion
			{
				Be: (value, message?: string) => { equal(this instanceof Number ? parseFloat(this) : (this instanceof String ? this.toString() : this), value, message); },
				BeExactly: (value, message?: string) => { strictEqual(this instanceof Number ? parseFloat(this) : (this instanceof String ? this.toString() : this), value, message); }
			};
		};
	}

	static RunTests()
	{
		// to VDFNode
		// ==========

		test("Depth0_Comment", ()=>
		{
			var a = VDFLoader.ToVDFNode(";; comment\n\
Root string.");
			a.baseValue.Should().Be("Root string.");
		});
		test("Depth0_Comment2", ()=>
		{
			var a = VDFLoader.ToVDFNode("Root string ends here.;; comment");
			a.baseValue.Should().Be("Root string ends here.");
		});
		test("Depth0_BaseValue", ()=>
		{
			var a = VDFLoader.ToVDFNode("Root string.");
			a.baseValue.Should().Be("Root string."); // note; remember that for ambiguous cases like this, the base-like-value is added both as the obj's base-value and as its solitary item
		});
		test("Depth0_BaseValue_SaveThenLoad", ()=>
		{
			var vdf = VDF.Serialize("Root string.");
			var a = VDFLoader.ToVDFNode(vdf);
			a.baseValue.Should().Be("Root string.");
			a.items.length.Should().Be(0); // it should assume it's a base-value, unless indicated otherwise
			a.ToVDF().Should().Be("Root string.");
		});
		test("Depth0_BaseValue_Literal", ()=>
		{
			var a = VDFLoader.ToVDFNode("@@\tBase-value string that {needs escaping}.@@");
			a.baseValue.Should().Be("\tBase-value string that {needs escaping}.");
		});
		test("Depth0_Metadata_Type", ()=>
		{
			var a = VDFLoader.ToVDFNode("string>Root string.");
			a.metadata_type.Should().Be("string");
		});
		test("Depth0_Array", ()=>
		{
			var a = VDFLoader.ToVDFNode("Root string 1.|Root string 2.");
			a[0].baseValue.Should().Be("Root string 1.");
			a[1].baseValue.Should().Be("Root string 2.");
		});
		/*test("Depth0_Array_ExplicitStartAndEndMarkers", ()=>
		{
			var a = VDFLoader.ToVDFNode("{Root string 1.}{Root string 2.}", "List[object]");
			a[0].baseValue.Should().Be("Root string 1.");
			a[1].baseValue.Should().Be("Root string 2.");
		});*/
		test("Depth0_Array_Objects", ()=>
		{
			var a = VDFLoader.ToVDFNode("name{Dan}age{50}|name{Bob}age{60}", "List[object]");
			a[0]["name"].AsString.Should().Be("Dan");
			a[0]["age"].AsInt.Should().Be(50);
			a[1]["name"].AsString.Should().Be("Bob");
			a[1]["age"].AsInt.Should().Be(60);
		});
		test("Depth0_Array_Literals", ()=>
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
		test("Depth0_Array_Empty", ()=>
		{
			var a = VDFLoader.ToVDFNode("|", "List[object]");
			ok(a[0].baseValue == null);
			ok(a[1].baseValue == null);
		});
		test("Depth0_Array_None_NoType", ()=>
		{
			var a = VDFLoader.ToVDFNode("", "List[object]");
			a.items.Count.Should().Be(0);
		});
		test("Depth0_Array_None_Type", ()=>
		{
			var a = VDFLoader.ToVDFNode(">>");
			a.items.Count.Should().Be(0);
		});
		test("Depth0_ArrayMetadata1", ()=>
		{
			var a = VDFLoader.ToVDFNode("List[int]>>1|2");
			a.metadata_type.Should().Be("List[int]");
			ok(a[0].metadata_type == null);
			ok(a[1].metadata_type == null);
		});
		test("Depth0_ArrayMetadata2", ()=>
		{
			var a = VDFLoader.ToVDFNode("List[int]>>int>1|int>2");
			a.metadata_type.Should().Be("List[int]");
			a[0].metadata_type.Should().Be("int");
			a[1].metadata_type.Should().Be("int");
		});
		test("Depth0_DictionaryItems", ()=>
		{
			var a = VDFLoader.ToVDFNode("key1{Simple string.}key2{name{Dan}age{50}}");
			a["key1"].baseValue.Should().Be("Simple string.");
			a["key2"]["age"].AsFloat.Should().Be(50);
		});
		test("Depth0_DictionaryItems_GetByKey", ()=>
		{
			var a = VDFLoader.ToVDFNode("key 1{value 1}key 2{value 2}");
			a["key 1"].baseValue.Should().Be("value 1");
			a["key 2"].baseValue.Should().Be("value 2");
		});
		test("Depth0_InferDepth2", ()=>
		{
			var a = VDF.Deserialize(">>>false", "List[object]");
			a[0].Should().Be(false);
		});
		test("Depth0_InferUnmarkedBaseValueTypeToBeString", ()=>
		{
			var a = VDF.Deserialize(">>SimpleString", "IList");
			a[0].Should().Be("SimpleString");
		});
		test("Depth0_InferUnmarkedBaseValueTypeToBeString_EvenWhenTypeSpecifiedAsObject", ()=>
		{
			var a = VDF.Deserialize(">>SimpleString", "List[object]");
			a[0].Should().Be("SimpleString");
		});
		test("Depth0_MultilineString", ()=>
		{
			var a = VDFLoader.ToVDFNode("@@This is a\nmultiline string\nof three lines in total.@@");
			a.baseValue.Should().Be("This is a\nmultiline string\nof three lines in total.");
		});

		test("Depth1_BaseValuesWithExplicitCasting", ()=>
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
		test("Depth1_BaseValuesWithMarkedTypes", ()=>
		{
			var a = VDFLoader.ToVDFNode("bool{bool>false}int{int>5}float{float>.5}string{string>Prop value string.}");
			a["bool"].AsBool.Should().Be(false);
			a["int"].AsInt.Should().Be(5);
			a["float"].AsFloat.Should().Be(.5);
			a["string"].AsString.Should().Be("Prop value string.");
		});
		test("Depth1_Literal", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@}");
			a["string"].baseValue.Should().Be("Prop value string that {needs escaping}.");
		});
		test("Depth1_TroublesomeLiteral1", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@@|@@}");
			a["string"].baseValue.Should().Be("Prop value string that {needs escaping}.@@");
		});
		test("Depth1_TroublesomeLiteral2", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@||@@}");
			a["string"].baseValue.Should().Be("Prop value string that {needs escaping}.@@|");
		});
		test("Depth1_TroublesomeLiteral3", ()=>
		{
			var a = VDFLoader.ToVDFNode("@@@@@Prop value string that needs escaping.@@@|@@");
			a.baseValue.Should().Be("@@Prop value string that needs escaping.@@");
		});
		test("Depth1_VDFWithVDFWithVDF", ()=>
		{
			var a = VDFLoader.ToVDFNode("level1{@@level2{@@@level3{Base string.}@@@}@@}");
			a["level1"].baseValue.Should().Be("level2{@@level3{Base string.}@@}");
			VDFLoader.ToVDFNode(a["level1"].baseValue)["level2"].baseValue.Should().Be("level3{Base string.}");
			VDFLoader.ToVDFNode(VDFLoader.ToVDFNode(a["level1"].baseValue)["level2"].baseValue)["level3"].baseValue.Should().Be("Base string.");
		});
		test("Depth1_ArraysInArrays", ()=>
		{
			var a = VDFLoader.ToVDFNode("{1A|1B}{2A|2B}{3A}");
			a[0][0].baseValue.Should().Be("1A");
			a[0][1].baseValue.Should().Be("1B");
			a[1][0].baseValue.Should().Be("2A");
			a[1][1].baseValue.Should().Be("2B");
			a[2].baseValue.Should().Be("3A");
		});
		test("Depth1_ArraysInArrays_SecondsEmpty", ()=>
		{
			var a = VDFLoader.ToVDFNode("{1A|}{2A|}");
			a[0][0].baseValue.Should().Be("1A");
			ok(a[0][1].baseValue == null);
			a[1][0].baseValue.Should().Be("2A");
			ok(a[1][1].baseValue == null);
		});
		test("Depth1_ArraysInArrays_FirstsAndSecondsEmpty", ()=>
		{
			var a = VDFLoader.ToVDFNode("{|}{|}");
			ok(a[0][0].baseValue == null);
			ok(a[0][1].baseValue == null);
			ok(a[1][0].baseValue == null);
			ok(a[1][1].baseValue == null);
		});
		test("Depth1_StringAndArraysInArrays", ()=>
		{
			var a = VDFLoader.ToVDFNode("{text}{2A|}");
			a[0].baseValue.Should().Be("text");
			a[1][0].baseValue.Should().Be("2A");
			ok(a[1][1].baseValue == null);
		});
		test("Depth1_Dictionary", ()=>
		{
			var a = VDFLoader.ToVDFNode("key1{value1}key2{value2}");
			a["key1"].baseValue.Should().Be("value1");
			a["key2"].baseValue.Should().Be("value2");
		});
		test("Depth1_Dictionary_Complex", ()=>
		{
			var a = VDFLoader.ToVDFNode("uiPrefs{toolOptions{@@Select{}TerrainShape{showPreview{true}continuousMode{true}strength{.3}size{7}}TerrainTexture{textureName{>null}size{7}}@@}liveTool{Select}}");
			a["uiPrefs"]["toolOptions"].baseValue.Should().Be("Select{}TerrainShape{showPreview{true}continuousMode{true}strength{.3}size{7}}TerrainTexture{textureName{>null}size{7}}");
			a["uiPrefs"]["liveTool"].baseValue.Should().Be("Select");
		});
		test("Depth1_Dictionary_TypesInferredFromGenerics", ()=>
		{
			var a = VDFLoader.ToVDFNode("vertexColors{Dictionary[string,Color]>>9,4,2.5{Black}1,8,9.5435{Gray}25,15,5{White}}");
			a["vertexColors"]["9,4,2.5"].baseValue.Should().Be("Black");
			a["vertexColors"]["1,8,9.5435"].baseValue.Should().Be("Gray");
			a["vertexColors"]["25,15,5"].baseValue.Should().Be("White");
		});

		// note: if only one item (when parsed as List), assume by default obj is an object; if more than one, assume by default obj is a List or Dictionary
		test("Depth1_ArrayPoppedOut_NoItems", ()=>
		{
			var a = VDFLoader.ToVDFNode("names:");
			a["names"].properties.Count.Should().Be(0);
		});
		test("Depth1_ArrayPoppedOut", ()=>
		{
			var a = VDFLoader.ToVDFNode("names:\n\
	Dan\n\
	Bob");
			a["names"][0].baseValue.Should().Be("Dan");
			a["names"][1].baseValue.Should().Be("Bob");
		});
		test("Depth1_ArraysPoppedOut", ()=> // each 'group' is actually just the value-data of one of the parent's properties
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
		test("Depth1_InferredDictionaryPoppedOut", ()=>
		{
			var a = VDFLoader.ToVDFNode("messages:,>>\n\
	title1{message1}\n\
	title2{message2}\n\
^otherProperty{false}");
			a["messages"].properties.Count.Should().Be(2);
			a["messages"]["title1"].baseValue.Should().Be("message1");
			a["messages"]["title2"].baseValue.Should().Be("message2");
			a["otherProperty"].baseValue.Should().Be("false");
		});
		test("Depth1_DictionaryPoppedOut", ()=>
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

		test("Depth1_MultilineStringThenProperty", ()=>
		{
			var a = VDFLoader.ToVDFNode("text{@@This is a\n\
multiline string\n\
of three lines in total.@@}bool{>true}");
			a["text"].baseValue.Should().Be("This is a\nmultiline string\nof three lines in total.");
			a["bool"].AsBool.Should().Be(true);
		});
		test("Depth1_ArrayPoppedOutThenMultilineString", ()=>
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

		test("Depth2_ObjectWithArrayProp_PoppedOutObjectWithArrayProp_PoppedOutObject", ()=>
		{
			var a = VDFLoader.ToVDFNode("\n\
name{L0}children:\n\
	name{L1}children:\n\
		name{L2}\n\
			".trim());
			a["children"].items.Count.Should().Be(1);
			a["children"].items[0]["children"].items.Count.Should().Be(1);
		});

		test("Depth5_DeepNestedPoppedOutData", ()=>
		{
			var vdf = "name{Main}worlds{string,object>>Test1{vObjectRoot{name{VObjectRoot}children:\n\
	id{System.Guid>025f28a5-a14b-446d-b324-2d274a476a63}name{#Types}children{}\n\
}}Test2{vObjectRoot{name{VObjectRoot}children:\n\
	id{System.Guid>08e84f18-aecf-4b80-9c3f-ae0697d9033a}name{#Types}children{}\n\
}}}";
			var livePackNode = VDFLoader.ToVDFNode(vdf);
			livePackNode["worlds"]["Test1"]["vObjectRoot"]["children"][0]["id"].baseValue.Should().Be("025f28a5-a14b-446d-b324-2d274a476a63");
			livePackNode["worlds"]["Test2"]["vObjectRoot"]["children"][0]["id"].baseValue.Should().Be("08e84f18-aecf-4b80-9c3f-ae0697d9033a");
		});
		test("Depth5_SpeedTester", ()=>
		{
			var vdf = "id{595880cd-13cd-4578-9ef1-bd3175ac72bb}visible{true}parts:\n\
	id{ba991aaf-447a-4a03-ade8-f4a11b4ea966}typeName{Wood}name{Body}pivotPoint_unit{-0.1875,0.4375,-0.6875}anchorNormal{0,1,0}scale{0.5,0.25,1.5}controller{true}\n\
	id{743f64f2-8ece-4dd3-bdf5-bbb6378ffce5}typeName{Wood}name{FrontBar}pivotPoint_unit{-0.4375,0.5625,0.8125}anchorNormal{0,0,1}scale{1,0.25,0.25}controller{false}\n\
	id{52854b70-c200-478f-bcd2-c69a03cd808f}typeName{Wheel}name{FrontLeftWheel}pivotPoint_unit{-0.5,0.5,0.875}anchorNormal{-1,0,0}scale{1,1,1}controller{false}\n\
	id{971e394c-b440-4fee-99fd-dceff732cd1e}typeName{Wheel}name{BackRightWheel}pivotPoint_unit{0.5,0.5,-0.875}anchorNormal{1,0,0}scale{1,1,1}controller{false}\n\
	id{77d30d72-9845-4b22-8e95-5ba6e29963b9}typeName{Wheel}name{FrontRightWheel}pivotPoint_unit{0.5,0.5,0.875}anchorNormal{1,0,0}scale{1,1,1}controller{false}\n\
	id{21ca2a80-6860-4de3-9894-b896ec77ef9e}typeName{Wheel}name{BackLeftWheel}pivotPoint_unit{-0.5,0.5,-0.875}anchorNormal{-1,0,0}scale{1,1,1}controller{false}\n\
	id{eea2623a-86d3-4368-b4e0-576956b3ef1d}typeName{Wood}name{BackBar}pivotPoint_unit{-0.4375,0.4375,-0.8125}anchorNormal{0,0,-1}scale{1,0.25,0.25}controller{false}\n\
	id{f1edc5a1-d544-4993-bdad-11167704a1e1}typeName{MachineGun}name{Gun1}pivotPoint_unit{0,0.625,0.875}anchorNormal{0,1,0}scale{0.5,0.5,0.5}controller{false\n\
	id{e97f8ee1-320c-4aef-9343-3317accb015b}typeName{Crate}name{Crate}pivotPoint_unit{0,0.625,0}anchorNormal{0,1,0}scale{0.5,0.5,0.5}controller{false}\n\
^tasksScriptText{@@Grab Flag\n\
	(Crate ensure contains an EnemyFlag) ensure is false\n\
	targetFlag be EnemyFlag_OnEnemyGround [objectRefreshInterval: infinity] [lifetime: infinity]\n\
	targetFlag set tag 'taken'\n\
	FrontLeftWheel turn to targetFlag [with: FrontRightWheel]\n\
	FrontLeftWheel roll forward\n\
	FrontRightWheel roll forward\n\
	BackLeftWheel roll forward\n\
	BackRightWheel roll forward\n\
	targetFlag put into Crate\n\
				\n\
Bring Flag to Safer Allied Ground\n\
	Crate ensure contains an EnemyFlag\n\
	targetLocation be AlliedGround_NoEnemyFlag_Safest [objectRefreshInterval: infinity]\n\
	targetLocation set tag 'taken'\n\
	FrontLeftWheel turn to targetLocation [with: FrontRightWheel]\n\
	FrontLeftWheel roll forward\n\
	FrontRightWheel roll forward\n\
	BackLeftWheel roll forward\n\
	BackRightWheel roll forward\n\
	targetFlag put at targetLocation\n\
				\n\
Shoot at Enemy Vehicle\n\
	Gun1 aim at EnemyVehicle_NonBroken\n\
	Gun1 fire@@}";
			VDFLoader.ToVDFNode(vdf);
			ok(true);
		});

		// to object
		// ==================

		test("Depth0_Null", ()=>ok(VDF.Deserialize(">null") == null));
		test("Depth0_Nothing", ()=>ok(VDF.Deserialize("") == null));
		test("Depth0_Nothing_TypeSpecified", ()=>ok(VDF.Deserialize("string>") == null));
		test("Depth0_EmptyString", ()=>VDF.Deserialize(">empty").Should().Be(""));
		test("Depth0_Bool", ()=>VDF.Deserialize("true", "bool").Should().Be(true));
		test("Depth0_Float", ()=>VDF.Deserialize("1.5", "float").Should().Be(1.5));

		test("Depth1_EmptyStringInList", ()=> ok(VDF.Deserialize("text1|", "List[string]")[1] == null));
		test("Depth1_PreDeserializeMethod", ()=>
		{
			var a = VDF.Deserialize("", "TypeWithPreDeserializeMethod");
			a.flag.Should().Be(true);
		});
		test("Depth1_PostDeserializeMethod", ()=>
		{
			var a = VDF.Deserialize("", "TypeWithPostDeserializeMethod");
			a.flag.Should().Be(true);
		});
		test("Depth1_PostDeserializeMethod_CustomMessageRequired", ()=>{ VDF.Deserialize("", "TypeWithPostDeserializeMethod_CustomMessageRequired", new VDFLoadOptions("WrongMessage")).flag.Should().Be(false); });
		test("Depth1_InstantiateTypeManuallyThenFill", ()=>
		{
			var a = new TypeInstantiatedManuallyThenFilled();
			VDF.DeserializeInto("flag{true}", a);
			a.flag.Should().Be(true);
		});
		test("Depth1_Object_PoppedOutDictionaryPoppedOutThenPoppedOutBool", ()=>
		{
			var a = VDF.Deserialize("\n\
	messages:\n\
		title1{message1}\n\
		title2{message2}\n\
	otherProperty{true}", "Depth1_Object_PoppedOutDictionaryPoppedOutThenPoppedOutBool_Class1");
			a.messages.Count.Should().Be(2);
			a.messages["title1"].Should().Be("message1");
			a.messages["title2"].Should().Be("message2");
			a.otherProperty.Should().Be(true);
		});

		// unique to JavaScript version
		// ==================

		test("Depth0_InferCompatibleTypesForUnknownTypes_Object", ()=>
		{
			var a = VDFLoader.ToVDFNode("UnknownType>string{Prop value string.}", new VDFLoadOptions(null, true));
			a["string"].baseValue.Should().Be("Prop value string.");
		});
		test("Depth0_InferCompatibleTypesForUnknownTypes_BaseValue", ()=>
		{
			var a = VDFLoader.ToVDFNode("string{UnkownBaseType>Prop value string.}", new VDFLoadOptions(null, true));
			a["string"].baseValue.Should().Be("Prop value string.");
		});
		test("AsObject", ()=>
		{
			var a = <any>VDF.Deserialize("bool{bool>false}float{float>3.5}", "object");
			a.bool.Should().Be(false);
			a.float.Should().BeExactly(3.5);
		});
		test("AsObject_NestedList_InferCompatibleTypesOff", () =>
		{
			var a = VDF.Deserialize("name{Soils}children{id{1.1.1.1}name{Grass}|id{1.1.1.2}name{Dirt}|id{1.1.1.3}name{Snow}}");
			ok(a == null);
		});
		test("AsObject_NestedList_InferCompatibleTypesOn", ()=>
		{
			var a = VDF.Deserialize("name{Soils}children{id{1.1.1.1}name{Grass}|id{1.1.1.2}name{Dirt}|id{1.1.1.3}name{Snow}}", new VDFLoadOptions(null, true));
			a["children"].length.Should().Be(3);
		});


		test("Depth2_ComplexPoppedOutItems", ()=>
		{
			var a = VDF.Deserialize("id{595880cd-13cd-4578-9ef1-bd3175ac72bb}visible{true}parts:>>\n\
	id{ba991aaf-447a-4a03-ade8-f4a11b4ea966}typeName{Wood}name{Body}pivotPoint_unit{-0.1875,0.4375,-0.6875}anchorNormal{0,1,0}scale{0.5,0.25,1.5}controller{true}\n\
	id{743f64f2-8ece-4dd3-bdf5-bbb6378ffce5}typeName{Wood}name{FrontBar}pivotPoint_unit{-0.4375,0.5625,0.8125}anchorNormal{0,0,1}scale{1,0.25,0.25}controller{false}\n\
	id{e97f8ee1-320c-4aef-9343-3317accb015b}typeName{Crate}name{Crate}pivotPoint_unit{0,0.625,0}anchorNormal{0,1,0}scale{0.5,0.5,0.5}controller{false}", new VDFLoadOptions(true, true));
			a.parts.Count.Should().Be(3);
		});
		test("Depth2_ComplexPoppedOutItemsThenBool", ()=>
		{
			var a = VDF.Deserialize("id{595880cd-13cd-4578-9ef1-bd3175ac72bb}visible{true}parts:\n\
	id{ba991aaf-447a-4a03-ade8-f4a11b4ea966}typeName{Wood}name{Body}pivotPoint_unit{-0.1875,0.4375,-0.6875}anchorNormal{0,1,0}scale{0.5,0.25,1.5}controller{true}\n\
	id{743f64f2-8ece-4dd3-bdf5-bbb6378ffce5}typeName{Wood}name{FrontBar}pivotPoint_unit{-0.4375,0.5625,0.8125}anchorNormal{0,0,1}scale{1,0.25,0.25}controller{false}\n\
	id{52854b70-c200-478f-bcd2-c69a03cd808f}typeName{Wheel}name{FrontLeftWheel}pivotPoint_unit{-0.5,0.5,0.875}anchorNormal{-1,0,0}scale{1,1,1}controller{false}\n\
	id{971e394c-b440-4fee-99fd-dceff732cd1e}typeName{Wheel}name{BackRightWheel}pivotPoint_unit{0.5,0.5,-0.875}anchorNormal{1,0,0}scale{1,1,1}controller{false}\n\
	id{77d30d72-9845-4b22-8e95-5ba6e29963b9}typeName{Wheel}name{FrontRightWheel}pivotPoint_unit{0.5,0.5,0.875}anchorNormal{1,0,0}scale{1,1,1}controller{false}\n\
	id{21ca2a80-6860-4de3-9894-b896ec77ef9e}typeName{Wheel}name{BackLeftWheel}pivotPoint_unit{-0.5,0.5,-0.875}anchorNormal{-1,0,0}scale{1,1,1}controller{false}\n\
	id{eea2623a-86d3-4368-b4e0-576956b3ef1d}typeName{Wood}name{BackBar}pivotPoint_unit{-0.4375,0.4375,-0.8125}anchorNormal{0,0,-1}scale{1,0.25,0.25}controller{false}\n\
	id{f1edc5a1-d544-4993-bdad-11167704a1e1}typeName{MachineGun}name{Gun1}pivotPoint_unit{0,0.625,0.875}anchorNormal{0,1,0}scale{0.5,0.5,0.5}controller{false}\n\
	id{e97f8ee1-320c-4aef-9343-3317accb015b}typeName{Crate}name{Crate}pivotPoint_unit{0,0.625,0}anchorNormal{0,1,0}scale{0.5,0.5,0.5}controller{false}\n\
^tasksScriptText{@@Grab Flag\n\
	(Crate ensure contains an EnemyFlag) ensure is false\n\
	targetFlag be EnemyFlag_OnEnemyGround [objectRefreshInterval: infinity] [lifetime: infinity]\n\
	targetFlag set tag `taken`\n\
	FrontLeftWheel turn to targetFlag [with: FrontRightWheel]\n\
	FrontLeftWheel roll forward\n\
	FrontRightWheel roll forward\n\
	BackLeftWheel roll forward\n\
	BackRightWheel roll forward\n\
	targetFlag put into Crate\n\
Shoot at Enemy Vehicle\n\
	Gun1 aim at EnemyVehicle_NonBroken\n\
	Gun1 fire@@}", new VDFLoadOptions(true, true));
			a.parts.Count.Should().Be(9);
		});
	}
}