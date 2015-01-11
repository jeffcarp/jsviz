var assert = require('assert');
var jsviz = require('../viz');

describe('graph', function () {

  it('takes a directory and returns a graph via a callback', function (done) {
    var baseDir = __dirname+'/..';
    jsviz.graph(baseDir, function (err, graph) {

      assert(!err, 'does not error out');
      assert(typeof graph === 'object', 'returns a graph object');
      assert(Object.keys(graph).length === 11, 'this project contains 11 requires');
      assert(graph['/viz.js'], 'contains unqualified /viz.js');
      assert(graph['/test/viz.js'], 'contains unqualified /test/viz.js');

      assert(graph['/viz.js'][0] === 'fs', '/viz.js includes fs require');
      assert(graph['/viz.js'][1] === 'path', '/viz.js includes path require');

      done();
    });
  });

  it('gives errors to the callback', function (done) {
    jsviz.graph('adfjksld', function (err, graph) {

      assert(err, 'error exists');
      assert(!graph, 'graph does not exist');

      done();
    });
  });

});

describe('html', function () {

  it('turns a graph into an html string', function (done) {

    var graph = {
      foo: ['ren', 'hoek'],
      bar: ['stimpy', 'j', 'cat']
    };

    jsviz.html(graph, function (err, html) {

      assert(!err);

      // TODO: more sophisticated testing
      assert(html.indexOf('foo') !== -1);
      assert(html.indexOf('stimpy') !== -1);

      done();
    });
  });

});
