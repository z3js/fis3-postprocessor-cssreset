# fis3-postprocessor-cssreset

z3 适配方案

<p>
    <a href="https://www.bithound.io/github/z3js/fis3-postprocessor-cssreset">
        <img src="https://www.bithound.io/github/z3js/fis3-postprocessor-cssreset/badges/score.svg" alt="bitHound Overall Score">
    </a>
    <a href="https://travis-ci.org/z3js/fis3-postprocessor-cssreset" alt="travis">
        <img src="https://travis-ci.org/z3js/fis3-postprocessor-cssreset.svg">
    </a>
</p>

### why use cssreset?

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
        ignore: [
            'border',
            'border-top',
            // ...
        ]
    })
});
```

* ``reset`` 默认 **font** 和 **font-size** 不会被转换成rem，通过指定rest参数恢复
```javascript
fis.match('*.{less,css}', {
    postprocessor: fis.plugin('css-reset', {
        reset: [
            'font',
            'font-size'
        ]
    })
});
```

### 规则优先级

/\*px\*/ > reset > ignore
