var chai, Cli, Config, Fs, fs, _fs, Generator, Nockstream, path, Project, Prompt, rewire, Template;

chai = require('chai');
path = require('path');
utils = require('./test/support/utilities');

fs = utils.fs;
_fs = require('fs');
rewire = require('rewire');
Nockstream = require('nockstream');

chai.should();

function mockPrompt(streamString) {
  var stream;

  stream = new Nockstream({
    streamString: streamString + "\n"
  });

  Prompt = utils.projectRequire('prompt', true);
  Prompt.__set__({
    process: {
      stdin: stream,
      stdout: {
        write: function() {}
      }
    }
  });

  return stream;
}

function unmockPrompt() {
  Prompt = utils.projectRequire('prompt');
}

Cli = utils.projectRequire('cli');
Config = utils.projectRequire('config');
Generator = utils.projectRequire('generator');
Template = utils.projectRequire('template');
Project = utils.projectRequire('project');
Prompt = utils.projectRequire('prompt');

describe('The Library', function() {
  describe(Template, function() {
    var cwd, dest, filename, options, template, templateContent, templateData, templateDestination;

    cwd = 'dummy/templates';
    dest = 'app';
    filename = 'sample/package.json';

    templateData = {
      name: 'dummy-app',
      version: '0.0.0',
      main: 'index.js'
    };

    templateDestination = 'app/sample/package.json';

    beforeEach(function() {
      templateContent = utils.mockTemplate('package.json', 'dummy/templates/sample/package.json');

      utils.patchFs();

      template = new Template({
        cwd: cwd,
        src: filename,
        dest: dest
      });
    });

    afterEach(function() {
      template = undefined;
      utils.unpatchFs();
    });

    describe('#constructor', function() {
      it('sets values from arguments', function() {
        template._cwd.should.eq(cwd);
        template._basename.should.eq('package');
        template._dest.should.eq(dest);
        template._dirname.should.eq('sample');
        template._ext.should.eq('.json');
        template._src.should.eq(filename);
      });
    });

    describe('#src', function() {
      it('concatenates #cwd and #path', function() {
        template.src().should.eq(path.join(cwd, filename));
      });
    });

    describe('#dest', function() {
      it('uses the _dest attribute', function() {
        template.dest().should.eq(templateDestination);
      });

      describe('when #dest is a function', function() {
        beforeEach(function() {
          template._dest = function() {
            return 'another/dest';
          };
        });

        it('runs the function', function() {
          template.dest().should.eq('another/dest/sample/package.json');
        });
      });
    });

    describe('#read', function() {
      it('reads the file', function() {
        template.read().should.eq(templateContent);
      });
    });

    describe('#render', function() {
      var textContent, jsonContent;

      beforeEach(function() {
        textContent = template.render(templateData);
        jsonContent = JSON.parse(textContent);
      });

      it('renders the template with data', function() {
        textContent.should.be.a('string');
        jsonContent.name.should.eq('dummy-app');
      });
    });

    describe('#write', function() {
      var contents, fileExists;

      beforeEach(function() {
        template.write(templateData);
        fileExists = fs.existsSync(templateDestination);
        jsonContent = JSON.parse(fs.readFileSync(templateDestination));
      });

      it('writes the file to the destination', function() {
        fileExists.should.eq(true);
        jsonContent.name.should.eq(templateData.name);
      });
    });
  });

  describe(Config, function() {
    var config;

    describe('#setDefault', function() {
      beforeEach(function() {
        config = new Config();
        config.settings.templateDir = 'customDir';
        config.setDefault('destinationDir', 'project');
      });

      it('overrides empty values', function() {
        config.settings.templateDir.should.eq('customDir');
        config.settings.destinationDir.should.eq('project');
      });
    });

    describe('no config file', function() {
      beforeEach(function() {
        config = new Config();
      });

      it('sets defaults', function() {
        config.settings.templateDir.should.eq('templates');
        config.settings.generatorDir.should.eq('generators');
      });
    });

    describe('config file exists', function() {
      var config, cwd, destinationDirectory, mockConfig;

      beforeEach(function() {
        cwd = 'dummy';
        destinationDirectory = path.join(cwd, 'config');

        mockConfig = utils.mockConfig('basic', destinationDirectory);

        utils.patchFs();

        config = new Config({
          cwd: 'dummy'
        });
      });

      afterEach(function() {
        utils.unpatchFs();
      });

      it('loads the config file', function() {
        config.src().should.eq('dummy/config.json');
        config.settings.templateDir.should.eq(mockConfig.data.templateDir);
      });
    });
  });

  describe('Project', function() {
    var config, configDestination, cwd, project, projectPath, mockConfig;

    describe('constructor', function() {
      describe('#config', function() {
        describe('no config given', function() {
          beforeEach(function() {
            project = new Project();
            config = new Config();
          });

          it('sets defaults', function() {
            project._cwd.should.eq('.');
            project.config.settings.templateDir.should.eq(config.settings.templateDir);
          });
        });

        describe('config given', function() {
          beforeEach(function() {
            cwd = 'dummy';
            configDestination = path.join(cwd, 'basic');

            mockConfig = utils.mockConfig('basic', configDestination);

            utils.patchFs();

            project = new Project({
              cwd: cwd,
              config: 'basic.json'
            });
          });

          afterEach(function() {
            utils.unpatchFs();
          });

          it('loads the correct config', function() {
            project.config.settings.templateDir.should.eq(mockConfig.data.templateDir);
          });
        });
      });
    });

    describe('#destination', function() {
      beforeEach(function() {
        project = new Project({
          cwd: 'dummy'
        });
      });

      it('should equal cwd', function() {
        project.destination().should.eq('dummy');
      });

      it('should equal cwd joined with other segments', function() {
        project.destination('templates', 'package.json').should.eq('dummy/templates/package.json');
      });
    });

    describe.skip('#runPrompts', function() {
      var cwd, mockConfig, streamString;

      beforeEach(function() {
        cwd = 'dummy';
        streamString = 'my-value';
        mockPrompt(streamString);

        Project = utils.projectRequire('project', true);
        Project.__set__({
          Prompt: Prompt
        });

        mockConfig = utils.mockConfig('prompts', path.join(cwd, 'config'));

        utils.patchFs();

        project = new Project({
          cwd: cwd
        });
      });

      afterEach(function() {
        utils.unpatchFs();
        unmockPrompt();
        Project = utils.projectRequire('project');
      });

      it('runs the prompts from the config file', function(done) {
        project.runPrompts(function() {
          project.prompts[0].executed.should.eq(true);
          project.prompts[0].value.should.eq('my-value');
          project.prompts[1].executed.should.eq(true);
          project.prompts[1].value.should.eq('my-value');
          done();
        });
      });
    });

    describe('#loadTemplates', function() {
      var cwd, mockTemplate;
      beforeEach(function() {
        cwd = 'dummy';

        mockTemplate = utils.mockTemplate('package.json', path.join(cwd, 'templates', 'package.json'));

        utils.patchFs();

        project = new Project({
          cwd: 'dummy'
        });
      });

      afterEach(function() {
        utils.unpatchFs();
      });

      it('loads templates from the templates directory', function() {
        project.loadTemplates();
        project.templates[0]._basename.should.eq('package');
        project.templates[0].read().should.eq(mockTemplate);
      });
    });

    describe('#loadGenerators', function() {
      var cwd, generatorContent, generatorModule, mockConfig, streamString;

      beforeEach(function() {
        cwd = 'dummy';

        streamString = 'my-value';
        mockPrompt(streamString);

        mockConfig = utils.mockConfig('prompts', path.join(cwd, 'config'));

        generatorContent = utils.readSupportFile('generators', 'basic_generator.js');
        generatorModule = require('./test/support/generators/basic_generator');
        generatorModule['@noCallThru'] = true;

        Generator = utils.projectRequire('generator', false, true, {
          'dummy/generators/my_generator': generatorModule,
          './prompt': Prompt
        });

        Project = utils.projectRequire('project', false, true, {
          './prompt': Prompt,
          './generator': Generator
        });

        utils.mockTemplate('happy_path.html', path.join(cwd, 'templates', 'happy_path.html'));

        utils.patchFs();

        fs.dir(path.join(cwd, 'generators'));
        fs.writeFileSync(path.join(cwd, 'generators', 'my_generator.js'), generatorContent);

        project = new Project({
          cwd: cwd
        });

        project.loadGenerators();
      });

      afterEach(function() {
        utils.unpatchFs();
        Project = utils.projectRequire('project');
        Generator = utils.projectRequire('generator');
        unmockPrompt();
      });

      it('loads the generators', function() {
        project.generators.length.should.eq(1);
      });
    });

    // Happy path.
    describe('#run', function() {
      var templateContent, mockTemplate;

      beforeEach(function(done) {
        mockConfig = utils.mockConfig('prompts', 'dummy/config');
        mockTemplate = utils.mockTemplate('happy_path.html', 'dummy/templates/mypath/happy_path.html');

        mockPrompt('js-generator');

        Project = utils.projectRequire('project', true);
        Project.__set__({
          Prompt: Prompt
        });

        utils.patchFs();

        project = new Project({
          cwd: 'dummy',
          dest: 'app'
        });

        project.run(function() {
          templateContent = fs.readFileSync('app/mypath/happy_path.html', 'utf8');
          done();
        });
      });

      afterEach(function() {
        utils.unpatchFs();
        unmockPrompt();
        Project = utils.projectRequire('project');
      });

      it('runs the project', function() {
        templateContent.should.eq("<h1>js-generator</h1>\n");
      });
    });
  });

  describe('Cli', function() {
    var Cli, cli, command, cwd, mockConfig, templateContent;

    function mockProcess() {
      Cli = utils.projectRequire('cli', true, false);
      Cli.__set__({
        process: {
          cwd: function() {
            return 'dummy';
          },
          argv: command.split(' ')
        }
      });
    }

    function unmockProcess() {
      Cli = utils.projectRequire('cli');
    }


    describe('running a whole project', function() {
      beforeEach(function(done) {
        cwd = 'dummy';

        command = 'custom-generate';

        streamString = 'my-value';

        mockPrompt(streamString);

        mockProcess();

        Project = utils.projectRequire('project', true);
        Project.__set__({
          Prompt: Prompt
        });

        Cli.__set__({
          Project: Project
        });

        mockConfig = utils.mockConfig('prompts', path.join(cwd, 'config'));

        utils.mockTemplate('happy_path.html', path.join(cwd, 'templates', 'happy_path.html'));

        utils.patchFs();

        cli = new Cli({
          cwd: 'dummy',
          dest: 'app'
        });

        cli.run(function() {
          templateContent = fs.readFileSync('./app/happy_path.html', 'utf8');
          done();
        });
      });

      afterEach(function() {
        utils.unpatchFs();
        unmockPrompt();
        unmockProcess();
      });

      it('parses the parameters', function() {
        cli.program.dest.should.eq('app');
        cli.project._dest.should.eq('app');
        cli.project._cwd.should.eq('dummy');
        cli.hasGenerator.should.eq(false);
        templateContent.should.eq("<h1>my-value</h1>\n");
      });
    });

    describe.only('running a generator', function() {
      var generatorContent, generatorModule;

      beforeEach(function(done) {
        cwd = 'dummy';

        command = 'node custom-generate my_generator';

        streamString = 'my-value';

        mockPrompt(streamString);

        mockProcess();

        generatorContent = utils.readSupportFile('generators', 'basic_generator.js');
        generatorModule = require('./test/support/generators/basic_generator');
        generatorModule['@noCallThru'] = true;

        Generator = utils.projectRequire('generator', false, true, {
          'dummy/generators/my_generator': generatorModule,
          './prompt': Prompt
        });

        Project = utils.projectRequire('project', false, true, {
          './prompt': Prompt,
          './generator': Generator
        });

        Cli.__set__({
          Project: Project
        });

        mockConfig = utils.mockConfig('prompts', path.join(cwd, 'config'));

        utils.mockTemplate('happy_path.html', path.join(cwd, 'templates', 'happy_path.html'));

        utils.patchFs();

        fs.dir(path.join(cwd, 'generators'));
        fs.writeFileSync(path.join(cwd, 'generators', 'my_generator.js'), generatorContent);

        cli = new Cli({
          cwd: 'dummy',
          dest: 'app'
        });

        cli.run(function() {
          templateContent = fs.readFileSync('./app/happy_path.html', 'utf8');
          done();
        });
      });

      afterEach(function() {
        utils.unpatchFs();
        unmockPrompt();
        unmockProcess();
      });

      it('parses the parameters', function() {
        cli.project._dest.should.eq('app');
        cli.project._cwd.should.eq('dummy');
        cli.hasGenerator.should.eq(false);
        templateContent.should.eq("<h1>my-value</h1>\n");
      });
    });
  });

  describe(Prompt, function() {
    var defaultValue, name, prompt, stream, text;

    name = 'my prompt';
    text = 'Name';
    defaultValue = 'myvalue';

    function makePrompt() {
      prompt = new Prompt({
        prompt: text,
        name: name,
        defaultValue: defaultValue
      });
    }

    describe('#constructor', function() {
      beforeEach(makePrompt);
      it('sets some defaults', function() {
        prompt.text.should.eq(text);
        prompt.name.should.eq(name);
      });
    });

    describe('#execute', function() {
      var streamString;
      beforeEach(function() {
        streamString = 'my-value';
        mockPrompt(streamString);
        makePrompt();
      });

      afterEach(unmockPrompt);

      it('streams from stdin', function(done) {
        prompt.execute(function() {
          prompt.value.should.eq(streamString);
          done();
        });
      });
    });
  });

  describe('Generator', function() {
    var generator, generatorModule, project;

    beforeEach(function() {
      cwd = 'dummy';

      streamString = 'my-value';
      mockPrompt(streamString);

      mockConfig = utils.mockConfig('prompts', path.join(cwd, 'config'));

      generatorModule = require('./test/support/generators/basic_generator');
      generatorModule['@noCallThru'] = true;

      Generator = utils.projectRequire('generator', false, true, {
        './generators/my_generator': generatorModule,
        './prompt': Prompt
      });

      Project = utils.projectRequire('project', false, true, {
        './prompt': Prompt,
        './generator': Generator
      });

      utils.mockTemplate('happy_path.html', path.join(cwd, 'templates', 'happy_path.html'));

      utils.patchFs();

      project = new Project({
        cwd: cwd
      });

      generator = new Generator({
        src: 'generators/my_generator',
        project: project
      });
    });

    afterEach(function() {
      utils.unpatchFs();
      unmockPrompt();
      Generator = utils.projectRequire('generator');
      Project = utils.projectRequire('project');
    });

    it('loads the module', function() {
      generator.module.should.be.a('function');
      generator.templates[0]._src.should.eq('happy_path.html');
      generator.prompts[0].name.should.eq('name');
    });

    describe('#run', function() {
      var templateResult;

      beforeEach(function(done) {
        generator.run(function() {
          templateResult = fs.readFileSync('happy_path.html', 'utf8');
          done();
        });
      });

      it('runs the prompts', function() {
        generator.prompts[0].executed.should.eq(true);
        templateResult.should.eq('<h1>my-value</h1>\n');
      });
    });
  });
});
