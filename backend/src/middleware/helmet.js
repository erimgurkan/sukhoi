const helmet = require('helmet');
const { HELMET_OPTIONS } = require('../config/security');

module.exports = helmet(HELMET_OPTIONS);
