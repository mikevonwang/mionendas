# mïonendas

Mïonendas is an API testing tool.

## Installation

`npm install mionendas @babel/runtime --save-dev`

## Usage and Example

After installation, there are 6 main steps to implementing Mïonendas:

**1.** In your project, create a file called `mionfile.js`.

**2.** In `mionfile.js`, add `require()`'s for Mïonendas' exports.

```javascript
var Tester = require('mionendas').Tester;
var Suite = require('mionendas').Suite;
var when = require('mionendas').when;
var match = require('mionendas').match;
```

**3.** In `mionfile.js`, extend `Mïonendas.Tester` to create your own testing class, and export it:

```javascript
class MyTester extends Tester {

  constructor(env) {
    super(env);
  }

  declareSuites() {

  }

}

module.exports = MyTester;
```

**4.** Write your testing suites inside your class's `declareSuites()` function. Each suite should correspond to a different API endpoint, and may contain multiple tests.

```javascript
declareSuites() {
  return ([

    new Suite('post', '/article', [

      when('given an invalid author')
      .with({
        title: 'This is my article’s title',
        content: 'This is my article’s content.',
        author: null,
      })
      .check((result) => {
        if (result === 'invalid_author') {
          return true;
        }
        return false;
      });

      when('given valid article data')
      .with({
        title: 'This is my article’s title',
        content: 'This is my article’s content.',
        author: 'Bob Ross',
      })
      .check((result) => {
        if (match(result, ['article_id'])) {
          return true;
        }
        return false;
      });

    ]),

  ]);
}
```

**5.** In a node script (or gulp task, etc.), import `mionfile.js`. Instantiate your tester with an environment object, and call `run()`:

```javascript
var gulp = require('gulp');
var MyTester = require('./mionfile');

gulp.task('test', () => {
  new MyTester({
    host: '127.0.0.1',
    path_root: '/',
    port: 8000,
  }).run();
});
```

**6.** Run your node script (or gulp task, etc).
