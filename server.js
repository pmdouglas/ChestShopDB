//  OpenShift sample Node application
var express = require('express'),
		app     = express(),
		morgan  = require('morgan'),
		fs = require('fs'),
		bodyParser = require('body-parser'),
		multer  = require('multer'),
		upload  = multer({ dest: __dirname+'/tmp/'}),
		readline = require('readline'),
		dataParsing = require(__dirname+'/app/dataParsingMethods'),
		dbMethods = require(__dirname+'/app/databaseMethods');
		
Object.assign=require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

var port = process.env.OPENSHIFT_NODEJS_PORT || 8090,
		ip   = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
		
app.get('/', function (req, res) {
	dbMethods.initDb(function(err){
		res.send('Error connecting to Mongo. Message:\n'+err);
	});
	// list collections
	var transactions = dbMethods.getAllRawTransactions();
	res.render('transactions.html',{transactionsArray: transactions});
});

app.get('/getfile', function(req,res){
	res.render('getfile.html');
});

app.post('/getfile', upload.single('rawtransactions'), function(req,res){
	dbMethods.initDb(function(err){
		res.send('Error connecting to Mongo. Message:\n'+err);
	});
	if (req.file != null){
		dbMethods.clearTransactionTables();
		var rl = readline.createInterface({
			input: fs.createReadStream(req.file.path),
			crlfDelay: Infinity
		});
		rl.on('line', (line) => {
			dbMethods.insertRawTransaction(line);
		});				
	}else{
		res.end('no file selected');	
	}

	//var hello = dataParsing.parseTransaction();
	res.redirect('/');
});

// error handling
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500).send('Something bad happened!');
});

dbMethods.initDb(function(err){
	console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
