﻿enum VDFTokenType {
	//WiderMetadataEndMarker,
	//MetadataBaseValue,
	//LiteralStartMarker, // this is taken care of within the TokenParser class, so we don't need a passable-to-the-outside enum-value for it
	//LiteralEndMarker
	//DataPropName,
	//DataStartMarker,
	//PoppedOutDataStartMarker,
	//PoppedOutDataEndMarker,
	//ItemSeparator,
	//DataBaseValue,
	//DataEndMarker,
	//Indent,

	// helper tokens for token-parser (or reader)
	LiteralStartMarker,
	LiteralEndMarker,
	StringStartMarker,
	StringEndMarker,
	InLineComment,
	SpaceOrCommaSpan,

	None,
	Tab,
	LineBreak,

	Metadata,
	MetadataEndMarker,
	Key,
	KeyValueSeparator,
	PoppedOutChildGroupMarker,

	Null,
	Boolean,
	Number,
	String,
	ListStartMarker,
	ListEndMarker,
	MapStartMarker,
	MapEndMarker
}
class VDFToken {
	type: VDFTokenType;
	position: number;
	index: number;
	text: string;
	constructor(type: VDFTokenType, position: number, index: number, text: string) {
		this.type = type;
		this.position = position;
		this.index = index;
		this.text = text;
	}
}
class VDFTokenParser {
	static charsAToZ: List<string> = <List<string>>List.apply(null, ["string"].concat("abcdefghijklmnopqrstuvwxyz".match(/./g)));
	static chars0To9DotAndNegative: List<string> = <List<string>>List.apply(null, ["string"].concat("0123456789\.\-\+eE".match(/./g)));
	public static ParseTokens(text: string, options?: VDFLoadOptions, parseAllTokens = false, postProcessTokens = true): List<VDFToken> {
		text = (text || "").replace(/\r\n/g, "\n"); // maybe temp
		options = options || new VDFLoadOptions();

		var result = new List<VDFToken>("VDFToken");

		var currentTokenFirstCharPos = 0;
		var currentTokenTextBuilder = new StringBuilder();
		var currentTokenType = VDFTokenType.None;
		var activeLiteralStartChars: string = null;
		var activeStringStartChar: string = null;
		var lastScopeIncreaseChar: string = null;
		var addNextCharToTokenText = true;

		var specialEnderChar = '№';
		text += specialEnderChar; // add special ender-char, so don't need to use Nullable for nextChar var

		var ch;
		var nextChar = text[0];
		for (var i = 0; i < text.length - 1; i++) {
			ch = nextChar;
			nextChar = text[i + 1];

			if (addNextCharToTokenText)
				currentTokenTextBuilder.Append(ch);
			addNextCharToTokenText = true;

			if (activeLiteralStartChars != null) { // if in literal
				// if first char of literal-end-marker
				if (ch == '>' && i + activeLiteralStartChars.length <= text.length && text.substr(i, activeLiteralStartChars.length) == activeLiteralStartChars.replace(/</g, ">")) {
					if (parseAllTokens)
						result.Add(new VDFToken(VDFTokenType.LiteralEndMarker, i, result.Count, activeLiteralStartChars.replace(/</g, ">"))); // (if this end-marker token is within a string, it'll come before the string token)
					currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text
					currentTokenFirstCharPos += activeLiteralStartChars.length; // don't count this inserted token text as part of main-token text
					i += activeLiteralStartChars.length - 2; // have next char processed be the last char of literal-end-marker
					addNextCharToTokenText = false; // but don't have it be added to the main-token text

					if (text[i + 1 - activeLiteralStartChars.length] == '#') // if there was a hash just before literal-end-marker (e.g. "some text>#>>"), remove it from main-token text
						currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text

					activeLiteralStartChars = null;

					nextChar = i < text.length - 1 ? text[i + 1] : specialEnderChar; // update after i-modification, since used for next loop's 'ch' value
					continue;
				}
			}
			else {
				if (ch == '<' && nextChar == '<') { // if first char of literal-start-marker
					activeLiteralStartChars = "";
					while (i + activeLiteralStartChars.length < text.length && text[i + activeLiteralStartChars.length] == '<')
						activeLiteralStartChars += "<";

					if (parseAllTokens)
						result.Add(new VDFToken(VDFTokenType.LiteralStartMarker, i, result.Count, activeLiteralStartChars));
					currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text
					currentTokenFirstCharPos += activeLiteralStartChars.length; // don't count this inserted token text as part of main-token text
					i += activeLiteralStartChars.length - 1; // have next char processed be the one right after literal-start-marker

					if (text[i + 1] == '#') { // if there is a hash just after literal-start-marker (e.g. "<<#<some text"), skip it
						currentTokenFirstCharPos++;
						i++;
					}

					nextChar = i < text.length - 1 ? text[i + 1] : specialEnderChar; // update after i-modification, since used for next loop's 'ch' value
					continue;
				}
				// else
				{
					if (activeStringStartChar == null) {
						if (ch == '\'' || ch == '"') { // if char of string-start-marker
							activeStringStartChar = ch;
							
							if (parseAllTokens)
								result.Add(new VDFToken(VDFTokenType.StringStartMarker, i, result.Count, activeStringStartChar));
							currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text
							currentTokenFirstCharPos++; // don't count this inserted token text as part of main-token text

							// special case; if string-start-marker for an empty string
							if (ch == nextChar)
								result.Add(new VDFToken(VDFTokenType.String, currentTokenFirstCharPos, result.Count, ""));
							
							continue;
						}
					}
					else if (activeStringStartChar == ch) {
						if (parseAllTokens)
							result.Add(new VDFToken(VDFTokenType.StringEndMarker, i, result.Count, ch));
						currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text
						currentTokenFirstCharPos++; // don't count this inserted token text as part of main-token text

						activeStringStartChar = null;

						continue;
					}
				}
			}

			// if not in literal
			if (activeLiteralStartChars == null)
				// if in a string
				if (activeStringStartChar != null) {
					// if last-char of string
					if (activeStringStartChar == nextChar)
						currentTokenType = VDFTokenType.String;
				}
				else {
					var firstTokenChar = currentTokenTextBuilder.Length == 1;
					if (nextChar == '>')
						currentTokenType = VDFTokenType.Metadata;
					else if (nextChar == ':') //&& ch != '\t' && ch != ' ') // maybe temp; consider tabs/spaces between key and : to be part of key
						currentTokenType = VDFTokenType.Key;
					else {
						// at this point, all the options are mutually-exclusive (concerning the 'ch' value), so use a switch statement)
						switch (ch) {
							case '#':
								if (nextChar == '#' && firstTokenChar) { // if first char of in-line-comment
									currentTokenTextBuilder = new StringBuilder(text.substr(i, (text.indexOf("\n", i + 1) != -1 ? text.indexOf("\n", i + 1) : text.length) - i));
									currentTokenType = VDFTokenType.InLineComment;
									i += currentTokenTextBuilder.Length - 1; // have next char processed by the one right after comment (i.e. the line-break char)

									nextChar = i < text.length - 1 ? text[i + 1] : specialEnderChar; // update after i-modification, since used for next loop's 'ch' value
								}
								break;
							case ' ':case ',':
								if ( // if last char of space-or-comma-span
									(ch == ' ' || (options.allowCommaSeparators && ch == ','))
									&& (nextChar != ' ' && (!options.allowCommaSeparators || nextChar != ','))
									&& currentTokenTextBuilder.ToString().TrimStart(options.allowCommaSeparators ? [' ', ','] : [' ']).length == 0
								)
									currentTokenType = VDFTokenType.SpaceOrCommaSpan;
								break;
							case '\t':
								if (firstTokenChar)
									currentTokenType = VDFTokenType.Tab;
								break;
							case '\n':
								if (firstTokenChar)
									currentTokenType = VDFTokenType.LineBreak;
								break;
							case '>':
								if (firstTokenChar)
									currentTokenType = VDFTokenType.MetadataEndMarker;
								break;
							case ':':
								//else if (nextNonSpaceChar == ':' && ch != ' ')
								if (firstTokenChar)
									currentTokenType = VDFTokenType.KeyValueSeparator;
								break;
							case '^':
								if (firstTokenChar)
									currentTokenType = VDFTokenType.PoppedOutChildGroupMarker;
								break;
							case 'l':
								if (currentTokenTextBuilder.Length == 4 && currentTokenTextBuilder.ToString() == "null" && (nextChar == null || !VDFTokenParser.charsAToZ.Contains(nextChar))) // if text-so-far is 'null', and there's no more letters
									currentTokenType = VDFTokenType.Null;
								break;
							case 'e':
								if ((currentTokenTextBuilder.Length == 5 && currentTokenTextBuilder.ToString() == "false")
									|| (currentTokenTextBuilder.Length == 4 && currentTokenTextBuilder.ToString() == "true")) {
									currentTokenType = VDFTokenType.Boolean;
									break;
								}
								/*else
									goto case '0';
								break;*/
							case '0':case '1':case '2':case '3':case '4':case '5':case '6':case '7':case '8':case '9':case '.':case '-':case '+':/*case 'e':*/case 'E':case 'y':
								if (
									( // if normal ("-12345" or "-123.45" or "-123e-45") number
										VDFTokenParser.chars0To9DotAndNegative.Contains(currentTokenTextBuilder[0]) && currentTokenTextBuilder[0].toLowerCase() != "e" // if first-char is valid as start of number
										//&& VDFTokenParser.chars0To9DotAndNegative.Contains(ch) // and current-char is valid as part of number // no longer needed, since case ensures it
										&& !VDFTokenParser.chars0To9DotAndNegative.Contains(nextChar) && nextChar != 'I' // and next-char is not valid as part of number
										&& (lastScopeIncreaseChar == "[" || result.Count == 0 || result.Last().type == VDFTokenType.Metadata || result.Last().type == VDFTokenType.KeyValueSeparator)
									)
									// or infinity number
									|| ((currentTokenTextBuilder.Length == 8 && currentTokenTextBuilder.ToString() == "Infinity") || (currentTokenTextBuilder.Length == 9 && currentTokenTextBuilder.ToString() == "-Infinity"))
								)
									currentTokenType = VDFTokenType.Number;
								break;
							case '[':
								if (firstTokenChar) {
									currentTokenType = VDFTokenType.ListStartMarker;
									lastScopeIncreaseChar = ch;
								}
								break;
							case ']':
								if (firstTokenChar)
									currentTokenType = VDFTokenType.ListEndMarker;
								break;
							case '{':
								if (firstTokenChar) {
									currentTokenType = VDFTokenType.MapStartMarker;
									lastScopeIncreaseChar = ch;
								}
								break;
							case '}':
								if (firstTokenChar)
									currentTokenType = VDFTokenType.MapEndMarker;
								break;
						}
					}
				}

			if (currentTokenType != VDFTokenType.None) {
				if (parseAllTokens || (currentTokenType != VDFTokenType.InLineComment && currentTokenType != VDFTokenType.SpaceOrCommaSpan && currentTokenType != VDFTokenType.MetadataEndMarker))
					result.Add(new VDFToken(currentTokenType, currentTokenFirstCharPos, result.Count, currentTokenTextBuilder.ToString()));

				currentTokenFirstCharPos = i + 1;
				currentTokenTextBuilder.Clear();
				currentTokenType = VDFTokenType.None;
			}
		}

		if (postProcessTokens)
			result = VDFTokenParser.PostProcessTokens(result, options);

		return result;
	}
	/*static FindNextNonXCharPosition(text: string, startPos: number, x: string) {
		for (var i = startPos; i < text.length; i++)
			if (text[i] != x)
				return i;
		return -1;
	}*/
	/*static UnpadString(paddedString: string) {
		var result = paddedString;
		if (result.StartsWith("#"))
			result = result.substr(1); // chop off first char, as it was just added by the serializer for separation
		if (result.EndsWith("#"))
			result = result.substr(0, result.length - 1);
		return result;
	}*/

