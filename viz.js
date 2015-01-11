var fs = require('fs');
var path = require('path');
var esprima = require('esprima');
var estraverse = require('estraverse');
var glob = require('glob');
var csvStringify = require('csv-stringify');

module.exports.graph = function (targetDir, callback) {

  if (!fs.existsSync(targetDir)) {
    callback(new Error('directory not found: '+targetDir));
    return;
  }

  glob(targetDir+'/**/*.js', {}, function (err, files) {

    if (err) {
      callback(err);
      return;
    }

    var fileList = files.filter(function (fileName) {
      return fileName.indexOf('node_modules') === -1;
    }).map(function (fileName) {
      return path.resolve(fileName);
    });

    var requiresByFile = {};

    fileList.forEach(function (fileName) {

      var contents = fs.readFileSync(fileName, 'utf8');

      var ast = esprima.parse(contents);
      var qualifiedFileName = qualifyFileName(fileName, fileName, targetDir);
      requiresByFile[qualifiedFileName] = requiresByFile[qualifiedFileName] || [];

      estraverse.traverse(ast, {
        enter: function (node, parent) {
          if (nodeIsRequireCall(node)) {
            var requireTarget = node.arguments[0].value;
            var qualifiedRequireName = qualifyFileName(fileName, requireTarget, targetDir);

            if (requiresByFile[qualifiedFileName].indexOf(qualifiedRequireName) === -1) {
              requiresByFile[qualifiedRequireName] = requiresByFile[qualifiedRequireName] || [];
              requiresByFile[qualifiedFileName].push(qualifiedRequireName);
            }
          }
        },
      });
    });

    callback(null, requiresByFile);
  });
};

module.exports.html = function (graph, callback) {

  // turn graph into d3-able data structure
  // append everything together
  var links = exportGraphToD3(graph);
  var linksStr = JSON.stringify(links);
  var dataTemplate = 'var links = '+linksStr;

  var templates = [
    getTemplate('top.html'),
    dataTemplate,
    getTemplate('render.js'),
    getTemplate('bottom.html')
  ];

  callback(null, templates.join(''));
};

function getTemplate(name) {
  var base = __dirname + '/templates/';
  return fs.readFileSync(base + name);
}

function nodeIsRequireCall(node) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.name === 'require'
  );
}

function qualifyFileName(sourceFile, requireName, targetDir) {
  targetDir = path.resolve(targetDir);
  if (requireName.indexOf('.') === -1) {
    return requireName;
  } else {
    if (path.extname(requireName) !== '.js') {
      requireName += '.js';
    }
    var resolvedPath = path.resolve(path.dirname(sourceFile), requireName);
    var cleanPath = resolvedPath.replace(targetDir, '');
    return cleanPath;
  }
}

function exportGraphToD3(graph) {
  var output = [];

  Object.keys(graph).forEach(function (graphNode) {
    graph[graphNode].forEach(function (graphLink) {

      output.push({
        source: graphNode,
        target: graphLink,
        value: '1.0'
      });
    });
  });

  return output;
}
