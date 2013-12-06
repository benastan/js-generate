var EventEmitter, program, Project;

EventEmitter = require('events').EventEmitter;

program = require('commander');

Project = require('./project');

module.exports = Cli;

function Cli(options) {
  var generatorName, programOptions, undefined;

  EventEmitter.call(this);

  this.version = options.version;

  if (! this.version) this.version = '0.0.0';

  options.version = undefined;

  if (options.options) {
    this.programOptions = options.options;

    options.options = undefined;
  }

  this.options = options;

  this.setupProject();

  this.setupProgram();

  this.setupGenerators();
}

Cli.prototype = new EventEmitter();

Cli.prototype.addGeneratorToProgram = function(generator) {
  var cli, command, generatorName, program;

  cli = this;

  cli.subcommands = {};

  program = this.program;

  generatorName = generator._src;

  description = 'Run the ' + generatorName + ' generator.';

  action = function(program) {
    generator.prompts.forEach(function(prompt) {
      var value;

      value = program[prompt.name];

      if (value) {
        prompt.executed = true;
        prompt.value = value;
      }
    });

    generator.run(function() {
      cli.emit('done');
    });
  };

  cli.subcommands[generatorName] = generator.command = command = program.command(generatorName).description(description).action(action);

  generator.prompts.forEach(function(prompt) {
    cli.addPromptToGeneratorCommand(generator, prompt);
  });
};

Cli.prototype.addPromptToGeneratorCommand = function(generator, prompt) {
  var command;

  command = generator.command;

  if (prompt.option && prompt.description) command.option(prompt.option, prompt.description);
};

Cli.prototype.setupGenerators = function() {
  var cli, generator, generatorName, program;

  cli = this;

  this.project.generators.forEach(function(generator) {
    cli.addGeneratorToProgram(generator);
  });
};

Cli.prototype.setupProgram = function() {
  var cli;

  cli = this;

  program.version(this.version);

  if (this.options.options) {
    programOptions = this.options.options;

    this.options.options = undefined;

    programOptions.forEach(function(option) {
      program.option(option[0], option[1]);
    });
  }

  program.usage('[options] <generator ...>');

  this.program = program;
};

Cli.prototype.setupProject = function() {
  this.project = new Project(this.options);
};

Cli.prototype.run = function(callback) {
  var runSubcommand;

  this.on('done', function() { callback(); });

  this.program.parse(process.argv);

  if (this.program._name && this.subcommands && this.subcommands[this.program._name]) return;

  this.project.run(function() { callback(); });
};
