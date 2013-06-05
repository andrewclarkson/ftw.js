console.log('Test collision avoidance');

var Walker = require('../ftw');
var assert = require('assert');

var walker = new Walker();

var expect = [
    __dirname + '/Felidae/Felid.md',
    __dirname + '/Felidae/Felinae.md',
    __dirname + '/Felidae/Felis/Felis_catus.md',
    __dirname + '/Felidae/Felis/Felis_silvestris.md',
    __dirname + '/Felidae/Leopardus/Leopardus_geoffroyi.md',
    __dirname + '/Felidae/Leopardus/Leopardus_jacobita.md',
    __dirname + '/Felidae/Leopardus/Leopardus_pardalis.md',
    __dirname + '/Felidae/Lynx/Lynx_canadensis.md',
    __dirname + '/Felidae/Lynx/Lynx_lynx.md',
    __dirname + '/Felidae/Panthera/Panthera_leo.md',
    __dirname + '/Felidae/Panthera/Panthera_onca.md',
    __dirname + '/Felidae/Panthera/Panthera_pardus.md',
    __dirname + '/Felidae/Panthera/Panthera_tigris.md',
    __dirname + '/Felidae/Pantherinae.md',
    __dirname + '/Felidae/Puma/Puma_concolor.md',
    __dirname + '/Felidae/Puma/Puma_yagouaroundi.md'
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

walker.walk([
    __dirname + '/Felidae', 
    __dirname + '/Felidae/Puma'
]);
