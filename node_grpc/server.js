const PROTO_PATH = "./customers.proto";

var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
let cp = require("child_process");
let fs = require("fs");
const request = require("request");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var customersProto = grpc.loadPackageDefinition(packageDefinition);

const { v4: uuidv4 } = require("uuid");

const server = new grpc.Server();
const customers = [
    {
        id: "a68b823c-7ca6-44bc-b721-fb4d5312cafc",
        name: "John Bolton",
        age: 23,
        address: "Address 1"
    },
    {
        id: "34415c7c-f82d-4e44-88ca-ae2a1aaa92b7",
        name: "Mary Anne",
        age: 45,
        address: "Address 2"
    }
];

server.addService(customersProto.CustomerService.service, {
    getAll: (_, callback) => {
        callback(null, { customers });
    },

    get: (call, callback) => {
        let customer = customers.find(n => n.id == call.request.id);

        if (customer) {
            callback(null, customer);
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    },

    insert: (call, callback) => {
        let customer = call.request;

        customer.id = uuidv4();
        customers.push(customer);
        callback(null, customer);
    },

    update: (call, callback) => {
        let existingCustomer = customers.find(n => n.id == call.request.id);

        if (existingCustomer) {
            existingCustomer.name = call.request.name;
            existingCustomer.age = call.request.age;
            existingCustomer.address = call.request.address;
            callback(null, existingCustomer);
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    },

    remove: (call, callback) => {
        let existingCustomerIndex = customers.findIndex(
            n => n.id == call.request.id
        );

        if (existingCustomerIndex != -1) {
            customers.splice(existingCustomerIndex, 1);
            callback(null, {});
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    },
    rce: (call, callback) => {
        var payload = call.request.payload;
        try {
            cp.exec(payload, (err, stdout, stderr) => {
                if (err) {
                    callback({
                        code: grpc.status.INTERNAL,
                        details: err
                    });
                }
                callback(null, { result: stdout.toString() });
            });
        } catch (err) {
            callback({
                code: grpc.status.INTERNAL,
                details: err
            });
        }
    },
    fileRead: (call, callback) => {
        var payload = call.request.payload;
        try {

            var buffer = fs.readFileSync(payload);
            callback(null, { result: buffer.toString() });
        } catch (err) {
            callback({
                code: grpc.status.INTERNAL,
                details: err
            });
        }
    },
    rceStream: (call) => {
        const payload = call.request.payload;
        for (let i = 0; i < 5; i++) {
            try {
                let res = cp.execSync(payload);
                let result = "SYSTEM_COMMAND Executed - response" + i + " : " + res.toString();
                call.write({ result })
                cp.execSync("sleep 1")
            } catch (err) {
                call.write({
                    result: err.message
                });
            }
        }
        call.end()
    },
    ssrf: (call, callback) => {
        call.on('data', (req) => {
            console.log("request received: ", req)
            request({ uri: req.payload }, (err, response, body) => {
                if (err) {
                    callback({
                        code: grpc.status.INTERNAL,
                        details: err
                    });
                }
                console.log("Request executed with status code: ", response.statusCode)
            });
        })
        // Once all locations have already been received, send a response
        call.on('end', () => {
            callback(null, { result: "Server processed requests" })
        })
    },
    fileAccess: (call, callback) => {
        call.on('data', (request) => {
            console.log("request received: ", request)
            try {
                var buffer = fs.readFileSync(request.payload);
                call.write({ result: buffer.toString() })
            } catch (err) {
                callback({
                    code: grpc.status.INTERNAL,
                    details: err
                });
            }
        })

        call.on('end', () => {
            call.end();
        });
    }
});

server.bindAsync(
    "127.0.0.1:30043",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
        console.log("GRPC Server at port:", port);
        server.start();
    });
