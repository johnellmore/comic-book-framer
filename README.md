# Comic book framer

_Try it out at [comicbook.johnellmore.com](https://comicbook.johnellmore.com/)._

This is a simple utility for generating a printable set of blank comic book frames, ready for artwork to be added. It supports arbitrary panel widths, as well as alternatives to plain vertical lines between panels. You can use the text editor on the page to define the specific format of each page. It can then be easily printed.

My kids recently got a "comic book creator" set for Christmas, and they quickly used up the two blank booklets that came with the set. I built this so that I could print off new ones without mucking around with drawing and alignment in [Photopea](https://www.photopea.com/).

## Local development

There's no fancy `npm` or `yarn` package installation or hot-reload local dev environment. If you want to spin up a local server for development, python's one-line HTTP server is perfect. Python is included on MacOS and Linux by default, and is easily installed on other OSes. From the repo's root:

```
python3 -m http.server 8000 --bind 127.0.0.1
```

You can then access the project at [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Tests

Some unit tests are defined in `test.mjs`. You can run them using Node's built-in test runner:

```
node --test tests.mjs
```

Use a version of Node.js at least v16.17.0 or later; the test runner is not available in earlier Node versions.
