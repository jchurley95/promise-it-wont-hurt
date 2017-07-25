'use strict';

var path = require('path');
var exercise = require('workshopper-exercise')();
var filecheck = require('workshopper-exercise/filecheck');
var execute = require('workshopper-exercise/execute');
var wrappedexec = require('@timothygu/workshopper-wrappedexec');

// checks that the submission file actually exists
exercise = filecheck(exercise);

// execute the solution and submission in parallel with spawn()
exercise = execute(exercise);

exercise.addProcessor(function (mode, callback) {
  this.submissionStdout.pipe(process.stdout);
  return this.on('executeEnd', function () {
    callback(null, true);
  });
});

// make sure Promise is available
// and wrap Promise with hooks used to check if the user used Promises as
// instructed
exercise = wrappedexec(exercise, 'all');
exercise.wrapModule(require.resolve('./wrap.js'));

// check if hooks have been activated
exercise.addVerifyProcessor(function (callback) {
  var __ = this.__;
  var ok = true;

  if (exercise.wrapData.usedPromiseResolve) {
    this.emit('pass', __('pass.func', { func: 'Promise.resolve' }));
  } else if (exercise.wrapData.usedPromiseReject) {
    this.emit('pass', __('pass.func', { func: 'Promise.reject' }));
  } else {
    ok = false;

    this.emit('fail', __('fail.funcOr', {
      func1: 'Promise.resolve',
      func2: 'Promise.reject',
    }));
  }

  if (exercise.wrapData.usedPrototypeCatch) {
    this.emit('pass', __('pass.func', { func: 'catch' }));
  } else {
    ok = false;
    this.emit('fail', __('fail.func', { func: 'catch' }));
  }

  process.nextTick(function () {
    callback(null, ok);
  });
});


var message;
var promise;

function randomBytes(n) {
  return (Math.random() * Math.pow(256, n) | 0).toString(16);
}

message = // Looked at solution for this section
  'A fatal exception ' + randomBytes(1) + ' has occurred at ' +
  randomBytes(2) + ':' + randomBytes(4) + '. Your system\nwill be ' +
  'terminated in 3 seconds.';

promise = Promise.reject(new Error(message));

promise.catch( (err) => {
  var i = 3;

  process.stderr.write(err.message);

  setTimeout(function boom() {
    process.stderr.write('\rwill be terminated in ' + (--i) + ' seconds.');
    if (!i) {
      process.stderr.write('\n..... . . . boom . . . .....\n');
    } else {
      setTimeout(boom, 1000);
    }
  }, 1000);


module.exports = exercise;
