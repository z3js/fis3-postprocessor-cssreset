
var parser = require('../index.js');

var fs = require('fs');

function main() {
    fs.readFile('./a.css', {
        encoding: 'utf-8'
    }, function(err, res) {
        // console.log(res);
        var content = parser(res, null, {
            regain: {
                no: ['border-right']
            }
        });
        console.log(content);
    });
}

main();
