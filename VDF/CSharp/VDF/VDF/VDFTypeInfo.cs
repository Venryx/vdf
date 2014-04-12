﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct)]
public class VDFType : Attribute
{
	public bool includePropsL1;
	public VDFType(bool includePropsL1) { this.includePropsL1 = includePropsL1; }
}

public class VDFTypeInfo
{
	static Dictionary<Type, VDFTypeInfo> cachedTypeInfo = new Dictionary<Type, VDFTypeInfo>();
	public static VDFTypeInfo Get(Type type)
	{
		if (!cachedTypeInfo.ContainsKey(type))
		{
			var vdfTypeAttribute = (VDF.typeVDFTypeOverrides.ContainsKey(type) ? VDF.typeVDFTypeOverrides[type] : null) ?? (VDFType)type.GetCustomAttributes(typeof(VDFType), true).FirstOrDefault();

			var typeInfo = new VDFTypeInfo();
			foreach (FieldInfo field in type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance))
				typeInfo.propInfoByName[field.Name] = VDFPropInfo.Get(field);
			foreach (PropertyInfo property in type.GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance))
				typeInfo.propInfoByName[property.Name] = VDFPropInfo.Get(property);
			if (vdfTypeAttribute != null)
				typeInfo.props_includeL1 = vdfTypeAttribute.includePropsL1;
			cachedTypeInfo[type] = typeInfo;
		}
		return cachedTypeInfo[type];
	}

	public bool props_includeL1;
	public Dictionary<string, VDFPropInfo> propInfoByName;

	public VDFTypeInfo()
	{
		props_includeL1 = false; // by default, use an opt-in approach
		propInfoByName = new Dictionary<string, VDFPropInfo>();
	}
}

[AttributeUsage(AttributeTargets.Field | AttributeTargets.Property)]
public class VDFProp : Attribute
{
	public bool includeL2;
	public bool popOutItemsToOwnLines;
	public bool ignoreEmptyValue;
	public VDFProp(bool includeL2 = true, bool popOutItemsToOwnLines = false, bool ignoreEmptyValue = false)
	{
		this.includeL2 = includeL2;
		this.popOutItemsToOwnLines = popOutItemsToOwnLines;
		this.ignoreEmptyValue = ignoreEmptyValue;
	}
}

public class VDFPropInfo
{
	static Dictionary<MemberInfo, VDFPropInfo> cachedTypeInfo = new Dictionary<MemberInfo, VDFPropInfo>();
	public static VDFPropInfo Get(FieldInfo field)
	{
		if (!cachedTypeInfo.ContainsKey(field))
		{
			var vdfPropAttribute = (VDF.propVDFPropOverrides.ContainsKey(field) ? VDF.propVDFPropOverrides[field] : null) ?? (VDFProp)field.GetCustomAttributes(typeof(VDFProp), true).FirstOrDefault();

			var propInfo = new VDFPropInfo();
			propInfo.memberInfo = field;
			if (vdfPropAttribute != null)
			{
				propInfo.includeL2 = vdfPropAttribute.includeL2;
				propInfo.popOutItemsToOwnLines = vdfPropAttribute.popOutItemsToOwnLines;
				propInfo.ignoreEmptyValue = vdfPropAttribute.ignoreEmptyValue;
			}
			cachedTypeInfo[field] = propInfo;
		}
		return cachedTypeInfo[field];
	}
	public static VDFPropInfo Get(PropertyInfo property)
	{
		if (!cachedTypeInfo.ContainsKey(property))
		{
			var vdfPropAttribute = (VDF.propVDFPropOverrides.ContainsKey(property) ? VDF.propVDFPropOverrides[property] : null) ?? (VDFProp)property.GetCustomAttributes(typeof(VDFProp), true).FirstOrDefault();

			var propInfo = new VDFPropInfo();
			propInfo.memberInfo = property;
			if (vdfPropAttribute != null)
			{
				propInfo.includeL2 = vdfPropAttribute.includeL2;
				propInfo.popOutItemsToOwnLines = vdfPropAttribute.popOutItemsToOwnLines;
				propInfo.ignoreEmptyValue = vdfPropAttribute.ignoreEmptyValue;
			}
			cachedTypeInfo[property] = propInfo;
		}
		return cachedTypeInfo[property];
	}

	bool ignoreEmptyValue;

	public MemberInfo memberInfo;
	public bool? includeL2;
	public bool popOutItemsToOwnLines;

	public Type GetPropType() { return memberInfo is PropertyInfo ? ((PropertyInfo)memberInfo).PropertyType : ((FieldInfo)memberInfo).FieldType; }
	public bool IsXIgnorableValue(object x)
	{
		if (ignoreEmptyValue && x is IList && ((IList)x).Count == 0)
			return true;
		if (GetPropType().IsValueType)
			return x == Activator.CreateInstance(GetPropType());
		return x == null;
	}
	public object GetValue(object objParent)
	{
		if (memberInfo is FieldInfo)
			return ((FieldInfo)memberInfo).GetValue(objParent);
		return ((PropertyInfo)memberInfo).GetValue(objParent, null);
	}
	public void SetValue(object objParent, object value)
	{
		if (memberInfo is FieldInfo)
			((FieldInfo)memberInfo).SetValue(objParent, value);
		else
			((PropertyInfo)memberInfo).SetValue(objParent, value, null);
	}
}