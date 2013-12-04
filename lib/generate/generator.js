var Prompt, _slice;

_slice = Array.prototype.slice;

Prompt = require('./prompt');

module.exports = Generator;

function Generator(options) {
  var cwd, modulePath, relative, src;

  cwd = options.cwd;

  if (! cwd) cwd = '.';

  this._cwd = cwd;

  this._src = options.src;

  relative = /^\./.test(cwd);

  modulePath = path.join(this._cwd, this._src);

  if (relative) modulePath = './' + modulePath;

  this.module = require(modulePath);

  this.project = options.project;

  this.templates = [];

  this.prompts = [];

  this.module.call(this);
}

Generator.prototype.useTemplate = function(templateName) {
  var template;

  template = this.project.getTemplate(templateName);

  if (template) this.templates.push(template);

  return template;
};

Generator.prototype.usePrompt = function(promptName) {
  var prompt;

  prompt = this.project.getPrompt(promptName);

  if (prompt) this.prompts.push(prompt);

  return prompt;
};

Generator.prototype.run = function(callback) {
  var prompts;

  prompts = _slice.apply(this.prompts);

  if (prompts.length > 0) {

    prompts.push(callback);

    Prompt.run.apply(Prompt, prompts);

  } else if (typeof callback === 'function') callback();
};
