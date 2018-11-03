# Project 3: Private blockchain w/ webservice (uses Express.js framework)

#### How to run:
1. Run ```npm install```
2. Use the command ```node server.js```
3. Your server is going to run on port ```3000```

### Endpoints:
| Type | Endpoint   | Function                                                                  |
|------|------------|---------------------------------------------------------------------------|
| GET  | /block/:id | Returns a block by ID                                                     |
| POST | /block/    | Creates a new block with data that's inside the post data with key "data" |
