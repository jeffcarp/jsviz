const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const estraverse = require('estraverse');
const glob = require('glob');

const baseDir = '/home/vagrant/bt/braintree.js/src';

glob(baseDir+'/**/*.js', {}, function (er, files) {
  //console.log(files);

  const fileList = files.filter(function (fileName) {
    return fileName.indexOf('node_modules') === -1;
  }).map(function (fileName) {
    return path.resolve(fileName);
  });

  //console.log(fileList);

  var requiresByFile = {};

  fileList.forEach(function (fileName) {

    var contents = fs.readFileSync(fileName, 'utf8');

    var ast = esprima.parse(contents);
    requiresByFile[fileName] = requiresByFile[fileName] || [];

    estraverse.traverse(ast, {
      enter: function (node, parent) {
        if (fileName === '/home/vagrant/bt/braintree.js/src/integrations/index.js') {
          console.log(node);
        }
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

  exportGraphToD3(requiresByFile);
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
      group: 1 // TODO: remove this dependency
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
