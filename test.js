var chai, Cli, Config, Fs, fs, _fs, path, Project, Prompt, Nockstream, rewire, Template;

chai = require('chai');
path = require('path');

Fs = require('fake-fs');
fs = new Fs();
_fs = require('fs');
rewire = require('rewire');
Nockstream = require('nockstream');

chai.should();

function projectRequire(dep, useRewire) {
  var method;

  if (useRewire) method = rewire;
  else method = require;

  return method('./lib/generate/'+dep);
}

function supportFile(file) {
  return _fs.readFileSync(path.join(process.cwd(), 'test', 'support', file), 'utf8');
}

function supportTemplate(template) {
  return supportFile(path.join('templates', template));
}

function supportConfig(config, parse) {
  var content;

  content = supportFile(path.join('configs', config) + '.json');

  if (parse) return JSON.parse(content);

  return content;
}

function mockPrompt(streamString) {
  var stream;

  stream = new Nockstream({
    streamString: streamString + "\n"
  });

  Prompt = projectRequire('prompt', true);
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
  Prompt = projectRequire('prompt');
}

Cli = projectRequire('cli');
Config = projectRequire('config');
Template = projectRequire('template');
Project = projectRequire('project');
Prompt = projectRequire('prompt');

describe(Template, function() {
  var destinationDir, options, template, templateContent, templateData, templateDestination, projectPath, templateFilename;

  destinationDir = 'app';
  templateContent = supportTemplate('package.json');
  templateData = {
    name: 'dummy-app',
    version: '0.0.0',
    main: 'index.js'
  };
  templateFilename = 'templates/package.json';
  projectPath = 'dummy';

  templateDestination = path.join(destinationDir, templateFilename);

  beforeEach(function() {
    fs.patch();
    fs.dir(projectPath);
    fs.file(path.join(projectPath, templateFilename), templateContent);

    template = new Template({
      cwd: projectPath,
      src: templateFilename,
      dest: destinationDir
    });
  });

  afterEach(function() {
    template = undefined;
    fs.unpatch();
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
    var configData, configName, configText;

    beforeEach(function() {
      configName = 'basic';
      configText = supportConfig('basic');
      configData = supportConfig('basic', true);

      fs.patch();
      fs.dir('dummy');
      fs.writeFileSync('dummy/config.json', configText);

      config = new Config({
        cwd: 'dummy'
      });
    });

    afterEach(function() {
      fs.unpatch();
    });

    it('loads the config file', function() {
      config.src().should.eq('dummy/config.json');
      config.settings.templateDir.should.eq('another-template-dir');
    });
  });
});

describe(Project, function() {
  var config, configData, configText, project, projectPath;

  describe('constructor', function() {
    beforeEach(function() {
      configName = 'basic';
      configText = supportConfig('basic');
      configData = supportConfig('basic', true);

      fs.patch();
      fs.dir('dummy');
      fs.writeFileSync('dummy/config.json', configText);
    });

    afterEach(function() {
      fs.unpatch();
    });

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
        var templateDir, promptData, promptName;

        templateDir = 'my-template-dir';

        promptName = 'some prompt';

        promptData = {
        };

        beforeEach(function() {
          project = new Project();
        });
      });
    });
  });

  describe('#runPrompts', function() {
    var cwd, start, streamString;

    beforeEach(function() {
      streamString = 'myvalue';
      start = mockPrompt(streamString);

      Project = projectRequire('project', true);
      Project.__set__({
        Prompt: Prompt
      });

      configText = supportConfig('prompts');
      configData = supportConfig('prompts', true);

      cwd = 'dummy';
      fs.patch();
      fs.dir('dummy');
      fs.writeFileSync('dummy/config.json', configText);
      project = new Project({
        cwd: cwd
      });
    });

    afterEach(function() {
      fs.unpatch();
      unmockPrompt();
      Project = projectRequire('project');
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
});

describe(Cli, function() {
  var Cli, cli, command, configData, configText;
  beforeEach(function() {
    Cli = projectRequire('cli', true);
    command = 'node ./bin/generate -c myconfig.json -d dummy';
    configText = supportConfig('basic');
    configData = supportConfig('basic', true);
    Cli.__set__({
      process: {
        argv: command.split(' ')
      }
    });
    fs.patch();
    fs.dir('dummy');
    fs.writeFileSync('dummy/myconfig.json', configText);
    cli = new Cli();
  });

  afterEach(function() {
    Cli = projectRequire('cli');
    fs.unpatch();
  });

  it('parses the parameters', function() {
    cli.program.config.should.eq('myconfig.json');
    cli.program.cwd.should.eq('dummy');
    cli.project.config.settings.templateDir.should.eq(configData.templateDir);
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
