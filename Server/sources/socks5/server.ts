//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------

'use strict'

import * as net from 'net';
import * as crypto from 'crypto';
import * as logger from 'winston';
import { defaultQueue } from '../lib/dispatchQueue';
import { ISocks5, ISocks5Options } from '../plugins/main';

export class Server {
  cipherAlgorithm: string;
  password: string;
  port: number;
  
  server: net.Server;
  plugin: ISocks5;
  
  constructor(options: { cipherAlgorithm: string, password: string, port: number, plugin: string }) {
    let _this = this;
    ['cipherAlgorithm', 'password', 'port'].forEach(n => _this[n] = options[n]);
    this.plugin = require(`./plugins/${options.plugin}`);
  }
  
  start() {
    let _this = this;
    
    let server = net.createServer(async (socket) => {
      
      function disposeSocket() {
        socket.removeAllListeners();
        socket.end();
        socket.destroy();
      }
      
      let options: ISocks5Options = {
        cipherAlgorithm: _this.cipherAlgorithm,
        password: _this.password,
        clientSocket: socket
      };
      
      // Step 1: Negotiate with Client.
      async function negotiateAsync(): Promise<boolean> { 
        return new Promise<boolean>(resolve => {
          _this.plugin.negotiate(options, (success, reason) => {
            if (!success) logger.info(reason);
            resolve(success);
          });
        });
      }
      
      let negotiated = await negotiateAsync();
      if (!negotiated) return disposeSocket();
      
      // Step 2: Process requests.
      _this.plugin.transport(options);
    });
    
    server.listen(this.port);
    server.on('error', (err) => logger.error(err.message));

    this.server = server;
  }
  
  stop() {
    if (!this.server) return;
    
    this.server.removeAllListeners();
    this.server.close();
    this.server.destroy();
    this.server = null;
  }
}