const sha3 = require("js-sha3");
const result = sha3.sha3_256("hello world");
console.log(Buffer.from(result, "hex").toJSON());

var a = [
  100, 75, 204, 126, 86, 67, 115, 4, 9, 153, 170, 200, 158, 118, 34, 243, 202,
  113, 251, 161, 217, 114, 253, 148, 163, 28, 59, 251, 242, 78, 57, 56,
];
var b = [
  100, 75, 204, 126, 86, 67, 115, 4, 9, 153, 170, 200, 158, 118, 34, 243, 202,
  113, 251, 161, 217, 114, 253, 148, 163, 28, 59, 251, 242, 78, 57, 56,
];
