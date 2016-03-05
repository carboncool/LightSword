//-----------------------------------
// Copyright(c) 2015 Neko
//-----------------------------------
'use strict';
const connectHandler_1 = require('./connectHandler');
const socks5constant_1 = require('../../common/socks5constant');
const socks5Helper = require('../../common/socks5helper');
const addressHelper_1 = require('../lib/addressHelper');
function handleOSXSocks5(client, data, options) {
    let dst = socks5Helper.refineDestination(data);
    if (!dst)
        return false;
    if (addressHelper_1.isIllegalAddress(dst.addr)) {
        client.dispose();
        return true;
    }
    switch (dst.cmd) {
        case socks5constant_1.REQUEST_CMD.CONNECT:
            connectHandler_1.connect(client, data, dst, options);
            break;
        case socks5constant_1.REQUEST_CMD.BIND:
            break;
        case socks5constant_1.REQUEST_CMD.UDP_ASSOCIATE:
            break;
        default:
            return false;
    }
    return true;
}
exports.handleOSXSocks5 = handleOSXSocks5;
