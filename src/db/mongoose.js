const mongoose = require('mongoose')

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://taskappadmin:HelloWorld684!@task-prod-qscad.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

module.exports = { mongoose }