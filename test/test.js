const fs     = require('fs');
const co     = require('co');
const path   = require('path');
const assert = require('assert');

const parser = require('..');

const encoding = {
    encoding: 'utf-8'
};

const basePath = path.join(__dirname, './cases');

function readFile(p) {
    return new Promise(function(resolve, reject) {
        fs.readFile(p, encoding, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

var testList = [
    undefined,
    {
        rootFontSize: 12
    },
    {
        rootFontSize: '14px'
    },
    {
        dpr: 3
    },
    {
        ignore: {
            px: ['background*']
        }
    },
    {
        regain: {
            px: ['font*']
        }
    },
    {
        regain: {
            // 只对border-right进行转换
            no: ['border-right*']
        }
    }
];

for (var i = 0; i < testList.length; i ++) {
    describe('test' + i, function() {
        // node 4.4不支持let，因此需要一个闭包
        (function(i) {
            var kase = testList[i];
            it('should work', function() {
                var getData = function * () {
                    var actual   = yield readFile(path.join(basePath, i + 1 + '.css'));
                    var expected = yield readFile(path.join(basePath, i + 1 + '.result.css'));
                    assert.equal(parser(actual, null, kase), expected);
                };
                return co(getData);
            });
        })(i);
    });
}
