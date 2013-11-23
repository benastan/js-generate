var program, Project;

program = require('commander');

Project = require('./project');

module.exports = Cli;

function Cli() {
  program.version('0.0.1');
  program.option('-c, --config [filename]', 'Config filename');
  program.option('-d, --cwd [dir]', 'Current working directory');
  program.parse(process.argv);

  this.program = program;

  this.project = new Project(program);

  this.project.runPrompts();
}
