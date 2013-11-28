var Config, fs, mkdirp, path, Prompt, _slice, Template;

Config = require('./config');
Prompt = require('./prompt');
Template = require('./template');

fs = require('fs');
mkdirp = require('mkdirp');
path = require('path');
_slice = Array.prototype.slice;

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

  this.loadTemplates();
}

Project.prototype.destination = function() {
  var args;

  args = _slice.apply(arguments);

  args.unshift(this._cwd);

  return path.join.apply(path, args);
};

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

Project.prototype.loadTemplates = function() {
  var project, templateDir;

  project = this;

  templateDir = this.config.settings.templateDir;

  function collectTemplates(dirname) {
    var templates;

    templates = [];

    fullpath = path.join(project._cwd, templateDir, dirname);

    if (! fs.existsSync(fullpath)) return;

    files = fs.readdirSync(fullpath);

    files.forEach(function(file) {
      var name, stat, template;

      stat = fs.statSync(path.join(fullpath, file));

      if (stat.isDirectory()) templates = templates.concat(collectTemplates(path.join(dirname, file)));

      else {
        template = new Template({
          cwd: path.join(project._cwd, templateDir),
          src: path.join(dirname, file)
        });

        templates.push(template);
      }
    });

    return templates;
  }

  this.templates = collectTemplates('');
};

Project.prototype.promptsData = function() {
  var data;

  data = {};

  this.prompts.forEach(function(prompt) {
    var value;

    if (prompt.value) value = prompt.value;
    else value = prompt.defaultValue;

    data[prompt.name] = value;
  });

  return data;
};

Project.prototype.renderTemplates = function() {
  var project;

  project = this;

  this.templates.forEach(function(template) {
    template.write(project.promptsData());
  });
};

Project.prototype.run = function(callback) {
  var project;

  project = this;

  this.runPrompts(function() {
    project.renderTemplates();
    callback();
  });
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
