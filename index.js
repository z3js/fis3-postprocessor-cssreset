
const eol = require('os').EOL;

// 默认设置
var defaults = {
    rootFontSize: 16,
    ignore: [
        'font-size',
        'font'
    ],
    reset: []
};

var trim = str => {
    if (str === undefined || str === null) {
        return '';
    }
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
};

function merge(type, arr, opts) {
    if (typeof arr === 'string') {
        arr = [arr];
    }
    if (Array.isArray(arr)) {
        // 合并 && 去重
        opts[type] = Array.from(new Set(defaults[type].concat(arr)));
    } else {
        opts[type] = defaults[type];
    }
}

function toRem(opts, str) {
    // console.log(str);
    if (str === undefined || str === null) {
        return str;
    }
    return str.replace(/\d+.?(\d*)px/g, function(item) {
        return parseFloat(item) / opts.rootFontSize + 'rem';
    });
}
// 从ignore中删除reset
function removeReset(opts) {
    // console.log(opts)
    var ignore = opts.ignore;
    var reset  = opts.reset;

    if (reset.length === 0) {
        return;
    }
    var resetMap = {};

    reset.forEach(function(key) {
        resetMap[key] = true;
    });

    ignore.forEach(function(key, i) {
        if (resetMap[key]) {
            ignore[i] = null;
        }
    });
}

// 以px结尾
function hasPxComment(line, nextLine) {
    var res = line.match(/\/\*([^\*\/]+)?\*\/$/);
    if (res === null) {
        // 看下一行
        if (/^\/\*\s*px\s*\*\/$/.test(trim(nextLine))) {
            return true;
        }
        return false;
    }
    if (trim(res[0].slice(2, -2)) === 'px') {
        return true;
    }
    return false;
}

// 对行进行格式化
function formatLine(str) {
    var i = 0;
    var l = str.length;
    var queue = [];
    var temp  = '';

    for (; i < l; i ++) {
        // 可能会遇到哪些特殊的字符
        var ch = str[i];
        if (ch === ';' ||
            ch === '{') {
            // 需要分割
            temp += ch;
            queue.push(temp);
            temp = '';
        } else if (ch === '}') {
            if (temp !== '') {
                queue.push(temp);
                temp = '';
            }
            queue.push(ch);
        } else if (i < l - 1 && ch === '/' && str[i + 1] === '*') {
            // 开始一段注释
            if (temp !== '') {
                queue.push(temp);
            }
            temp = '/*';
            i += 2;
            while (i < l - 1 && !(str[i] === '*' && str[i + 1] === '/')) {
                // 直到注释结束
                temp += str[i];
                i ++;
            }
            // temp += '*/';
            temp += str[i];
            if (i < l - 1) {
                temp += str[++i];
            }
            queue.push(temp);
            temp = '';
        } else {
            temp += ch;
        }
    }
    if (temp !== '') {
        queue.push(temp);
    }
    return queue;
}

module.exports = function(content, file, setting) {
    // 首先合并setting
    // 根字体大小
    var opts = {};

    if (setting.rootFontSize &&
        !isNaN(parseInt(setting.rootFontSize))) {
        opts.rootFontSize = parseInt(setting.rootFontSize);
    } else {
        opts.rootFontSize = defaults.rootFontSize;
    }
    ['ignore', 'reset'].forEach(function(key) {
        merge(key, setting[key], opts);
    });

    removeReset(opts);
    // 开始过滤
    var lines = content.split(eol);
    var res = [];
    lines.forEach(function(line, idx) {
        if (trim(line) === '') {
            return;
        }
        // 以px结尾
        if (hasPxComment(line, lines[idx + 1])) {
            res.push(line);
            return;
        }
        // 分析当前行
        var arr = formatLine(line);
        var temp = [];
        arr.forEach(function(sub, i) {
            if (sub.indexOf(':')) {
                // 注意也有可能是伪类或者伪元素
                var prefix = trim(sub.split(':')[0]);
                if (~opts.ignore.indexOf(prefix)) {
                    temp.push(sub);
                } else if (/^\/\*\s*px\s*\*\/$/.test(arr[i + 1])) {
                    // 判断下一项是否是px注释
                    temp.push(sub);
                } else {
                    // 替换px为rem
                    temp.push(toRem(opts, sub));
                }
            } else {
                // 说明该项不包含样式
                temp.push(sub);
            }
        });
        res.push(temp.join(''));
        // 对当前行进行分析
    });
    // console.log(opts);
    return res.join(eol);
};
