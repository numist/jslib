/*
 * Copyright © 2011 by Scott Perry
 * Released under the MIT License; its terms are at the end of this file.
 *
 * This file depends on:
 * • jQuery (tested against v1.4.2)
 *   http://jquery.com/
 *
 * To use this file, ensure that:
 * • jkInterestingElements() returns all available scroll targets
 * • jkKeys (or jkCodes) represent intended keybindings
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

// elements that should be scroll targets
var jkSelector = "article";

// if you want to use non-character keys for navigation, override jkCodes below
var jkKeys = {
  NEXT: 'j',
  PREV: 'k',
};

// specifically set keycodes override jkKeys
var jkCodes = {
  NEXT: jkKeys.NEXT.charCodeAt(),
  PREV: jkKeys.PREV.charCodeAt(),
};

/*****************************************************************************/

(function(){

  function jkInterestingElements() { return $(jkSelector); }
  // worker function
  function jkExecute(event) {
    // get the nearest (prev and next) elements of interest
    function closest() {
      // the elements of interest
      items = jkInterestingElements().filter(":visible");

      // defaults:
      // we can never scroll higher than the top of the page
      prev = $('html, body');
      // but we can potentially scroll lower than the last item
      next = null;

      items.each(function(index, item){
        // cache the distance, it gets used a lot
        itemdistance = $(item).offset().top - $(window).scrollTop();

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

    // nothing to do if there's no code
    if(!event.which) {
      return;
    }

    // avoid annoying the user
    if ($(event.target).is(':input')) {
      return;
    }

    /*
     * scroll to the appropriate location.
     *
     * could also use $('html, body').animate({scrollTop:pixels}, 'fast') but
     * it's not very responsive.
     */
    if(event.which == jkCodes.NEXT
    && closest().next != null)
    {
      $('html, body').scrollTop($(closest().next).offset().top);
    }
    if(event.which == jkCodes.PREV
    && closest().prev != null) {
      $('html, body').scrollTop($(closest().prev).offset().top);
    }
  }

  $(document).ready(function () {
    $(document).bind('keypress', jkExecute);
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
