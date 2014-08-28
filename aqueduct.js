var Duplex = require('readable-stream/duplex')
var inherits = require('inherits')
var isStream = require('isstream')
var splice = Array.prototype.splice

function append_(add, pipeline, aqueduct) {
  function ondata(d) {
    aqueduct.push(d)
  }

  function onend() {
    aqueduct.push(null)
  }

  var il = add.length
  if (!il) return
  
  var target = pipeline.streams
  var tl = target.length - 1
  if (~tl) {
    p = target[tl]
    p.removeListener('data', ondata)
    p.removeListener('end', onend)
  }

  var a, p
  for (var i = 0; i < il;) {
    a = add[i]
    p = target[tl++]

    splice.call(target, tl, 0, a)
    if (p) p.pipe(a)
    if (++i === il) {
      a.on('data', ondata)
      a.on('end', onend)
    }
  }
}

function append(streams, pipeline, aqueduct) {
  if (isStream(streams)) streams = [streams]
  if (Array.isArray(streams)) append_(streams, pipeline, aqueduct)
}

function Pipeline(options, aqueduct) {
  this.aqueduct = aqueduct
  this.streams = []
}

function read(streams, n) {
  length = streams.length
  if (!length) return null
  return streams[length - 1].read(n)
}

Pipeline.prototype.read = function (n) {
  return read(this.streams, n)
}

function Aqueduct(streams, options) {
  if (!(this instanceof Aqueduct))
    return new Aqueduct(streams, options)

  this._pipeline = new Pipeline(options, this)
  Duplex.call(this, options)
  append(streams, this._pipeline, this)
}

inherits(Aqueduct, Duplex)

module.exports = Aqueduct

Object.defineProperty(Aqueduct.prototype, 'length', {
  get: function () {
    return this._pipeline.streams.length
  }
})

Aqueduct.prototype._read = function (n) {
  return this._pipeline.read(n)
}

Aqueduct.prototype._write = function (chunk, enc, next) {
  var first = this._pipeline.streams[0]
  first ? first.write(chunk) : this.push(chunk)
  next()
}

