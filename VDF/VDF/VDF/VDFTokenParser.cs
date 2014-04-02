﻿using System.Collections.Generic;

enum TokenType
{
	None,
	Marker,
	StartMetadataBracket,
	Metadata_BaseValue,
	EndMetadataBracket,
	LiteralFlag,
	Data_PropName,
	StartDataBracket,
	ItemSeparator,
	Data_BaseValue,
	EndDataBracket,
	LineBreak,
	Indent
}
class Token
{
	public TokenType type;
	public string text;
	public Token(TokenType type, string text)
	{
		this.type = type;
		this.text = text;
	}
}
class VDFTokenParser
{
	string vdf;
	bool literalFlagOn;
	public int nextCharPos;
	public VDFTokenParser(string vdf, int firstCharPos)
	{
		this.vdf = vdf;
		nextCharPos = firstCharPos;
	}

	public Token GetNextToken()
	{
		var tokenType = TokenType.None;
		var tokenChars = new List<char>();
		int i = nextCharPos;
		for (; i < vdf.Length && tokenType == TokenType.None; i++)
		{
			char? lastChar = i > 0 ? vdf[i - 1] : (char?)null;
			char ch = vdf[i];
			char? nextChar = i < vdf.Length - 1 ? vdf[i + 1] : (char?)null;
			char? nextNextChar = i < vdf.Length - 2 ? vdf[i + 2] : (char?)null;

			if (ch == '@' && nextChar.HasValue && nextChar == '@' && nextNextChar.HasValue && nextNextChar == '@') // special case; escape literals
			{
				literalFlagOn = !literalFlagOn;
				i += 2; // skip to first char after literal-flag
				if (!literalFlagOn) // if literal-block ended, return chars as Data_BaseValue token
					tokenType = TokenType.Data_BaseValue;
				continue;
			}
			tokenChars.Add(ch);
			if (literalFlagOn) // don't do any token processing, (other than the literal-block-related stuff), until literal-flag is turned back off
				continue;

			if (ch == '<')
				tokenType = TokenType.StartMetadataBracket;
			else if (ch == '>')
				tokenType = TokenType.EndMetadataBracket;
			else if (ch == '{')
				tokenType = TokenType.StartDataBracket;
			else if (ch == '}')
				tokenType = TokenType.EndDataBracket;
			else // non-bracket char
			{
				if (ch == '\n')
					tokenType = TokenType.LineBreak;
				else if (ch == '\t')
					tokenType = TokenType.Indent;
				else if (ch == '#' && lastChar.HasValue && lastChar == '\t')
					tokenType = TokenType.Marker;
				else if (ch == '|')
					tokenType = TokenType.ItemSeparator;
				else if (nextChar.HasValue && nextChar == '>')
					tokenType = TokenType.Metadata_BaseValue;
				else if (nextChar.HasValue && nextChar == '{')
					tokenType = TokenType.Data_PropName;
				else if (nextChar.HasValue && (nextChar == '}' || nextChar == '|')) // if normal char, and we're at end of normal-segment
					tokenType = TokenType.Data_BaseValue;
			}
		}
		nextCharPos = i;

		return tokenType != TokenType.None ? new Token(tokenType, new string(tokenChars.ToArray())) : null;
	}
}