	static PostProcessTokens(tokens: List<VDFToken>, options: VDFLoadOptions): List<VDFToken> {
		// pass 1: update strings-before-key-value-separator-tokens to be considered keys, if that's enabled (one reason being, for JSON compatibility)
		// ----------
		
		if (options.allowStringKeys)
			for (var i = <any>0; i < tokens.Count; i++)
				if (tokens[i].type == VDFTokenType.String && i + 1 < tokens.Count && tokens[i + 1].type == VDFTokenType.KeyValueSeparator)
					tokens[i].type = VDFTokenType.Key;

		// pass 2: re-wrap popped-out-children with parent brackets/braces
		// ----------

		tokens.Add(new VDFToken(VDFTokenType.None, -1, -1, "")); // maybe temp: add depth-0-ender helper token

		var line_tabsReached = 0;
		var tabDepth_popOutBlockEndWrapTokens = new Dictionary<number, List<VDFToken>>("int", "List(VDFToken)");
		for (var i = <any>0; i < tokens.Count; i++) {
			var lastToken = i - 1 >= 0 ? tokens[i - 1] : null;
			var token = tokens[i];
			if (token.type == VDFTokenType.Tab)
				line_tabsReached++;
			else if (token.type == VDFTokenType.LineBreak)
				line_tabsReached = 0;
			else if (token.type == VDFTokenType.PoppedOutChildGroupMarker) {
				if (lastToken.type == VDFTokenType.ListStartMarker || lastToken.type == VDFTokenType.MapStartMarker) { //lastToken.type != VDFTokenType.Tab)
					var enderTokenIndex = i + 1;
					while (enderTokenIndex < tokens.Count - 1 && tokens[enderTokenIndex].type != VDFTokenType.LineBreak && (tokens[enderTokenIndex].type != VDFTokenType.PoppedOutChildGroupMarker || tokens[enderTokenIndex - 1].type == VDFTokenType.ListStartMarker || tokens[enderTokenIndex - 1].type == VDFTokenType.MapStartMarker))
						enderTokenIndex++;
					var wrapGroupTabDepth = tokens[enderTokenIndex].type == VDFTokenType.PoppedOutChildGroupMarker ? line_tabsReached - 1 : line_tabsReached;
					tabDepth_popOutBlockEndWrapTokens.Set(wrapGroupTabDepth, tokens.GetRange(i + 1, enderTokenIndex - (i + 1)));
					tabDepth_popOutBlockEndWrapTokens.Get(wrapGroupTabDepth)[0].index = i + 1; // update index
					i = enderTokenIndex - 1; // have next token processed be the ender-token (^^[...] or line-break)
				}
				else if (lastToken.type == VDFTokenType.Tab) {
					var wrapGroupTabDepth = lastToken.type == VDFTokenType.Tab ? line_tabsReached - 1 : line_tabsReached;
					tokens.InsertRange(i, tabDepth_popOutBlockEndWrapTokens.Get(wrapGroupTabDepth));
					//tokens.RemoveRange(tokens.IndexOf(tabDepth_popOutBlockEndWrapTokens[wrapGroupTabDepth][0]), tabDepth_popOutBlockEndWrapTokens[wrapGroupTabDepth].Count);
					tokens.RemoveRange(tabDepth_popOutBlockEndWrapTokens.Get(wrapGroupTabDepth)[0].index, tabDepth_popOutBlockEndWrapTokens.Get(wrapGroupTabDepth).Count); // index was updated when set put together
					/*for (var i2 in tabDepth_popOutBlockEndWrapTokens[wrapGroupTabDepth].Indexes()) {
						var token2 = tabDepth_popOutBlockEndWrapTokens[wrapGroupTabDepth][i2];
						tokens.Remove(token2);
						tokens.Insert(i - 1, token2);
					}*/

					// maybe temp; fix for that tokens were not post-processed correctly for multiply-nested popped-out maps/lists
					VDFTokenParser.RefreshTokenPositionAndIndexProperties(tokens);

					i -= tabDepth_popOutBlockEndWrapTokens.Get(wrapGroupTabDepth).Count + 1; // have next token processed be the first pop-out-block-end-wrap-token
					tabDepth_popOutBlockEndWrapTokens.Remove(wrapGroupTabDepth);
				}
			}
			else if (lastToken != null && (lastToken.type == VDFTokenType.LineBreak || lastToken.type == VDFTokenType.Tab || token.type == VDFTokenType.None)) {
				if (token.type == VDFTokenType.None) // if depth-0-ender helper token
					line_tabsReached = 0;
				if (tabDepth_popOutBlockEndWrapTokens.Count > 0) {
					var maxTabDepth = -1;
					for (var key in tabDepth_popOutBlockEndWrapTokens.Keys)
						if (parseInt(key) > maxTabDepth)
							maxTabDepth = parseInt(key);
					for (var tabDepth = maxTabDepth; tabDepth >= line_tabsReached; tabDepth--)
						if (tabDepth_popOutBlockEndWrapTokens.ContainsKey(tabDepth)) {
							tokens.InsertRange(i, tabDepth_popOutBlockEndWrapTokens.Get(tabDepth));
							//tokens.RemoveRange(tokens.IndexOf(tabDepth_popOutBlockEndWrapTokens[tabDepth][0]), tabDepth_popOutBlockEndWrapTokens[tabDepth].Count);
							tokens.RemoveRange(tabDepth_popOutBlockEndWrapTokens.Get(tabDepth)[0].index, tabDepth_popOutBlockEndWrapTokens.Get(tabDepth).Count); // index was updated when set put together
							/*for (var i2 in tabDepth_popOutBlockEndWrapTokens[tabDepth].Indexes()) {
								var token2 = tabDepth_popOutBlockEndWrapTokens[tabDepth][i2];
								tokens.Remove(token2);
								tokens.Insert(i - 1, token2);
							}*/

							// maybe temp; fix for that tokens were not post-processed correctly for multiply-nested popped-out maps/lists
							VDFTokenParser.RefreshTokenPositionAndIndexProperties(tokens);

							tabDepth_popOutBlockEndWrapTokens.Remove(tabDepth);
						}
				}
			}
		}

		tokens.RemoveAt(tokens.Count - 1); // maybe temp: remove depth-0-ender helper token

		// pass 3: remove all now-useless tokens
		// ----------

		/*for (var i = tokens.Count - 1; i >= 0; i--)
			if (tokens[i].type == VDFTokenType.Tab || tokens[i].type == VDFTokenType.LineBreak || tokens[i].type == VDFTokenType.MetadataEndMarker || tokens[i].type == VDFTokenType.KeyValueSeparator || tokens[i].type == VDFTokenType.PoppedOutChildGroupMarker)
				tokens.RemoveAt(i);*/

		var result = new List<VDFToken>(); //"VDFToken");
		for (var i in tokens.Indexes()) {
			var token = tokens[i];
			if (!(token.type == VDFTokenType.Tab || token.type == VDFTokenType.LineBreak || token.type == VDFTokenType.MetadataEndMarker || token.type == VDFTokenType.KeyValueSeparator || token.type == VDFTokenType.PoppedOutChildGroupMarker))
				result.Add(token);
		}

		// pass 4: fix token position-and-index properties
		// ----------

		VDFTokenParser.RefreshTokenPositionAndIndexProperties(result); //tokens);

		//Console.Write(String.Join(" ", tokens.Select(a=>a.text).ToArray())); // temp; for testing

		return result;
	}
	static RefreshTokenPositionAndIndexProperties(tokens: List<VDFToken>) {
		var textProcessedLength = 0;
		for (var i = 0; i < tokens.Count; i++) {
			var token = tokens[i];
			token.position = textProcessedLength;
			token.index = i;
			textProcessedLength += token.text.length;
		}
	}
}