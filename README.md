# jslib - Self-contained functional units in JavaScript

The scripts in this library are designed to do one thing with great flexibility and easy configuration, with a minimum of external script support.

Units:

* _infScr_ - Infinite Scrolling/Lazyloading for paginated sites
* _irsz_ - dynamic Image Resizer for fitting images in the viewport
* _jk_ - simple keyboard navigation for pages/sites with discrete articles

## In General

Most units require only jQuery. Dependency versions that have been tested are listed in the comments of each file. For jQuery this is usually between 1.4.2 and latest.

Parameters include at least an enabled flag and functional selectors returning the set of elements the script needs to know about to complete its tasks.

For usage, attribution, and complete documentation, see the comment headers and parameter comments in the unminified source files.

## Licensing

All source in this repository is released under the MIT license. You can use or modify the code in this repository for any purpose so long as you don't expect it to work nor claim to have originally written it.

A copy of the license is at the bottom of each unminified file, and each minified file includes a link back to its original source (which contains the license). One of these must be present in copies/derivatives of the source to maintain an attribution chain.