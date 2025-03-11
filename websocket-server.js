"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var express_1 = require("express");
var cors_1 = require("cors");
var { format } = require('date-fns');
var app = (0, express_1.default)();
var port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
var GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
var START_ADDRESS = "562 richmond road grey lynn";
var UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
var wss = new ws_1.WebSocketServer({ port: 3002 });
// Store connected clients and data
var clients = new Set();
var orders = [];
var drivers = [];
var productList = [];
var parseAddress = function (addressString) {
    try {
        return JSON.parse(addressString);
    }
    catch (e) {
        console.error('Error parsing address:', e);
        return null;
    }
};
var formatAddress = function (addressData) {
    if (!addressData)
        return '-';
    var parts = [
        addressData.address1,
        addressData.address2,
        addressData.city,
        addressData.province,
        addressData.zip,
        addressData.country
    ].filter(Boolean);
    return parts.join(', ');
};
var formatPhoneNumber = function (phone) {
    if (!phone)
        return '-';
    var digits = phone.replace(/\D/g, '');
    if (digits.startsWith('6421')) {
        return '0' + digits.slice(2);
    }
    else if (digits.startsWith('21')) {
        return '0' + digits;
    }
    else if (digits.startsWith('+6421')) {
        return '0' + digits.slice(3);
    }
    return phone;
};
var calculateDispatchTime = function (deliveryTime, travelTime) {
    if (!deliveryTime)
        return null;
    var delivery = new Date(deliveryTime);
    var travelMinutes = travelTime || 5; // Use 5 as default if travelTime is null
    return new Date(delivery.getTime() - (travelMinutes * 60 * 1000)).toISOString();
};
var calculateTravelTime = function (address) {
    return __awaiter(void 0, void 0, void 0, function () {
        var formattedAddress, response, data, duration, minutes;
        return __generator(this, function (_a) {
            try {
                formattedAddress = formatAddress(parseAddress(address));
                response = yield fetch("https://maps.googleapis.com/maps/api/distancematrix/json?origins=".concat(encodeURIComponent(START_ADDRESS), "&destinations=").concat(encodeURIComponent(formattedAddress), "&key=").concat(GOOGLE_MAPS_API_KEY));
                if (!response.ok) {
                    console.warn("Failed to fetch travel time:", response.status);
                    return [2 /*return*/, null];
                }
                data = yield response.json();
                if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
                    duration = data.rows[0].elements[0].duration.text;
                    minutes = parseInt(duration.split(' ')[0]);
                    return [2 /*return*/, isNaN(minutes) ? null : minutes];
                }
                return [2 /*return*/, null];
            }
            catch (error) {
                console.warn("Error calculating travel time:", error);
                return [2 /*return*/, null];
            }
        });
    });
};
wss.on('connection', function (ws) {
    ws.isAlive = true;
    clients.add(ws);
    console.log('Client connected');
    // Send initial data to new client
    ws.send(JSON.stringify({
        type: 'INIT',
        orders: orders.map(function (order) { return (__assign(__assign({}, order), { dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime) })); }),
        drivers: drivers,
        productList: productList
    }));
    ws.on('pong', function () {
        ws.isAlive = true;
    });
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            switch (data.type) {
                case 'TRAVEL_TIME_UPDATE':
                    const { address, duration } = data;
                    const minutes = parseInt(duration.split(' ')[0]);
                    
                    if (!isNaN(minutes)) {
                        // Update travel time for all orders with matching address
                        const updatedOrders = orders.map(order => {
                            if (formatAddress(parseAddress(order.address)) === address) {
                                return {
                                    ...order,
                                    travelTime: minutes,
                                    dispatchTime: calculateDispatchTime(order.deliveryTime, minutes)
                                };
                            }
                            return order;
                        });

                        orders = updatedOrders;

                        // Broadcast updates
                        const travelTimeUpdate = JSON.stringify({
                            type: 'ORDERS_UPDATE',
                            orders: updatedOrders
                        });

                        clients.forEach(client => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(travelTimeUpdate);
                            }
                        });
                    }
                    break;

                case 'ORDER_UPDATE':
                    const { orderId, updates } = data;
                    const orderIndex = orders.findIndex(o => o.id === orderId);
                    
                    if (orderIndex !== -1) {
                        orders[orderIndex] = {
                            ...orders[orderIndex],
                            ...updates,
                            dispatchTime: calculateDispatchTime(
                                updates.deliveryTime || orders[orderIndex].deliveryTime,
                                updates.travelTime || orders[orderIndex].travelTime
                            )
                        };

                        // Broadcast update to all clients
                        const updateMessage = JSON.stringify({
                            type: 'ORDER_UPDATE',
                            order: orders[orderIndex]
                        });
                        
                        clients.forEach(client => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(updateMessage);
                            }
                        });
                    }
                    break;

                case 'FETCH_ORDERS':
                    // Send current orders to requesting client
                    ws.send(JSON.stringify({
                        type: 'ORDERS_UPDATE',
                        orders: orders.map(function (order) { return (__assign(__assign({}, order), { dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime) })); })
                    }));
                    break;
                case 'FETCH_DRIVERS':
                    ws.send(JSON.stringify({
                        type: 'DRIVERS_UPDATE',
                        drivers: drivers
                    }));
                    break;
                case 'FETCH_PRODUCT_LIST':
                    ws.send(JSON.stringify({
                        type: 'PRODUCT_LIST_UPDATE',
                        productList: productList
                    }));
                    break;
            }
        }
        catch (error) {
            console.error('Error processing message:', error);
        }
    });
    ws.on('close', function () {
        clients.delete(ws);
        console.log('Client disconnected');
    });
});
// Ping clients every 30 seconds to keep connections alive
var interval = setInterval(function () {
    clients.forEach(function (ws) {
        if (ws.isAlive === false) {
            clients.delete(ws);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);
// Broadcast endpoint
app.post('/broadcast', function (req, res) {
    var data = req.body;
    // Handle different types of broadcasts
    switch (data.type) {
        case 'NEW_ORDER':
            // Calculate initial travel time for new orders
            calculateTravelTime(data.order.address).then(function (travelTime) {
                if (travelTime !== null) {
                    var newOrder = __assign(__assign({}, data.order), { travelTime: travelTime, isManualTravelTime: false, dispatchTime: calculateDispatchTime(data.order.deliveryTime, travelTime) });
                    orders.push(newOrder);
                }
            });
            break;
        case 'ORDER_UPDATE':
            var orderIndex = orders.findIndex(function (o) { return o.id === data.orderId; });
            if (orderIndex !== -1) {
                // If travel time is being updated manually, set isManualTravelTime flag
                var isManualUpdate = data.updates.hasOwnProperty('travelTime');
                orders[orderIndex] = __assign(__assign(__assign({}, orders[orderIndex]), data.updates), { isManualTravelTime: isManualUpdate ? true : orders[orderIndex].isManualTravelTime, dispatchTime: calculateDispatchTime(data.updates.deliveryTime || orders[orderIndex].deliveryTime, data.updates.travelTime || orders[orderIndex].travelTime) });
            }
            break;
        case 'DRIVERS_UPDATE':
            drivers = data.drivers;
            break;
        case 'PRODUCT_LIST_UPDATE':
            productList = data.productList;
            break;
    }
    // Broadcast to all connected clients
    var message = JSON.stringify(data);
    clients.forEach(function (client) {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
    res.json({ success: true });
});
// API endpoints
app.get('/api/orders', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.json(orders.map(function (order) { return (__assign(__assign({}, order), { dispatchTime: calculateDispatchTime(order.deliveryTime, order.travelTime) })); }));
        return [2 /*return*/];
    });
}); });
app.get('/api/drivers', function (req, res) {
    res.json(drivers);
});
app.get('/api/product-list', function (req, res) {
    res.json(productList);
});
wss.on('listening', function () {
    console.log('WebSocket server running on port 3002');
});
app.listen(port, function () {
    console.log("HTTP server running on port ".concat(port));
});
// Clean up on server close
wss.on('close', function () {
    clearInterval(interval);
});
