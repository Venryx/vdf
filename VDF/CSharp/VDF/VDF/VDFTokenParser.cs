﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using static VDFN.VDFGlobals;

namespace VDFN {
	public enum VDFTokenType {
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
	public class VDFToken {
		public VDFTokenType type;
		public int position;
		public int index;
		public string text;
		public VDFToken(VDFTokenType type, int position, int index, string text) {
			this.type = type;
			this.position = position;
			this.index = index;
			this.text = text;
		}

		public override string ToString() { // for debugging
			var result = "   " + text.Replace("\t", "\\t").Replace("\n", "\\n") + "   ";
			for (var i = result.Length; i < 30; i++)
				result += " ";
			return result;
		}
	}
	public static class VDFTokenParser {
		static List<char> charsAToZ = new Regex(".").Matches("abcdefghijklmnopqrstuvwxyz").OfType<Match>().Select(a=>a.Value[0]).ToList();
		static HashSet<char> chars0To9DotAndNegative = new HashSet<char>(new Regex(".").Matches("0123456789.-+eE").OfType<Match>().Select(a=>a.Value[0]));

		public static List<VDFToken> ParseTokens(string text, VDFLoadOptions options = null, bool parseAllTokens = false, bool postProcessTokens = true) {
			text = (text ?? "").Replace("\r\n", "\n"); // maybe temp
			options = options ?? new VDFLoadOptions();

			var result = new List<VDFToken>();

			var currentTokenFirstCharPos = 0;
			var currentTokenTextBuilder = new StringBuilder();
			var currentTokenType = VDFTokenType.None;
			string activeLiteralStartChars = null;
			char? activeStringStartChar = null;
			string lastScopeIncreaseChar = null;
			bool addNextCharToTokenText = true;

			char specialEnderChar = '№';
			text += specialEnderChar; // add special ender-char, so don't need to use Nullable for nextChar var

			char ch;
			char nextChar = text[0];
			for (var i = 0; i < text.Length - 1; i++) {
				ch = nextChar;
				nextChar = text[i + 1];

				//int nextNonSpaceCharPos = FindNextNonXCharPosition(text, i + 1, ' ');
				//char? nextNonSpaceChar = nextNonSpaceCharPos != -1 ? text[nextNonSpaceCharPos] : (char?)null;

				if (addNextCharToTokenText)
					currentTokenTextBuilder.Append(ch);
				addNextCharToTokenText = true;

				if (activeLiteralStartChars != null) { // if in literal
					// if first char of literal-end-marker
					if (ch == '>' && i + activeLiteralStartChars.Length <= text.Length && text.Substring(i, activeLiteralStartChars.Length) == activeLiteralStartChars.Replace("<", ">")) {
						//currentTokenTextBuilder = new StringBuilder(activeLiteralStartChars.Replace("<", ">"));
						//currentTokenType = VDFTokenType.LiteralEndMarker;
						//i += currentTokenTextBuilder.Length - 1; // have next char processed be the one right after literal-end-marker

						if (parseAllTokens)
							result.Add(new VDFToken(VDFTokenType.LiteralEndMarker, i, result.Count, activeLiteralStartChars.Replace("<", ">"))); // (if this end-marker token is within a string, it'll come before the string token)
						currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text
						currentTokenFirstCharPos += activeLiteralStartChars.Length; // don't count this inserted token text as part of main-token text
						i += activeLiteralStartChars.Length - 2; // have next char processed be the last char of literal-end-marker
						addNextCharToTokenText = false; // but don't have it be added to the main-token text

						if (text[i + 1 - activeLiteralStartChars.Length] == '#') // if there was a hash just before literal-end-marker (e.g. "some text>#>>"), remove it from main-token text
							currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text

						activeLiteralStartChars = null;

						nextChar = i < text.Length - 1 ? text[i + 1] : specialEnderChar; // update after i-modification, since used for next loop's 'ch' value
						continue;
					}
				}
				else {
					if (ch == '<' && nextChar == '<') { // if first char of literal-start-marker
						activeLiteralStartChars = "";
						while (i + activeLiteralStartChars.Length < text.Length && text[i + activeLiteralStartChars.Length] == '<')
							activeLiteralStartChars += "<";

						//currentTokenTextBuilder = new StringBuilder(activeLiteralStartChars);
						//currentTokenType = VDFTokenType.LiteralStartMarker;
						//i += currentTokenTextBuilder.Length - 1; // have next char processed be the one right after comment (i.e. the line-break char)

						if (parseAllTokens)
							result.Add(new VDFToken(VDFTokenType.LiteralStartMarker, i, result.Count, activeLiteralStartChars));
						currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text
						currentTokenFirstCharPos += activeLiteralStartChars.Length; // don't count this inserted token text as part of main-token text
						i += activeLiteralStartChars.Length - 1; // have next char processed be the one right after literal-start-marker

						if (text[i + 1] == '#') { // if there is a hash just after literal-start-marker (e.g. "<<#<some text"), skip it
							currentTokenFirstCharPos++;
							i++;
						}

						nextChar = i < text.Length - 1 ? text[i + 1] : specialEnderChar; // update after i-modification, since used for next loop's 'ch' value
						continue;
					}
					// else
					{
						if (activeStringStartChar == null) {
							if (ch == '\'' || ch == '"') { // if char of string-start-marker
								activeStringStartChar = ch;

								//currentTokenType = VDFTokenType.StringStartMarker;
								if (parseAllTokens)
									result.Add(new VDFToken(VDFTokenType.StringStartMarker, i, result.Count, activeStringStartChar.ToString()));
								currentTokenTextBuilder.Remove(currentTokenTextBuilder.Length - 1, 1); // remove current char from the main-token text
								currentTokenFirstCharPos++; // don't count this inserted token text as part of main-token text

								// special case; if string-start-marker for an empty string
								if (ch == nextChar)
									result.Add(new VDFToken(VDFTokenType.String, currentTokenFirstCharPos, result.Count, ""));

								continue;
							}
						}
						else if (activeStringStartChar == ch) {
							//currentTokenType = VDFTokenType.StringEndMarker;
							if (parseAllTokens)
								result.Add(new VDFToken(VDFTokenType.StringEndMarker, i, result.Count, ch.ToString()));
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
						//else if (nextNonSpaceChar == '>')
						if (nextChar == '>')
							currentTokenType = VDFTokenType.Metadata;
						//else if (nextNonSpaceChar == ':' && ch != ' ')
						else if (nextChar == ':') //&& ch != '\t' && ch != ' ') // maybe temp; consider tabs/spaces between key and : to be part of key
							currentTokenType = VDFTokenType.Key;
						else {
							// at this point, all the options are mutually-exclusive (concerning the 'ch' value), so use a switch statement)
							switch (ch) {
								case '#':
									if (nextChar == '#' && firstTokenChar) { // if first char of in-line-comment
										currentTokenTextBuilder = new StringBuilder(text.Substring(i, (text.IndexOf("\n", i + 1) != -1 ? text.IndexOf("\n", i + 1) : text.Length) - i));
										currentTokenType = VDFTokenType.InLineComment;
										i += currentTokenTextBuilder.Length - 1; // have next char processed by the one right after comment (i.e. the line-break char)

										nextChar = i < text.Length - 1 ? text[i + 1] : specialEnderChar; // update after i-modification, since used for next loop's 'ch' value
									}
									break;
								case ' ':case ',':
									if ( // if last char of space-or-comma-span
										(ch == ' ' || (options.allowCommaSeparators && ch == ','))
										&& (nextChar != ' ' && (!options.allowCommaSeparators || nextChar != ','))
										&& currentTokenTextBuilder.ToString().TrimStart(options.allowCommaSeparators ? new[] { ' ', ',' } : new[] { ' ' }).Length == 0
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
									if (firstTokenChar)
										currentTokenType = VDFTokenType.KeyValueSeparator;
									break;
								case '^':
									if (firstTokenChar)
										currentTokenType = VDFTokenType.PoppedOutChildGroupMarker;
									break;
								case 'l':
									if (currentTokenTextBuilder.Length == 4 && currentTokenTextBuilder.ToString() == "null" && !charsAToZ.Contains(nextChar)) // if text-so-far is 'null', and there's no more letters
										currentTokenType = VDFTokenType.Null;
									break;
								case 'e':
									if ((currentTokenTextBuilder.Length == 5 && currentTokenTextBuilder.ToString() == "false")
										|| (currentTokenTextBuilder.Length == 4 && currentTokenTextBuilder.ToString() == "true"))
										currentTokenType = VDFTokenType.Boolean;
									else
										goto case '0';
									break;
								case '0':case '1':case '2':case '3':case '4':case '5':case '6':case '7':case '8':case '9':case '.':case '-':case '+':/*case 'e':*/case 'E':case 'y':
									if (
										( // if normal ("-12345" or "-123.45" or "-123e-45") number
											chars0To9DotAndNegative.Contains(currentTokenTextBuilder[0]) && currentTokenTextBuilder[0].ToString().ToLower() != "e" // if first-char is valid as start of number
											//&& chars0To9DotAndNegative.Contains(ch) // and current-char is valid as part of number // no longer needed, since case ensures it
											&& (!chars0To9DotAndNegative.Contains(nextChar)) && nextChar != 'I' // and next-char is not valid as part of number
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
										lastScopeIncreaseChar = ch.ToString();
									}
									break;
								case ']':
									if (firstTokenChar)
										currentTokenType = VDFTokenType.ListEndMarker;
									break;
								case '{':
									if (firstTokenChar) {
										currentTokenType = VDFTokenType.MapStartMarker;
										lastScopeIncreaseChar = ch.ToString();
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
					currentTokenTextBuilder.Length = 0; // clear
					currentTokenType = VDFTokenType.None;
				}
			}

			if (postProcessTokens)
				//PostProcessTokens(result, options);
				result = PostProcessTokens(result, options);

			return result;
		}
		/*static int FindNextNonXCharPosition(string text, int startPos, char x) {
			for (int i = startPos; i < text.Length; i++)
				if (text[i] != x)
					return i;
			return -1;
		}*/
		/*static string UnpadString(string paddedString) {
			var result = paddedString;
			if (result.StartsWith("#"))
				result = result.Substring(1); // chop off first char, as it was just added by the serializer for separation
			if (result.EndsWith("#"))
				result = result.Substring(0, result.Length - 1);
			return result;
		}*/

		static List<VDFToken> PostProcessTokens(List<VDFToken> origTokens, VDFLoadOptions options) {
			var result = new List<VDFToken>();

			// 1: update strings-before-key-value-separator-tokens to be considered keys, if that's enabled (one reason being, for JSON compatibility)
			// 2: re-wrap popped-out-children with parent brackets/braces

			var groupDepth_tokenSetsToProcessAfterGroupEnds = new Dictionary<int, TokenSet>();
			var tokenSetsToProcess = new Stack<TokenSet>();
			// maybe temp: add depth-0-ender helper token
			tokenSetsToProcess.Push(new TokenSet(new List<VDFToken> {new VDFToken(VDFTokenType.None, -1, -1, "")}));
			tokenSetsToProcess.Push(new TokenSet(origTokens));
			while (tokenSetsToProcess.Count > 0) {
				var tokenSet = tokenSetsToProcess.Peek();
				var tokens = tokenSet.tokens;
				var i = tokenSet.currentTokenIndex;

				VDFToken lastToken = i - 1 >= 0 ? tokens[i - 1] : null;
				VDFToken token = tokens[i];
				//var addThisToken = true;
				var addThisToken = !(token.type == VDFTokenType.Tab || token.type == VDFTokenType.LineBreak
					|| token.type == VDFTokenType.MetadataEndMarker || token.type == VDFTokenType.KeyValueSeparator
					|| token.type == VDFTokenType.PoppedOutChildGroupMarker
					|| token.type == VDFTokenType.None);

				if (token.type == VDFTokenType.String && i + 1 < tokens.Count && tokens[i + 1].type == VDFTokenType.KeyValueSeparator && options.allowStringKeys) {
					token.type = VDFTokenType.Key;
				}

				//var line_tabsReached_old = line_tabsReached;
				if (token.type == VDFTokenType.Tab) {
					tokenSet.line_tabsReached++;
				} else if (token.type == VDFTokenType.LineBreak) {
					tokenSet.line_tabsReached = 0;
				}

				if (token.type == VDFTokenType.None || 
						((lastToken?.type == VDFTokenType.LineBreak || lastToken?.type == VDFTokenType.Tab)
						&& token.type != VDFTokenType.LineBreak && token.type != VDFTokenType.Tab)) {
					// if there's popped-out content, check for any end-stuff that we need to now add (because the popped-out block ended)
					if (groupDepth_tokenSetsToProcessAfterGroupEnds.Count > 0) {
						var tabDepthEnded = token.type == VDFTokenType.PoppedOutChildGroupMarker ? tokenSet.line_tabsReached : tokenSet.line_tabsReached + 1;
						var deepestTokenSetToProcessAfterGroupEnd_depth = groupDepth_tokenSetsToProcessAfterGroupEnds.Keys.Last();
						if (deepestTokenSetToProcessAfterGroupEnd_depth >= tabDepthEnded) {
							var deepestTokenCollectionToProcessAfterGroupEnd = groupDepth_tokenSetsToProcessAfterGroupEnds[deepestTokenSetToProcessAfterGroupEnd_depth];
							tokenSetsToProcess.Push(deepestTokenCollectionToProcessAfterGroupEnd);
							groupDepth_tokenSetsToProcessAfterGroupEnds.Remove(deepestTokenSetToProcessAfterGroupEnd_depth);

							if (token.type == VDFTokenType.PoppedOutChildGroupMarker) // if token was group-marker, skip when we get back
								tokenSet.currentTokenIndex++;
							// we just added a collection-to-process, so go process that immediately (we'll get back to our collection later)
							continue;
						}
					}
				}

				if (token.type == VDFTokenType.PoppedOutChildGroupMarker) {
					addThisToken = false;
					if (lastToken.type == VDFTokenType.ListStartMarker || lastToken.type == VDFTokenType.MapStartMarker) { //lastToken.type != VDFTokenType.Tab)
						var enderTokenIndex = i + 1;
						while (enderTokenIndex < tokens.Count && tokens[enderTokenIndex].type != VDFTokenType.LineBreak && (tokens[enderTokenIndex].type != VDFTokenType.PoppedOutChildGroupMarker || tokens[enderTokenIndex - 1].type == VDFTokenType.ListStartMarker || tokens[enderTokenIndex - 1].type == VDFTokenType.MapStartMarker))
							enderTokenIndex++;
						// the wrap-group consists of the on-same-line text after the popped-out-child-marker (eg the "]}" in "{children:[^]}")
						var wrapGroupTabDepth = tokenSet.line_tabsReached + 1;
						var wrapGroupTokens = tokens.GetRange(i + 1, enderTokenIndex - (i + 1));
						groupDepth_tokenSetsToProcessAfterGroupEnds.Add(wrapGroupTabDepth, new TokenSet(wrapGroupTokens, tokenSet.line_tabsReached));
						groupDepth_tokenSetsToProcessAfterGroupEnds[wrapGroupTabDepth].tokens[0].index = i + 1; // update index
						// skip processing the wrap-group-tokens (at this point)
						i += wrapGroupTokens.Count;
					}
				}

				if (addThisToken)
					result.Add(token);

				// if last token in this collection, remove collection (end its processing)
				if (i == tokens.Count - 1)
					tokenSetsToProcess.Pop();
				tokenSet.currentTokenIndex = i + 1;
			}

			// fix token position-and-index properties
			RefreshTokenPositionAndIndexProperties(result); //tokens);

			// for testing
			// ==========

			/*Log(string.Join(" ", origTokens.Select(a=>a.text).ToArray()));
			Log("==========");
			Log(string.Join(" ", result.Select(a=>a.text).ToArray()));*/

			/*Assert(groupDepth_tokenSetsToProcessAfterGroupEnds.Count == 0, "A token-set-to-process-after-group-end was never processed!");
			Assert(result.Count(a=>a.type == VDFTokenType.MapStartMarker) == result.Count(a=>a.type == VDFTokenType.MapEndMarker),
				$"Map start-marker count ({result.Count(a=>a.type == VDFTokenType.MapStartMarker)}) and "
					+ $"end-marker count ({result.Count(a=>a.type == VDFTokenType.MapEndMarker)}) must be equal.");
			Assert(result.Count(a=>a.type == VDFTokenType.ListStartMarker) == result.Count(a=>a.type == VDFTokenType.ListEndMarker),
				$"List start-marker count ({result.Count(a=>a.type == VDFTokenType.ListStartMarker)}) and "
					+ $"end-marker count ({result.Count(a=>a.type == VDFTokenType.ListEndMarker)}) must be equal.");*/

			return result;
		}
		static void RefreshTokenPositionAndIndexProperties(List<VDFToken> tokens) {
			var textProcessedLength = 0;
			for (var i = 0; i < tokens.Count; i++) {
				var token = tokens[i];
				token.position = textProcessedLength;
				token.index = i;
				textProcessedLength += token.text.Length;
			}
		}
	}

	class TokenSet {
		public TokenSet(List<VDFToken> tokens, int line_tabsReached = 0) {
			this.tokens = tokens;
			this.line_tabsReached = line_tabsReached;
		}
		public List<VDFToken> tokens;
		public int currentTokenIndex;
		public int line_tabsReached;
	}
}