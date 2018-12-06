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
      console.log('\x1b[2m' + this.suites[i].tests.length + ' tests\x1b[0m');
      console.log('\n');
      for (let j=0; j<this.suites[i].tests.length; j++) {
        console.log(this.suites[i].tests[j].description);
        console.log('- - - - - - - - - - - - - - - - - - -')
        const response = await this.call(this.suites[i].method, this.suites[i].path, this.suites[i].tests[j].body);
        let returned_value;
        if (response.err) {
          console.log(' ', response.err);
          returned_value = response.err;
        }
        else {
          console.log(' ', response.result);
          returned_value = response.result;
        }
        const test_result = this.suites[i].tests[j].checker(returned_value);
        if (test_result === true) {
          this.suites[i].tests[j].passed = true;
          console.log('\x1b[32m  PASSED\x1b[0m');
        }
        else if (test_result === false) {
          this.suites[i].tests[j].passed = false;
          console.log('\x1b[31m  FAILED\x1b[0m');
        }
        else {
          console.log('\x1b[33m  INCONCLUSIVE\x1b[0m');
        }
        console.log('\n');
      };
      console.log('\n')
    };

    const tests_counts = this.suites.map((suite) => {
      return (suite.tests.length);
    });
    const tests_passed_counts = this.suites.map((suite) => {
      return (suite.tests.filter((test) => {
        return (test.passed === true);
      }).length);
    });
    const total_tests = this.sum(tests_counts);
    const total_suites = this.suites.length;
    const tests_passed_count = this.sum(tests_passed_counts);
    const suites_passed_count = this.sum(tests_passed_counts.map((count, i) => {
      if (count === tests_counts[i]) {
        return 1;
      }
      else {
        return 0;
      }
    }));

    const tests_passed_color = (tests_passed_count === total_tests) ? '\x1b[32m' : '\x1b[31m';
    const suites_passed_color = (suites_passed_count === total_suites) ? '\x1b[32m' : '\x1b[31m';

    console.log('API tests complete');
    console.log(suites_passed_color + suites_passed_count + '\x1b[0m out of ' + total_suites + ' suites passed');
    console.log(tests_passed_color + tests_passed_count + '\x1b[0m out of ' + total_tests + ' tests passed');
    console.log('\n');
  }

  call(method, path, body) {
    return new Promise((resolve, reject) => {
      console.log('\x1b[2m ', body, '\x1b[0m');
      const req = http.request({
        host: this.env.host,
        port: this.env.port,
        path: this.env.path_root + path,
        method: method,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
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
      req.write(JSON.stringify(Object.assign({}, body, {token: this.storage.token})));
      req.end();
    });
  }

  sum(array) {
    return array.reduce((a,b) => a + b, 0);
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
    with: (body) => {
      return ({
        check: (checker) => {
          return ({
            description,
            body,
            checker,
            passed: null,
          });
        },
      });
    },
  });
}

function match(subject, target) {
  return (Object.keys(target).find((key) => {
    let match_existence = (subject[key] !== undefined);
    let match_type = false;
    if (match_existence) {
      switch (target[key]) {
        case 'string':
          match_type = (typeof subject[key] === 'string');
        break;
        case 'number':
          match_type = (typeof subject[key] === 'number');
        break;
        case 'boolean':
          match_type = (typeof subject[key] === 'boolean');
        break;
        case 'array':
          match_type = Array.isArray(subject[key]);
        break;
        case 'object':
          match_type = (typeof subject[key] === 'object' && subject[key] !== null);
        break;
      }
    }
    return (!match_existence || !match_type);
  }) === undefined);
}


const Mionendas = {
  Tester,
  Suite,
  when,
  match,
};

module.exports = Mionendas;
