/**
 * @file parser
 */
var util = require('./util');
// 文件换行符
const EOL = require('os').EOL;

/**
 * 默认配置
 */
var defaults = {
    dpr: 2,
    rootFontSize: 16,
    // 用于批量忽略
    ignore: {
        // px表示不将单位转换成rem
        px: [
            'border*',
            'font*'
        ],
        // no表示不将像素值除以dpr
        no: [
            'border*'
        ]
    },
    // 用于批量重置
    regain: {
        px: [],
        no: [
            'border-radius'
        ]
    }
};

// css前缀
const PREFIX = [
    '-webkit-',
    '-moz-',
    '-ms-',
    '-o-'
];

// 伪类和伪元素
const PSEUDO = [
    'active',
    'focus',
    'hover',
    'link',
    'visited',
    'first-child',
    'last-child',
    'lang',
    'first-letter',
    'first-line',
    'before',
    'after'
];

/**
 * 拆分单条css属性
 *
 * @param {string} item css属性 如：font-size: 12px
 * @return {Object} 拆分后的css属性对象
 */
function parseAttribute(item) {
    if (!(item && ~item.indexOf(':')) || ~item.indexOf(',') || ~item.indexOf('{') || ~item.indexOf('::')) {
        return item;
    }

    var res = item.split(':', 2);
    var key = util.trim(res[0]);
    var value = util.trim(res[1]);
    // 判断是否是伪类或者为元素
    if (~PSEUDO.indexOf(value) || /^nth\-child\(.*\)$/.test(value)) {
        return item;
    }

    return {
        key: key,
        value: value
    };
}

/**
 * 对单行进行拆分
 *
 * @param {string} line 单行css，可能包含多条css样式规则
 * @return {Array} 拆分后的css样式列表
 */
