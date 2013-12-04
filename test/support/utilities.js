var emitter, EventEmitter, Fs, fs, _fs, requireHijack, rewire, _slice;

EventEmitter = require('events').EventEmitter;
Fs = require('fake-fs');
fs = new Fs();
_fs = require('fs');
path = require('path');
rewire = require('rewire');
requireHijack = require('require-hijack');

_slice = Array.prototype.slice;
emitter = new EventEmitter();

module.exports = {
  fs: fs,
  mockConfig: mockConfig,
  mockTemplate: mockTemplate,
  patchFs: patchFs,
  projectRequire: projectRequire,
  unpatchFs: unpatchFs
};

function mockConfig(configSource, mockDestination, configData) {
  var content, data, destinationDirectory;

  if (configSource) content = readSupportConfig(configSource);

  if (configData) {
    data = configData;
    content = JSON.stringify(data);
  } else {
    data = JSON.parse(content);
  }

  destinationDirectory = path.dirname(mockDestination);

  emitter.on('patch', function() {
    fs.dir(destinationDirectory);
    fs.writeFileSync(mockDestination + '.json', content);
  });

  return {
    data: data,
    content: content
  };
}

function mockTemplate(templateName, mockDestination, textContent) {
  var destinationDirectory, contents;

  if (textContent) content = textContent;
  else content = readSupportTemplate(templateName);

  destinationDirectory = path.dirname(mockDestination);

  emitter.on('patch', function() {
    fs.dir(destinationDirectory);
    fs.writeFileSync(mockDestination, content);
  });

  return content;
}

function patchFs() {
  fs.patch();
  emitter.emit('patch');
}

function projectRequire(moduleName, useRewire) {
  var method;

  if (useRewire) method = rewire;

  else method = require;

  return method('../../lib/generate/' + moduleName);
}

function readSupportFile() {
  var args;

  args = _slice.apply(arguments);

  return _fs.readFileSync(supportFilePath.apply(this, args), 'utf8');
}

function readSupportConfig(config, parse) {
  var content;

  content = readSupportFile('configs', config + '.json');

  if (parse) return JSON.parse(content);

  return content;
}

function supportFilePath(filename) {
  var args;

  args = [ process.cwd(), 'test', 'support' ].concat(_slice.apply(arguments));

  return path.join.apply(path, args);
}

function readSupportTemplate(template) {
  return readSupportFile('templates', template);
}

function unpatchFs() {
  fs.unpatch();
}
