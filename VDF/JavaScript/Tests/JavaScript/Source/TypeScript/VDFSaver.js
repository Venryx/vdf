System.register(["./VDFExtras", "./VDF", "./VDFNode", "./VDFTypeInfo"], function (exports_1, context_1) {
    var __moduleName = context_1 && context_1.id;
    var VDFExtras_1, VDF_1, VDFNode_1, VDFTypeInfo_1, VDFTypeMarking, VDFSaveOptions, VDFSaver;
    return {
        setters: [
            function (VDFExtras_1_1) {
                VDFExtras_1 = VDFExtras_1_1;
            },
            function (VDF_1_1) {
                VDF_1 = VDF_1_1;
            },
            function (VDFNode_1_1) {
                VDFNode_1 = VDFNode_1_1;
            },
            function (VDFTypeInfo_1_1) {
                VDFTypeInfo_1 = VDFTypeInfo_1_1;
            }
        ],
        execute: function () {
            (function (VDFTypeMarking) {
                VDFTypeMarking[VDFTypeMarking["None"] = 0] = "None";
                VDFTypeMarking[VDFTypeMarking["Internal"] = 1] = "Internal";
                VDFTypeMarking[VDFTypeMarking["External"] = 2] = "External";
                VDFTypeMarking[VDFTypeMarking["ExternalNoCollapse"] = 3] = "ExternalNoCollapse"; // maybe temp
            })(VDFTypeMarking || (VDFTypeMarking = {}));
            exports_1("VDFTypeMarking", VDFTypeMarking);
            VDFSaveOptions = (function () {
                function VDFSaveOptions(initializerObj, messages, typeMarking, useMetadata, useChildPopOut, useStringKeys, useNumberTrimming, useCommaSeparators) {
                    if (typeMarking === void 0) { typeMarking = VDFTypeMarking.Internal; }
                    if (useMetadata === void 0) { useMetadata = true; }
                    if (useChildPopOut === void 0) { useChildPopOut = true; }
                    if (useStringKeys === void 0) { useStringKeys = false; }
                    if (useNumberTrimming === void 0) { useNumberTrimming = true; }
                    if (useCommaSeparators === void 0) { useCommaSeparators = false; }
                    this.messages = messages || [];
                    this.typeMarking = typeMarking;
                    this.useMetadata = useMetadata;
                    this.useChildPopOut = useChildPopOut;
                    this.useStringKeys = useStringKeys;
                    this.useNumberTrimming = useNumberTrimming;
                    this.useCommaSeparators = useCommaSeparators;
                    if (initializerObj)
                        for (var key in initializerObj)
                            this[key] = initializerObj[key];
                }
                VDFSaveOptions.prototype.ForJSON = function () {
                    this.useMetadata = false;
                    this.useChildPopOut = false;
                    this.useStringKeys = true;
                    this.useNumberTrimming = false;
                    this.useCommaSeparators = true;
                    return this;
                };
                return VDFSaveOptions;
            }());
            exports_1("VDFSaveOptions", VDFSaveOptions);
            VDFSaver = (function () {
                function VDFSaver() {
                }
                VDFSaver.ToVDFNode = function (obj, declaredTypeName_orOptions, options, path, declaredTypeInParentVDF) {
                    if (options === void 0) { options = new VDFSaveOptions(); }
                    if (declaredTypeName_orOptions instanceof VDFSaveOptions)
                        return VDFSaver.ToVDFNode(obj, null, declaredTypeName_orOptions);
                    var declaredTypeName = declaredTypeName_orOptions;
                    path = path || new VDFExtras_1.VDFNodePath(new VDFExtras_1.VDFNodePathNode(obj));
                    var typeName = obj != null ? (VDFExtras_1.EnumValue.IsEnum(declaredTypeName) ? declaredTypeName : VDF_1.VDF.GetTypeNameOfObject(obj)) : null; // at bottom, enums an integer; but consider it of a distinct type
                    var typeGenericArgs = VDF_1.VDF.GetGenericArgumentsOfType(typeName);
                    var typeInfo = typeName ? VDFTypeInfo_1.VDFTypeInfo.Get(typeName) : new VDFTypeInfo_1.VDFTypeInfo();
                    for (var propName_1 in VDF_1.VDF.GetObjectProps(obj))
                        if (obj[propName_1] instanceof Function && obj[propName_1].tags && obj[propName_1].tags.Any(function (a) { return a instanceof VDFTypeInfo_1.VDFPreSerialize; })) {
                            if (obj[propName_1](path, options) == VDF_1.VDF.CancelSerialize)
                                return VDF_1.VDF.CancelSerialize;
                        }
                    var result;
                    var serializedByCustomMethod = false;
                    for (var propName_2 in VDF_1.VDF.GetObjectProps(obj))
                        if (obj[propName_2] instanceof Function && obj[propName_2].tags && obj[propName_2].tags.Any(function (a) { return a instanceof VDFTypeInfo_1.VDFSerialize; })) {
                            var serializeResult = obj[propName_2](path, options);
                            if (serializeResult !== undefined) {
                                result = serializeResult;
                                serializedByCustomMethod = true;
                                break;
                            }
                        }
                    if (!serializedByCustomMethod) {
                        result = new VDFNode_1.VDFNode();
                        if (obj == null) { } //result.primitiveValue = null;
                        else if (VDF_1.VDF.GetIsTypePrimitive(typeName))
                            result.primitiveValue = obj;
                        else if (VDFExtras_1.EnumValue.IsEnum(typeName))
                            result.primitiveValue = new VDFExtras_1.EnumValue(typeName, obj).toString();
                        else if (typeName && typeName.StartsWith("List(")) {
                            result.isList = true;
                            var objAsList = obj;
                            for (var i = 0; i < objAsList.length; i++) {
                                var itemNode = VDFSaver.ToVDFNode(objAsList[i], typeGenericArgs[0], options, path.ExtendAsListItem(i, objAsList[i]), true);
                                if (itemNode == VDF_1.VDF.CancelSerialize)
                                    continue;
                                result.AddListChild(itemNode);
                            }
                        }
                        else if (typeName && typeName.StartsWith("Dictionary(")) {
                            result.isMap = true;
                            var objAsDictionary = obj;
                            for (var i = 0, pair = null, pairs = objAsDictionary.Pairs; i < pairs.length && (pair = pairs[i]); i++) {
                                var keyNode = VDFSaver.ToVDFNode(pair.key, typeGenericArgs[0], options, path.ExtendAsMapKey(i, pair.key), true); // stringify-attempt-1: use exporter
                                if (typeof keyNode.primitiveValue != "string")
                                    //throw new Error("A map key object must either be a string or have an exporter that converts it into a string.");
                                    keyNode = new VDFNode_1.VDFNode(pair.key.toString());
                                var valueNode = VDFSaver.ToVDFNode(pair.value, typeGenericArgs[1], options, path.ExtendAsMapItem(pair.key, pair.value), true);
                                if (valueNode == VDF_1.VDF.CancelSerialize)
                                    continue;
                                result.SetMapChild(keyNode, valueNode);
                            }
                        }
                        else {
                            result.isMap = true;
                            // special fix; we need to write something for each declared prop (of those included anyway), so insert empty props for those not even existent on the instance
                            for (var propName_3 in typeInfo.props) {
                                if (!(propName_3 in obj))
                                    obj[propName_3] = null;
                            }
                            for (var propName_4 in obj) {
                                try {
                                    var propInfo = typeInfo.props[propName_4]; // || new VDFPropInfo("object"); // if prop-info not specified, consider its declared-type to be 'object'
                                    /*let include = typeInfo.typeTag != null && typeInfo.typeTag.propIncludeRegexL1 != null ? new RegExp(typeInfo.typeTag.propIncludeRegexL1).test(propName) : false;
                                    include = propInfo && propInfo.propTag && propInfo.propTag.includeL2 != null ? propInfo.propTag.includeL2 : include;*/
                                    var include = propInfo && propInfo.propTag && propInfo.propTag.includeL2 != null ? propInfo.propTag.includeL2 : (typeInfo.typeTag != null && typeInfo.typeTag.propIncludeRegexL1 != null && new RegExp(typeInfo.typeTag.propIncludeRegexL1).test(propName_4));
                                    if (!include)
                                        continue;
                                    var propValue = obj[propName_4];
                                    // maybe temp; fix for ts derived-class constructors
                                    if (propName_4 == "constructor" && propValue instanceof Function)
                                        continue;
                                    if (propInfo && !propInfo.ShouldValueBeSaved(propValue))
                                        continue;
                                    var propNameNode = new VDFNode_1.VDFNode(propName_4);
                                    var propValueNode = void 0;
                                    var childPath = path.ExtendAsChild(propInfo, propValue);
                                    for (var propName2 in VDF_1.VDF.GetObjectProps(obj))
                                        if (obj[propName2] instanceof Function && obj[propName2].tags && obj[propName2].tags.Any(function (a) { return a instanceof VDFTypeInfo_1.VDFSerializeProp; })) {
                                            var serializeResult = obj[propName2](childPath, options);
                                            if (serializeResult !== undefined) {
                                                propValueNode = serializeResult;
                                                break;
                                            }
                                        }
                                    if (propValueNode === undefined)
                                        propValueNode = VDFSaver.ToVDFNode(propValue, propInfo ? propInfo.typeName : null, options, childPath);
                                    if (propValueNode == VDF_1.VDF.CancelSerialize)
                                        continue;
                                    propValueNode.childPopOut = options.useChildPopOut && (propInfo && propInfo.propTag && propInfo.propTag.popOutL2 != null ? propInfo.propTag.popOutL2 : propValueNode.childPopOut);
                                    result.SetMapChild(propNameNode, propValueNode);
                                }
                                finally { }
                            }
                        }
                    }
                    if (declaredTypeName == null)
                        if (result.isList || result.listChildren.Count > 0)
                            declaredTypeName = "List(object)";
                        else if (result.isMap || result.mapChildren.Count > 0)
                            declaredTypeName = "Dictionary(object object)";
                        else
                            declaredTypeName = "object";
                    if (options.useMetadata && typeName != null && !VDF_1.VDF.GetIsTypeAnonymous(typeName) && ((options.typeMarking == VDFTypeMarking.Internal && !VDF_1.VDF.GetIsTypePrimitive(typeName) && typeName != declaredTypeName)
                        || (options.typeMarking == VDFTypeMarking.External && !VDF_1.VDF.GetIsTypePrimitive(typeName) && (typeName != declaredTypeName || !declaredTypeInParentVDF))
                        || options.typeMarking == VDFTypeMarking.ExternalNoCollapse))
                        result.metadata = typeName;
                    if (result.metadata_override != null)
                        result.metadata = result.metadata_override;
                    if (options.useChildPopOut && typeInfo && typeInfo.typeTag && typeInfo.typeTag.popOutL1)
                        result.childPopOut = true;
                    for (var propName in VDF_1.VDF.GetObjectProps(obj))
                        if (obj[propName] instanceof Function && obj[propName].tags && obj[propName].tags.Any(function (a) { return a instanceof VDFTypeInfo_1.VDFPostSerialize; }))
                            obj[propName](result, path, options);
                    return result;
                };
                return VDFSaver;
            }());
            exports_1("VDFSaver", VDFSaver);
        }
    };
});
//# sourceMappingURL=VDFSaver.js.map