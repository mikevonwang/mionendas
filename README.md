# mïonendas

Mïonendas is an API testing tool.

## Installation

`npm install mionendas @babel/runtime --save-dev`

## Usage and Example

After installation, there are 6 main steps to implementing Mïonendas:

**1.** In your project, create a file called `mionfile.js`.

**2.** In `mionfile.js`, add `require()`'s for Mïonendas' exports (or Mïonendas as a whole, if you wish).

```javascript
var Tester = require('Mionendas').Tester;
var Suite = require('Mionendas').Suite;
var when = require('Mionendas').when;
var match = require('Mionendas').match;
// Use `Tester` as just `Tester`

// - - - OR - - -

var Mionendas = require('Mionendas');
// Use `Tester` as `Mionendas.Tester`
```

**3.** In `mionfile.js`, extend `Mionendas.Tester` to create your own testing class, and export it:

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

**4.** In `mionfile.js`, write your `Suites` inside your class's `declareSuites()` function. Each suite should correspond to a different API endpoint, and may contain multiple tests.

```javascript
declareSuites() {
  return ([

    new Suite('post', '/article', () => {

      const schema = {
        article_id: 'string',
      };

      return ([
        when('given an invalid author')
        .with(() => ({
          title: 'This is my article’s title',
          content: 'This is my article’s content.',
          author: null,
        }))
        .check((result) => {
          if (result === 'invalid_author') {
            return true;
          }
          return false;
        });

        when('given valid article data')
        .with(() => ({
          title: 'This is my article’s title',
          content: 'This is my article’s content.',
          author: 'Bob Ross',
        }))
        .check((result) => {
          if (match(result, schema)) {
            return true;
          }
          return false;
        });

      ]);
    }),

  ]);
}
```

**5.** In a gulp task (or node script, etc.), import `mionfile.js`. Instantiate your tester with an environment object, and call `run()`:

```javascript
var gulp = require('gulp');
var MyTester = require('./mionfile');

gulp.task('test', () => {
  return new MyTester({
    host: '127.0.0.1',
    path_root: '/',
    port: 8000,
  }).run();
});
```

**6.** Run your gulp task (or node script, etc.).

```
gulp test
```

## Documentation

### `Tester`

Extend this class to create your own tester class. Your tester class must have:

* A `constructor()` that takes a single argument, and calls `super()` with that argument. See step 3 in "Usage and Example" for an example.

* A `declareSuites()` that returns an array of `Suite`s. See step 4 in "Usage and Example" for an example.

When instantiating your tester class, pass it an object with environment properties. This object will accept the following keys:

* `host` **String** *required*

  The host name of your API.

* `path_root` **String** *required*

  The path to your API's root. Can be an empty string.

* `port` **Number** *optional*

  Your API's port.

To run your tester class, instantiate it, and call `run()` on the instance. See step 5 in "Usage and Example" for an example.

---

### `new Suite(method, route, testBuilder)`

Creates a new Mïonendas `Suite`. Each `Suite` should correspond to one of your API's endpoints. An array of these should be returned in your tester class's `declareSuites()` function.

#### Parameters

##### `method` **String** *required*

The HTTP method for this `Suite`'s endpoint, e.g. `'get'`, `'post'`, etc.

##### `route` **String** *required*

The route string for this `Suite`'s endpoint. It should always start with a `'/'`.

This string will be split by `'/'` into `route_pieces`. Any `route_piece` that starts with `':'` will be considered a `route_parameter`. Every test that is returned by this `Suite`'s `testBuilder()` will need to provide a value for any `route_parameter`s that exist. For example:

```javascript
// This suite has one route parameter called `article_id`. Each test returned by
// `articleSuiteBuilder` will need to include a value for `article_id`.
new Suite('get', '/articles/:article_id', articleSuiteBuilder);
```

##### `testBuilder` **Function** *required*

This function takes no arguments, and must return an array of `Tests`.

---

### `when(description)`

Creates a new Mïonendas `Test`. An array of these should be returned by the `testBuilder()` of each `Suite`. Must be chained with a subsequent call to `with()`. See step 4 of "Usage and Example" for an example.

#### Parameters

##### `description` **String** *required*

The description for this test. The convention is to start the description with the word "given", e.g. `'given an invalid author_id'`, so that when the word `'when'` is prepended to the description, a valid prepositional phrase is formed.

---

### `with(dataGetter)`

Defines the data to pass to a Mïonendas `Test`. Must be chained onto a `when()`, and must be chained with a subsequent call to `check()`. See step 4 of "Usage and Example" for an example.

#### Parameters

##### `dataGetter` **Function** *required*

A function that takes no arguments, and returns an object. This object describes the data sent to the API endpoint being tested, and can have the following keys:

* `body` **any**

  The body of the HTTP call to the API endpoint. Used with every HTTP method except for `GET`.

* `params` **Object**

  Each key in this object should correspond to a `route_parameter` in the `Suite`'s `route`, and should be a string.

* `query` **Object**

  This object is serialized into a URL query string, e.g. `?author_id=94&year=2014`. Used only on `GET` HTTP calls.

* `token` **String**

  This string is set as the HTTP call's `Authorization Bearer` header.

---

### `check(checker)`

Validates the result of the Mïonendas `Test`'s API call. Must be chained onto a `with()`. See step 4 of "Usage and Example" for an example.

#### Parameters

##### `checker` **Function** *required*

A function that takes the result of the `Test`s API call as its one argument, and must return a `Boolean`. This is where you put your logic to determine if the API endpoint you're testing has passed this particular test or not. `match()` can be used here.

---

### `match(subject, target)`

Used within `check()` to determine if the result of an API call matches a particular schema.

#### Parameters

##### `subject` **Object** *required*

This is either the result of the your `Test`'s API call, or a part of it.

##### `target` **Object** *required*

The target schema that you want to check if `subject` matches.

Each key in `target` corresponds to a key in `subject`.

Each value in `target` can be one of:

* `'string'`
* `'number'`
* `'boolean'`
* `'array'`
* `'object'`
* `'datestring'`
* `'null'`

A value can also be an array where each item is one of the above values.

A value can also be appended with a `'?'`, as a shorthand for a 2-element array containing value and `'null'`. For example:

```javascript
// Both `name` and `author` be can either a string value or `null`.
const target = {
  name: 'string?',
  author: ['string', 'null'],
};
```

A value of `'datestring'` will match any string that, when passed to `new Date()`, results in a valid `Date` object. For example:

```javascript
const valid_subject = {
  date_created: '2014-05-14T11:00:00Z',
};

const invalid_subject = {
  date_created: 'meow',
};

const target = {
  date_created: 'datestring',
};

match(valid_subject,   target); // true
match(invalid_subject, target); // false
```

To examine a sub-object within the result of your API call, call `match()` twice with two different `target` values, one corresponding to the result as a whole, and one corresponding to the sub-object in that result. For example:

```javascript
const subject = {
  name: 'United States of America',
  national_anthem: {
    title: 'The Star-Spangled Banner',
    author: 'Francis Scott Key',
    year_written: 1814,
  },
};

const target = {
  result: {
    name: 'string',
    national_anthem: 'object',
  },
  national_anthem: {
    title: 'string',
    author: 'string',
    year_written: 'number',
  },
};

(
  match(subject, target.result) &&
  match(subject.national_anthem, target.national_anthem)
) // true
```

#### Returns

A `Boolean`:

* `true` if the `subject` matches the `target` exactly, and

* `false` if not.
