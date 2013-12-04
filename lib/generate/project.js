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

  this.loadGenerators();
}

Project.prototype.destination = function() {
  var args;

  args = _slice.apply(arguments);

  args.unshift(this._cwd);

  return path.join.apply(path, args);
};

Project.prototype.getTemplate = function(templateName) {
  var template;

  this.templates.forEach(function(currentTemplate) {
    if (currentTemplate._src === templateName) template = currentTemplate;
  });

  return template;
};

Project.prototype.getPrompt = function(promptName) {
  var prompt;

  this.prompts.forEach(function(currentPrompt) {
    if (currentPrompt.name === promptName) prompt = currentPrompt;
  });

  return prompt;
};

Project.prototype.loadConfig = function() {
  this.config = new Config({
    cwd: this._cwd,
    filename: this._configFilename
  });
};

Project.prototype.loadGenerators = function() {
  var generatorDir;

  project = this;

  generatorDir = this.config.settings.generatorDir;

  function collectGenerators(dirname) {
    var generators;

    generators = [];

    fullpath = path.join(project._cwd, generatorDir, dirname);

    if (! fs.existsSync(fullpath)) return;

    files = fs.readdirSync(fullpath);

    files.forEach(function(file) {
      var name, stat, generator;

      stat = fs.statSync(path.join(fullpath, file));

      if (stat.isDirectory()) generators = generators.concat(collectGenerators(path.join(dirname, file)));

      else {
        generator = new Generator({
          cwd: path.join(project._cwd, generatorDir),
          project: project,
          src: path.join(dirname, file)
        });

        generators.push(generator);
      }
    });

    return generators;
  }

  this.generators = collectGenerators('');
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
  var prompts;

  prompts = _slice.apply(this.prompts);

  if (prompts.length > 0) {

    prompts.push(finalCallback);

    Prompt.run.apply(Prompt, prompts);

  } else if (typeof finalCallback === 'function') finalCallback();
};
