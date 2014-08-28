# Stream-Aqueduct

Install:

```bash
$ npm install --save stream-aqueduct
```

Construct a pipeline of streams by passing an array of streams:

```javascript
var aqueduct = require('stream-aqueduct')

var pipeline = (new) aqueduct([
  jsonStream
  , validationStream
  , stringifyStream
])

process.stdin
  .pipe(pipeline)
  .pipe(process.stdout)

```