var fs, path;

fs = require('fs');
path = require('path');

module.exports = Config;

function Config(options) {
  var ext, filename;

  if (! options) options = {};

  this._cwd = options.cwd;
  filename = options.filename;

  if (! filename) filename = 'config.json';

  this._filename = filename;
  this._ext = ext = path.extname(filename);
  this._dirname = path.dirname(filename);
  this._basename = path.basename(filename, ext);

  this.load();

  this.setDefaults();
}

Config.prototype.exists = function() {
  return fs.existsSync(this.src());
};

Config.prototype.load = function() {
  if (this.exists()) {
    this.settings = this.parse();
  } else {
    this.settings = {};
  }
};

Config.prototype.parse = function() {
  return JSON.parse(this.read());
};

Config.prototype.read = function() {
  return fs.readFileSync(this.src(), 'utf8');
};

Config.prototype.setDefault = function(key, val) {
  if (! this.settings[key]) return this.settings[key] = val;
};

Config.prototype.setDefaults = function() {
  this.setDefault('templateDir', 'templates');
  this.setDefault('generatorDir', 'generators');
};

Config.prototype.src = function() {
  return path.join(this._cwd, this._dirname, this._basename) + this._ext;
};
