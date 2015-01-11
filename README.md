# jsviz

For visualizing the internal and external dependencies of a JavaScript codebase. Takes a directory to analyze and outputs an HTML file.

Uses `esprima` and `estraverse` to walk the syntax tree, pick out any `require()` calls, and generate a dependency graph. Generates an HTML file that uses `d3` to visualize the graph. Example output:

## Usage

From the command line, pass in a directory (to be analyed) and an output file:

```bash
jsviz taco-project -o pages/taco.html
```

From JavaScript:

```javascript
var jsviz = require('jsviz');

var analysisDir = 'taco-project';
var outputDir = './pages/';

// Optional
var callback = function(err) {};

jsviz.generate(analysisDir, outputDir, callback);
```