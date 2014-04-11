﻿enum VDFTokenType
{
	None,
	PoppedOutNodeMarker,
	SpecialMetadataStartMarker,
	SpecialMetadataEndMarker,
	MetadataStartMarker,
	Metadata_BaseValue,
	MetadataEndMarker,
	//LiteralMarker, // this is taken care of within the TokenParser class, so we don't need a passable-to-the-outside enum-value for it
	Data_PropName,
	DataStartMarker,
	ItemSeparator,
	Data_BaseValue,
	DataEndMarker,
	LineBreak,
	InLineComment,
	//Indent // this is taken care of at a higher level by the VDFLoader class
}
class VDFToken
{
	type: VDFTokenType;
	text: string;
	constructor(type: VDFTokenType, text: string)
	{
		this.type = type;
		this.text = text;
	}
}
class VDFTokenParser
{
	vdf: string;
	nextCharPos: number;
	tokens: Array<VDFToken>;
	constructor(vdf: string, firstCharPos: number)
	{
		this.vdf = vdf;
		this.nextCharPos = firstCharPos;
		this.tokens = new Array<VDFToken>();
	}

	GetNextToken(): VDFToken
	{
		var tokenType = VDFTokenType.None;
		var tokenTextBuilder = new StringBuilder();

		var inLiteralMarkers = false;

		var i = this.nextCharPos;
		for (; i < this.vdf.length && tokenType == VDFTokenType.None; i++)
		{
			var lastChar = i > 0 ? this.vdf[i - 1] : null;
			var ch = this.vdf[i];
			var nextChar = i < this.vdf.length - 1 ? this.vdf[i + 1] : null;
			var nextNextChar = i < this.vdf.length - 2 ? this.vdf[i + 2] : null;

			if (lastChar != '@' && ch == '@' && nextChar == '@' && (!inLiteralMarkers || nextNextChar == '}' || nextNextChar == '\n')) // special case; escape literals
			{
				tokenTextBuilder = new StringBuilder(VDFTokenParser.FinalizedDataStringToRaw(tokenTextBuilder.ToString()));
				inLiteralMarkers = !inLiteralMarkers;
				i++; // increment index by one extra, so as to have the next char processed be the first char after literal-marker
				if (!inLiteralMarkers) // if literal-block ended, return chars as Data_BaseValue token
					tokenType = VDFTokenType.Data_BaseValue;
				continue;
			}
			tokenTextBuilder.Append(ch);
			if (inLiteralMarkers) // don't do any token processing, (other than the literal-block-related stuff), until end-literal-marker is reached
				continue;

			if (ch == '<')
			{
				if (nextChar == '<')
				{
					tokenType = VDFTokenType.SpecialMetadataStartMarker;
					i++;
				}
				else
					tokenType = VDFTokenType.MetadataStartMarker;
			}
			else if (ch == '>')
			{
				if (nextChar == '>')
				{
					tokenType = VDFTokenType.SpecialMetadataEndMarker;
					i++;
				}
				else
					tokenType = VDFTokenType.MetadataEndMarker;
			}
			else if (ch == '{')
				tokenType = VDFTokenType.DataStartMarker;
			else if (ch == '}')
				tokenType = VDFTokenType.DataEndMarker;
			else // non-bracket char
			{
				if (ch == '\n')
					tokenType = VDFTokenType.LineBreak;
				else if ((lastChar == null || lastChar == '\n') && ch == '/' && nextChar == '/') {
					tokenType = VDFTokenType.InLineComment;
					i = VDFTokenParser.FindNextLineBreakCharPos(this.vdf, i + 2); // since rest of line is comment, skip to first char of next line
				}
				//else if (ch == '\t')
				//	tokenType = VDFTokenType.Indent;
				else if (ch == '#' && lastChar == '\t')
					tokenType = VDFTokenType.PoppedOutNodeMarker;
				else if (ch == '|')
					tokenType = VDFTokenType.ItemSeparator;
				else if (nextChar == '>')
					tokenType = VDFTokenType.Metadata_BaseValue;
				else if (nextChar == '{')
					tokenType = VDFTokenType.Data_PropName;
				else if (nextChar == '}' || nextChar == '|' || nextChar == '\n' || nextChar == null) // if normal char, and we're at end of normal-segment
					tokenType = VDFTokenType.Data_BaseValue;
			}
		}
		this.nextCharPos = i;

		var token = tokenType != VDFTokenType.None ? new VDFToken(tokenType, tokenTextBuilder.ToString()) : null;
		this.tokens.push(token);
		return token;
	}

	static FindNextLineBreakCharPos(vdfFile: string, searchStartPos: number): number
	{
		for (var i = searchStartPos; i < vdfFile.length; i++)
			if (vdfFile[i] == '\n')
				return i;
		return -1;
	}

	static FinalizedDataStringToRaw(finalizedDataStr: string): string
	{
		var result: string = finalizedDataStr;
		if (finalizedDataStr.contains("}"))
		{
			if ((result[result.length - 2] == '@' || result[result.length - 2] == '|') && result.endsWith("|"))
				result = result.substring(0, result.length - 1); // chop of last char, as it was just added by the serializer for separation
			result = result.replace(/@@@(?=\n|}|$)/g, "@@"); // remove extra '@' char added to all troublesome (before-end-of-line-or-end-bracket-or-end-of-string) two-at-signs char-segments
		}
		return result;
	}
}