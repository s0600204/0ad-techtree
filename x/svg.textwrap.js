/**
 * @author: Tom Adam - tom@ambitiongroup.com
 * Created on: 07/02/14 19:16
 *
 * Plugin description:
 * This plugin overrides the SVG.Text object's text and tspan methods.
 * Supports text wrap for a given text width. The plugin basically splits the text based on contained spaces,
 * and tries to do a best possible match for the SVG.Text object's specified width.
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
			// Will call the tspan method multiple times...
			var wrappedLines = [];
			var tspan = new SVG.TSpan().text(textLines[0]);
			var node = this.textPath ? this.textPath.node : this.node;
			node.appendChild(tspan.node);
			for (var li = 0; li < textLines.length; li++) {
				tspan.text(textLines[li]);
				var textWidth = tspan.node.getComputedTextLength();
				if (textWidth > this.width()) {
					/**
					 * Method to splitt ext into lines.
					 * @param testSpan The span to be used as tester SVG element.
					 * @param words The array of words - the original text split by ' '
					 * @returns {Array}
					 */
					var splitText = function (testSpan, words) {
						// Array of strings with acceptable lengths.
						var retVal = [];
						var currentText = "";
						var computedTextLength = 0;//testSpan.node.getComputedTextLength();
						var i = 0;
						var oldText = "";
						testSpan.node.textContent = "";
						while (i < words.length) {
							if (testSpan.node.textContent == "") {
								//New round
								testSpan.node.textContent = words[i];
								oldText = words[i];
							} else {
								//We are in the middle of the round somewhere.
								/*var*/
								oldText = testSpan.node.textContent;
								testSpan.node.textContent = testSpan.node.textContent + " " + words[i];
								computedTextLength = testSpan.node.getComputedTextLength();
								if (computedTextLength > this.width()) {
									retVal.push(oldText);
									i--;
									testSpan.node.textContent = "";
									oldText = null;
								}
								else {
									oldText = testSpan.node.textContent;
								}
							}
							i++;
						}
						if (oldText != null)
							retVal.push(oldText);
						return retVal;
					}
					// EOF Split text method.
					var wrappedLines = splitText.call(this, tspan, textLines[li].split(' '));
				}
				else {
					// Width defined but fits in!
					wrappedLines.push(textLines[li]);
				}
			}
			tspan.remove();
			node.removeChild(tspan.node);
			return wrappedLines;

		}
	}
)