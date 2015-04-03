﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;

public enum VDFTypeMarking
{
	None,
	Internal,
	External,
	ExternalNoCollapse // maybe temp
}
public class VDFSaveOptions
{
	public object message;
	public VDFTypeMarking typeMarking;

	// for JSON compatibility
	public bool useMetadata;
	public bool useChildPopOut;
	public bool useStringKeys;
	public bool useNumberTrimming; // e.g. trims 0.123 to .123
	public bool useCommaSeparators; // currently only applies to non-popped-out children

	// CS only
	public List<MemberInfo> propIncludesL3;
	public List<MemberInfo> propExcludesL4;
	public List<MemberInfo> propIncludesL5;
	public Dictionary<string, string> namespaceAliasesByName;
	public Dictionary<Type, string> typeAliasesByType;

	public VDFSaveOptions(object message = null, VDFTypeMarking typeMarking = VDFTypeMarking.Internal,
		bool useMetadata = true, bool useChildPopOut = true, bool useStringKeys = false, bool useNumberTrimming = true, bool useCommaSeparators = false, 
		IEnumerable<MemberInfo> propIncludesL3 = null, IEnumerable<MemberInfo> propExcludesL4 = null, IEnumerable<MemberInfo> propIncludesL5 = null, Dictionary<string, string> namespaceAliasesByName = null, Dictionary<Type, string> typeAliasesByType = null)
	{
		this.message = message;
		this.typeMarking = typeMarking;
		this.useMetadata = useMetadata;
		this.useChildPopOut = useChildPopOut;
		this.useStringKeys = useStringKeys;
		this.useNumberTrimming = useNumberTrimming;
		this.useCommaSeparators = useCommaSeparators;
		this.propIncludesL3 = propIncludesL3 != null ? propIncludesL3.ToList() : new List<MemberInfo>();
		this.propExcludesL4 = propExcludesL4 != null ? propExcludesL4.ToList() : new List<MemberInfo>();
		this.propIncludesL5 = propIncludesL5 != null ? propIncludesL5.ToList() : new List<MemberInfo>();
		this.namespaceAliasesByName = namespaceAliasesByName ?? new Dictionary<string, string>();
		this.typeAliasesByType = typeAliasesByType ?? new Dictionary<Type, string>();
	}

	public VDFSaveOptions ForJSON() // helper function for JSON compatibility
	{
		useMetadata = false;
		useChildPopOut = false;
		useStringKeys = true;
		useNumberTrimming = false;
		useCommaSeparators = true;
		return this;
	}
}

