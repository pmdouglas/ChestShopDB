/*
*Declarations
*/	
var dbMethods = require(__dirname+'/databaseMethods');

/*
*function name: parseAllRawTransactions
*purpose: parse all raw transactions, ignore trash transactions
*input: none
*ouput: callback
*/	
function parseAllRawTransactions(callback){
	var parsedTransaction;
	var promiseArray = [];
	dbMethods.getAllRawTransactions(function(rawTransactions){
		rawTransactions.forEach(function(rawTransaction, index){
			parsedTransaction = parseTransaction(rawTransaction);
			if (parsedTransaction.type != 'trash'){
				promiseArray.push(dbMethods.insertParsedTransaction(parsedTransaction));
			};
		});
		Promise.all(promiseArray).then(values =>{
			callback();			
		});
	});
};

/*
*function name: parseRawTransactions
*purpose: parse a single raw transaction
*input: raw transaction json
*ouput: parsed transaction json
*/
function parseTransaction(rawTransaction){
	var parsedTransaction = {
		type:"",
		date:"",
		time:"",
		buyer:"",
		seller:"",
		item:"",
		price:"",
		count:"",
		total:"",
		text:""
	};
	if (rawTransaction != null){
		if (rawTransaction.text.includes("Shop") || rawTransaction.text.includes("shop") || rawTransaction.text.includes("ChestShop")){
			parsedTransaction.type = "trash"
		}else{
			parsedTransaction.type = "parsed"
		}
		parsedTransaction.date = rawTransaction.text.substring(0,10);
		parsedTransaction.time = rawTransaction.text.substring(12,19);
		if (rawTransaction.text.includes('bought')){
			var boughtIndex = rawTransaction.text.indexOf('bought');
			var forIndex = rawTransaction.text.indexOf('for');
			var fromIndex = rawTransaction.text.indexOf('from');
			var atIndex = rawTransaction.text.indexOf('at');
			parsedTransaction.buyer = rawTransaction.text.substring(20,boughtIndex-1);
			var itemPart = rawTransaction.text.substring(boughtIndex+7, forIndex);
			parsedTransaction.count = itemPart.substring(0, itemPart.indexOf(' '));
			parsedTransaction.item = itemPart.substring(itemPart.indexOf(' '));
			parsedTransaction.total = rawTransaction.text.substring(forIndex+4,fromIndex-1);
			parsedTransaction.seller = rawTransaction.text.substring(fromIndex+5,atIndex-1);
			parsedTransaction.price = parseFloat(parsedTransaction.total)/parseFloat(parsedTransaction.count);
			parsedTransaction.text = rawTransaction.text.substring(atIndex+3);
		}else{
			var soldIndex = rawTransaction.text.indexOf('sold');
			var forIndex = rawTransaction.text.indexOf('for');
			var toIndex = rawTransaction.text.indexOf('to');
			var atIndex = rawTransaction.text.indexOf('at');
			parsedTransaction.seller = rawTransaction.text.substring(20,soldIndex-1);
			var itemPart = rawTransaction.text.substring(soldIndex+5, forIndex);
			parsedTransaction.count = itemPart.substring(0, itemPart.indexOf(' '));
			parsedTransaction.item = itemPart.substring(itemPart.indexOf(' '));
			parsedTransaction.total = rawTransaction.text.substring(forIndex+4,toIndex-1);
			parsedTransaction.buyer = rawTransaction.text.substring(toIndex+2,atIndex-1);
			parsedTransaction.price = parseFloat(parsedTransaction.total)/parseFloat(parsedTransaction.count);
			parsedTransaction.text = rawTransaction.text.substring(atIndex+3);
			
		};
	};
	return parsedTransaction
};

/*
*expose public methods
*/
module.exports = {
	parseAllRawTransactions:parseAllRawTransactions,
	parseTransaction:parseTransaction
};
