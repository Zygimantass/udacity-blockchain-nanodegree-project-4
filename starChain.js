const SHA256 = require('crypto-js/sha256');
const dbInterface = require('./dbInterface.js');

// Block class
class Block {
	constructor(data) {
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
  }
}

Block.prototype.toString = function () {
  return 'Block #' + this.height + ", hash: " + this.hash + ", body: " + this.body;
}

// Blockchain class
class Blockchain {
  constructor() {
    this.getBlockHeight().then((blockHeight) => {
      if (blockHeight == -1) {
        return this.addBlock(new Block("Genesis block"));
      }
    })
    .catch((err) => {
      console.error("Genesis block creation failed!");
      quit();
    });
  }

  addBlock(newBlock) {
    return new Promise((resolve, reject) => {
      this.getBlockHeight()
      .then((height) => {
        newBlock.height = height + 1;
        newBlock.time = new Date().getTime().toString().slice(0,-3); // timestamp is in UTC format

        if (height > 0) {
          return dbInterface.getBlock(height);
        } else {
          return undefined;
        }
      })
      .then((lastBlock) => {
        if (lastBlock !== undefined) newBlock.previousBlockHash = lastBlock.hash;
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        console.log("added")
        return dbInterface.addBlock(newBlock.height, newBlock);
      })
      .then((newBlock) => {
        return dbInterface.setHeight(newBlock.height);
      }).then(() => {
        console.log("Successfully added block #" + newBlock.height);
        console.log(newBlock);
        resolve(newBlock);
      }).catch((err) => {
        console.log(err);
        console.log("Encountered error while adding block #" + newBlock.height);
        reject(err);
      })
    })
  }

  async getBlockHeight() {
    var height = await dbInterface.getBlockHeight();
    return height;
  }

  async getBlock(blockHeight) {
    var block = await dbInterface.getBlock(blockHeight);
    return block; // returns block at blockHeight as a JSON object
  }

  getBlocksByAddress(address) {
    return new Promise(function(resolve, reject) {
      dbInterface.getAllBlocks()
      .then((blocks) => {
        var addressBlocks = [];

        for (let i = 0; i < blocks.length; ++i) {
          let block = blocks[i];

          if (block.body.address === undefined) continue;
          if (block.body.address !== address) continue;
          addressBlocks.push(block);
        }

        resolve(addressBlocks)
      })
      .catch((err) => reject(err));
    })
  }

  getBlockByHash(hash) {
    return new Promise(function(resolve, reject) {
      dbInterface.getAllBlocks()
      .then((blocks) => {
        var addressBlocks = [];

        for (let i = 0; i < blocks.length; ++i) {
          let block = blocks[i];

          if (block.hash !== hash) continue;
          resolve(block);
          return;
        }

        resolve({});
      })
      .catch((err) => reject(err));
    })
  }

  validateBlock(originalBlock){
    console.log(originalBlock)
    let block = JSON.parse(JSON.stringify(originalBlock)) // copying a block
    let blockHash = block.hash; // get block's hash

    block.hash = ''; // removing block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString(); // generate a proper hash
    if (blockHash === validBlockHash) { // comparing current block hash to a valid block hash
        return true;
    } else {
        console.log('Block #' + block.height + ' invalid hash:\n' + blockHash + ' <> ' + validBlockHash); // else print an error and return False
        return false;
    }
  }

  validateChain() { // validate the whole chain
    let errorLog = [];
    
    dbInterface.getAllBlocks()
    .then((blocks) => {
      for (var i = 1; i <= blocks.length - 1; i++) {
        var block = blocks[i];
        // validate block
        if (!this.validateBlock(block)) errorLog.push(i);
        
        if (i == blocks.length - 1) break; // last block doesnt have a second block with a prev hash
        // compare blocks hash link
        let blockHash = block.hash;
        let previousHash = blocks[i + 1].previousBlockHash;
        if (blockHash !== previousHash) {
          console.log("Block #" + block.height + "invalid: " + blockHash + " <> " + previousHash);
          errorLog.push(i);
        }
      }


      if (errorLog.length > 0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: ' + errorLog);
      } else {
        console.log('No errors detected');
      }
    })
  }
}

module.exports = {Block: Block, Blockchain: Blockchain}