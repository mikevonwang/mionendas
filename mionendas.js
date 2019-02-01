const http = require('http');

class Tester {

  constructor(env) {
    this.env = env;
    this.suites = [];
    this.storage = {};
    if (this.declareSuites) {
      this.suites = this.declareSuites();
    }
  }

  async run() {
    console.log('\n');
    console.log('Starting API tests');
    console.log('\n\n');

    for (let i=0; i<this.suites.length; i++) {
      console.log('\x1b[36m' + this.suites[i].method.toUpperCase() + ' ' + this.suites[i].path + '\x1b[0m');
      console.log('\x1b[2m' + this.suites[i].tests.length + ' test' + this.plural(this.suites[i].tests.length) + ' \x1b[0m');
      console.log('\n');
      for (let j=0; j<this.suites[i].tests.length; j++) {
        console.log('\x1b[35m' + this.suites[i].tests[j].description + '\x1b[0m');
        console.log('- - - - - - - - - - - - - - - - - - -');
        this.suites[i].tests[j].data = this.suites[i].tests[j].data_getter();
        if (Array.isArray(this.suites[i].tests[j].data) === false) {
          this.suites[i].tests[j].data = [this.suites[i].tests[j].data];
        }
        this.suites[i].tests[j].passed = [];
        this.suites[i].tests[j].errors = [];
        for (let k=0; k<this.suites[i].tests[j].data.length; k++) {
          const response = await this.call(this.suites[i].method, this.suites[i].path, this.suites[i].tests[j].data[k]);
          let returned_value;
          if (response.err) {
            console.log(' ', response.err);
            returned_value = response.err;
          }
          else {
            console.log(' ', response.result);
            returned_value = response.result;
          }
          let test_result = null;
          let test_error = null;
          try {
            test_result = this.suites[i].tests[j].checker(returned_value, k);
          }
          catch (err) {
            if (err instanceof MatchError) {
              test_result = false;
            }
            test_error = err;
          }
          if (test_result === true) {
            this.suites[i].tests[j].passed[k] = true;
            console.log('\x1b[32m  PASSED\n\x1b[0m');
          }
          else if (test_result === false) {
            this.suites[i].tests[j].passed[k] = false;
            this.suites[i].tests[j].errors[k] = test_error;
            console.log('\x1b[31m  FAILED\x1b[0m' + this.format_error(test_error) + '\n');
          }
          else {
            this.suites[i].tests[j].passed[k] = null;
            this.suites[i].tests[j].errors[k] = test_error;
            console.log('\x1b[33m  INCONCLUSIVE\x1b[0m' + this.format_error(test_error) + '\n');
          }
        }
        console.log('');
      };
      console.log('\n\n\n')
    };

    const test_counts_per_suite = this.suites.map((suite) => {
      return this.sum(suite.tests.map((test) => {
        return (test.data.length);
      }));
    });
    const passed_tests_count_per_suite = this.suites.map((suite) => {
      return this.sum(suite.tests.map((test) => {
        return (test.passed.filter((passed) => {
          return (passed === true);
        }).length);
      }));
    });
    const total_tests = this.sum(test_counts_per_suite);
    const total_suites = this.suites.length;
    const tests_passed_count = this.sum(passed_tests_count_per_suite);
    const suites_passed_count = this.sum(passed_tests_count_per_suite.map((count, i) => {
      if (count === test_counts_per_suite[i]) {
        return 1;
      }
      else {
        return 0;
      }
    }));

    const tests_passed_color = (tests_passed_count === total_tests) ? '\x1b[32m' : '\x1b[31m';
    const suites_passed_color = (suites_passed_count === total_suites) ? '\x1b[32m' : '\x1b[31m';

    console.log('API tests complete');
    console.log(suites_passed_color + suites_passed_count + '\x1b[0m out of ' + total_suites + ' suite' + this.plural(total_suites) + ' passed');
    console.log(tests_passed_color + tests_passed_count + '\x1b[0m out of ' + total_tests + ' test' + this.plural(total_tests) + ' passed');
    console.log('\n');

    if (tests_passed_count < total_tests) {
      console.log('\nFailed tests (\x1b[31m' + (total_tests - tests_passed_count) + '\x1b[0m total): ');
      this.suites.forEach((suite, i) => {
        if (passed_tests_count_per_suite[i] < test_counts_per_suite[i]) {
          console.log('\n\x1b[36m' + suite.method.toUpperCase() + ' ' + suite.path + '\x1b[0m');
          suite.tests.forEach((test, j) => {
            if (test.passed.find(passed => (passed !== true)) !== undefined) {
              console.log('\x1b[35m  ' + test.description + '\x1b[0m');
            }
            test.passed.forEach((passed, k) => {
              if (passed === false) {
                console.log('\x1b[31m    FAILED\x1b[0m' + this.format_error(test.errors[k]));
              }
              else if (passed === null) {
                console.log('\x1b[33m    INCONCLUSIVE\x1b[0m' + this.format_error(test.errors[k]));
              }
            });
          });
        }
      });
      console.log('\n');
    }
  }

