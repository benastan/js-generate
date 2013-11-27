var chai, Cli, Config, Fs, fs, _fs, path, Project, Prompt, Nockstream, rewire, Template;

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

  function prompt() {
    stream.start();
  }

  return prompt;
}

function unmockPrompt() {
  Prompt = utils.projectRequire('prompt');
}

Cli = utils.projectRequire('cli');
Config = utils.projectRequire('config');
Template = utils.projectRequire('template');
Project = utils.projectRequire('project');
Prompt = utils.projectRequire('prompt');

describe(Template, function() {
  var destinationDir, options, template, templateContent, templateData, templateDestination, templateSource, projectPath, templateFilename;

  projectPath = 'dummy';
  destinationDir = 'app';
  templateFilename = 'templates/package.json';
  templateSource = path.join(projectPath, templateFilename);
  templateDestination = path.join(destinationDir, templateFilename);

  templateData = {
    name: 'dummy-app',
    version: '0.0.0',
    main: 'index.js'
  };

  beforeEach(function() {
    templateContent = utils.mockTemplate('package.json', templateSource);

    utils.patchFs();

    template = new Template({
      cwd: projectPath,
      src: templateFilename,
      dest: destinationDir
    });
  });

  afterEach(function() {
    template = undefined;
    utils.unpatchFs();
  });

  describe('#constructor', function() {
    it('sets values from arguments', function() {
      template._cwd.should.eq(projectPath);
      template._basename.should.eq('package');
      template._dest.should.eq(destinationDir);
      template._dirname.should.eq('templates');
      template._ext.should.eq('.json');
      template._src.should.eq(templateFilename);
    });
  });

  describe('#src', function() {
    it('concatenates #cwd and #path', function() {
      template.src().should.eq(path.join(projectPath, templateFilename));
    });
  });

  describe('#dest', function() {
    it('uses the _dest attribute', function() {
      template.dest().should.eq(templateDestination);
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
      config.setDefault('templateDir', 'templates');
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

describe(Project, function() {
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

  describe('#runPrompts', function() {
    var cwd, mockConfig, start, streamString;

    beforeEach(function() {
      cwd = 'dummy';
      streamString = 'myvalue';
      start = mockPrompt(streamString);

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
        project.prompts[0].value.should.eq('myvalue');
        project.prompts[1].executed.should.eq(true);
        project.prompts[1].value.should.eq('myvalue');
        done();
      });

      start();
    });
  });

  describe('#loadTemplates', function() {
    beforeEach(function() {
      fs.patch();
      fs.dir('dummy');
    });
  });
});

describe(Cli, function() {
  var Cli, cli, command, mockConfig;
  beforeEach(function() {
    Cli = utils.projectRequire('cli', true);
    command = 'node ./bin/generate -c myconfig.json -d dummy';

    mockConfig = utils.mockConfig('basic', 'dummy/myconfig');

    Cli.__set__({
      process: {
        argv: command.split(' ')
      }
    });

    utils.patchFs();

    cli = new Cli();
  });

  afterEach(function() {
    Cli = utils.projectRequire('cli');
    utils.unpatchFs();
  });

  it('parses the parameters', function() {
    cli.program.config.should.eq('myconfig.json');
    cli.program.cwd.should.eq('dummy');
    cli.project.config.settings.templateDir.should.eq(mockConfig.data.templateDir);
  });
});

describe(Prompt, function() {
  var defaultValue, name, prompt, stream, text;

  name = 'my prompt';
  text = 'Name';
  defaultValue = 'my value';

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
    var start, streamString;
    beforeEach(function() {
      streamString = 'myvalue';
      start = mockPrompt(streamString);
      makePrompt();
    });

    afterEach(unmockPrompt);

    it('streams from stdin', function(done) {
      prompt.execute(function() {
        prompt.value.should.eq(streamString);
        done();
      });

      start();
    });
  });
});
