/**
 * @file parser
 */

const eol = require('os').EOL;

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

// 一些css前缀
const prefix = [
    '-webkit-',
    '-moz-',
    '-ms-',
    '-o-'
];

/**
 * 过滤单行首尾空格
 */

function trim(str) {
    if (!str) {
        return str;
    }
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
}

/**
 * 数组去重
 */

function unique(arr) {
    if (!Array.isArray(arr) || arr.length < 2) {
        return arr;
    }
    if (typeof Set === 'function' &&
        typeof Array.form === 'function') {
        return Array.form(new Set(arr));
    }
    var res = [];
    arr.forEach(function(item, i) {
        if (arr.lastIndexOf(item) !== i) {
            return;
        }
        res.push(arr[i]);
    });
    return arr;
}

/**
 * 从origin中移除target
 */

function remove(origin, target) {
    var res = [];
    origin.forEach(function(item) {
        if (!~target.indexOf(item)) {
            res.push(item);
        }
    });
    return res;
}

/**
 * 拆分单条css属性
 */

function parseAttribute(item) {
    if (!(item && ~item.indexOf(':'))) {
        return item;
    }
    item = item.split(':', 2);
    return {
        key  : trim(item[0]),
        value: trim(item[1])
    };
}

/**
 * 对单行进行拆分
 */

function splitLine(line) {
    if (!(line && line.length > 1)) {
        return line;
    }
    var arr = [];
    var tmp = '';
    for (var i = 0, l = line.length; i < l; i ++) {
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
                i ++;
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
        } else {
            tmp += ch;
        }
    }
    tmp && arr.push(tmp);
    return arr;
}

/**
* 是否命中list中的规则
*/

function match(key, list) {
    if (~list.indexOf(key)) {
        return true;
    }
    for (var i = 0; i < prefix.length; i ++) {
        var pre = prefix[i];
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
 * 获取行尾注释内容
 */
function getComments(line, type) {
    if (!line) {
        return false;
    }
    var res = line.match(/\/\*([^\*\/]+)?\*\/$/);
    if (!Array.isArray(res)) {
        return false;
    }
    return trim(res[1]) === type;
}

/**
 * 该行是否只包含px注释
 */
function isCommentsLine(line, type) {
    if (!line) {
        return false;
    }
    var res = line.match(/^\/\*(.*)\*\/$/);
    if (!Array.isArray(res)) {
        return false;
    }
    return trim(res[1]) === type;
}

/**
 * 转换成rem单位
 */

function toRem(line, opts) {
    var rate = opts.dpr * opts.rootFontSize;
    return line.replace(/\d+\.?(\d*)px/g, function(item) {
        return parseFloat(item) / rate + 'rem';
    });
}

/**
 * 根据dpr进行转换
 */

function divideDpr(line, opts) {
    return line.replace(/\d+\.?(\d*)px/g, function(item) {
        return ((parseFloat(item) / opts.dpr)|0) + 'px';
    });
}

/**
 * 预处理opts
 */

function proccess(opts) {
    opts = opts || {};
    if (parseInt(opts.rootFontSize) >= 10) {
        opts.rootFontSize = parseInt(opts.rootFontSize);
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
    var arr = ['px', 'no'];

    var init = function(object, type) {
        arr.forEach(function(item) {
            if (Array.isArray(object[item])) {
                object[item] = unique(object[item].concat(defaults[type][item]));
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
    arr.forEach(function(item) {
        remove(opts.ignore[item], opts.regain[item]);
    });
    return opts;
}

/**
 * 处理行
 */

function parse(line, opts) {
    var sub = [];
    var arr = splitLine(line);

    var ignore = opts.ignore;
    var regain = opts.regain;
    var length = arr.length;

    arr.forEach(function(item, i) {
        var tmp = parseAttribute(item);
        if (tmp.key) {
            var key  = tmp.key;
            // 第一个非空next
            var n = i + 1;
            while (n < length && !trim(arr[n])) {
                n ++;
            }
            var next = trim(arr[n]);
            // 如果是regain中的内容
            if (isCommentsLine(next, 'no')) {
                sub.push(item);
            }
            else if (isCommentsLine(next, 'px')) {
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

module.exports = function(content, file, opts) {
    opts = proccess(opts);

    var lines = content.split(eol);
    var res = [];
    // 对每一行进行遍历
    lines.forEach(function(line, idx) {
        var str = trim(line);
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
        var next = trim(lines[idx + 1]);
        // 行尾是no注释
        if (getComments(str, 'no')) {
            res.push(line);
        }
        // 下一行是一个完整的no注释
        else if (isCommentsLine(next, 'no')) {
            res.push(line);
        }
        // 行尾是px注释
        else if (getComments(str, 'px')) {
            res.push(divideDpr(line, opts));
        }
        // 下一行是完整的px注释
        else if (isCommentsLine(next, 'px')) {
            res.push(divideDpr(line, opts));
        }
        else {
            res.push(parse(line, opts));
        }
    });

    return res.join(eol);
};
