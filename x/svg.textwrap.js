/**
 * @author: Tom Adam - tom@ambitiongroup.com
 * Created on: 07/02/14 19:16
 * 
 * @editor: s0600204
 * Edited on: 2014-06-26 22:46
 *
 * Plugin description:
 * This plugin overrides the SVG.Text object's text and tspan methods.
 * Supports text wrap for a given text width. The plugin basically splits the text based on contained spaces,
 * and tries to do a best possible match for the SVG.Text object's specified width.
 * 
 * The plugin has been extended to store character widths and use them to calculate word widths
 * This is remarkably faster, and no longer requires the SVG.Text to be drawn on screen
 * This method may not work as the SVG.js library continues to be developed, as it depends heavily on a quirk.
 * It also will only work in HTML DOM environments
 */

SVG.extend(SVG.Text, {
		/**
		 * Flag to show if text wrapping is enabled.
		 */
		_textWrapped: false,

		/**
		 * Stores the original, unwrapped text. Used as wrapped flag changes.
		 */
		_unwrappedText: "",

		textWrapped: function (wrapped) {
			// Getter
			if (wrapped == null)
				return this._textWrapped;
			else {
				// Setter
				if (this._textWrapped != wrapped) {
					this._textWrapped = wrapped;
					// We reset the same text attribute to trigger text rebuild.
					this.text(this._unwrappedText);
				}
				return this;
			}
		},
		
		width: function (width) {
			var ret = this.attr('width', width);
			if (width != null) {
				this.text(this._unwrappedText);
			}
			return ret;
		},
		
		text: function (text) {
			/* act as getter */
			if (text == null)
				return this.content

			/* remove existing lines */
			this.clear()

			if (typeof text === 'function') {
				this._rebuild = false

				text(this)

			} else {
				this._unwrappedText = text;
				this._rebuild = true

				/* make sure text is not blank */
				text = SVG.regex.isBlank.test(text) ? '' : text

				var i, il
					, lines = text.split('\n')
				if (this.width() && this._textWrapped) {
					// If we are text wrapped, we further break line by line...
					lines = this._wrapLines(lines);
				}

				/* build new lines */
				this.build(true)
				for (i = 0, il = lines.length; i < il; i++)
					this.tspan(lines[i]).newLine()
				
				this.rebuild()
			}
			return this
		},

		_wrapLines: function (textLines) {
			var wrappedLines = [];
			for (var li = 0; li < textLines.length; li++) {
				var lineText = textLines[li];
				var textWidth = this._measureWord(lineText);
				if (textWidth > this.width()) {
					/**
					 * Method to splitt ext into lines.
					 * @param testSpan The span to be used as tester SVG element.
					 * @param words The array of words - the original text split by ' '
					 * @returns {Array}
					 */
					var splitText = function (words) {
						// Array of strings
						var retVal = [];
						var currentText = "";
						var computedTextLength = 0;
						var i = 0;
						var oldText = "";
						while (i < words.length) {
							if (currentText == "") {
								// New Line
								currentText = words[i];
								oldText = words[i];
							} else {
								// We are in the middle of a line somewhere.
								currentText = currentText + " " + words[i];
								computedTextLength = this._measureWord(currentText);
								if (computedTextLength > this.width()) {
									retVal.push(oldText);
									i--;
									currentText = "";
									oldText = null;
								}
								else {
									oldText = currentText;
								}
							}
							i++;
						}
						if (oldText != null)
							retVal.push(oldText);
						return retVal;
					}
					// EOF Split text method.
					wrappedLines = splitText.call(this, textLines[li].split(' '));
				}
				else {
					// Width defined but fits in!
					wrappedLines.push(textLines[li]);
				}
			}
			return wrappedLines;

		},
		
		_charWidths : {},
		
		_getRuler: function () {
			var ruler = document.getElementById("charRuler");
			if (ruler === null) {
				ruler = document.getElementById("SvgjsSvg1001").instance;
				ruler = ruler.text("!").attr({
					"id": "charRuler",
					"font-size": this.node.getAttribute("font-size")
				});
			} else {
				ruler = ruler.instance;
			}
			return ruler;
		},
		
		_measureChar: function (char) {
			var tspan = new SVG.Tspan().text(char);
			var ruler = this._getRuler();
			
			ruler.node.appendChild(tspan.node);
			var ret = tspan.node.getComputedTextLength()
			ruler.node.removeChild(tspan.node);
			return ret;
		},
		
		_getCharWidth : function (char) {
			if (this._charWidths["Cx"+char[0]] === undefined) {
				if (char[0] === " ") {
					this._charWidths["Cx"+char[0]] = this._measureChar("."+char[0]+".") - this._measureChar(".")*2;
				} else {
					this._charWidths["Cx"+char[0]] = this._measureChar(char[0]);
				}
			}
			return this._charWidths["Cx"+char[0]];
		},
		
		_measureWord: function (word) {
			var length = 0;
			for (var c in word) {
				length += this._getCharWidth(word[c]);
			}
			return length;
		}
		
		
		
	}
)
