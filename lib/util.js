/**
 * @file 提出一些工具函数，方便测试
 */

module.exports = {

    /**
     * 过滤单行首尾空格
     *
     * @param {string} str 待过滤字符串
     * @return {string} 过滤后的字符串
     */
    trim: function (str) {
        if (!str) {
            return str;
        }

        return str.replace(/^\s+/, '').replace(/\s+$/, '');
    },

    /**
     * 数组去重
     *
     * @param {Array} arr 待去重数组
     * @return {Array} 去重后的数组
     */
    unique: function (arr) {
        if (!Array.isArray(arr) || arr.length < 2) {
            return arr;
        }

        if (typeof global.Set === 'function' && typeof Array.form === 'function') {
            return Array.form(new global.Set(arr));
        }

        var res = [];
        arr.forEach(function (item, i) {
            if (arr.lastIndexOf(item) !== i) {
                return;
            }

            res.push(arr[i]);
        });
        return res;
    },

    /**
     * 从origin中移除target
     *
     * @param {Array} origin 源数组
     * @param {Array} target 目标数组
     * @return {Array} 从源数组中移除所有目标数组项的数组
     */
    remove: function (origin, target) {
        var res = [];
        origin.forEach(function (item) {
            if (!~target.indexOf(item)) {
                res.push(item);
            }

        });
        return res;
    }
};
