var ejs, fs, mkdirp, path;

ejs = require('ejs');
fs = require('fs');
mkdirp = require('mkdirp');
path = require('path');

module.exports = Template;

function Template(options) {
  var ext, src;

  this._flatten = options.flatten;
  this._cwd = options.cwd;
  this._dest = options.dest;

  this._src = src = options.src;
  this._ext = ext = path.extname(src);
  this._dirname = path.dirname(src);
  this._basename = path.basename(src, ext);
}

Template.prototype.src = function() {
  return path.join(this._cwd, this._src);
};

Template.prototype.destDir = function() {
  segments = [ this._dest, this._dirname ];
  if (this._flatten === true) segments.splice(1, 1);
  return path.join.apply(path, segments);
};

Template.prototype.dest = function() {
  return path.join(this.destDir(), this._basename) + this._ext;
};

Template.prototype.mkdir = function() {
  var dir;

  dir = this.destDir();

  return mkdirp.sync(dir);
};

Template.prototype.read = function() {
  var fullPath, stats;

  src = this.src();

  stats = fs.statSync(src);

  if (stats.isFile()) return fs.readFileSync(src, 'utf8');

  return '';
};

Template.prototype.render = function(data) {
  return ejs.render(this.read(), data);
};

Template.prototype.write = function(data) {
  var content, dest;

  if (typeof data === 'string') {
    content = data;
  } else {
    content = this.render(data);
  }

  this.mkdir();

  dest = this.dest();

  return fs.writeFileSync(dest, content);
};
