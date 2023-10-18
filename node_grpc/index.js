const express = require("express");
const bodyParser = require("body-parser");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const app = express();
const cp = require("child_process");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PROTO_PATH = "./customers.proto";

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	arrays: true
});

const CustomerService = grpc.loadPackageDefinition(packageDefinition).CustomerService;

app.get("/", (req, res) => {
	res.send("Server UP")
});

app.post("/save", (req, res) => {
	let newCustomer = {
		name: req.body.name,
		age: req.body.age,
		address: req.body.address
	};
	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	client.insert(newCustomer, (err, data) => {
		if (err) throw err;

		console.log("Customer created successfully", data);
		res.redirect("/");
	});
	grpc.closeClient(client)
});

app.post("/update", (req, res) => {
	const updateCustomer = {
		id: req.body.id,
		name: req.body.name,
		age: req.body.age,
		address: req.body.address
	};

	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	client.update(updateCustomer, (err, data) => {
		if (err) throw err;

		console.log("Customer updated successfully", data);
		res.redirect("/");
	});
	grpc.closeClient(client)
});

app.post("/remove", (req, res) => {
	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	client.remove({ id: req.body.customer_id }, (err, _) => {
		if (err) throw err;

		console.log("Customer removed successfully");
		res.redirect("/");
	});
	grpc.closeClient(client)
});

app.get("/rce", (req, res) => {
	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	const payload = req.query["payload"];
	client.rce({ payload }, (err, _) => {
		if (err) console.log(err);
		grpc.closeClient(client)
		res.send(_.result);
	});
});

app.get("/fileread", (req, res) => {
	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	const payload = req.query["payload"];
	client.fileRead({ payload }, (err, _) => {
		if (err) console.log(err);
		grpc.closeClient(client)
		res.send(_.result);
	});
});

app.get("/rce-stream", (req, res) => {
	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	const payload = req.query["payload"];

	const stream = client.rceStream({ payload })

	stream.on('data', (result) => {
		console.info("Respone: ", result.result)
	})

	stream.on('end', () => {
	grpc.closeClient(client)
	res.send('Server Stream call completed\n')
	})
});

app.get("/ssrf", (req, res) => {
	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	const call = client.ssrf((err, response) => {
		if (err) return console.error(err)
		console.log(response)
		grpc.closeClient(client)
		res.send("Client Stream call completed\n")
	  })
	const payload = req.query["payload"];
	for(let i=1; i<=5; i++){
		console.log("Sending Client message = " + i);
		call.write({payload});
	}
	call.end()
});

app.get("/fileAccess", (req, res) => {
	const payload = req.query["payload"];
	const client = new CustomerService(
		"localhost:30043",
		grpc.credentials.createInsecure()
	);
	const call = client.fileAccess()
	
	call.on('data', (result) => {
		console.log('Response received:', result)
	})

	call.on('end', () => {
		console.log('SERVER COMPLETED SENDING')
		grpc.closeClient(client)
		res.send("Bi directional Stream call completed\n")
	})

	for(let i=1; i<=5; i++){
		console.log("SENDING MESSAGE - " + i);
		call.write({payload});
		cp.execSync('sleep 1')
	}
	call.end()
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Server running at port %d", PORT);
});