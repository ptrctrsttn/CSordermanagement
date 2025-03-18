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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var { PrismaClient } = require("@prisma/client");
var prisma = new PrismaClient();
// Store orders in memory
var orders = [];
var drivers = [];
var productList = [];
// Store WebSocket clients
var clients = new Set();
var app = (0, express_1.default)();
var wsPort = 3002; // WebSocket port
var httpPort = 3003; // HTTP port
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// File path for persisting orders
var ORDERS_FILE = path_1.default.join(process.cwd(), 'orders.json');
// Function to save orders to file
var saveOrders = function () {
    try {
        fs_1.default.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        console.log('Orders saved to file');
    }
    catch (error) {
        console.error('Error saving orders:', error);
    }
};
// Function to load orders from file
var loadOrders = function () {
    try {
        if (fs_1.default.existsSync(ORDERS_FILE)) {
            var data = fs_1.default.readFileSync(ORDERS_FILE, 'utf8');
            orders = JSON.parse(data);
            console.log('Orders loaded from file');
        }
        else {
            console.log('No existing orders file found');
            orders = [];
        }
    }
    catch (error) {
        console.error('Error loading orders:', error);
        orders = [];
    }
};
// Load orders when server starts
loadOrders();
var GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
var START_ADDRESS = "562 richmond road grey lynn";
var UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
// Store the update interval reference
var updateIntervalRef;
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
var updateAllTravelTimes = function () { return __awaiter(void 0, void 0, void 0, function () {
    var updatedTimes, fetch, _loop_1, _i, orders_1, order, updateMessage_1;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                updatedTimes = {};
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('node-fetch')); })];
            case 1:
                fetch = (_f.sent()).default;
                _loop_1 = function (order) {
                    var addressData, formattedAddress, response, data, duration, minutes, orderIndex, error_1;
                    return __generator(this, function (_g) {
                        switch (_g.label) {
                            case 0:
                                // Skip orders with manually set travel times
                                if (order.isManualTravelTime) {
                                    return [2 /*return*/, "continue"];
                                }
                                _g.label = 1;
                            case 1:
                                _g.trys.push([1, 4, , 5]);
                                addressData = parseAddress(order.address);
                                if (!addressData)
                                    return [2 /*return*/, "continue"];
                                formattedAddress = formatAddress(addressData);
                                return [4 /*yield*/, fetch("/api/maps?type=distancematrix&address=".concat(encodeURIComponent(formattedAddress), "&startAddress=").concat(encodeURIComponent(START_ADDRESS)))];
                            case 2:
                                response = _g.sent();
                                if (!response.ok) {
                                    console.warn("Failed to fetch travel time for order ".concat(order.id, ":"), response.status);
                                    return [2 /*return*/, "continue"];
                                }
                                return [4 /*yield*/, response.json()];
                            case 3:
                                data = _g.sent();
                                if (((_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.rows) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.elements) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.status) === 'OK' && ((_e = data.rows[0].elements[0].duration) === null || _e === void 0 ? void 0 : _e.text)) {
                                    duration = data.rows[0].elements[0].duration.text;
                                    minutes = parseInt(duration.split(' ')[0]);
                                    if (!isNaN(minutes)) {
                                        updatedTimes[order.id] = minutes;
                                        orderIndex = orders.findIndex(function (o) { return o.id === order.id; });
                                        if (orderIndex !== -1) {
                                            orders[orderIndex] = __assign(__assign({}, orders[orderIndex]), { travelTime: minutes, dispatchTime: calculateDispatchTime(orders[orderIndex].deliveryTime, minutes) });
                                        }
                                    }
                                }
                                return [3 /*break*/, 5];
                            case 4:
                                error_1 = _g.sent();
                                console.warn("Error updating travel time for order ".concat(order.id, ":"), error_1);
                                return [2 /*return*/, "continue"];
                            case 5: return [2 /*return*/];
                        }
                    });
                };
                _i = 0, orders_1 = orders;
                _f.label = 2;
            case 2:
                if (!(_i < orders_1.length)) return [3 /*break*/, 5];
                order = orders_1[_i];
                return [5 /*yield**/, _loop_1(order)];
            case 3:
                _f.sent();
                _f.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                // Only broadcast if there are non-manual updates
                if (Object.keys(updatedTimes).length > 0) {
                    updateMessage_1 = JSON.stringify({
                        type: 'TRAVEL_TIME_UPDATE',
                        travelTimes: updatedTimes,
                        orders: orders
                    });
                    clients.forEach(function (client) {
                        if (client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(updateMessage_1);
                        }
                    });
                }
                return [2 /*return*/];
        }
    });
}); };
// Set up periodic travel time updates
updateIntervalRef = setInterval(updateAllTravelTimes, UPDATE_INTERVAL);
// Create WebSocket server
var wss = new ws_1.WebSocketServer({ port: wsPort });
console.log('WebSocket server starting on port '.concat(wsPort));
wss.on('connection', function (ws) {
    console.log('Client connected to WebSocket server');
    clients.add(ws);
    // Send initial data to client
    var initialData = JSON.stringify({
        type: 'INITIAL_DATA',
        orders: orders,
        drivers: drivers,
        productList: productList
    });
    ws.send(initialData);
    ws.on('message', function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var data, orderId_1, updates, orderIndex, updateMessage_2;
        return __generator(this, function (_a) {
            try {
                data = JSON.parse(message.toString());
                console.log('Received message:', data);
                if (data.type === 'ORDER_UPDATE') {
                    orderId_1 = data.orderId, updates = data.updates;
                    console.log('Processing order update for:', orderId_1, updates);
                    orderIndex = orders.findIndex(function (o) { return o.id === orderId_1; });
                    if (orderIndex !== -1) {
                        orders[orderIndex] = __assign(__assign({}, orders[orderIndex]), updates);
                        // Save updated orders to file
                        saveOrders();
                        updateMessage_2 = JSON.stringify({
                            type: 'ORDER_UPDATE',
                            order: orders[orderIndex]
                        });
                        clients.forEach(function (client) {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(updateMessage_2);
                            }
                        });
                    }
                }
            }
            catch (error) {
                console.error('Error processing message:', error);
            }
            return [2 /*return*/];
        });
    }); });
    ws.on('close', function () {
        console.log('Client disconnected from WebSocket server');
        clients.delete(ws);
    });
});
// API endpoints
app.get('/api/orders', function (req, res) {
    res.json(orders);
});
app.get('/api/stock', async (req, res) => {
    try {
        const stockItems = await prisma.stockItem.findMany();
        res.json(stockItems);
    }
    catch (error) {
        console.error('Error fetching stock items:', error);
        res.status(500).json({ error: 'Failed to fetch stock items' });
    }
});
app.get('/api/product-list', async (req, res) => {
    try {
        const stockItems = await prisma.stockItem.findMany();
        res.json(stockItems);
    }
    catch (error) {
        console.error('Error fetching product list:', error);
        res.status(500).json({ error: 'Failed to fetch product list' });
    }
});
app.get('/api/drivers', async (req, res) => {
    try {
        const allDrivers = await prisma.driver.findMany();
        res.json(allDrivers);
    }
    catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});
app.listen(httpPort, function () {
    console.log("Express server running on port ".concat(httpPort));
    console.log("WebSocket server running on port ".concat(wsPort));
});
// Clean up on server close
wss.on('close', function () {
    if (updateIntervalRef) {
        clearInterval(updateIntervalRef);
    }
});
// Handle server shutdown
process.on('SIGINT', function () {
    console.log('Shutting down WebSocket server...');
    wss.close(function () {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});
