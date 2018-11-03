const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

class MemPool {
  constructor () {
    this.mempool = {};
  }

  addValidation (address, expirationInSeconds) {
    let currentDate = new Date().getTime();
    let messageToSign = address + ":" + currentDate + ":starRegistry"

    this.mempool[address] = {"expireDate": currentDate + (expirationInSeconds * 1000), "dateAdded": currentDate, "messageToSign": messageToSign, "validMessageSignature": false};
    return this.mempool[address];
  }

  getValidation (address) {
    return this.mempool[address];
  }

  deleteValidation(address) {
    delete this.mempool[address];
  }

  validateSignature(address, signature) {
    let validation = this.getValidation(address);
    validation.validMessageSignature = bitcoinMessage.verify(validation.messageToSign, address, signature);
    return validation.validMessageSignature;
  }

  getTimeLeft(address) {
    let currentDate = new Date().getTime();
    let expireDate = this.getValidation(address)["expireDate"];
    return ((expireDate - currentDate) / 1000).toFixed(); // returns time left in seconds 
  }

  checkValidation (address) {
    let validation = this.getValidation(address);
    console.log(validation)
    if (validation === undefined) return false;

    let currentDate = new Date().getTime();
    if (validation["expireDate"] > currentDate) return true;

    this.deleteValidation(address);
    return false;
  }
}

module.exports = MemPool;