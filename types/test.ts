import fs = require('fs');
import socketio = require('socket.io');
import chai = require('chai');
import ChaiIo = require('./index');

chai.use(ChaiIo);

declare const io: socketio.Server;

chai.socket(io);

function test1() {
    const socket = chai.socket(io);
    chai.expect(1).to.eq(1);
}
