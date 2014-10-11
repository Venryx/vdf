﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;
using System.Text;
using System.Text.RegularExpressions;

public class VDFNode
{
	public string metadata_type;
	public string baseValue;
	public List<VDFNode> items = new List<VDFNode>();
	public Dictionary<string, VDFNode> properties = new Dictionary<string, VDFNode>(); // this also holds Dictionaries' keys/values

	public VDFNode(string baseValue = null, string metadata_type = null)
	{
		this.baseValue = baseValue;
		this.metadata_type = metadata_type;
	}

	public VDFNode this[int index]
	{
		get { return items[index]; }
		set
		{
			if (items.Count == index) // lets you add new items easily: vdfNode[0] = new VDFNode();
				items.Add(value);
			else
				items[index] = value;
		}
	}
	public VDFNode this[string key]
	{
		get { return properties[key]; }
		set { properties[key] = value; }
	}
	public bool Equals(VDFNode other) { return ToVDF() == other.ToVDF(); } // base equality on whether their 'default output' is the same
	// base-types: ["bool", "char", "byte", "sbyte", "short", "ushort", "int", "uint", "long", "ulong", "float", "double", "decimal", "string"]
	public static implicit operator bool(VDFNode node) { return bool.Parse(node.baseValue); }
	public static implicit operator VDFNode(bool val) { return new VDFNode { baseValue = val.ToString().ToLower() }; }
	public static implicit operator char(VDFNode node) { return char.Parse(node.baseValue); }
	public static implicit operator VDFNode(char val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator byte(VDFNode node) { return byte.Parse(node.baseValue); }
	public static implicit operator VDFNode(byte val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator sbyte(VDFNode node) { return sbyte.Parse(node.baseValue); }
	public static implicit operator VDFNode(sbyte val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator short(VDFNode node) { return short.Parse(node.baseValue); }
	public static implicit operator VDFNode(short val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator ushort(VDFNode node) { return ushort.Parse(node.baseValue); }
	public static implicit operator VDFNode(ushort val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator int(VDFNode node) { return int.Parse(node.baseValue); }
	public static implicit operator VDFNode(int val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator uint(VDFNode node) { return uint.Parse(node.baseValue); }
	public static implicit operator VDFNode(uint val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator long(VDFNode node) { return long.Parse(node.baseValue); }
	public static implicit operator VDFNode(long val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator ulong(VDFNode node) { return ulong.Parse(node.baseValue); }
	public static implicit operator VDFNode(ulong val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator float(VDFNode node) { return float.Parse(node.baseValue); }
	public static implicit operator VDFNode(float val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator double(VDFNode node) { return double.Parse(node.baseValue); }
	public static implicit operator VDFNode(double val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator decimal(VDFNode node) { return decimal.Parse(node.baseValue); }
	public static implicit operator VDFNode(decimal val) { return new VDFNode { baseValue = val.ToString() }; }
	public static implicit operator string(VDFNode node) { return node.baseValue; }
	public static implicit operator VDFNode(string val) { return new VDFNode { baseValue = val }; }
	public override string ToString() { return this; } // another way of calling the above string cast; equivalent to: (string)vdfNode

	// saving
	// ==================

	public bool isList;
	public bool isDictionary;
	public bool popOutChildren;
	public bool guardingItsLastLine;
	static string RawDataStringToFinalized(string rawDataStr, bool disallowRawPipe = false)
	{
		string result = rawDataStr;
		if (rawDataStr.Contains(">") || rawDataStr.Contains("}") || (disallowRawPipe && rawDataStr.Contains("|")) || rawDataStr.Contains("@@") || rawDataStr.Contains(";;") || rawDataStr.Contains("\n"))
			if (rawDataStr.EndsWith("@") || rawDataStr.EndsWith("|"))
				result = "@@" + new Regex("(@{2,})").Replace(rawDataStr, "@$1") + "|@@";
			else
				result = "@@" + new Regex("(@{2,})").Replace(rawDataStr, "@$1") + "@@";
		return result;
	}
	static string AddIndentToChildText(string childText)
	{
		var builder = new StringBuilder();
		builder.Append("\t");
		bool inLiteralMarkers = false;
		for (var i = 0; i < childText.Length; i++)
		{
			char? lastChar = i - 1 >= 0 ? childText[i - 1] : (char?)null;
			char ch = childText[i];
			char? nextChar = i + 1 < childText.Length ? childText[i + 1] : (char?)null;
			char? nextNextChar = i + 2 < childText.Length ? childText[i + 2] : (char?)null;
			char? nextNextNextChar = i + 3 < childText.Length ? childText[i + 3] : (char?)null;

			if (!inLiteralMarkers && lastChar != '@' && ch == '@' && nextChar == '@') // if first char of literal-start-marker
				inLiteralMarkers = true;
			else if (inLiteralMarkers && lastChar != '@' && ch == '@' && nextChar == '@' && ((nextNextChar == '|' && nextNextNextChar != '|') || nextNextChar == '}' || nextNextChar == '\n' || nextNextChar == null)) // if first char of literal-end-marker
				inLiteralMarkers = false;

			if (lastChar == '\n' && !inLiteralMarkers)
				builder.Append("\t");

			builder.Append(ch);
		}
		return builder.ToString();
	}
	public string ToVDF(bool disallowRawPipe = false)
	{
		var builder = new StringBuilder();
		if (metadata_type != null)
			builder.Append(isList || isDictionary ? metadata_type.Replace(" ", "") + ">>" : metadata_type.Replace(" ", "") + ">");

		if (baseValue != null)
			builder.Append(RawDataStringToFinalized(baseValue, disallowRawPipe));
		else if (items.Count > 0)
		{
			var hasListItem = items.Any(a => a.isList);
			for (var i = 0; i < items.Count; i++)
			{
				var lastItem = i > 0 ? items[i - 1] : null;
				var item = items[i];

				if (lastItem != null && lastItem.guardingItsLastLine)
				{
					builder.Append("\n");
					lastItem.guardingItsLastLine = false;
				}

				if (popOutChildren)
					builder.Append("\n" + AddIndentToChildText(item.ToVDF()));
				else
					if (hasListItem)
						builder.Append((i > 0 ? "|" : "") + "{" + item.ToVDF() + "}");
					else
						builder.Append((i > 0 ? "|" : "") + item.ToVDF(item.baseValue != null && !item.baseValue.StartsWith("@@") && item.baseValue.Contains("|")));
			}
		}
		else
		{
			string lastPropName = null;
			foreach (string propName in properties.Keys)
			{
				var lastPropValue = lastPropName != null ? properties[lastPropName] : null;
				var propValue = properties[propName];

				if (lastPropValue != null && lastPropValue.guardingItsLastLine)
					if (popOutChildren) // if we're popping out this current child, we can ignore adding a marker for it, because it's supposed to be on its own line
						lastPropValue.guardingItsLastLine = false;
					else
					{
						builder.Append("\n");
						lastPropValue.guardingItsLastLine = false;
						if (lastPropValue.popOutChildren)
							builder.Append("^");
					}

				string propNameAndValueVDF;
				if (propValue.popOutChildren)
					propNameAndValueVDF = propName + ":" + propValue.ToVDF();
				else
				{
					var propValueVDF = propValue.ToVDF();
					if (propValue.guardingItsLastLine)
					{
						propValueVDF += "\n";
						propValue.guardingItsLastLine = false;
					}
					propNameAndValueVDF = propName + "{" + propValueVDF + "}";
				}
				if (popOutChildren)
					builder.Append("\n" + AddIndentToChildText(propNameAndValueVDF));
				else
					builder.Append(propNameAndValueVDF);

				lastPropName = propName;
			}
		}

		guardingItsLastLine = (popOutChildren && (items.Count > 0 || properties.Count > 0));
		if (items.Any(a=>a.guardingItsLastLine))
		{
			guardingItsLastLine = true;
			items.First(a=>a.guardingItsLastLine).guardingItsLastLine = false; // we've taken it as our own
		}
		else if (properties.Values.Any(a=>a.guardingItsLastLine))
		{
			guardingItsLastLine = true;
			properties.Values.First(a=>a.guardingItsLastLine).guardingItsLastLine = false; // we've taken it as our own
		}

		return builder.ToString();
	}

	// loading
	// ==================

	static object CreateNewInstanceOfType(Type type)
	{
		if (typeof(IList).IsAssignableFrom(type) || typeof(IDictionary).IsAssignableFrom(type)) // special cases, which require that we call the constructor
			return Activator.CreateInstance(type, true);
		return FormatterServices.GetUninitializedObject(type); // preferred (for simplicity/consistency's sake): create an instance of the type, completely uninitialized 
	}

	public T ToObject<T>(VDFLoadOptions loadOptions = null) { return (T)ToObject(typeof(T), loadOptions); }
	public object ToObject(VDFLoadOptions loadOptions, Type declaredType = null) { return ToObject(declaredType, loadOptions); }
	public object ToObject(Type declaredType = null, VDFLoadOptions loadOptions = null)
	{
		loadOptions = loadOptions ?? new VDFLoadOptions();

		var finalMetadata_type = metadata_type;
		if (finalMetadata_type == "") // empty string for metadata_type, so infer type
		{
			if (baseValue == "null")
				return null;
			if (baseValue == "empty")
				return "";
			if (new[] {"true", "false"}.Contains(baseValue))
				finalMetadata_type = "bool";
			else if (baseValue.Contains("."))
				finalMetadata_type = "float";
			else
				finalMetadata_type = "int";
		}
		else if (finalMetadata_type == "System.Collections.IList")
			finalMetadata_type = "List[object]";
		else if (finalMetadata_type == "System.Collections.IDictionary")
			finalMetadata_type = "Dictionary[object,object]";

		Type finalType = declaredType;
		if (finalMetadata_type != null && finalMetadata_type.Length > 0)
		{
			var fromMetadataType = VDF.GetTypeByVName(finalMetadata_type, loadOptions);
			if (finalType == null || finalType.IsAssignableFrom(fromMetadataType)) // if there is no declared type, or the from-metadata type is more specific than the declared type
				finalType = fromMetadataType;
		}

		// note; C# 3.5 doesn't have anonymous objects, so we can't replicate the infer-compatible-types-for-unknown-types option that we have in the JS version
		// if the type isn't specified in the VDF text itself, or as a declared type, infer that it's a string (string is the default type)
		if (finalType == null)
			finalType = typeof(string); // string is the default/fallback type
		
		object result;
		if (VDF.typeImporters_inline.ContainsKey(finalType))
			result = VDF.typeImporters_inline[finalType](baseValue, finalType.GetGenericArguments().ToList());
		else if (finalType.IsGenericType && VDF.typeImporters_inline.ContainsKey(finalType.GetGenericTypeDefinition()))
			result = VDF.typeImporters_inline[finalType.GetGenericTypeDefinition()](baseValue, finalType.GetGenericArguments().ToList());
		else if (finalType.IsEnum)
			result = Enum.Parse(finalType, baseValue);
		else if (finalType.IsPrimitive || finalType == typeof(string))
			result = Convert.ChangeType(baseValue, finalType);
		else if (baseValue != null) // (non-importer-registered objects, the only alternative to base-value-fallback-strings left, doesn't store base-values)
			result = Convert.ChangeType(baseValue, typeof(string));
		else
		{
			result = CreateNewInstanceOfType(finalType);
			IntoObject(result, loadOptions, (declaredType != null && declaredType.IsGenericType) || (metadata_type != "System.Collections.IList" && metadata_type != "System.Collections.IDictionary"));
		}

		return result;
	}
	public void IntoObject(object obj, VDFLoadOptions loadOptions = null, bool typeGenericArgumentsAreReal = true)
	{
		loadOptions = loadOptions ?? new VDFLoadOptions();

		var type = obj.GetType();
		var typeInfo = VDFTypeInfo.Get(type);
		for (var i = 0; i < items.Count; i++)
			if (obj is Array)
				((Array)obj).SetValue(items[i].ToObject(type.GetElementType(), loadOptions), i);
			else if (obj is IList)
				((IList)obj).Add(items[i].ToObject(typeGenericArgumentsAreReal ? type.GetGenericArguments()[0] : null, loadOptions));
		foreach (string propName in properties.Keys)
			try
			{
				if (obj is IDictionary)
				{
					object key = propName; // in most cases, the Dictionary's in-code key-type will be a string, so we can just use the in-VDF raw-key-string directly
					if (typeGenericArgumentsAreReal)
						if (VDF.typeImporters_inline.ContainsKey(type.GetGenericArguments()[0]))
							key = VDF.typeImporters_inline[type.GetGenericArguments()[0]](propName, type.GetGenericArguments()[0].GetGenericArguments().ToList());
						else if (type.GetGenericArguments()[0].IsGenericType && VDF.typeImporters_inline.ContainsKey(type.GetGenericArguments()[0].GetGenericTypeDefinition()))
							key = VDF.typeImporters_inline[type.GetGenericArguments()[0].GetGenericTypeDefinition()](propName, type.GetGenericArguments()[0].GetGenericArguments().ToList());
					((IDictionary)obj).Add(key, properties[propName].ToObject(typeGenericArgumentsAreReal ? type.GetGenericArguments()[1] : null, loadOptions));
				}
				else
					typeInfo.propInfoByName[propName].SetValue(obj, properties[propName].ToObject(typeGenericArgumentsAreReal ? typeInfo.propInfoByName[propName].GetPropType() : null, loadOptions));
			}
			catch (Exception ex) { throw new VDFException("Error loading key-value-pair or property '" + propName + "'.", ex); }

		// call post-deserialize constructors before post-deserialize normal methods
		foreach (VDFMethodInfo method in VDFTypeInfo.Get(type).methodInfo.Where(methodInfo=>methodInfo.memberInfo is ConstructorInfo && methodInfo.postDeserializeMethod))
			method.Call(obj, method.memberInfo.GetParameters().Length > 0 ? new[] {loadOptions.message} : new object[0]);
		foreach (VDFMethodInfo method in VDFTypeInfo.Get(type).methodInfo.Where(methodInfo=>methodInfo.memberInfo is MethodInfo && methodInfo.postDeserializeMethod))
			method.Call(obj, method.memberInfo.GetParameters().Length > 0 ? new[] {loadOptions.message } : new object[0]);
	}
}