public static class VDFSaver
{
	public static VDFNode ToVDFNode<T>(object obj, VDFSaveOptions options = null) { return ToVDFNode(obj, typeof(T), options); }
	public static VDFNode ToVDFNode(object obj, VDFSaveOptions options) { return ToVDFNode(obj, null, options); }
	public static VDFNode ToVDFNode(object obj, Type declaredType = null, VDFSaveOptions options = null, VDFPropInfo prop = null, bool declaredTypeInParentVDF = false)
	{
		options = options ?? new VDFSaveOptions();
		
		Type type = obj != null ? obj.GetType() : null;
		var typeGenericArgs = VDF.GetGenericArgumentsOfType(type);
		var typeInfo = type != null ? VDFTypeInfo.Get(type) : null; //VDFTypeInfo.Get(type) : null; // so anonymous object can be recognized

		if (obj != null)
			foreach (VDFMethodInfo method in VDFTypeInfo.Get(type).methods.Values.Where(a=>a.preSerializeTag != null))
				method.Call(obj, prop, options);

		VDFNode result = null;
		bool serializedByCustomMethod = false;
		if (obj != null)
			foreach (VDFMethodInfo method in VDFTypeInfo.Get(type).methods.Values.Where(a=>a.serializeTag != null))
			{
				object serializeResult = method.Call(obj, prop, options);
				if (serializeResult != VDF.NoActionTaken)
				{
					result = (VDFNode)serializeResult;
					serializedByCustomMethod = true;
				}
			}

		if (!serializedByCustomMethod)
		{
			result = new VDFNode();
			if (obj == null) {} //result.primitiveValue = null;}
			else if (VDF.GetIsTypePrimitive(type))
				result.primitiveValue = obj;
			else if (type.IsEnum) // helper exporter for enums
				result.primitiveValue = obj.ToString();
			else if (obj is IList) // this saves arrays also
			{
				result.isList = true;
				var objAsList = (IList)obj;
				for (var i = 0; i < objAsList.Count; i++)
					result.listChildren.Add(ToVDFNode(objAsList[i], typeGenericArgs[0], options, prop, true));
			}
			else if (obj is IDictionary)
			{
				result.isMap = true;
				var objAsDictionary = (IDictionary)obj;
				foreach (object key in objAsDictionary.Keys)
					result.mapChildren.Add(ToVDFNode(key, typeGenericArgs[0], options, prop, true), ToVDFNode(objAsDictionary[key], typeGenericArgs[1], options, prop, true));
			}
			else // if an object, with properties
			{
				result.isMap = true;
				foreach (string propName in typeInfo.props.Keys)
					try
					{
						VDFPropInfo propInfo = typeInfo.props[propName];
						bool include = typeInfo.typeTag.propIncludeRegexL1 != null ? new Regex(typeInfo.typeTag.propIncludeRegexL1).IsMatch(propName) : false; //new Regex("^" + typeInfo.propIncludeRegexL1 + "$").IsMatch(propName);
						include = propInfo.propTag != null ? propInfo.propTag.includeL2 : include;
						include = options.propIncludesL3.Contains(propInfo.memberInfo) || options.propIncludesL3.Contains(VDF.AnyMember) ? true : include;
						include = options.propExcludesL4.Contains(propInfo.memberInfo) || options.propExcludesL4.Contains(VDF.AnyMember) ? false : include;
						include = options.propIncludesL5.Contains(propInfo.memberInfo) || options.propIncludesL5.Contains(VDF.AnyMember) ? true : include;
						if (!include)
							continue;

						object propValue = propInfo.GetValue(obj);
						if (propInfo.IsXValueTheDefault(propValue) && propInfo.propTag != null && !propInfo.propTag.writeDefaultValue)
							continue;

						// if obj is an anonymous type, considers its props' declared-types to be null, since even internal loading doesn't have a class declaration it can look up
						var propValueNode = ToVDFNode(propValue, !type.Name.Contains("<") ? propInfo.GetPropType() : null, options, propInfo);
						propValueNode.childPopOut = options.useChildPopOut && (propInfo.propTag != null ? propInfo.propTag.popOutL2 : propValueNode.childPopOut);
						result.mapChildren.Add(propName, propValueNode);
					}
					catch (Exception ex)
					{
						throw new VDFException("Error saving property '" + propName + "'.", ex);
					}
			}
		}

		if (declaredType == null)
			if (result.isList || result.listChildren.Count > 0)
				declaredType = typeof(List<object>);
			else if (result.isMap || result.mapChildren.Count > 0)
				declaredType = typeof(Dictionary<object, object>);
			else
				declaredType = typeof(object);
		if (options.useMetadata && type != null && !VDF.GetIsTypeAnonymous(type) &&
		(
			(options.typeMarking == VDFTypeMarking.Internal && !VDF.GetIsTypePrimitive(type) && type != declaredType) ||
			(options.typeMarking == VDFTypeMarking.External && !VDF.GetIsTypePrimitive(type) && (type != declaredType || !declaredTypeInParentVDF)) ||
			options.typeMarking == VDFTypeMarking.ExternalNoCollapse
		))
			result.metadata = VDF.GetNameOfType(type, options);

		if (options.useChildPopOut && typeInfo != null && typeInfo.typeTag.popOutL1)
			result.childPopOut = true;

		if (obj != null)
			foreach (VDFMethodInfo method in VDFTypeInfo.Get(type).methods.Values.Where(a=>a.postSerializeTag != null))
				method.Call(obj, prop, options);

		return result;
	}
}