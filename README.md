# jsvis

For visualizing the internal and external dependencies of a JavaScript codebase (if it adheres to CommonJS).

Uses `esprima` and `estraverse` to walk the syntax tree, pick out any `require()` calls, and generate a dependency graph. Generates an HTML file that uses `d3` to visualize the graph. Example output:
