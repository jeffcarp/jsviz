#!/usr/bin/env node
var jsviz = require('./viz');

var targetDir = process.argv[2];
if (!targetDir) {
  throw new Error('No target directory given.');
}

jsviz.graph(targetDir, function (err, graph) {
  jsviz.html(graph, function (err, html) {
    console.log(html);
  });
});
