var fs, readline, _slice;

fs = require('fs');
readline = require('readline');
_slice = Array.prototype.slice;

module.exports = Prompt;

function Prompt(options) {
  var prompt;

  prompt = this;

  this.name = options.name;
  this.text = options.prompt;
  this.defaultValue = options['default'];
  this.executed = false;
}

Prompt.run = function() {
  var args, finalCallback, runners;

  prompts = _slice.apply(arguments);

  finalCallback = prompts.pop();

  if (typeof finalCallback !== 'function') {
    prompts.push(finalCallback);
    finalCallback = function() {};
  }

  runners = [];

  function callback() {
    runners.shift();

    if (runners.length === 0) {
      finalCallback();
    }
  }

  prompts.forEach(function(prompt) {
    runners.push(prompt.execute(callback));
  });
};

Prompt.prototype.setupPrompt = function() {
  var prompt;

  prompt = this;

  this['interface'] = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  this['interface'].setPrompt(this.promptText());

  this['interface'].on('line', function(input) {
    prompt.write(input);
  });

  this['interface'].on('close', function() {
    prompt.write();
  });
};

Prompt.prototype.execute = function(callback) {
  this.callback = callback;

  this.setupPrompt();
};

Prompt.prototype.promptText = function() {
  var text;

  text = this.text;

  if (this.defaultValue) text += ' (default: ' + this.defaultValue + ')';

  text += ': ';

  return text;
};

Prompt.prototype.write = function(input) {
  if (! this['interface'].paused && this.callback) {
    this['interface'].pause();
    if (input) this.value = input.match(/(.+)\n$/)[1];
    this.executed = true;
    this.callback();
  }
};