function splitLine(line) {
    if (!(line && line.length > 1)) {
        return line;
    }

    var arr = [];
    var tmp = '';
    for (var i = 0, l = line.length; i < l; i++) {
        var ch = line[i];
        if (/[;\{]/.test(ch)) {
            arr.push(tmp + ch);
            tmp = '';
        }
        else if (ch === '}') {
            if (tmp) {
                arr.push(tmp);
                tmp = '';
            }

            arr.push(ch);
        }
        // 开始一段注释
        else if (ch === '/' && line[i + 1] === '*') {
            if (tmp) {
                arr.push(tmp);
            }

            tmp = ch + line[i + 1];
            i += 2;
            while (!(line[i] === '*' && line[i + 1] === '/')) {
                if (i >= l) {
                    break;
                }

                tmp += line[i];
                i++;
            }
            // 直到注释结束
            if (line[i] !== undefined) {
                tmp += line[i];
            }

            if (i < l - 1) {
                tmp += line[++i];
            }

            arr.push(tmp);
            tmp = '';
        }
        else {
            tmp += ch;
        }
    }
    tmp && arr.push(tmp);
    return arr;
}

/**
 * 是否命中list中的规则
 *
 * @param {string} key css属性 如：font-size
 * @param {Array} list css属性数组
 * @return {boolean} 返回key是否在list中
 */
function match(key, list) {
    if (~list.indexOf(key)) {
        return true;
    }

    for (var i = 0; i < PREFIX.length; i++) {
        var pre = PREFIX[i];
        // 包含前缀
        if (key.indexOf(pre) === 0) {
            key = key.slice(pre.length);
            break;
        }

    }
    return list.some(function (single) {
        if (single === key) {
            return true;
        }

        if (single[single.length - 1] === '*') {
            return key.indexOf(single.slice(0, -1)) === 0;
        }

        return false;
    });
}

/**
 * 判断该行注释是否是符合匹配的注释
 *
 * @param {string} line 单行css样式
 * @param {string} type 目标注释内容
 * @return {boolean} 注释内容是否为目标内容
 */
function legalComments(line, type) {
    if (!line) {
        return false;
    }

    var pattens = [
        /\/\*([^\*\/]+)?\*\/$/,
        /^\/\*(.*)\*\/$/
    ];
    for (var i = 0, l = pattens.length; i < l; i++) {
        var patten = pattens[i];
        var res = line.match(patten);
        if (Array.isArray(res) && util.trim(res[i]) === type) {
            return true;
        }

    }
    return false;
}

/**
 * 转换成rem单位
 *
 * @param {string} line 单行css样式
 * @param {Object} opts 配置
 * @param {Object} opts.dpr 设备dpr值
 * @param {Object} opts.rootFontSize 根节点字体大小
 * @return {string} 转换后的css样式
 */
function toRem(line, opts) {
    var rate = opts.dpr * opts.rootFontSize;
    return line.replace(/\d+\.?(\d*)px/g, function (item) {
        return parseFloat(item) / rate + 'rem';
    });
}

/**
 * 根据dpr进行转换
 *
 * @param {string} line 单行css样式
 * @param {Object} opts 配置
 * @param {Object} opts.dpr 设备dpr值
 * @return {string} 转换后的css样式
 */
function divideDpr(line, opts) {
    return line.replace(/\d+\.?(\d*)px/g, function (item) {
        return ((parseFloat(item) / opts.dpr) | 0) + 'px';
    });
}

/**
 * 预处理opts，主要用于过滤和规范参数
 *
 * @param {Object} opts 配置
 * @return {Object} 处理后的配置
 */
function proccess(opts) {
    opts = opts || {};
    if (parseInt(opts.rootFontSize, 10) >= 10) {
        opts.rootFontSize = parseInt(opts.rootFontSize, 10);
    }
    else {
        opts.rootFontSize = defaults.rootFontSize;
    }
    // dpr可能是小数
    if (parseFloat(opts.dpr) > 0) {
        opts.dpr = parseFloat(opts.dpr);
    }
    else {
        opts.dpr = defaults.dpr;
    }
    // 处理regain和ignore
    var arr = [
        'px',
        'no'
    ];

    var init = function (object, type) {
        arr.forEach(function (item) {
            if (Array.isArray(object[item])) {
                object[item] = util.unique(object[item].concat(defaults[type][item]));
            }
            else {
                object[item] = defaults[type][item];
            }
        });
        return object;
    };

    opts.ignore = init(opts.ignore || {}, 'ignore');
    opts.regain = init(opts.regain || {}, 'regain');

    // 从ignore中移除regain
    arr.forEach(function (item) {
        util.remove(opts.ignore[item], opts.regain[item]);
    });
    return opts;
}

/**
 * 对拆分后的css样式进行单位转换处理
 *
 * @param {string} line 单行css样式
 * @param {Object} opts 配置
 * @return {string} 处理后的css样式
 */
function parse(line, opts) {
    var sub = [];
    var arr = splitLine(line);

    var ignore = opts.ignore;
    var regain = opts.regain;
    var length = arr.length;

    arr.forEach(function (item, i) {
        var tmp = parseAttribute(item);
        if (tmp.key) {
            var key = tmp.key;
            // 第一个非空next
            var n = i + 1;
            while (n < length && !util.trim(arr[n])) {
                n++;
            }
            var next = util.trim(arr[n]);
            // 如果是regain中的内容
            if (legalComments(next, 'no')) {
                sub.push(item);
            }
            else if (legalComments(next, 'px')) {
                sub.push(divideDpr(item, opts));
            }
            else if (match(key, regain.px)) {
                sub.push(toRem(item, opts));
            }
            else if (match(key, regain.no)) {
                sub.push(divideDpr(item, opts));
            }
            else if (match(key, ignore.no)) {
                sub.push(item);
            }
            else if (match(key, ignore.px)) {
                sub.push(divideDpr(item, opts));
            }
            else {
                sub.push(toRem(item, opts));
            }
        }
        else {
            sub.push(item);
        }
    });
    return sub.join('');
}

module.exports = function (content, file, opts) {
    opts = proccess(opts);

    var lines = content.split(EOL);
    var res = [];
    // 对每一行进行遍历
    lines.forEach(function (line, idx) {
        var str = util.trim(line);
        // 尽量不对无关内容进行处理
        if (!str) {
            res.push(line);
            return;
        }

        // 如果当前行不含冒号
        if (!~str.indexOf(':')) {
            res.push(line);
            return;
        }

        var next = util.trim(lines[idx + 1]);
        // 行尾是no注释
        if (legalComments(str, 'no')) {
            res.push(line);
        }
        // 下一行是一个完整的no注释
        else if (legalComments(next, 'no')) {
            res.push(line);
        }
        // 行尾是px注释
        else if (legalComments(str, 'px')) {
            res.push(divideDpr(line, opts));
        }
        // 下一行是完整的px注释
        else if (legalComments(next, 'px')) {
            res.push(divideDpr(line, opts));
        }
        else {
            res.push(parse(line, opts));
        }
    });

    return res.join(EOL);
};
