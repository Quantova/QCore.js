const core = require('./pkg-node/qcore_js.js');
const { makeClient, generateSeed } = require('./shared.js');

const Client = makeClient(core);

module.exports = { Client, core, generateSeed };
