#!/usr/bin/env node

var aqueduct = require('./')
var desc = require('macchiato')
var stream = require('readable-stream')

desc('Stream-Aqueduct', function () {
  
  desc.beforeEach(function () {
    this.jsonStream = new stream.Transform({ objectMode: true })
    this.jsonStream._transform = function (chunk, enc, next) {
      if (chunk) chunk = JSON.parse(chunk)
      next(null, chunk)
    }
    
    this.validationStream = new stream.Transform({ objectMode: true })
    this.validationStream._transform = function (obj, enc, next) {
      if (!obj.attr) obj.attr = true
      next(null, obj)
    }

    this.stringifyStream = new stream.Transform({ objectMode: true })
    this.stringifyStream._transform = function (obj, enc, next) {
      var str
      if (obj) {
        str = JSON.stringify(obj)
        str = new Buffer(str)
      }
      next(null, str)
    }
  })

  desc.it('Should make a pipeline of streams', function (t) {
    var start  = new stream.Readable()
    start._read = function () {
      this.push(JSON.stringify({ attr: false }))
      this.push(null)
    }

    var end = new stream.Writable()
    end._write = function (chunk, enc, next) {
      t.equals(chunk.toString(), JSON.stringify({ attr: true }))
      next()
      t.end()
    }
    
    var pipeline = [
      this.jsonStream
      , this.validationStream
      , this.stringifyStream
    ]
    
    start.pipe(aqueduct(pipeline)).pipe(end)
  })
  
  desc.it('Should emit finish', function (t) {
    var start  = new stream.Readable()
    start._read = function () {
      this.push(JSON.stringify({ attr: false }))
      this.push(null)
    }

    var end = new stream.Writable()
    end._write = function (chunk, enc, next) {
      next()
    }
    
    var pipeline = [
      this.jsonStream
      , this.validationStream
      , this.stringifyStream
    ]
    
    var a = aqueduct(pipeline)
    a.on('finish', function () {
      t.pass()
      t.end()
    })
    start.pipe(a).pipe(end)
  })
  
  desc.it('Should allow read()', function (t) {
    var start  = new stream.Readable()
    start._read = function () {
      this.push(JSON.stringify({ attr: false }))
      this.push(null)
    }
    
    var pipeline = [
      this.jsonStream
      , this.validationStream
      , this.stringifyStream
    ]
    
    start.pipe(aqueduct(pipeline))
      .on('readable', function () {
        t.equals(this.read().toString(), JSON.stringify({ attr: true }))
        t.end()
      })
  })

  desc.it('Should pass through if given no streams', function (t) {
    var testStr = 'test string of data';
    var start = new stream.Readable()
    start._read = function () {
      this.push(new Buffer(testStr))
      this.push(null)
    }

    var end = new stream.Writable()
    end._write = function (chunk, enc, next) {
      t.equals(chunk.toString(), testStr)
      next()
      t.end()
    }
    
    start.pipe(aqueduct()).pipe(end)
  })
  
  desc.it('Should pass through if given empty array', function (t) {
    var testStr = 'test string of data';
    var start = new stream.Readable()
    start._read = function () {
      this.push(new Buffer(testStr))
      this.push(null)
    }

    var end = new stream.Writable()
    end._write = function (chunk, enc, next) {
      t.equals(chunk.toString(), testStr)
      next()
      t.end()
    }
    
    start
      .pipe(aqueduct([]))
      .pipe(end)
  })
})