  call(method, path, data) {
    return new Promise((resolve, reject) => {
      data = Object.assign({}, {
        body: null,
        params: null,
        query: null,
        token: '',
      }, data);
      const payload = JSON.stringify(data.body);

      if (data.params !== null) {
        Object.keys(data.params).forEach((key) => {
          path = path.replace(':' + key, data.params[key])
        });
      }

      const headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Authorization': 'Bearer ' + data.token,
      };
      if (method === 'get') {
        if (data.query !== null) {
          path += '?' + Object.keys(data.query).map((key) => {
            return (key + '=' + data.query[key]);
          }).join('&');
        }
      }
      console.log('\x1b[36m ', path, '\x1b[0m');
      if (method !== 'get') {
        console.log('\x1b[2m ', data.body, '\x1b[0m');
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request({
        host: this.env.host,
        port: this.env.port,
        path: this.env.path_root + path,
        method: method,
        headers: headers,
      }, (res) => {
        var responseString = '';
        res.on('data', (data) => {
            responseString += data;
        });
        res.on('end', () => {
          try {
            const data = JSON.parse(responseString);
            resolve(data);
          }
          catch(e) {
            resolve({
              err: responseString,
              result: null,
            });
          }
        });
      });
      if (method === 'get') {
        //req.write();
      }
      else {
        req.write(payload);
      }
      req.end();
    });
  }

  sum(array) {
    return array.reduce((a,b) => a + b, 0);
  }

  plural(n) {
    return (n === 1 ? '' : 's');
  }

  format_error(error) {
    return ((error !== null) ? (' - ' + (error || '')) : '');
  }

}

class Suite {

  constructor(method, path, getTests) {
    this.method = method;
    this.path = path;
    this.tests = getTests();
  }

}

function when(description) {
  return ({
    with: (data_getter) => {
      return ({
        check: (checker) => {
          return ({
            description,
            data_getter,
            data: null,
            checker,
            passed: null,
          });
        },
      });
    },
  });
}

class MatchError extends Error {
  constructor(message) {
    super(message);
  }
}

function isDateString(datestring) {
  const date = new Date(datestring);
  return (date instanceof Date && !isNaN(date));
}

function match(subject, target) {
  if ((typeof subject !== 'object' || subject === null)) {
    throw new TypeError('match() expects an object for its first argument. Instead received: ' + String(subject));
    return null;
  }
  if ((typeof target !== 'object' || target === null)) {
    throw new TypeError('match() expects an object for its second argument. Instead received: ' + String(target));
    return null;
  }
  return (Object.keys(target).find((key) => {
    let matches_existence = (subject[key] !== undefined);
    let matches_type = false;
    let is_type_target_invalid = false;
    if (matches_existence) {
      let type_targets = target[key];
      if (Array.isArray(type_targets) === false) {
        type_targets = [type_targets];
      }
      if (type_targets.find((target) => {
        return (target[target.length - 1] === '?');
      }) !== undefined) {
        type_targets = type_targets.map((target) => {
          if (target[target.length - 1] === '?') {
            return target.substring(0, target.length - 1);
          }
          else {
            return target;
          }
        });
        type_targets.push('null');
      }
      for (let i=0; i<type_targets.length; i++) {
        switch (type_targets[i]) {
          case 'null':
            matches_type = (subject[key] === null);
          break;
          case 'datestring':
            matches_type = isDateString(subject[key]);
          break;
          case 'string':
            matches_type = (typeof subject[key] === 'string');
          break;
          case 'number':
            matches_type = (typeof subject[key] === 'number');
          break;
          case 'boolean':
            matches_type = (typeof subject[key] === 'boolean');
          break;
          case 'array':
            matches_type = Array.isArray(subject[key]);
          break;
          case 'object':
            matches_type = (typeof subject[key] === 'object' && subject[key] !== null);
          break;
          default:
            is_type_target_invalid = true;
            matches_type = false;
        }
        if (matches_type === true || is_type_target_invalid === true) {
          break;
        }
      }
      if (is_type_target_invalid === true) {
        throw new MatchError('"' + type_targets + '" is not a valid type target');
      }
      else if (matches_type === false) {
        throw new MatchError('match() expects ' + key + ' to be type "' + type_targets + '". Instead received: ' + String(subject[key]));
      }
    }
    return (!matches_existence || !matches_type);
  }) === undefined);
}


const Mionendas = {
  Tester,
  Suite,
  when,
  match,
};

module.exports = Mionendas;
