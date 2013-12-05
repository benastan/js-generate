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

Cli.prototype.setupGenerators = function() {
  var cli, generator, generatorName, program;

  cli = this;

  program = this.program;

  this.hasGenerator = false;

  this.project.generators.forEach(function(generator) {
    var command, generatorName;

    generatorName = generator._src;

    description = 'Run the ' + generatorName + ' generator.';
    action = function() {
      generator.run(function() {
        cli.emit('done');
      });
    };
    program.command(generatorName).description(description).action(action);
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
  this.program.parse(process.argv);

  if (this.program._name) {
    this.on('done', function() {
      callback();
    });
    this.program.emit(this.program._name);
  } else {
    this.project.run(function() {
      callback();
    });
  }
};
