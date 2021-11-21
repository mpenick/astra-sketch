var sg = require('@stargate-oss/stargate-grpc-node-client')
var express = require('express');
var router = express.Router();

var grpc = require("../grpc")

/* GET users listing. */
router.get('/', function(req, res, next) {
  grpc.client.executeQuery(new sg.Query().setCql("SELECT * FROM system.local")).then((response) => {
    console.log(response.getResultSet());
    res.send('respond with a resource');
  })
});

module.exports = router;
