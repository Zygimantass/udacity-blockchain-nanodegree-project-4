# Project 4: Private star notary service w/ webservice (uses Express.js framework)

#### How to run:
1. Run ```npm install```
2. Use the command ```node server.js```
3. Your server is going to run on port ```3000```

### Endpoints:
| Type | Endpoint                    | Function                                                 |
|------|-----------------------------|----------------------------------------------------------|
| GET  | /stars/height::height       | Returns a block by it's height                           |
| GET  | /stars/address::address     | Returns all blocks created by the address specified      |
| GET  | /stars/hash::hash           | Returns a block by it's hash                             |
| POST | /stars/                     | Create a star                                            |
| POST | /requestValidation          | Request a message to sign to verify                      |
| POST | /message-signature/validate | Verify signed message to get permission to create a star |