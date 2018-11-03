const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const Blockchain = require('./starChain').Blockchain;
const Block = require('./starChain').Block;
const dbInterface = require('./dbInterface')
const MemPool = require('./memPool');

const version = require('./package.json').version;

let blockChain = new Blockchain();
let memPool = new MemPool();

const VALIDATION_EXPIRATION_IN_SECONDS = 300;

app.get('/', (req, res) => {
  res.json({'success': true, version: version})
});

app.get('/stars/height::blockHeight', function(req, res) {
  let blockHeight = -1;
  if (req.params.blockHeight === undefined) {
    res.status(400).json({'success': false, 'error': 'Please include block ID in URL'});
    return;
  }
  try {
    blockHeight = parseInt(req.params.blockHeight);
    if (isNaN(blockHeight)) {
      throw "Block ID is invalid";
    }
  } catch (err) {
    console.log(err)
    res.status(400).json({'success': false, 'error': 'Block ID is invalid'})
    return;
  }

  dbInterface.getBlock(blockHeight)
  .then((block) => {
    res.json(block)
    return;
  })
  .catch((err) => {
    res.status(500).json({"success": false, "error": err.toString()});
    return;
  })
})

app.get('/stars/address::address', function(req, res) {
  if (req.params.address === undefined) {
    res.status(400).json({'success': false, 'error': 'Please include address in URL'});
    return;
  }

  let address = req.params.address;

  blockChain.getBlocksByAddress(address).then((blocks) => {
    res.json(blocks);
  }).catch((err) => {
    res.json([]);
  })
})


app.get('/stars/hash::hash', function(req, res) {
  if (req.params.hash === undefined) {
    res.status(400).json({'success': false, 'error': 'Please include star hash in URL'});
    return;
  }

  let hash = req.params.hash;

  blockChain.getBlockByHash(hash).then((block) => {
    res.json(block);
  }).catch((err) => {
    res.json({});
  })
})


app.post('/requestValidation', (req, res) => {
  if (req.body.address === undefined) {
    res.status(400).json({'success': false, "error": "No wallet address provided"});
    return;
  }

  let address = req.body.address;
  let entryValid = memPool.checkValidation(address);
  let validation = memPool.getValidation(address);

  if (!entryValid) {
    validation = memPool.addValidation(address, VALIDATION_EXPIRATION_IN_SECONDS);
  }

  res.json({"address": address, "requestTimestamp": validation.dateAdded, "messageToSign": validation.messageToSign, "validationWindow": memPool.getTimeLeft(address)})
});

app.post('/message-signature/validate', (req, res) => {
  if (req.body.address === undefined) {
    res.status(400).json({'success': false, "error": "No wallet address provided"});
    return;
  }

  if (req.body.signature === undefined) {
    res.status(400).json({'success': false, "error": "No signature provided"});
    return;
  }

  let address = req.body.address;
  let signature = req.body.signature;

  let entryValid = memPool.checkValidation(address);
  let validation = memPool.getValidation(address);
  if (!entryValid) {
    res.json({"registerStar": false, "status": "No valid validation window"})
    return;
  }

  validation.validationWindow = memPool.getTimeLeft(address);

  let successfulVerification = memPool.validateSignature(address, signature);

  res.json({"registerStar": successfulVerification, "status": validation});
});

app.post('/stars/', (req, res) => {
  if (req.body.address === undefined) {
    res.status(400).json({'success': false, "error": "No wallet address provided"});
    return;
  }

  let address = req.body.address;
  
  if (req.body.star === undefined) {
    res.status(400).json({'success': false, "error": "No star object provided"});
    return;
  }

  let star = req.body.star;

  if (star.dec === undefined) {
    res.status(400).json({'success': false, "error": "No declination in the star object is provided"});
    return;
  }

  if (star.ra === undefined) {
    res.status(400).json({'success': false, "error": "No right ascension in the star object is provided"});
    return;
  }

  if (star.story === undefined) {
    res.status(400).json({'success': false, "error": "No story in the star object is provided"});
    return;
  }

  if (star.story.length > 250) {
    res.status(400).json({'success': false, "error": "Story in the star object is longer than 250 characters"});
    return;
  }

  star.story = new Buffer(star.story.toString()).toString("hex");
  if (!memPool.checkValidation(address)) {
    res.status(200).json({'success': false, "error": "You haven't made a validation request"});
    return;
  }

  blockChain.addBlock(new Block({"address": address, "star": star}))
  .then((newBlock) => {
    res.json(newBlock);
    console.log(newBlock);
    memPool.deleteValidation(address)
    return;
  }).catch((err) => {
    res.status(500).json({"success": false, "error": "Error while adding your star to the chain"});
    return;
  })
});


app.listen(8000, () => console.log('Blockchain web service running on port 8000'))
