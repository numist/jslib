/*
 * Copyright © 2011 by Scott Perry
 * Released under the MIT License; its terms are at the end of this file.
 *
 * This file depends on:
 * • jQuery (tested against v1.4.2 - 1.7.1)
 *   http://jquery.com/
 *
 * To use this file, ensure that:
 * • jkInterestingElements() returns all available scroll targets
 * • jkCodes represent intended keybindings. Use http://api.jquery.com/keydown/
 *   to get the appropriate keyCodes, and | them with the appropriate meta key
 *   masks as prescribed by var modifier in the code below (s: shift, a: alt,
 *   c: ctrl, m: meta). Some examples:
 *   • 74 | 1 << 8 // capital J
 *   • 37          // left arrow
 *
 * Inspiration provided by:
 * • jquery-jk
 *   by Pat Nakajima (patnakajima@gmail.com)
 *   https://github.com/nakajima/jquery-jk
 * • In Focus (The Atlantic) and The Big Picture (Boston Globe)
 *   by Alan Taylor (ataylor@theatlantic.com)
 *   http://www.theatlantic.com/infocus/
 *   http://www.boston.com/bigpicture/
 *
 * If you plan on using unusual keys (numpad, symbols, etc) and run into
 * cross-browser problems, chances are Jonathan Tang has solved this for you:
 *   https://github.com/nostrademons/keycode.js
 */

// on/off switch
var jkEnabled = true,

// elements that should be scroll targets
jkSelector = function(e) { return $(e).find("img"); },

// keycodes to watch
jkCodes = {
  next: [74, 40],
  prev: [75, 38]
};

/*****************************************************************************/
(function() {
  $(document).ready(function () {
    var modifier = {
      s: 1 << 8,
      a: 1 << 9,
      c: 1 << 10,
      m: 1 << 11
    },
    keyMask = 0xFF;
    
    $(document).bind('keydown', function(e) {
      if(!jkEnabled) { return; }
      
      function composite_keycode(e) {
        var keycode = (e.which == null) ? e.keyCode : e.which;
  			if(e.shiftKey) {
    		  keycode |= modifier.s;
    		}
    		if(e.altKey) {
    		  keycode |= modifier.a;
    		}
    		if(e.ctrlKey) {
    		  keycode |= modifier.c;
    		}
    		if(e.metaKey) {
    		  keycode |= modifier.m;
    		}
    		
    		return keycode;
      }
      
      // get the nearest (prev and next) elements of interest
      function closest() {
        // the elements of interest
        var items = jkSelector().filter(":visible"),
  
        // defaults:
        // we can never scroll higher than the top of the page
        prev = $('html, body'),
        // but we can potentially scroll lower than the last item
        next = null;
  
        items.each(function(index, item){
          // cache the distance, it gets used a lot
          var itemdistance = $(item).offset().top - $(window).scrollTop();
  
          // update nearest previous item
          if(itemdistance < 0
          && ( prev == null
            || itemdistance > $(prev).offset().top - $(window).scrollTop()))
          {
            prev = item;
          }
  
          // update nearest next item
          if(itemdistance > 0
          && ( next == null
            || itemdistance < $(next).offset().top - $(window).scrollTop()))
          {
            next = item;
          }
        });
  
        return {next: next, prev: prev};
      }
  
      function in_array(needle, haystack) {
        for (var i = 0; i < haystack.length; i++) {
          if(haystack[i] == needle) { return true; }
        }
        return false;
      }
      
      // avoid annoying the user
      if ($(e.target).is(':input')) {
        return;
      }
  
      /*
       * scroll to the appropriate location.
       *
       * could also use $('html, body').animate({scrollTop:pixels}, 'fast') but
       * it's not very responsive.
       */
      if(in_array(composite_keycode(e), jkCodes.next)
      && closest().next != null)
      {
        $('html, body').scrollTop($(closest().next).offset().top);
      }
      if(in_array(composite_keycode(e), jkCodes.prev)
      && closest().prev != null) {
        $('html, body').scrollTop($(closest().prev).offset().top);
      }
    });
  });
})();

/*
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
