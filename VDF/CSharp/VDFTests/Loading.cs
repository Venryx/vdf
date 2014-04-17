﻿using System;
using System.Collections.Generic;
using FluentAssertions;
using Xunit;

public class SpecialList<T> : List<T> {}
namespace VDFTests
{
	public class Loading
	{
		static Loading()
		{
			VDF.RegisterTypeExporter_Inline<Guid>(id=>id.ToString());
			VDF.RegisterTypeImporter_Inline<Guid>(str=>new Guid(str));
			VDF.RegisterTypeExporter_Inline<Vector3>(point=>point.x + "," + point.y + "," + point.z);
			VDF.RegisterTypeImporter_Inline<Vector3>(str=>
			{
				string[] parts = str.Split(new[] {','});
				return new Vector3(float.Parse(parts[0]), float.Parse(parts[1]), float.Parse(parts[2]));
			});
		}
		
		[Fact] void VDFNode_Level0_Comment()
		{
			VDFNode a = VDFLoader.ToVDFNode(@"// comment
			Root string.");
			a.items[0].baseValue.Should().Be("			Root string.");
		}
		[Fact] void VDFNode_Level0_BaseValue()
		{
			VDFNode a = VDFLoader.ToVDFNode("Root string.");
			a.baseValue.Should().Be(null); // base-values should only ever be at one level
			a.items[0].baseValue.Should().Be("Root string.");
		}
		[Fact] void VDFNode_Level0_Metadata_Type()
		{
			VDFNode a = VDFLoader.ToVDFNode("<string>Root string.");
			a.metadata_type.Should().Be("string");
		}
		[Fact] void VDFNode_Level0_ArrayItems()
		{
			VDFNode a = VDFLoader.ToVDFNode("Root string 1.|Root string 2.");
			a.items[0].baseValue.Should().Be("Root string 1.");
			a.items[1].baseValue.Should().Be("Root string 2.");
		}
		[Fact] void VDFNode_Level0_ArrayItems_Empty()
		{
			VDFNode a = VDFLoader.ToVDFNode("|");
			a.items[0].baseValue.Should().Be("");
			a.items[1].baseValue.Should().Be("");
		}
		[Fact] void VDFNode_Level0_ArrayMetadata1()
		{
			VDFNode a = VDFLoader.ToVDFNode("<<SpecialList[int]>>1|2", new VDFLoadOptions(null, new Dictionary<Type, string>{{typeof(SpecialList<>), "SpecialList"}}));
			a.metadata_type.Should().Be("SpecialList[int]");
			a.items[0].metadata_type.Should().Be(null);
			a.items[1].metadata_type.Should().Be(null);
		}
		[Fact] void VDFNode_Level0_ArrayMetadata2()
		{
			VDFNode a = VDFLoader.ToVDFNode("<<SpecialList[int]>><int>1|<int>2", new VDFLoadOptions(null, new Dictionary<Type, string> { { typeof(SpecialList<>), "SpecialList" } }));
			a.metadata_type.Should().Be("SpecialList[int]");
			a.items[0].metadata_type.Should().Be("int");
			a.items[1].metadata_type.Should().Be("int");
		}
		[Fact] void VDFNode_Level0_DictionaryItems()
		{
			VDFNode a = VDFLoader.ToVDFNode("{key 1|value 1}{key 2|value 2}");
			a.items[0].items[0].baseValue.Should().Be("key 1");
			a.items[0].items[1].baseValue.Should().Be("value 1");
			a.items[1].items[0].baseValue.Should().Be("key 2");
			a.items[1].items[1].baseValue.Should().Be("value 2");
		}

		[Fact] void VDFNode_Level1_BaseValues()
		{
			VDFNode a = VDFLoader.ToVDFNode("bool{false}int{5}float{.5}string{Prop value string.}");
			a.properties["bool"].items[0].baseValue.Should().Be("false");
			a.properties["int"].items[0].baseValue.Should().Be("5");
			a.properties["float"].items[0].baseValue.Should().Be(".5");
			a.properties["string"].items[0].baseValue.Should().Be("Prop value string.");
		}
		[Fact] void VDFNode_Level1_Literal()
		{
			VDFNode a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@}");
			a.properties["string"].items[0].baseValue.Should().Be("Prop value string that {needs escaping}.");
		}
		[Fact] void VDFNode_Level1_TroublesomeLiteral1()
		{
			VDFNode a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@@|@@}");
			a.properties["string"].items[0].baseValue.Should().Be("Prop value string that {needs escaping}.@@");
		}
		[Fact] void VDFNode_Level1_TroublesomeLiteral2()
		{
			VDFNode a = VDFLoader.ToVDFNode("string{@@Prop value string that {needs escaping}.@@||@@}");
			a.properties["string"].items[0].baseValue.Should().Be("Prop value string that {needs escaping}.@@|");
		}
		[Fact] void VDFNode_Level1_PoppedOutNodes()
		{
			VDFNode a = VDFLoader.ToVDFNode(@"names{#}
	Dan
	Bob
");
			a.properties["names"].items[0].items[0].baseValue.Should().Be("Dan");
			a.properties["names"].items[1].items[0].baseValue.Should().Be("Bob");
		}
		[Fact] void VDFNode_Level1_ArrayItemsInArrayItems()
		{
			VDFNode a = VDFLoader.ToVDFNode("{1A|1B}|{2A|2B}");
			a.items[0].items[0].baseValue.Should().Be("1A");
			a.items[0].items[1].baseValue.Should().Be("1B");
			a.items[1].items[0].baseValue.Should().Be("2A");
			a.items[1].items[1].baseValue.Should().Be("2B");
		}
		[Fact] void VDFNode_Level1_ArrayItemsInArrayItems_Empty()
		{
			VDFNode a = VDFLoader.ToVDFNode("{|}|{|}");
			a.items[0].items[0].baseValue.Should().Be("");
			a.items[0].items[1].baseValue.Should().Be("");
			a.items[1].items[0].baseValue.Should().Be("");
			a.items[1].items[1].baseValue.Should().Be("");
		}
		[Fact] void VDFNode_Level1_DictionaryItemsInDictionaryItems()
		{
			VDFNode a = VDFLoader.ToVDFNode("{1key|1value}{2key|2value}");
			a.items[0].items[0].baseValue.Should().Be("1key");
			a.items[0].items[1].baseValue.Should().Be("1value");
			a.items[1].items[0].baseValue.Should().Be("2key");
			a.items[1].items[1].baseValue.Should().Be("2value");
		}
		[Fact] void VDFNode_Level1_PoppedOutItemGroups() // each 'group' is actually just the value-data of one of the parent's properties
		{
			VDFNode a = VDFLoader.ToVDFNode(@"names{#}ages{#}
	Dan
	Bob
	#10
	20");
			a.properties["names"].items[0].items[0].baseValue.Should().Be("Dan");
			a.properties["names"].items[1].items[0].baseValue.Should().Be("Bob");
			a.properties["ages"].items[0].items[0].baseValue.Should().Be("10");
			a.properties["ages"].items[1].items[0].baseValue.Should().Be("20");
		}
	}
}