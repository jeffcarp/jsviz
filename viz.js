const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const estraverse = require('estraverse');
const glob = require('glob');
const csvStringify = require('csv-stringify');

const baseDir = '/home/vagrant/bt/braintree-dropin.js/src';

glob(baseDir+'/**/*.js', {}, function (er, files) {

  const fileList = files.filter(function (fileName) {
    return (
      fileName.indexOf('node_modules') === -1 &&
      fileName.indexOf('shared/intro') === -1 && // not a real file
      fileName.indexOf('shared/outro') === -1 // not a real file
    );
  }).map(function (fileName) {
    return path.resolve(fileName);
  });

  var requiresByFile = {};

  fileList.forEach(function (fileName) {

    var contents = fs.readFileSync(fileName, 'utf8');

    var ast = esprima.parse(contents);
    requiresByFile[fileName] = requiresByFile[fileName] || [];

    estraverse.traverse(ast, {
      enter: function (node, parent) {
        if (nodeIsRequireCall(node)) {
          var requireTarget = node.arguments[0].value;

          var qualifiedFileName = qualifyFileName(fileName, requireTarget);

          if (requiresByFile[fileName].indexOf(qualifiedFileName) === -1) {
            requiresByFile[qualifiedFileName] = requiresByFile[qualifiedFileName] || [];
            requiresByFile[fileName].push(qualifiedFileName);
          }
        }
      },
    });
  });

  console.log();
  Object.keys(requiresByFile).forEach(function (requireTarget) {
    console.log('requires in '+requireTarget+':');
    console.log(requiresByFile[requireTarget]);
  });

  exportGraphToD3_2(requiresByFile);
});

function nodeIsRequireCall(node) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.name === 'require'
  );
}

function qualifyFileName(sourceFile, fileName) {
  if (fileName.indexOf('.') === -1) {
    return fileName;
  } else {
    if (path.extname(fileName) !== '.js') {
      fileName += '.js';
    }
    return path.resolve(path.dirname(sourceFile), fileName);
  }
}

// Takes a directed, acyclic graph of type
// Object<Array> and converts it into D3's
// force directed graph data object
function exportGraphToD3(graph) {
  var d3Data = {
    nodes: [],
    links: []
  };

  d3Data.nodes = Object.keys(graph).map(function (graphNode) {
    var niceTitle = graphNode.replace(baseDir, '');
    return {
      name: niceTitle,
      group: 1
    };
  });

  Object.keys(graph).forEach(function (graphNode) {
    graph[graphNode].forEach(function (graphLink) {

      var sourceIndex = Object.keys(graph).indexOf(graphNode);
      var targetIndex = Object.keys(graph).indexOf(graphLink);

      d3Data.links.push({
        source: sourceIndex,
        target: targetIndex,
        value: 5
      });

    });
  });

  var d3DataJson = JSON.stringify(d3Data);
  fs.writeFileSync('./graph/data2.json', d3DataJson, 'utf8');
}

function exportGraphToD3_2(graph) {
  var input = [
    ['source', 'target', 'value'],
  ];

  Object.keys(graph).forEach(function (graphNode) {
    graph[graphNode].forEach(function (graphLink) {

      var niceFrom = graphNode.replace(baseDir, '');
      var niceTo = graphLink.replace(baseDir, '');

      input.push([
        niceFrom, niceTo, '1.0'
      ]);

    });
  });

  csvStringify(input, function(err, output) {
    fs.writeFileSync('./graph/data2.csv', output, 'utf8');
  });
}
