var Walker = require('../ftw');
var test = require('tap').test;

var compareArrays = function(expect, actual) {
    if(expect.length !== actual.length) {
        return false;
    }
    
    actual.sort();

    for(var i = 0; i < expect.length; i++) {
        if(expect[i] !== actual[i]) {
            return false;
        }
    }

    return true;
};

test('basic walking', function(t) {

    var walker = new Walker();

    var expect = [
        'Felidae/Felid.md',
        'Felidae/Felinae.md',
        'Felidae/Felis/Felis_catus.md',
        'Felidae/Felis/Felis_silvestris.md',
        'Felidae/Leopardus/Leopardus_geoffroyi.md',
        'Felidae/Leopardus/Leopardus_jacobita.md',
        'Felidae/Leopardus/Leopardus_pardalis.md',
        'Felidae/Lynx/Lynx_canadensis.md',
        'Felidae/Lynx/Lynx_lynx.md',
        'Felidae/Panthera/Panthera_leo.md',
        'Felidae/Panthera/Panthera_onca.md',
        'Felidae/Panthera/Panthera_pardus.md',
        'Felidae/Panthera/Panthera_tigris.md',
        'Felidae/Pantherinae.md',
        'Felidae/Puma/Puma_concolor.md',
        'Felidae/Puma/Puma_yagouaroundi.md'
    ];

    var actual = [];

    walker.on('file', function(file) {
        console.log(file);
        actual.push(file);
    });

    walker.on('error', function(error) {
        t.notOk(error, 'no errors');
        t.end();
    });

    walker.on('done', function() {
        console.log(actual.sort());
        var same = compareArrays(expect, actual);
        t.ok(same, 'files are as expected');
        t.end();
    });

    walker.walk('Felidae');
});


test('depth limit', function(t) {

    var walker = new Walker({
        depth: 0
    });

    var expect = [ 
        'Felidae/Felid.md',
        'Felidae/Felinae.md',
        'Felidae/Pantherinae.md' 
    ];

    var actual = [];

    walker.on('error', function(error) {
        t.notOk(error, 'no errors');
        t.end();
    })

    walker.on('file', function(file) {
        actual.push(file);
    });

    walker.on('done', function() {
        var same = compareArrays(expect, actual);
        t.ok(same, 'files as expected');
        t.end();
    });

    walker.walk('Felidae');

});

test('duplicate avoidance', function(t) {

    var walker = new Walker();

    var expect = [
        'Felidae/Felid.md',
        'Felidae/Felinae.md',
        'Felidae/Felis/Felis_catus.md',
        'Felidae/Felis/Felis_silvestris.md',
        'Felidae/Leopardus/Leopardus_geoffroyi.md',
        'Felidae/Leopardus/Leopardus_jacobita.md',
        'Felidae/Leopardus/Leopardus_pardalis.md',
        'Felidae/Lynx/Lynx_canadensis.md',
        'Felidae/Lynx/Lynx_lynx.md',
        'Felidae/Panthera/Panthera_leo.md',
        'Felidae/Panthera/Panthera_onca.md',
        'Felidae/Panthera/Panthera_pardus.md',
        'Felidae/Panthera/Panthera_tigris.md',
        'Felidae/Pantherinae.md',
        'Felidae/Puma/Puma_concolor.md',
        'Felidae/Puma/Puma_yagouaroundi.md'
    ];

    var actual = [];

    walker.on('file', function(file) {
        actual.push(file);
    });

    walker.on('error', function(error) {
        t.notOk(error, 'no errors');
        t.end();
    });

    walker.on('done', function() {
        var same = compareArrays(expect, actual);
        t.ok(same, 'files are as expected');
        t.end();
    });

    walker.walk(['Felidae', 'Felidae/Lynx']);
});
