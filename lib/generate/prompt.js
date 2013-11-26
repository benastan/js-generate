var fs, readline;

fs = require('fs');
readline = require('readline');

module.exports = Prompt;

function Prompt(options) {
  var prompt;

  prompt = this;

  this.name = options.name;
  this.text = options.prompt;
  this.defaultValue = options['default'];
  this.executed = false;

  this.setupPrompt();
}

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

  if (this['interface'].paused) this['interface'].resume();

  else this['interface'].prompt();
};

Prompt.prototype.promptText = function() {
  var text;

  text = this.text;

  if (this.defaultValue) text += ' (default: ' + this.defaultValue + ')';

  text += ': ';

  return text;
};

Prompt.prototype.write = function(input) {
  if (! this['interface'].paused) {
    this['interface'].pause();
    if (input) this.value = input.match(/(\w+)\n$/)[1];
    this.callback();
    this.executed = true;
  }
};
