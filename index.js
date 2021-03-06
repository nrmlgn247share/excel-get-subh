
var bodyParser = require('body-parser');
var express = require('express');
var serveStatic = require('serve-static');
var http = require('http');
var fs = require("fs");
var cors = require('cors');
var mysql = require('mysql2');
const { Parser } = require('json2csv');

var app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/test1', test1);


app.all('/dashboard/getExcelData', getExcelData);
app.all('/dashboard/setExcelData', setExcelData);
app.get('/dashboard/getCSV', getCSV);

app.set('port', process.env.PORT || 9603);
app.listen(app.get('port'), function () {
console.log('Express server listening on port ' + app.get('port'));
});
/*
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
    });
app.set('port', process.env.PORT || 9603);
app.listen(app.get('port'), function () {
console.log('Express server listening on port ' + app.get('port'));
});*/



//app.use('/web', express.static('../web'));

//app.get('/studentDel', studentDel);



var con = mysql.createConnection({
    connectionLimit: 100,
    host: "34.93.31.132",
    user: "remote",
    password: "Remote@147",
    port: 3306,
    database: "erpexcel"
});

async function runDB2(query, data) {
    
    let promise = new Promise((resolve, reject) => {
        con.connect(function(err) {
            if (err) reject(err);
            else {
                con.query(query, data, (err, res) => {
                    if (err) reject(err)
                    else resolve(res);
                });
            }
        });
    });
    let result = await promise;
    return result;
}

async function test1(req, res){
	result = [{status:'ok'}];
	res.send(result);
}



async function getExcelData(req, res){
    var batchNumber = req.body.batchNumber;
    // console.log("getExcelData() postId: ", batchNumber);
    var query = `select *
                from erpexcel.t_excel e
                where e.batch_number = '${(batchNumber)}';`
	//console.log(query);
	var result = await runDB2(query);
    // console.log('getPostDetail result: ', result);
    res.send(result);
}

async function setExcelData(req, res){
    // console.log(req.body);
    var dataArray = req.body.dataArray;
    var batchNumber = req.body.batchNumber;
    // console.log("setExcelData() postId: ", dataArray);

    var query = '';
	for (var i = 1; i < dataArray.length; i++) {
        query += `INSERT INTO erpexcel.t_excel (po_id, customer_id, ship_name, ship_mobile_number, ship_city, ship_pincode, order_date, weight, status, batch_number)
        VALUES ('${dataArray[i][0]}', '${dataArray[i][1]}', '${dataArray[i][2]}', '${dataArray[i][3]}', '${dataArray[i][4]}', '${dataArray[i][5]}', '${dataArray[i][6]}', '${dataArray[i][7]}', '${dataArray[i][7]}', '${batchNumber}');`
    }
	// console.log(query);
	var result = await runDB2(query);
    // console.log('getPostDetail result: ', result);
    res.send(result);
    
}

async function getCSV(req, res){
    var batchNumber = req.query.batchNumber;
    var query = `select *
                from erpexcel.t_excel e
                where e.batch_number = '${(batchNumber)}';`
	var result = await runDB2(query);
    // console.log('getPostDetail result: ', result);
    var fieldsIn = [
        { label: 'po_id', value: 'po_id' },
        { label: ' customer id', value: 'customer_id' },
        { label: 'Ship Name', value: 'ship_name' },
        { label: 'Ship Mobile Number', value: 'ship_mobile_number' },
        { label: 'Ship City', value: 'ship_city' },
        { label: 'Ship Pincode', value: 'ship_pincode' },
        { label: 'Order Date', value: 'order_date' },
        { label: 'Weight', value: 'weight' },
        { label: 'Status', value: 'status' }
    ];
    // datas = data.map(function(tData){ return tData.dataValues });
    var json2csv = new Parser({ fields: fieldsIn });
    const csv = json2csv.parse(result);

    res.attachment(`${batchNumber}.csv`);
    res.status(200).send(csv);
}