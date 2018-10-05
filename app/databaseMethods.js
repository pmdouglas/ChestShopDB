//load environment variables
var dotenv = require('dotenv');
dotenv.load();

/*
* declarations
*/

var mongodb = require('mongodb');
var db = null;
var	dbDetails = new Object();
var rawTransactionsCollection;
var transactionsCollection; 
var mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGODB_DB_URL;
var	mongoURLLabel = "";

/*
* set up uri for mongo based on environment
*/
if (mongoURL == null) {
	var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
	// If using plane old env vars via service discovery
	if (process.env.DATABASE_SERVICE_NAME) {
		var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
		mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
		mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
		mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
		mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
		mongoUser = process.env[mongoServiceName + '_USER'];

	// If using env vars from secret from service binding  
	} else if (process.env.database_name) {
		mongoDatabase = process.env.database_name;
		mongoPassword = process.env.password;
		mongoUser = process.env.username;
		var mongoUriParts = process.env.uri && process.env.uri.split("//");
		if (mongoUriParts.length == 2) {
			mongoUriParts = mongoUriParts[1].split(":");
			if (mongoUriParts && mongoUriParts.length == 2) {
				mongoHost = mongoUriParts[0];
				mongoPort = mongoUriParts[1];
			}
		}
	}

	if (mongoHost && mongoPort && mongoDatabase) {
		mongoURLLabel = mongoURL = 'mongodb://';
		if (mongoUser && mongoPassword) {
			mongoURL += mongoUser + ':' + mongoPassword + '@';
		}
		// Provide UI label that excludes user id and pw
		mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
		mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
	}
}

console.log("*******mongoURL:"+mongoURL);
console.log("*******process.env.MONGODB_DB_URL:"+process.env.MONGODB_DB_URL);

/*
*function name: initDB
*purpose: initialize db connection
*input: none
*ouput: callback
*/
function initDb(callback) {
	if (mongoURL == null){
		callback(Error('mongoURL is null'));
		return;
	};

	if (mongodb == null){
		callback(Error('mongodb is null'));
		return;
	};
	
  if (db == null){
		mongodb.connect(mongoURL, function(err, conn) {
			if (err) {
				callback(err);
				return;
			}

			db = conn;
			dbDetails.databaseName = db.databaseName;
			dbDetails.url = mongoURLLabel;
			dbDetails.type = 'MongoDB';

			console.log('Connected to MongoDB at: %s', mongoURL);
			console.log('database name: %s', dbDetails.databaseName );
			
			rawTransactionsCollection = db.collection('rawtransactions'); 
			transactionsCollection = db.collection('transactions'); 
		});
	};	
};


/*
*function name: clearTransactionTables
*purpose: clear raw and parsed transactions
*input: none
*ouput: callback
*/
function clearTransactionTables(callback){
	rawTransactionsCollection.drop(function(err, delok1){
		if(err) {
			console.log(err);
		};
		transactionsCollection.drop(function(err,delok2){
			if (err) {
				console.log(err);
			};
			callback();
		});
	});
};

/*
*function name: getAllRawTransactions
*purpose: get the list of raw transactions as an array
*input: none
*ouput: callback with array of raw transactions
*/
function getAllRawTransactions(callback){
	rawTransactionsCollection.find().toArray(function(err, docs){
		callback(docs);
	})
};

/*
*function name: getAllParsedTransactions
*purpose: get the list of parsed transactions as an array
*input: none
*ouput: callback with array of parsed transactions
*/
function getAllParsedTransactions(callback){
	transactionsCollection.find().toArray(function(err, docs){
		callback(docs);
	})
};

/*
*function name: insertRawTransaction
*purpose: insert a raw transaction
*input: raw transaction string
*ouput: promise object
*/	
function insertRawTransaction(line){
	return rawTransactionsCollection.insert({type: 'plaintext', text: line});
};

/*
*function name: insertParsedTransaction
*purpose: insert a Parsed transaction
*input: parsed transaction json
*ouput: promise object
*/		
function insertParsedTransaction(transaction){
	return transactionsCollection.insert(transaction);
};

/*
*expose public functions
*/	
module.exports = {
	initDb:initDb,
	clearTransactionTables:clearTransactionTables,
	getAllRawTransactions:getAllRawTransactions,
	getAllParsedTransactions:getAllParsedTransactions,
	insertRawTransaction:insertRawTransaction,
	insertParsedTransaction:insertParsedTransaction
};
