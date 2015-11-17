//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------

'use strict'

import * as crypto from 'crypto';
import { ISocks5, INegotiationOptions, IStreamTransportOptions, ICommandOptions } from './main';
import { negotiateAsync } from './lightsword';

class LightSwordConnect implements ISocks5 {
  cipherKey: string;
  vNum: number = 0;
  
  async negotiate(options: INegotiationOptions, callback: (result: boolean, reason?: string) => void) {
    let { result, reason, cipherKey, vNum } = await negotiateAsync(options);
    callback(result, reason);
    this.cipherKey = cipherKey;
    this.vNum = vNum;
  }
  
  async sendCommand(options: ICommandOptions, callback: (result: boolean, reason?: string) => void) {
    let proxySocket = options.proxySocket;
    let connect = {
      dstAddr: options.dstAddr,
      dstPort: options.dstPort,
      vNum: this.vNum,
      type: 'connect'
    };
    
    let cipher = crypto.createCipher(options.cipherAlgorithm, this.cipherKey);  
    let connectBuffer = cipher.update(new Buffer(JSON.stringify(connect)));
    await proxySocket.writeAsync(connectBuffer);
    
    let data = await proxySocket.readAsync();
    if (!data) return callback(false, 'Data not available.');
    
    let decipher = crypto.createDecipher(options.cipherAlgorithm, this.cipherKey);
    
    try {
      let connectOk = JSON.parse(decipher.update(data).toString());
      
      if (connectOk.vNum === connect.vNum + 1) {
        return callback(true);
      }
      
      return callback(false, "Can't confirm verification number.");
    } catch(ex) {
      return callback(false, ex.message);
    }
  }
  
  async transportStream(options: IStreamTransportOptions) {
    let proxySocket = options.proxySocket;
    let clientSocket = options.clientSocket;
    
    let decipher = crypto.createDecipher(options.cipherAlgorithm, this.cipherKey);
    // proxySocket.on('data', data => clientSocket.write(decipher.update(data)));
    proxySocket.pipe(decipher).pipe(clientSocket);
    
    let cipher = crypto.createCipher(options.cipherAlgorithm, this.cipherKey);
    // clientSocket.on('data', (data) => proxySocket.write(cipher.update(data)));
    clientSocket.pipe(cipher).pipe(proxySocket);
  }
}

module.exports = LightSwordConnect;