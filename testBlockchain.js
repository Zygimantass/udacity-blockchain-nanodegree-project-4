const Blockchain = require('./starChain').Blockchain;
const Block = require('./starChain').Block;
const dbInterface = require('./dbInterface')

let blockChain = new Blockchain();

async function addBlocks (numOfBlocks, currentBlockHeight) {
  for (var i = 0; i < numOfBlocks; i++) {
    let nextBlockNo = currentBlockHeight + 1 + i;
    setTimeout(blockChain.addBlock.bind(blockChain, new Block("Block " + nextBlockNo)), 100 * i);
  }
}

function printHelp() {
  console.log("-------------------------------")
  console.log("Usage: node . [option]\n");
  console.log("Options: ");
  console.log("createGenesisBlock")
  console.log("createBlocks [number]");
  console.log("validateChain");
  console.log("outputChain");
  process.exit(1);
}

let args = process.argv;

if (args.length < 3) {
  printHelp();
}

if (args[2] == "createGenesisBlock") {
  dbInterface.getBlockHeight()
  .then((currentBlockHeight) => {
    if (currentBlockHeight == -1) {
      blockChain.addBlock(new Block("Genesis block #1"));
    } else {
      console.log("There is already a genesis block in your blockchain. Please create blocks using the createBlocks command!")
      printHelp();      
    }
  })
} else if (args[2] == "createBlocks") {
  if (args.length != 4) {
    console.log("You need to supply a number of blocks you want to create: node . createBlocks [number]")
    printHelp()
  } 
  
  dbInterface.getBlockHeight()
  .then((currentBlockHeight) => {
    if (currentBlockHeight != -1) {
      let numOfBlocks = parseInt(args[3])
      addBlocks(numOfBlocks, currentBlockHeight)
    } else {
      console.log("You need to create a genesis block using the command createGenesisBlock");
      printHelp();
    }
  });
} else if (args[2] == "validateChain") {
  blockChain.validateChain();
} else if (args[2] == "outputChain") {
  dbInterface.getAllBlocks()
  .then((blocks) => {
    for (var i = 1; i < blocks.length; i++) {
      console.log(Object.assign(new Block, blocks[i]).toString());
    }
  })
} else {
  printHelp();
}
