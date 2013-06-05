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

    this.walked = [];

    this.pending = 0;

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

Walker.prototype.walk = function(dirs, depth) {

    /** @this Walker */
    var self = this;

    depth = depth || 0;

    /* The end of walking:
     * we have either reached our limit or there are no directories to walk 
     */
    if(depth > self.depth || dirs.length === 0) {
        if(self.pending === 0) {
            self.emit('done');
        }
        return; // go no further
    }
    
    /**
     * if the input is only one directory (a string) convert it into an array
     * with one element
     */
    if(typeof dirs === 'string') {
        dirs = Array(dirs);
    }
    dirs.forEach(function(dir) {
        // if dir is in the walked array
        if(self.walked.indexOf(dir) !== -1) {
            return;
        }
        self.pending += 1;
        self.walked.push(dir);
        fs.readdir(dir, function(error, entries) {
            /* 
             * because this is a "breadth first search" we queue the 
             * directories until we have found all the non-recursive stuff
             */
            var queue = [];       
            if(error){
                self.emit('error', error);
                return; // go no further
            }
            self.emit('directory', dir);
            // since this is async we need a counter to count the callbacks
            var counter = entries.length;
            entries.forEach(function(entry) {
                // we need to enclose `entry` each loop; thus an IIFE
                (function (entry) { 
                    fs.stat(entry, function(error, stats) {
                        counter -= 1;
                        if(error) { 
                            self.emit('error', error);
                        } 
                        // if it's a directory add it to the queue
                        if(stats.isDirectory()) {
                            queue.push(entry);
                        } else {
                            // takes the map of entry types and checks each
                            Object.keys(self.types).forEach(function(key) {
                                // the isType() stat function
                                var test = self.types[key];
                                if(stats[test]()) {
                                    self.emit(key, entry);
                                }
                            });
                        }
                        // if this is the last entry and we haven't hit our 
                        // recursion limit, walk the queue
                        if(counter === 0) {
                            self.pending -= 1;
                            self.walk(queue, depth += 1);
                        }
                    });
                // IIFE gets the path to the entry. getting a little lispy
                }(path.join(dir, entry)));
            });
        });
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

/**
 * Adds the ability to express interest in multiple events with the same 
 * listener
 *
 * @param events - an event or an array of events
 * @param {function} listener - a function that will be called on these events
 */

Walker.prototype.find = function(events, listener) {

    var self = this

    // if it's just one type of result we're interested in just add the 
    // listener
    if(typeof types === 'string') {
        self.addListener(events, listener);
    
    // if it's an array of types that we're interested in add the listener to 
    // each
    } else if (Array.isArray(events)) {

        for(var i = 0; i < events.length; i++) {
            self.addListener(events[i], listener);
        }
    }
};

/**
 * Add a listener to the 'error' event. alias for on('error', ...)
 *
 * @param {function} listener - a function that will be called on an error
 */

Walker.prototype.error = function(listener) {
    var self = this;
    self.addListener('error', listener);
};

/**
 * Add a listener to the 'done' event. alias for on('done', ...)
 *
 * @param {function} listener - a function that will be called when the walker
 * has finished
 */

Walker.prototype.done = function(listener) {
    var self = this;
    self.addListener('done', listener);
};

module.exports = Walker;
