/*
 * Copyright © 2011 by Alexander Micek and Scott Perry
 * Released under the MIT License; its terms are at the end of this file.
 *
 * This file depends on:
 * • jQuery (tested against v1.4.2)
 *   http://jquery.com/
 * • jQuery doTimeout (tested against v1.0)
 *   by "Cowboy" Ben Alman
 *   http://benalman.com/projects/jquery-dotimeout-plugin/
 *
 * Pages that include this file must:
 * • support the following URI formats:
 *   (1) …/page/$w/ loads page $w
 *   (2) …/pages/$x/ loads $x pages of articles (1 - $x)
 *   (3) …/pages/$y-$z/ loads pages $y through $z
 * • provide articles on its pages enclosed in an <article> tag
 *   NOTE: nesting <article>s is not supported and has not been tested
 * • provide a last <article id="more"> containing an anchor referencing the
 *   next page in the series
 *   NOTE: the href in the more link must match type (2) above
 *
 * Basic logic of this file:
 * + if viewport is one page or less from the bottom of the document:
 *   • hide the last <article id="more">
 *   • add another containing infScrLoadingFeedback
 *   • load the next page in the background and parse it for <article>s
 *   • remove the loading feedback
 *   + if articles were successfully loaded from the next page:
 *     • append them to the current page after last <article>
 *     • update history to reflect range of pages now displayed
 *   - otherwise:
 *     • unhide the last <article id="more"> to allow retry
 *
 * Original source by Alexander Micek:
 *   http://tumbledry.org/2011/05/12/screw_hashbangs_building
 *
 * This file includes minor adaptations of other original works:
 * • updatepath() adapted from from pathchange (jQuery plugin)
 *   by Ben Cherry (bcherry@gmail.com), released under the MIT License.
 *   http://www.bcherry.net/static/lib/js/jquery.pathchange.js
 * • detectHistorySupport() from Modernizr
 *   released under the MIT License.
 *   http://www.modernizr.com/download/
 */

// loading feedback used when XHR is active
var infScrLoadingFeedback = '<p>loading…</p>';

/*****************************************************************************/

// infScrStates = states of the InfScr system:
var infScrStates = {
  idle: 0,    // (-> loading)
  loading: 1, // (-> success | idle)
  success: 2  // page updated with new posts (-> idle)
};

// infScr = current state of infinite scroll
var infScrState = infScrStates.idle;

// first page in range of pages shown, set once.
var infScrUrlBasePage = null;

// worker function
function infScrExecute() {
  // updates browser history to reflect the new range of pages being displayed
  function updatepath(path) {
    if(infScrUrlBasePage == null) {
      // we need a base page number
      regexp = /\/pages?\/([0-9]+)-?[0-9]*\/?$/;
      
      if(regexp.test(window.location.href)) {
        // base page in current location
        nextPage = regexp.exec(window.location.href);
        infScrUrlBasePage = nextPage[1];
      } else {
        // use the base page number of the next page (minus one)
        nextPage = regexp.exec(path);
        infScrUrlBasePage = nextPage[1] - 1;
      }
    }
    
    // create link with range from the base page number to the next page number
    path = path.replace("page/","pages/"+infScrUrlBasePage+"-");
    
    // NOTE: replaceState only allows same-origin changes, see:
    // https://developer.mozilla.org/en/DOM/Manipulating_the_browser_history#The_pushState().C2.A0method
    window.history.replaceState(null, null, path);
  }
  
  function scriptmatch(script, haystack) {
    for(i = 0; i < haystack.length; i++) {
      if($(script).html() == $(haystack[i]).html()) {
        return true;
      }
    }
    return false;
  }

  /*
   * get more content if:
   * • not already loading new content
   * • viewport is less than one $(window).height() from bottom of document.
   *   see: http://www.tbray.org/ongoing/When/201x/2011/11/26/Misscrolling
   */
  if(infScrState == infScrStates.idle
  && $(document).height() < $(document).scrollTop() + (2 * $(window).height()))
  {
    // block potentially concurrent requests
    infScrState = infScrStates.loading;

    // get next page's loading node and URL
    moreNode = $('article#more').last();
    moreURL = moreNode.find('a').last().attr("href");

    // make request if node was found, not hidden, and updatepath is supported
    if(moreURL.length > 0 && moreNode.css('display') != 'none'
    && !!(window.history && history.replaceState))
    {
      $.ajax({
        type: 'GET',
        url: moreURL,
        beforeSend: function() {
          // display loading feedback
          moreNode.clone().empty().insertBefore(moreNode).append(infScrLoadingFeedback);

          // hide 'more' browser
          moreNode.hide();
        },
        success: function(data) {
          // use nodetype to grab elements
          var filteredData = $(data).find("article");

          if(filteredData.length > 0) {
            // found valid data
            infScrState = infScrStates.success;

            // drop data into document
            filteredData.insertAfter(moreNode);

            // insert and evaluate scripts unique to the page
            $(data).filter("script").each(function(index, item) {
              if(!scriptmatch(item, $(document).find("script"))) {
                var element = document.createElement("script");
        				element.charset = "utf-8";
        				element.type = "text/javascript";
                if(item.src) {
          			  element.src = item.src;
                } else if($(item).html().length) {
                  element.innerHTML = $(item).html();
                }
        			  document.body.appendChild(element);
              }
            });

            // update the address bar
            updatepath(moreURL)
          }
        },
        complete: function(jqXHR, textStatus) {
          // remove loading feedback
          moreNode.prev().remove();

          // if our XHR did not add data to the page,
          if(infScrState != infScrStates.success) {
            // unhide 'more' browser
            moreNode.show();
          }

          infScrState = infScrStates.idle;
        },
        dataType: "html"
      });
    }
  }
}

$(document).ready(function () {
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  // http://paulirish.com/2009/throttled-smartresize-jquery-event-handler/
  $(window).scroll(function() {
    $.doTimeout( 'scroll', 200 /* milliseconds */, infScrExecute);
  });
});

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
