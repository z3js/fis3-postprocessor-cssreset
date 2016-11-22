const assert = require('assert');
const util = require('../lib/util');

function sort(arr) {
    arr.sort(function (a, b) {
        return a < b ? -1 : 1;
    });
    return arr;
}

describe('test trim', function () {
    it('should work', function () {
        var actual = '   xiaoming ';
        var expected = 'xiaoming';
        assert.strictEqual(util.trim(actual), expected);
    });

    it('should work', function () {
        var actual = 'xiaohong  ';
        var expected = 'xiaohong';
        assert.strictEqual(util.trim(actual), expected);
    });

    it('should work', function () {
        var actual = '   hanmeimei';
        var expected = 'hanmeimei';
        assert.strictEqual(util.trim(actual), expected);
    });

    it('should work', function () {
        var actual = 'lilei';
        var expected = 'lilei';
        assert.strictEqual(util.trim(actual), expected);
    });
});

describe('test unique', function () {
    it('should work', function () {
        var actual = [
            1,
            2,
            1,
            2,
            3
        ];
        var expected = [
            1,
            2,
            3
        ];
        // 不稳定去重
        assert.deepEqual(sort(util.unique(actual)), sort(expected));
    });

    it('should work', function () {
        var actual = [
            'hello',
            'world',
            'hello',
            'hellx',
            'worlb',
            'xiaoming',
            'worlb'
        ];
        var expected = [
            'hello',
            'world',
            'hellx',
            'worlb',
            'xiaoming'
        ];
        assert.deepEqual(sort(util.unique(actual)), sort(expected));
    });

    it('should work', function () {
        var actual = [
            'how',
            'old',
            'are',
            'you'
        ];
        var expected = [
            'how',
            'old',
            'are',
            'you'
        ];
        assert.deepEqual(sort(util.unique(actual)), sort(expected));
    });
});

describe('test remove', function () {
    it('should work', function () {
        var actual = [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            0
        ];
        var remove = [
            2,
            4,
            6,
            8,
            0
        ];
        var expected = [
            1,
            3,
            5,
            7,
            9
        ];
        assert.deepEqual(util.remove(actual, remove), expected);
    });

    it('should work', function () {
        var actual = [
            'good',
            'morning',
            'haha',
            'hehe',
            'Mr.robot'
        ];
        var remove = [
            'haha',
            'hehe'
        ];
        var expected = [
            'good',
            'morning',
            'Mr.robot'
        ];
        assert.deepEqual(util.remove(actual, remove), expected);
    });
});
