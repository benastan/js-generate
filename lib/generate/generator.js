var path, Project, Prompt, _slice;

_slice = Array.prototype.slice;

path = require('path');
Project = require('./project');
Prompt = require('./prompt');

module.exports = Generator;

function Generator(options) {
  var cwd, modulePath, relative, src;

  cwd = options.cwd;

  if (! cwd) cwd = '.';

  this._cwd = cwd;

  this._src = options.src;

  this.modulePath = modulePath = this._cwd + '/' + path.join(this._src);

  try {
    this.module = require(modulePath);
  } catch (e) {
    this.noSuchModule = true;
  }

  this.project = options.project;

  this.templates = [];

  this.prompts = [];

  if (! this.noSuchModule) this.module.call(this);
}

Generator.prototype = new Project({});

Generator.prototype.renderTemplate = function(templateName) {
  var template;

  template = this.project.getTemplate(templateName);

  if (template) this.templates.push(template);

  return template;
};

Generator.prototype.prompt = function(promptName) {
  var prompt;

  prompt = this.project.getPrompt(promptName);

  if (prompt) this.prompts.push(prompt);

  return prompt;
};
