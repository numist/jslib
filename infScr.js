/*
 * Copyright © 2011 by Alexander Micek and Scott Perry
 * Released under the MIT License; its terms are at the end of this file.
 *
 * This file depends on:
 * • jQuery (tested against v1.4.2 - 1.7.1)
 *   http://jquery.com/
 * • jQuery doTimeout (tested against v1.0)
 *   by "Cowboy" Ben Alman
 *   http://benalman.com/projects/jquery-dotimeout-plugin/
 *
 * Pages that include this file must support the following URI formats:
 *   (1) …/page/$w/ loads page $w
 *   (2) …/pages/$x/ loads $x pages of articles (1 - $x)
 *   (3) …/pages/$y-$z/ loads pages $y through $z
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

// on/off switch
var infScrEnabled = true,

// loading feedback used when XHR is active
infScrLoadingFeedback = '<p>loading…</p>',

// selector to locate items to be lazyloaded
infScrItemSelector = function(e) {return $(e).find("article").not(":last")},

// selector to locate the link to more items
infScrMoreLinkSelector = function(e) {return $(e).find('article#more a')};

/*****************************************************************************/
(function(){
  // infScrStates = states of the InfScr system:
  var infScrStates = {
    idle: 0,    // (-> loading)
    loading: 1  // (-> idle)
  };
  
  // infScr = current state of infinite scroll
  var infScrState = infScrStates.idle;
  
  // first page in range of pages shown, set once.
  var infScrUrlBasePage = null;
  
  // worker function
  function infScrExecute() {
    if(!infScrEnabled) { return; }
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

    // get next page's loading node
    var moreNode = infScrMoreLinkSelector(document).filter(":visible").last();
    if(moreNode.length == 0) {
      return;
    }
  
    /*
     * get more content if:
     * • not already loading new content and
     *   • viewport is less than one $(window).height() from bottom of document.
     *     see: http://www.tbray.org/ongoing/When/201x/2011/11/26/Misscrolling
     *   or
     *   • loading node is visible
     */
    if(infScrState == infScrStates.idle
    && ($(document).height() < $(document).scrollTop() + (2 * $(window).height())
       || moreNode.offset().top < $(window).scrollTop() + $(window).height()))
    {
      // block potentially concurrent requests
      infScrState = infScrStates.loading;
  
      // get next page's URL
      var moreURL = moreNode.attr("href"), loadingNode;
  
      // make request if node was found, not hidden, and updatepath is supported
      if(moreURL.length > 0 && moreNode.css('display') != 'none'
      && !!(window.history && history.replaceState))
      {
        $.ajax({
          type: 'GET',
          url: moreURL,
          beforeSend: function() {
            // display loading feedback
            loadingNode = moreNode.clone().empty().insertBefore(moreNode).append(infScrLoadingFeedback);
  
            // hide 'more' browser
            moreNode.hide();
          },
          success: function(data) {
            // use nodetype to grab elements
            var filteredData = infScrItemSelector(data);
  
            if(filteredData.length > 0) {
              // update the address bar
              updatepath(moreURL)
  
              // drop data into document
              filteredData.insertAfter(infScrItemSelector(document).last());
              
              // update the modeNode's address
              moreNode.attr("href", infScrMoreLinkSelector(data).attr("href"));
  
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
            }
          },
          complete: function(jqXHR, textStatus) {
            // remove loading feedback
            loadingNode.remove();
  
            // unhide 'more' browser
            moreNode.show();
  
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
      $.doTimeout('scroll', 200 /* milliseconds */, infScrExecute);
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
