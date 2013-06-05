/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, 
strict:true, undef:true, unused:true, latedef:true, curly:true, node:true, 
indent:4, maxerr:50, newcap:true, nonew:true, quotmark:single, plusplus:true, 
trailing:true, maxdepth:4, maxlen:80 */

/** 
 * @module FTW
 * @version 0.0.1
 * @author Andrew Clarkson <@_andrewclarkson>
 */

var fs = require('fs');
var events = require('events');
var path = require('path');
var util = require('util');

/** 
 * Creates a File Tree Walker
 * @constructor
 * @param {object} options - a map of options
 * @augments EventEmitter
 */
var Walker = function(options) {

    /**
    * a map of types of entries we may encounter in a directory paired with 
    * their corresponding stat functions 
    * @see {@link http://nodejs.org/api/fs.html#fs_class_fs_stats|Node.js API}
    */
    this.types = {
        block: 'isBlockDevice',
        character: 'isCharacterDevice',
        dir: 'isDirectory',
        fifo: 'isFIFO',
        file: 'isFile',
        socket: 'isSocket'
    };

    /**
     * a running array of the directories we have already walked to avoid 
     * duplicates
     */
    this.walked = [];

    // if depth is not set or it's < 0 set depth to the default: 10
    this.depth = options && options.depth >= 0 ? options.depth : 10;
};

util.inherits(Walker, events.EventEmitter);

/**
 * Walks a directory firing events on files and directories
 * @param {String|String[]} dirs - a directory path or an array of paths
 * @param {Number} [depth=0] - the recursion depth
 * @fires Walker#block
 * @fires Walker#character
 * @fires Walker#dir
 * @fires Walker#error
 * @fires Walker#fifo
 * @fires Walker#file
 * @fires Walker#socket
 */

Walker.prototype.walk = function(directories) {

    /** @this Walker */
    var self = this;

    /**
     * if the input is only one directory (a string) convert it into an array
     * with one element
     */

    if(typeof directories === 'string') {
        directories = Array(directories);
    }

    self._walkEach(directories, 0, function() {
        self.emit('done');
    });
};

Walker.prototype._walkEach = function(directories, depth, callback) {
   
    /** @this Walker */
    var self = this;

    var pending = 0;
    
    directories.forEach(function(directory) {
        pending += 1;
        self._walk(directory, depth, function() {
            
            pending -= 1;
            
            if(pending === 0) {
                callback();
            }
        });
    });
};


/**
 * Recursively walks a directory
 * @private
 * @param {String} directory - the directory to walk
 * @param {Number} depth - the current recursion depth
 */

Walker.prototype._walk = function(directory, depth, callback) {
    
    debugger;

    /** @this Walker */
    var self = this;

    /* if we've reached the maximum recusion depth */
    if(depth > self.depth) {
        return callback();
    }

    /* if we have already walked this directory */
    if(self.walked.indexOf(directory) !== -1) {
        return callback;
    }

    self.walked.push(directory);
    
    fs.readdir(directory, function(error, results) {
        
        if(error){
            self.emit('error', error);
            return callback(); // go no further
        }

        /* now we can be sure the directory exists */
        self.emit('directory', directory);

        self._statEach(results, depth, directory, callback);

    });
};

Walker.prototype._statEach = function(results, depth, directory, callback) {
   
    /* @this Walker */
    var self = this;

    /* 
     * because this is a "breadth first search" we queue the 
     * directories until we have found all the non-recursive stuff
     */

    var pending = 0;

    var queue = [];
    
    /* since this is async we need a counter to count the callbacks */
    var counter = results.length;

    results.forEach(function(result) {
        
        pending += 1;
        
        result = path.join(directory, result);

        fs.stat(result, function(error, stats) {
            
            pending -= 1;
            
            if(error) { 
                self.emit('error', error);
                return callback();
            } 
            // if it's a directory add it to the queue
            if(stats.isDirectory()) {
                queue.push(result);
            } else {
                // takes the map of entry types and checks each
                self._emitTypes(result, stats);
            }
            // if this is the last entry and we haven't hit our 
            // recursion limit, walk the queue
            if(pending === 0) {

                if(queue.length === 0) {
                    return callback();
                }

                self._walkEach(queue, depth += 1, callback);
            }
        });
    });
};

Walker.prototype._emitTypes = function(result, stats) {
    
    /** @this Walker */
    var self = this;
    
    Object.keys(self.types).forEach(function(key) {
        // the isType() stat function
        var test = self.types[key];
        if(stats[test]()) {
            self.emit(key, result);
        }
    });
};
/* Event documentation */

/**
 * Block device event.
 * @event Walker#block
 * @type {String}
 */

/**
 * Character device event.
 * @event Walker#character
 * @type {String}
 */

/**
 * Directory event
 * @event Walker#dir
 * @type {String}
 */
/*
var walker = new Walker({
    depth: 0
});

walker.on('done', function() {
    console.log('done');
});

walker.walk('test/Felidae');
*/
module.exports = Walker;
