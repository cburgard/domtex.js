domtex.js
=========

A javascript library for rendering javascript on the web, using DOM and HTML5.

Why another take on TeX and HTML?
----------------------------------

TeX and HTML are both very useful and elegant ways of typesetting
text, although designed for completely different purposes. HTML is
today used for displaying (often dynamically generated) content on the
web on a variety of different devices with different screen
resolutions and sizes. With the advent of HTML5, the possibility of
the user to interact with the webpage he or she is visiting has grown
tremendously. TeX, on the other hand, has always been designed and
used for typesetting text in a very well-defined environment, where
the page proportions and maybe even the print resolution are known
exactly by the person designing the document.

Any approach that attempts to build a bridge between those two worlds
of typesetting needs to take into account these different design
goals. Some features of TeX do not make much sense on the web today,
and some things can be achieved much more easily and efficiently.

The web provides a wide variety of "converters" that are capable of
translating TeX to HTML. However, none of these are capable of
translating typical documents without the need of user adjustments. A
list of available converters including their features and shortcomings
can be found here:
http://www.tex.ac.uk/cgi-bin/texfaq2html?label=LaTeX2HTML

However, this project follows a completely differnt approach. The
feature that people typically have in mind when thinking about
converting a TeX document to HTML is to be able to view their LaTeX
document in a browser. But browsers can do way more than HTML
rendering - they know javascript. A javascript library could be
designed to render TeX documents inside the browser, making use of
existing libraries to achieve the most complicated features, and
dynamically generate the website for the user. This could be employed
in a wide variety of use cases, starting from a simple interface of
viewing documents up to a fully featured WYSIWYG LaTeX inside the
browser.

License and other things
-----------------------



