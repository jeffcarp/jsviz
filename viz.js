const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const estraverse = require('estraverse');
const glob = require('glob');

glob("../../bt/braintree.js/src/**/*.js", {}, function (er, files) {
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
        if (nodeIsRequireCall(node)) {
          var requireTarget = node.declarations[0].init.arguments[0].value;
          var qualifiedFileName = qualifyFileName(fileName, requireTarget);
          if (requiresByFile[fileName].indexOf(qualifiedFileName) === -1) {
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

});

function nodeIsRequireCall(node) {
  return (
    node &&
    node.type === 'VariableDeclaration' &&
    node.declarations[0] &&
    node.declarations[0].init &&
    node.declarations[0].init.type === 'CallExpression' &&
    node.declarations[0].init.callee &&
    node.declarations[0].init.callee.name === 'require'
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
