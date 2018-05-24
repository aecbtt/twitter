const db=require('./myStorage');

let DB = new db.myDB('./data');

const str = require('./myStream');

let streams = new str.StreamManager();

exports.sendStatic    = (req,res) => res.sendFile("public/index.html",{root:application_root});

exports.sendDatasets  = (req,res) => res.send({result: DB.getDatasets()}); 

exports.sendCounts    = (req,res) => res.send({error:"No operativo!"});

exports.sendLastPosts = (req,res) => {
    let n = (req.query.n == null) ? 10 : parseInt(req.query.n);
    DB.getLastObjects(req.params.name,n,data => res.send(data));
};

//pon aqui tus funciones adicionales!

exports.sendTweetPolarity = (req,res) => {
	DB.getLastObjects(req.params.name,100,data => {
	let polaridad = {pos:0, neg:0, neutr:0};
	for(let tweet of data.result) {
		if (typeof tweet.polarity=="string") 
			tweet.polarity = parseInt(tweet.polarity.split(",").slice(-1)[0]);
		if (tweet.polarity > 0) {
			polaridad.pos++;
		} else if (tweet.polarity < 0) {
			polaridad.neg++;
		} else {
			polaridad.neutr++;
		}
	}
	res.send({result: { positive: polaridad.pos, negative: polaridad.neg, neutral: polaridad.neutr}});
	});
};

function myCountBy(lista,top){
	let H={};
	for(let w of lista)
		if (w in H) H[w]++;
		else H[w]=1;
	let pairs=[];
	for(let k in H) pairs.push([k,H[k]]);
	return pairs.sort(function(a,b){return b[1]-a[1]}).slice(0,top);
}

exports.sendWords = (req,res) => {
	let top = (req.query.top == null) ? 10 : parseInt(req.query.top);
	DB.getLastObjects(req.params.name,50,data => {
		let lista = [];
		for (let tweet of data.result) {
			lista.push(...tweet.text.split(" "));
		}
                let resultado = myCountBy(lista, top);
		res.send({result: resultado});
	});
};

exports.sendCoordinates = (req,res) => {
	DB.getLastObjects(req.params.name,100,data => {
	let lista = [];
	for (let tweet of data.result) {
		if (tweet.coordinates != null) {
			lista.push([tweet.id, tweet.coordinates]);
		}
	}
	res.send({result: lista});
	});
};

exports.sendTweets = (req,res) => {
	let limit = (req.query.limit == null) ? 10 : parseInt(req.query.limit);
	DB.getLastObjects(req.params.name,limit,data => {
		let lista = [];
		for (let tweet of data.result) {
			lista.push(tweet.id);
		}
		res.send({result: lista});
	});
};

exports.sendStream = (req,res) => {
	var stream = {
		"@context": "http://schema.org",
      		"@type": "SearchAction",
      		"agent": {
        		"@type": "Person",
        		"name": "Persona"
      		},
      		"startTime": Date.now(),
      		"@id": "./data/"+req.body.name+".data",
      		"identifier": req.body.name,
      		"query": req.body.track
    	};
	stream.createStream(req.body.name, stream);
	res.send({result: "success"});
}

exports.sendGraph = (req,res) => {
	var promesas = DB.datasets.map(
    		function(name){
      			return new Promise( (resolve, reject)=> {
        			DB.getDatasetInfo(req.body.name, function(data){
        		resolve(data.result);
        		});
      		});
    	});

  	Promise.all(promesas).then((values)=>{
      		res.send({"@context":"http://schema.org", "@graph":values});
  	});
}

exports.warmup = DB.events;
