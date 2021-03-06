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
 * 
 * @constructor
 * @param {object} options - a map of options
 * @augments EventEmitter
 */

var Walker = function(options) {

    /**
    * A map of types of entries we may encounter in a directory paired with 
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
     * A array of the directories we have already walked to avoid duplicates
     */
    this.walked = [];

    /**
     * The maximum recursion depth
     */
    this.depth = options && options.depth >= 0 ? options.depth : 10;
};

util.inherits(Walker, events.EventEmitter);

/**
 * Walks a directory firing events on files and directories
 * 
 * @param {String|String[]} directories - a directory path or an array of paths
 * 
 * @fires module:FTW~Walker#block
 * @fires module:FTW~Walker#character
 * @fires module:FTW~Walker#directory
 * @fires module:FTW~Walker#done
 * @fires module:FTW~Walker#error
 * @fires module:FTW~Walker#fifo
 * @fires module:FTW~Walker#file
 * @fires module:FTW~Walker#socket
 */

Walker.prototype.walk = function(directories) {

    /** @this Walker */
    var self = this;

    /*
     * If the input is only one directory (a string) convert it into an array
     * with one element
     */
    if(typeof directories === 'string') {
        directories = Array(directories);
    }

    /*
     * Walk each directory with a callback that emits the done event 
     * @see{module:FTW~Walker#done}
     */
    self._walkEach(directories, function() {
        self.emit('done');
    });
};

/**
 * Calls {@link module:FTW~Walker#_walk|_walk} on each directory.
 * 
 * @private
 * @param {String[]} directories - the directories to walk
 * @param {Function} callback - the callback to call when we have walked each
 * directory
 */

Walker.prototype._walkEach = function(directories, callback) {
   
    /** @this Walker */
    var self = this;
    
    /* if we have reached the maximum recursion depth go no further */
    if(self.depth < 0) {
        return callback();
    }
    
    /* decrement the maximum depth so that eventually we will hit it */
    self.depth -= 1;

    /* 
     * because the functions are asynchronous we need to set up a pending 
     * callbacks counter
     */
    var pending = 0;

    directories.forEach(function(directory) {
        self._walk(directory, function() {
            /** decrement the pending callbacks; we just finished one */
            pending -= 1;
            
            /** 
             * if this was the last pending callback return from this level of 
             * recursion @see{@link walkedEach}
             */
            if(pending === 0) {
                return callback();
            }
        });

        /** add a pending callback */
        pending += 1;
    });
};


/**
 * Recursively walks a directory
 * @private
 * @param {String} directory - the directory to walk
 * @param {Function} callback - the callback to call when we have walked the
 * directory
 */

Walker.prototype._walk = function(directory, callback) {
    
    /** @this Walker */
    var self = this;

    /* if we have already walked this directory skip the directory */
    if(self.walked.indexOf(directory) !== -1) {
        return callback();
    }

    fs.readdir(directory, function(error, results) {
        
        if(error){
            self.emit('error', error);
            return callback();
        }

        /* now that we can be sure the directory exists, emit the event */
        self.emit('directory', directory);

        self._statEach(results, directory, callback);

    });

    /* add this directory to the array of directories we have walked */
    self.walked.push(directory);
};

/**
 * Creates the {@link http://nodejs.org/api/fs.html#fs_class_fs_stats|Stat}
 * object for each result
 * @private
 * @param {String[]} results - an array of file or directory paths to pass to 
 * fs.stat
 * @param {String} directory - the directory currently being walked
 * @param {Function} callback - the callback to call when we have stat'd each
 * result
 */

Walker.prototype._statEach = function(results, directory, callback) {
   
    /* @this Walker */
    var self = this;

    /* 
     * because this is a "breadth first search" we queue the 
     * directories until we have found all the non-recursive stuff
     */
    var queue = [];
    
    /* since this is async we need a counter to count the pending callbacks */
    var pending = 0;

    results.forEach(function(result) {
        result = path.join(directory, result);
        fs.stat(result, function(error, stats) {
            
            /* remove a pending callback */
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
            /* if this is the last entry, walk the queue */
            if(pending === 0) {

                /* if the queue is empty, bubble up callback stack */
                if(queue.length === 0) {
                    return callback();
                }

                self._walkEach(queue, callback);
            }
        });

        /** add a pending callback */
        pending += 1;
    });
};

/**
 * Emits events based on the type of the "file" that was fs.stat'd
 * @private
 * @param {String} result - the path to the file
 * @param {Object} stats - the stat object returned from fs.stat
 * @see {@link http://nodejs.org/api/fs.html#fs_class_fs_stats|Node.js API}
 */

Walker.prototype._emitTypes = function(result, stats) {
    
    /** @this Walker */
    var self = this;
    
    /** 
     * for each key of the types object test if the result is that type using
     * the corresponding stat.is____() function, if it is emit the event for 
     * that type
     */

    Object.keys(self.types).forEach(function(key) {
        var test = self.types[key];
        if(stats[test]()) {
            self.emit(key, result);
        }
    });
};

module.exports = Walker;

/* Event documentation */

/**
 * Block device event. Fired upon finding a block device file.
 * @event module:FTW~Walker#block
 * @param {String} path - a path to the block device
 */

/**
 * Character device event. Fired upon finding a character device file.
 * @event module:FTW~Walker#character
 * @param {String} path - a path to the character device
 */

/**
 * Directory event. Fired upon finding a directory.
 * @event module:FTW~Walker#character
 * @param {String} path - a path to the directory
 */

/**
 * Done event. Fired upon finishing walking all the directories.
 * @event module:FTW~Walker#done
 */

/**
 * Error event. Fired upon an error while walking.
 * @event module:FTW~Walker#error
 * @param {Object} error - the error object
 */

/**
 * FIFO event. Fired upon FIFO pipe.
 * @event module:FTW~Walker#fifo
 * @param {String} path - a path to the pipe
 */

/**
 * File event. Fired upon finding a standard file.
 * @event module:FTW~Walker#file
 * @param {String} path - a path to the file
 */

/**
 * Socket event. Fired upon finding a socket.
 * @event module:FTW~Walker#socket
 * @param {String} path - a path to the socket
 */
