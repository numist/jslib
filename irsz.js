/*
 * Copyright © 2012 by Scott Perry
 * Released under the MIT License; its terms are at the end of this file.
 *
 * This file depends on:
 * • jQuery (tested against 1.7.1)
 *   http://jquery.com/
 * • String.prototype.endsWith
 *   from https://github.com/numist/jslib/blob/master/String.prototypes.js
 *
 * Basic logic of this file:
 * + if irsz_auto is true
 *   • when each image is loaded, each image is resized to fit with a smooth animation.
 *   • when the viewport is resized, each image is resized to fit as the window changes size.
 * • when the image is clicked, it toggles (smooth animation) between resized to fit and full size
 *
 * resized to fit means:
 * + if image aspect ratio is more extreme (less square) than 2:1/1:2
 *   • scale the smaller dimension between irsz_min_* and the original size,
 *     intermediates correspond to the dimension of the viewport minus
 *     irsz_padding[#]
 * - if the aspect ratio is sane
 *   • scale the image between irsz_min_* and the original size,
 *     intermediates fitting both dimensions within the viewport minus
 *     irsz_padding[#]
 *
 * As far as I know, the method of getting the image's actual dimensions (by
 * making an in-memory copy) was first put forth in this form by
 * Xavi (http://xavi.co/) at http://stackoverflow.com/a/670433
 * This adapted version, the image_dimensions wrapper function, caches image
 * dimensions in the attributes max-width and max-height by default, and can be
 * preset by the server in order to prevent jerky resizing when an image loads
 * progressively.
 */

// disable all included resizing functions
var irsz_enabled = true,

// which elements the irszer should act upon
irsz_selector = function(e) { return $(e).find("img"); },

// do not act upon elements with images smaller than:
irsz_min_height = 400,
irsz_min_width = 400,

// automatically resize images when viewport is resized/on page load
irsz_auto = true,

// length to animate resizing transition (0 for instant, unit:ms)
irsz_toggle_ani = 500,
irsz_onload_ani = 0,

// resize image (x, y) smaller than viewport
irsz_padding = [10, 10];

/*****************************************************************************/
(function() {
  $(document).ready(function() {
    // if images are not already loaded, attach a function to fire on arrival
    irsz_selector(document).load(function() {
      if(irsz_auto) {
        image_fit(this, irsz_onload_ani);
      }
    });
    
    // bind function to resize as needed during viewport resize
    $(window).resize(function() {
      if(irsz_auto) {
        irsz_selector(document).each(function(i, e) {
          image_fit(e, 0);
        });
      }
    });
    
    irsz_selector(document).each(function(i, e) {
      // attach click handler for manual zooming
      $(e).click(function(){
        image_toggle(this, irsz_toggle_ani);
        return false;
      });
      
      // if iages are already loaded, fit them
      if(irsz_auto) {
        image_fit(this, irsz_onload_ani);
      }
    });
  });
  
  // keep images zoomed in when they were click-zoomed
  var noresize_class = "irsz_noresize",
  
  // dimensional values in this file are pixels
      units = "px";

  // get image's actual dimensions
  function image_dimensions(image, func) {
    var attr_width = "max-width", attr_height = "max-height", image_width, image_height;
    image = $(image);
    if(image.length != 1 || image.attr("src") == undefined) { return; }
    
    if(image.filter("["+attr_width+"]["+attr_height+"]").length == 1) {
      // found cached/supplied image dimensions
      var pixels_width, pixels_height;
      image_width = image.attr(attr_width);
      pixels_width = parseInt(image_width.endsWith(units)
                            ? image_width.substr(0, image_width.lastIndexOf(units))
                            : image_width);
      image_height = image.attr(attr_height);
      pixels_height = parseInt(image_height.endsWith(units)
                             ? image_height.substr(0, image_height.lastIndexOf(units))
                             : image_height);
      func(pixels_width, pixels_height);
    } else {
      // get dimensions from image. make a copy in memory to avoid css issues.
      $("<img/>")
        .attr("src", image.attr("src"))
        .load(function() {
          image_width = this.width, image_height = this.height;
          image.attr(attr_width, image_width+units).attr(attr_height, image_height+units);
          func(image_width, image_height);
        });
    }
  }
  
  // zoom image in/out
  function image_toggle(image, animate) {
    if(!irsz_enabled) { return; }
    
    image_dimensions(image, function(actual_width, actual_height) {
      // check both dimensions in case there's a bug elsewhere we're resetting
      if($(image).width() < actual_width || $(image).height < actual_height) {
        $(image).addClass(noresize_class);
        image_resize(image, actual_width, actual_height, animate);
      } else {
        $(image).removeClass(noresize_class);
        image_fit(image, animate);
      }
    });
  }
  
  function image_fit(image, animate) {
    if(!irsz_enabled) { return; }
    if($(image).hasClass(noresize_class)) { return; }
    
    image_dimensions(image, function(actual_width, actual_height) {
      var aspect_ratio = Math.max(actual_width / actual_height, actual_height / actual_width),
          target_width = $(window).width() - irsz_padding[0],
          target_height = $(window).height() - irsz_padding[1],
          new_height = 0,
          new_width = 0,
          w_width, w_height, h_width, h_height;
      
      // do not bother with images that are already smaller than the minima
      if(actual_height < irsz_min_height) { return; }
      if(actual_width < irsz_min_width) { return; }

      function compute_width(height) {
        return Math.round(actual_width * height / actual_height);
      }
      function compute_height(width) {
        return Math.round(actual_height * width / actual_width);
      }
      
      if(aspect_ratio > 2) {
        // if ratio > 2, check and fit to *smaller* image dimension (assume image intended to be scrolled)
        if(actual_width < actual_height) {
          new_width = target_width > irsz_min_width ? target_width : irsz_min_width;
          new_height = compute_height(new_width);
        } else {
          new_height = target_height > irsz_min_height ? target_height : irsz_min_height;
          new_width = compute_width(new_height);
        }
      } else {
        // fit image entirely within viewport
        w_width = target_width > irsz_min_width ? target_width : irsz_min_width;
        w_height = compute_height(w_width);
        h_height = target_height > irsz_min_height ? target_height : irsz_min_height;
        h_width = compute_width(h_height);
        
        // do not enlarge image beyond its limits
        w_width = w_width < actual_width ? w_width : actual_width;
        w_height = w_height < actual_height ? w_height : actual_height;
        h_width = h_width < actual_width ? h_width : actual_width;
        h_height = h_height < actual_height ? h_height : actual_height;

        if(w_height > h_height) {
          // width-based dimensions are too tall
          new_width = h_width;
          new_height = h_height;
        } else {
          // height-based dimensions are too wide/just right
          new_width = w_width;
          new_height = w_height;
        }
      }
      
      if(new_height != $(image).height() && new_height <= actual_height) {
        image_resize(image, new_width, new_height, animate);
      }
    });
  }
  
  function image_resize(image, new_width, new_height, animate) {
    if(animate > 0) {
      $(image).animate({
          width: new_width+units,
          height: new_height+units
      }, animate);
    } else {
      image.style.height = new_height+units;
      image.style.width = new_width+units;
    }
  }
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
