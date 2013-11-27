var Config, fs, mkdirp, path, Prompt;

Config = require('./config');
Prompt = require('./prompt');

fs = require('fs');
mkdirp = require('mkdirp');
path = require('path');

module.exports = Project;

function Project(options) {
  var cwd;

  if (! options) options = {};

  this._configFilename = options.config;

  cwd = options.cwd;

  if (! cwd) cwd = '.';

  this._cwd = cwd;

  this.loadConfig();

  this.loadPrompts();
}

Project.prototype.loadConfig = function() {
  this.config = new Config({
    cwd: this._cwd,
    filename: this._configFilename
  });
};

Project.prototype.loadPrompts = function() {
  var currentPrompt, prompts, promptKey, promptOptions;

  this.prompts = [];

  prompts = this.config.settings.prompts;

  for (promptKey in prompts) {
    promptOptions = prompts[promptKey];
    promptOptions.name = promptKey;
    currentPrompt = new Prompt(promptOptions);
    this.prompts.push(currentPrompt);
  }
};

Project.prototype.runPrompts = function(finalCallback) {
  var runners;

  runners = [];

  if (typeof finalCallback !== 'function') finalCallback = function() {};

  function callback() {
    runners.shift();

    if (runners.length === 0) {
      finalCallback();
    }
  }

  this.prompts.forEach(function(prompt) {
    runners.push(prompt.execute(callback));
  });
};
