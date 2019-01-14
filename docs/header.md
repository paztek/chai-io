# Chai IO [![Build Status](https://travis-ci.org/paztek/chai-io.svg?branch=master)](https://travis-ci.org/paztek/chai-io)

> Socket.io integration testing with Chai assertions.

Heavily inspired by [chai-http](https://github.com/chaijs/chai-http).

#### Features

- test socket.io apps
- assertions for common socket.io tasks
- chai `expect` and `should` interfaces

#### Installation

This is a addon plugin for the [Chai Assertion Library](http://chaijs.com). Install via [npm](http://npmjs.org).

    npm install chai-io

#### Plugin

Use this plugin as you would all other Chai plugins.

```js
var chai = require('chai')
  , chaiIo = require('chai-io');

chai.use(chaiIo);
```

To use Chai IO on a web page, just include the [`dist/chai-io.js`](dist/chai-io.js) file:

```html
<script src="chai.js"></script>
<script src="chai-io.js"></script>
<script>
  chai.use(chaiIo);
</script>
```
