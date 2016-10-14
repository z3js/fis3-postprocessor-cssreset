# fis3-postprocessor-cssreset

H5适配方案

<p>
    <a href="https://www.bithound.io/github/z3js/fis3-postprocessor-cssreset">
        <img src="https://www.bithound.io/github/z3js/fis3-postprocessor-cssreset/badges/score.svg" alt="bitHound Overall Score">
    </a>
    <a href="https://travis-ci.org/z3js/fis3-postprocessor-cssreset" alt="travis">
        <img src="https://travis-ci.org/z3js/fis3-postprocessor-cssreset.svg">
    </a>
    <a href="javascript:;">
        <img src="https://img.shields.io/badge/%E5%88%9A%E5%93%A5js-passing-blue.svg">
    </a>
</p>

### why use fis3-postprocessor-cssreset?

fis3-postprocessor-cssreset 是一个fis3插件，用于将样式表中的px单位转换成rem单位，同时根据指定的dpr参数对数值进行缩放。如在默认参数下，fis3-postprocessor-cssreset将会对源代码进行如下转换。

source code
```style
.container {
    width: 100%;
    height: 80px;
    margin: 0 30px;
    padding: 10px;
    font-size: 28px;
    color: #333;
    border: 1px solid #ddd;
}
```
output code
```style
.container {
    width: 100%;
    height: 2.5rem;
    margin: 0 0.9375rem;
    padding: 0.3125rem;
    font-size: 14px;
    color: #333;
    border: 1px solid #ddd;
}
```
fis3-postprocessor-cssreset 支持批量指定属性的转换规则，并且内置了font*和border*，其中font相关属性只除去dpr值，不转换rem单位，而border相关属性既不除去dpr也不转换单位。你可以通过修改regain参数进行重置。

### 开始

```shell
npm install fis3-postprocessor-cssreset -g
```

```javascript
fis.match('*.{less,css}', {
    postprocessor: fis.plugin('css-reset')
});

```

### 参数介绍

* ``rootFontSize`` 指定根节点字体大小, 默认为 **16**
```javascript
fis.match('*.{less,css}', {
    postprocessor: fis.plugin('css-reset', {
        rootFontSize: 10
    })
});
```

* ``ignore`` 对特定属性设置不转换规则
```javascript
fis.match('*.{less,css}', {
    postprocessor: fis.plugin('css-reset', {
        ignore: {
            // 只除以dpr不转换单位
            px: [
                'padding-top'
            ],
            // 既不除以dpr也不转换单位
            no: [
                'top',
                'bottom'
            ]
        }
    })
});
```

* ``regain`` 恢复通过ignore设置的规则
```javascript
fis.match('*.{less,css}', {
    postprocessor: fis.plugin('css-reset', {
        regain: {
            px: [
                'font*'
            ],
            // 只恢复border-right
            no: [
                'border-right*'
            ]
        }
    })
});
```

### Notice

* 由于采用单行分析，程序无法准确判断当前行是否被包含在注释中，因此``注释中的内容会被无条件转换``。
* 规则优先级 /\*px\*/ > reset > ignore
* css前缀将会被自动处理，在批处理属性中无需单独配置
