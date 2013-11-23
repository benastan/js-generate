var fs, readline;

readline = require('readline');
fs = require('fs');

module.exports = Prompt;

function Prompt(options) {
  this.name = options.name;
  this.text = options.prompt;
  this.defaultValue = options['default'];
  this.executed = false;
}

Prompt.prototype.read = function() {
  prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  prompt.on('line', function() {
    console.log(arguments);
  });

  this.executed = true;
};
