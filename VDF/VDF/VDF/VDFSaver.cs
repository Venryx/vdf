﻿using System;
using System.CodeDom;
using System.CodeDom.Compiler;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using Microsoft.CSharp;

class VDFSaveOptions
{
	public List<MemberInfo> includePropsL3;
	public List<MemberInfo> excludePropsL4;
	public List<MemberInfo> includePropsL5;
	public bool saveTypesForAllObjects;

	public VDFSaveOptions(IEnumerable<MemberInfo> includePropsL3 = null, IEnumerable<MemberInfo> excludePropsL4 = null, IEnumerable<MemberInfo> includePropsL5 = null, bool saveTypesForAllObjects = false)
	{
		this.includePropsL3 = includePropsL3 != null ? includePropsL3.ToList() : new List<MemberInfo>();
		this.excludePropsL4 = excludePropsL4 != null ? excludePropsL4.ToList() : new List<MemberInfo>();
		this.includePropsL5 = includePropsL5 != null ? includePropsL5.ToList() : new List<MemberInfo>();
		this.saveTypesForAllObjects = saveTypesForAllObjects;
	}
}

static class VDFSaver
{
	public static VDFNode ToVDFNode(object obj, VDFSaveOptions saveOptions = null)
	{
		var objNode = new VDFNode();

		if (saveOptions.saveTypesForAllObjects) // if we're adding types for all objects, just do it here (no need to compare actual type with base type)
			objNode.metadata = VDF.TypeToRealTypeName(obj.GetType());

		Type type = obj.GetType();
		if (VDF.typeExporters_inline.ContainsKey(type))
			objNode.items.Add(VDF.typeExporters_inline[type](obj).Contains("}") ? "@@@" + VDF.typeExporters_inline[type](obj) + "@@@" : VDF.typeExporters_inline[type](obj));
		else if (type == typeof(float) || type == typeof(double))
			objNode.items.Add(obj.ToString().StartsWith("0.") ? obj.ToString().Substring(1) : obj.ToString());
		else if (type.IsPrimitive || type == typeof(string))
			objNode.items.Add(obj.ToString().Contains("}") ? "@@@" + obj + "@@@" : obj);
		else if (obj is IList) // note; this saves arrays also
		{
			var objAsList = (IList)obj;
			for (int i = 0; i < objAsList.Count; i++)
			{
				object item = objAsList[i];
				bool typeDerivedFromDeclaredType = type.IsGenericType && item.GetType() != type.GetGenericArguments()[0]; // if List item is of a type *derived* from the List's base item-type (i.e. we need to specify actual item-type)
				VDFNode itemValueNode = ToVDFNode(item, saveOptions);
				if (item is IList) // if array item is itself an array
					itemValueNode.isArrayItem_array = true;
				if (i > 0)
					itemValueNode.isArrayItem_nonFirst = true;
				if (typeDerivedFromDeclaredType)
					itemValueNode.metadata = item.GetType().FullName;
				objNode.items.Add(itemValueNode);
			}
		}
		else if (obj is IDictionary)
		{
			var objAsDictionary = (IDictionary)obj;
			foreach (object key in objAsDictionary.Keys)
			{
				object value = objAsDictionary[key];
				var keyValuePairPseudoNode = new VDFNode();
				keyValuePairPseudoNode.isKeyValuePairPseudoNode = true;

				bool keyTypeDerivedFromDeclaredType = type.IsGenericType && key.GetType() != type.GetGenericArguments()[0]; // if key is of a type *derived* from the Dictionary's base key-type (i.e. we need to specify actual key-type)
				VDFNode keyNode = ToVDFNode(key, saveOptions);
				if (keyTypeDerivedFromDeclaredType)
					keyNode.metadata = key.GetType().FullName;
				keyValuePairPseudoNode.items.Add(keyNode);

				bool valueTypeDerivedFromDeclaredType = type.IsGenericType && value.GetType() != type.GetGenericArguments()[1]; // if value is of a type *derived* from the Dictionary's base value-type (i.e. we need to specify actual value-type)
				VDFNode valueNode = ToVDFNode(value, saveOptions);
				valueNode.isArrayItem_nonFirst = true;
				if (valueTypeDerivedFromDeclaredType)
					valueNode.metadata = value.GetType().FullName;
				keyValuePairPseudoNode.items.Add(valueNode);

				objNode.items.Add(keyValuePairPseudoNode);
			}
		}
		else // an object, with properties
		{
			var typeInfo = VDFTypeInfo.Get(type);
			int popOutGroupsAdded = 0;
			foreach (string propName in typeInfo.propInfoByName.Keys)
			{
				VDFPropInfo propInfo = typeInfo.propInfoByName[propName];
				bool include = typeInfo.props_includeL1;
				include = propInfo.includeL2.HasValue ? propInfo.includeL2.Value : include;
				include = saveOptions != null && (saveOptions.includePropsL3.Contains(propInfo.memberInfo) || saveOptions.includePropsL3.Contains(VDF.AnyMember)) ? true : include;
				include = saveOptions != null && (saveOptions.excludePropsL4.Contains(propInfo.memberInfo) || saveOptions.excludePropsL4.Contains(VDF.AnyMember)) ? false : include;
				include = saveOptions != null && (saveOptions.includePropsL5.Contains(propInfo.memberInfo) || saveOptions.includePropsL5.Contains(VDF.AnyMember)) ? true : include;
				if (!include)
					continue;

				object propValue = propInfo.GetValue(obj);
				if (propInfo.IsXIgnorableValue(propValue))
					continue;

				bool typeDerivedFromDeclaredType = propValue.GetType() != propInfo.GetPropType(); // if value is of a type *derived* from the property's base value-type (i.e. we need to specify actual value-type)
				if (propInfo.popOutItemsToOwnLines)
				{
					VDFNode propValueNode = ToVDFNode(propValue, saveOptions);
					propValueNode.items.Insert(0, "#"); // add in-line marker, indicating that items are popped-out
					if (popOutGroupsAdded > 0 && propValueNode.items.Count > 1)
						((VDFNode)propValueNode.items[1]).isFirstItemOfNonFirstPopOutGroup = true;
					if (typeDerivedFromDeclaredType)
						propValueNode.metadata = propValue.GetType().FullName;
					foreach (object propValueNodeItem in propValueNode.items)
						if (propValueNodeItem is VDFNode)
							((VDFNode)propValueNodeItem).popOutToOwnLine = true;
					objNode.properties.Add(propName, propValueNode);
					popOutGroupsAdded++;
				}
				else
				{
					VDFNode propValueNode = ToVDFNode(propValue, saveOptions);
					if (typeDerivedFromDeclaredType)
						propValueNode.metadata = propValue.GetType().FullName;
					objNode.properties.Add(propName, propValueNode);
				}
			}
		}

		return objNode;
	}
}