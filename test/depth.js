console.log('Test depth limiting');

var Walker = require('../ftw');
var assert = require('assert');

walker = new Walker({
    depth: 0
});

expect = [ 
    __dirname + '/Felidae/Felid.md',
    __dirname + '/Felidae/Felinae.md',
    __dirname + '/Felidae/Pantherinae.md' 
];

var actual = [];

walker.on('file', function(file) {
    actual.push(file);
});

walker.on('error', function(error) {
    assert(!error, 'there was an error while walking')
});

walker.on('done', function() {
    assert.deepEqual(actual.sort(), expect, 'files weren\'t as expected');
});

walker.walk(__dirname + '/Felidae');
