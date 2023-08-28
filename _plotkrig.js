'use strict';
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
//Fix x(value)
var cfg = {
    w: 1000,
    hw: null,
    h: 600,
    hh: null,
    scale: 20,
    basePlotSpeed: 250,
    stepSize: 0.005,
    playerSize: 0.5,
    playerSizeSquared: null,
    currency: {
        giveDelay: 2000,
        giveAmount: 2
    },
    explosionSize: 15
};
var costs = {
    'constant': 1,
    'char': 0,
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 5,
    'log': 5,
    'sqrt': 4,
    'sin': 3,
    'cos': 3,
    'tan': 4,
    'asin': 2,
    'acos': 2,
    'atan': 8,
    'abs': 4,
    'pi': 0,
    'e': 0,
    'x': 1,
    'y': 10
};
cfg.playerSizeSquared = Math.pow(cfg.playerSize, 2);
cfg.hw = cfg.w / 2;
cfg.hh = cfg.h / 2;
var elms = {
    login: document.getElementById("login"),
    lobby: document.getElementById("lobby"),
    game: document.getElementById("game"),
    username: document.getElementById("username"),
    roomname: document.getElementById("roomname"),
    isServer: document.getElementById("isServer"),
    playerlist: document.getElementById("playerlist"),
    cost: document.getElementById("cost"),
    error: document.getElementById("error"),
    lengthInput: document.getElementById("lengthInput"),
    projectileType: document.getElementById("projectileType")
};
elms.roomname.value = "testroom";
if (window.location.search == "") {
    if (window.location.href.indexOf("file") != -1) {
        elms.username.value = "Client";
    }
    //setTimeout(connect, 500);
}
else {
    elms.username.value = "Server";
    elms.isServer.checked = true;
    //setTimeout(connect, 100);
}
var canvas = document.getElementById("canvas");
var bufferCanvas = document.getElementById("bufferCanvas");
var ctx = canvas.getContext("2d");
var bctx = bufferCanvas.getContext("2d");
canvas.width = bufferCanvas.width = cfg.w;
canvas.height = bufferCanvas.height = cfg.h;
ctx.textAlign = "center";
var redraw = false;
function draw() {
    if (state != "running") {
        requestAnimationFrame(draw);
        return;
    }
    var now = Date.now();
    var isServer = elms.isServer.checked;
    if (isServer) {
        while (timeSinceCurrencyGiven + cfg.currency.giveDelay < now) {
            timeSinceCurrencyGiven += cfg.currency.giveDelay;
            for (var i = 0; i < teams.length; i++) {
                teams[i].money = Math.min(teams[i].cap, teams[i].money + teams[i].perTick);
            }
            broadcast("teams", teams);
            updateTeams();
        }
    }
    if (!(redraw || plots.length > 0)) {
        requestAnimationFrame(draw);
        return;
    }
    ;
    redraw = false;
    // Logic
    for (var i_1 = plots.length - 1; i_1 >= 0; i_1--) {
        if (plots[i_1].crashTime != 0) {
            if (now - plots[i_1].crashTime > 10000) {
                plots.splice(i_1, 1);
            }
            continue;
        }
        var x = plots[i_1].points[plots[i_1].points.length - 1][0];
        var y = plots[i_1].points[plots[i_1].points.length - 1][1];
        var dy = void 0;
        var stop_1 = false;
        while (plots[i_1].start + plots[i_1].length < now) {
            dy = plots[i_1].expression.evaluate({ x: x * plots[i_1].direction, y: -y }) * cfg.stepSize;
            if (dy.type != undefined) {
                stop_1 = true;
                break;
            }
            y += -dy;
            x += cfg.stepSize * plots[i_1].direction;
            plots[i_1].length += Math.sqrt(Math.pow(cfg.stepSize, 2) + Math.pow(dy, 2)) * cfg.basePlotSpeed;
            if (isServer) {
                if (plots[i_1].settings.projectileType == "Regular" || plots[i_1].settings.projectileType == "Explosive") {
                    for (var p in players) {
                        if (players[p].alive && p != plots[i_1].name && Math.pow((x - players[p].x), 2) + Math.pow((y - players[p].y), 2) < cfg.playerSizeSquared) {
                            players[p].alive = false;
                            broadcast("kill", p);
                        }
                    }
                    for (var it = 0; it < targets.length; it++) {
                        if (targets[it].available && Math.pow((x - targets[it].x), 2) + Math.pow((y - targets[it].y), 2) < targets[it].sizesq) {
                            targets[it].available = false;
                            var prop = void 0;
                            switch (targets[it].effect) {
                                case "g":
                                    prop = "perTick";
                                    break;
                                case "c":
                                    prop = "cap";
                                    break;
                            }
                            switch (targets[it].op) {
                                case "+":
                                    teams[players[plots[i_1].name].team][prop] += targets[it].amount;
                                    break;
                                case "*":
                                    teams[players[plots[i_1].name].team][prop] *= targets[it].amount;
                                    break;
                            }
                            sendTargets();
                            updateTeams();
                        }
                    }
                }
            }
            if (Math.abs(x) > cfg.hw / cfg.scale || Math.abs(y) > cfg.hh / cfg.scale ||
                (terrain != null && getPixel(x, y, 0) < 10) ||
                plots[i_1].length > plots[i_1].maxLength) {
                stop_1 = true;
                if (elms.isServer.checked && plots[i_1].settings.projectileType == "Explosive") {
                    bctx.fillStyle = "#ffffff";
                    bctx.beginPath();
                    bctx.ellipse(x * cfg.scale + cfg.hw, y * cfg.scale + cfg.hh, cfg.explosionSize, cfg.explosionSize, 0, 0, Math.PI * 2);
                    bctx.fill();
                    terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                    sendTerrainRect(x * cfg.scale + cfg.hw - cfg.explosionSize, y * cfg.scale + cfg.hh - cfg.explosionSize, cfg.explosionSize * 2, cfg.explosionSize * 2);
                    updateTerrainImage();
                }
                break;
            }
        }
        if (stop_1) {
            plots[i_1].crashTime = now;
        }
        else {
            plots[i_1].points.push([x, y]);
        }
    }
    //Draw
    var self = players[elms.username.value];
    var mirror = self.x > 0 ? -1 : 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (terrainImage != null) {
        if (mirror == 1) {
            ctx.putImageData(terrain, 0, 0);
        }
        else {
            ctx.save();
            ctx.translate(cfg.w, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(terrainImage, 0, 0);
            ctx.restore();
        }
    }
    ctx.strokeStyle = "#22";
    ctx.beginPath();
    ctx.moveTo(cfg.w / 2, 0);
    ctx.lineTo(cfg.w / 2, cfg.h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cfg.h / 2);
    ctx.lineTo(cfg.w, cfg.h / 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(cfg.w / 2, cfg.h / 2);
    Object.keys(players).forEach(function (name) {
        var p = players[name];
        if (!p.alive) {
            ctx.fillStyle = "black";
        }
        else if (Math.sign(mirror) != Math.sign(p.x)) {
            ctx.fillStyle = "green";
        }
        else {
            ctx.fillStyle = "red";
        }
        ctx.beginPath();
        ctx.ellipse(p.x * cfg.scale * mirror, p.y * cfg.scale, cfg.playerSize * cfg.scale, cfg.playerSize * cfg.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "blue";
        ctx.fillText(name, p.x * cfg.scale * mirror, p.y * cfg.scale);
    });
    for (var i_2 = 0; i_2 < targets.length; i_2++) {
        var t = targets[i_2];
        if (t.available) {
            ctx.strokeStyle = "#000000";
            ctx.fillStyle = "#ff0000";
        }
        else {
            ctx.strokeStyle = ctx.fillStyle = "#888888";
        }
        ctx.beginPath();
        ctx.ellipse(t.x * cfg.scale * mirror, t.y * cfg.scale, t.size * cfg.scale, t.size * cfg.scale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(t.effect + t.op + t.amount, t.x * cfg.scale * mirror, t.y * cfg.scale + 5);
    }
    for (var i_3 = 0; i_3 < plots.length; i_3++) {
        var fade = now - plots[i_3].crashTime;
        var xEnd = plots[i_3].points[plots[i_3].points.length - 1][0] * cfg.scale * mirror;
        var yEnd = plots[i_3].points[plots[i_3].points.length - 1][1] * cfg.scale;
        if (plots[i_3].crashTime == 0) {
            if (plots[i_3].settings.projectileType == "Tracer") {
                ctx.fillStyle = "rgb(70, 230, 255)";
                ctx.beginPath();
                ctx.arc(xEnd, yEnd, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            else {
                var flicker = Math.random();
                if (plots[i_3].settings.projectileType == "Explosive") {
                    flicker *= 2.5;
                    ctx.fillStyle = "rgb(214, 7, 0)";
                }
                else {
                    ctx.fillStyle = "hsl(" + (25 + flicker * 10) + ", 100%, 50%)";
                }
                ctx.beginPath();
                ctx.arc(xEnd, yEnd, flicker * 2 + 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(xEnd, yEnd, 20, Math.PI * 2 * (plots[i_3].length / plots[i_3].maxLength) - Math.PI * 0.5, Math.PI * 1.5);
            ctx.stroke();
            ctx.lineWidth = 1;
        }
        else if (fade < 80) {
            ctx.fillStyle = "#ffb752";
            ctx.beginPath();
            ctx.arc(xEnd, yEnd, fade / 20 + 30, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = "rgba(0,0,0," + (plots[i_3].crashTime == 0 ? 1 : 1 - fade / 5000);
        ctx.beginPath();
        for (var n = 0; n < plots[i_3].points.length; n++) {
            ctx.lineTo(plots[i_3].points[n][0] * cfg.scale * mirror, plots[i_3].points[n][1] * cfg.scale);
        }
        ctx.stroke();
        // hsl(50, 100%, 50%)
    }
    ctx.restore();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.beginPath();
    var a = Date.now() / 500 % (2 * Math.PI);
    ctx.arc(20, 20, 10, a, a + Math.PI);
    ctx.stroke();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
var connected = false;
var state = "disconnected";
var peer_id = null;
var conn = null;
var clients = {};
var players = {};
var teams = [{ money: 0, cap: 10, perTick: 0.5 }, { money: 0, cap: 10, perTick: 0.5 }];
var plots = [];
var terrain = null;
var terrainImage = null;
var timeSinceCurrencyGiven;
var targets = [];
var settings = {
    config: {
        'iceServers': [
            {
                url: 'stun:stun.l.google.com:19302'
            },
            {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:443?transport=tcp",
                username: "openrelayproject",
                credential: "openrelayproject"
            }
        ]
    }
};
function connect() {
    if (state != "disconnected")
        return;
    setStatus("Connecting");
    state = "connecting";
    var peer = elms.isServer.checked ? new Peer("plotkrig-" + elms.roomname.value, settings) : new Peer("plotkrig-" + elms.roomname.value + "-" + elms.username.value, settings);
    peer.on("open", function (id) {
        console.log("Connection open");
        setStatus("Connection Open");
        elms.login.style.display = "none";
        elms.lobby.style.display = "block";
        if (elms.isServer.checked) {
            // Server code
            peer.on("connection", function (con) {
                con.on("data", function (data) {
                    console.log("Received>", data);
                    if (data == "Opened") {
                    }
                    switch (data.t) {
                        case "fireRequest":
                            tryPlot(con.label, data.d.expression, data.d.derivative, data.d.settings);
                            break;
                        case "status":
                            switch (data.d) {
                                case "opened":
                                    broadcast("plist", Object.keys(clients));
                                    break;
                                case "ready":
                                    clients[con.label].ready = true;
                                    var count = 0;
                                    for (var name_1 in clients) {
                                        if (clients[name_1].ready) {
                                            count++;
                                        }
                                    }
                                    if (count == Object.keys(clients).length) {
                                        state = "running";
                                        broadcast("gameStarted", "");
                                    }
                                    break;
                            }
                            break;
                    }
                });
                con.on("error", function (e) {
                    console.log(e);
                });
                con.on("close", function () {
                    console.log("Closed");
                });
                console.log("Connected >", con.label);
                clients[con.label] = { conn: con, ready: false };
            });
        }
        else {
            // Client code
            conn = peer.connect("plotkrig-" + elms.roomname.value, { label: elms.username.value });
            conn.on("data", function (data) {
                console.log("Receive>", data);
                switch (data.t) {
                    case "plist":
                        elms.playerlist.innerHTML = data.d;
                        break;
                    case "starting":
                        setStatus("Starting game, loading data...");
                        state = "running";
                        elms.lobby.style.display = "none";
                        elms.game.style.display = "block";
                        break;
                    case "players":
                        players = data.d;
                        redraw = true;
                        break;
                    case "fire":
                        tryPlot(data.d.name, data.d.expression, data.d.derivative, data.d.settings);
                        break;
                    case "kill":
                        players[data.d].alive = false;
                        redraw = true;
                        break;
                    case "terrain":
                        if (terrain == null)
                            terrain = new ImageData(cfg.w, cfg.h);
                        terrain.data.set(new Uint8ClampedArray(data.d));
                        bctx.putImageData(terrain, 0, 0);
                        updateTerrainImage();
                        redraw = true;
                        conn.send({ t: "status", d: "ready" });
                        setStatus("Ready, awaiting start...");
                        break;
                    case "terrainChunk":
                        console.log("Update", data.d.x, data.d.y, data.d.w, data.d.h);
                        var chunk = new ImageData(data.d.w, data.d.h);
                        chunk.data.set(new Uint8ClampedArray(data.d.data));
                        bctx.putImageData(chunk, data.d.x, data.d.y);
                        terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                        updateTerrainImage();
                        break;
                    case "teams":
                        teams = data.d;
                        updateTeams();
                        break;
                    case "targets":
                        targets = data.d;
                        redraw = true;
                        break;
                    case "gameStarted":
                        setStatus("Running");
                        break;
                    default:
                        console.log("Unknown message type>", data.t);
                }
            });
            conn.on("open", function () {
                setStatus("Connected");
                conn.send({ t: "status", d: "opened" });
                console.log("Open");
            });
            conn.on("error", function (e) {
                setStatus("Error: " + e);
                console.log(e);
            });
            conn.on("close", function () {
                setStatus("Disconnected");
                console.log("Closed");
            });
        }
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var i_4, player, x, n, r, a, i_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!elms.isServer.checked) return [3 /*break*/, 3];
                    targets = [];
                    i_4 = Math.round(Math.random());
                    shuffle(Object.keys(clients)).forEach(function (name) {
                        players[name] = {};
                        players[name].y = (Math.random() - 0.5) * cfg.h / cfg.scale;
                        players[name].x = cfg.w / cfg.scale / 2 - 0.5 - Math.random();
                        players[name].team = i_4 % 2;
                        if (i_4 % 2 == 0)
                            players[name].x *= -1;
                        i_4++;
                    });
                    players[elms.username.value] = {};
                    players[elms.username.value].y = (Math.random() - 0.5) * cfg.h / cfg.scale;
                    players[elms.username.value].x = cfg.w / cfg.scale / 2 - 0.5 - Math.random();
                    players[elms.username.value].team = i_4 % 2;
                    if (i_4 % 2 == 0)
                        players[elms.username.value].x *= -1;
                    for (player in players) {
                        players[player].alive = true;
                    }
                    redraw = true;
                    state = "game";
                    elms.lobby.style.display = "none";
                    elms.game.style.display = "block";
                    // Generate Map
                    bctx.fillStyle = "white";
                    bctx.fillRect(0, 0, cfg.w, cfg.h);
                    bctx.fillStyle = "black";
                    for (x = 0; x < cfg.hw / cfg.scale - 3; x += 3) {
                        for (n = 0; n < 1 + x / 15; n++) {
                            bctx.beginPath();
                            r = x < 7 ?
                                Math.random() * 75 + 20
                                : Math.random() * 30 + 15;
                            a = (Math.random() * 1.5 + 0.5) * Math.PI;
                            bctx.ellipse(cfg.hw - (x + Math.random()) * cfg.scale, Math.random() * cfg.h, r, r, 0, a, a + (0.5 + Math.random()) * Math.PI * 2);
                            bctx.fill();
                        }
                    }
                    // Mirror half map
                    terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                    return [4 /*yield*/, updateTerrainImage()];
                case 1:
                    _a.sent();
                    bctx.save();
                    bctx.scale(-1, 1);
                    bctx.drawImage(terrainImage, 0, 0, cfg.w / 2, cfg.h, -cfg.w, 0, cfg.w / 2, cfg.h);
                    bctx.restore();
                    terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                    return [4 /*yield*/, updateTerrainImage()];
                case 2:
                    _a.sent();
                    // Place targets
                    for (i_5 = -1; i_5 < 2; i_5 += 2) {
                        addTarget(15 * i_5, 20 * i_5, 0.7, "g", "+", 0.25);
                        addTarget(10 * i_5, 15 * i_5, 0.7, "g", "+", 0.25);
                        addTarget(5 * i_5, 10 * i_5, 0.5, "g", "*", 1.1);
                        addTarget(15 * i_5, 5 * i_5, 0.7, "c", "+", 2);
                        addTarget(20 * i_5, 15 * i_5, 0.7, "c", "+", 2);
                        addTarget(15 * i_5, 10 * i_5, 0.7, "c", "+", 2);
                        addTarget(15 * i_5, 5 * i_5, 0.3, "c", "*", 1.5);
                        addTarget(15 * i_5, 1 * i_5, 0.5, "c", "*", 1.25);
                    }
                    broadcast("starting", "");
                    broadcast("terrain", terrain.data);
                    sendPlayers();
                    sendTargets();
                    broadcast("finished", "");
                    timeSinceCurrencyGiven = Date.now();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function addTarget(x1, x2, size, effect, op, amount) {
    while (true) {
        var target = {
            x: Math.random() * (x2 - x1) + x1,
            y: (Math.random() - 0.5) * cfg.h / cfg.scale,
            size: size,
            sizesq: Math.pow(size, 2),
            effect: effect,
            op: op,
            amount: amount,
            available: true
        };
        if (getPixel(target.x, target.y, 0) == 255 &&
            getPixel(target.x + target.size, target.y, 0) == 255 &&
            getPixel(target.x - target.size, target.y, 0) == 255 &&
            getPixel(target.x, target.y + target.size, 0) == 255 &&
            getPixel(target.x, target.y - target.size, 0) == 255) {
            targets.push(target);
            targets.push(__assign(__assign({}, target), { x: target.x * -1 }));
            break;
        }
    }
}
function sendPlayers() {
    broadcast("players", players);
}
function sendTargets() {
    broadcast("targets", targets);
}
function firePressed() {
    if (elms.isServer.checked) {
        tryPlot(elms.username.value, document.getElementById("expression").value, 1, collectSettings());
    }
    else {
        conn.send({ t: "fireRequest", d: {
                expression: document.getElementById("expression").value,
                derivative: 1,
                settings: collectSettings()
            } });
    }
}
function collectSettings() {
    return {
        lengthFactor: Number(elms.lengthInput.value),
        projectileType: elms.projectileType.value
    };
}
function tryPlot(name, expression, derivative, settings) {
    expression = fixExpression(expression);
    var cost = getCost(expression, settings);
    if (elms.isServer.checked) {
        if (cost.cost == undefined || teams[players[name].team].money < cost.cost)
            return;
        teams[players[name].team].money -= cost.cost;
        updateTeams();
    }
    plots.push({
        name: name,
        expression: math.compile(expression),
        derivative: derivative,
        points: [[players[name].x, players[name].y]],
        start: Date.now(),
        length: 0.0,
        maxLength: 10 * 1000 * settings.lengthFactor,
        speed: 1,
        direction: players[name].x > 0 ? -1 : 1,
        crashTime: 0,
        settings: settings
    });
    if (elms.isServer.checked) {
        broadcast("fire", { name: name, expression: expression, derivative: derivative, settings: settings });
    }
}
// ---- Helper functions ----
//Graphics
function getPixel(x, y, channel) {
    x = Math.floor(x * cfg.scale) + cfg.hw;
    y = Math.floor(y * cfg.scale) + cfg.hh;
    return terrain.data[(cfg.w * y + x) * 4 + channel];
}
function updateTerrainImage() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createImageBitmap(terrain)];
                case 1:
                    terrainImage = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function updateTerrainImageDeferred() {
    createImageBitmap(terrain).then(function (image) {
        terrainImage = image;
    });
}
function sendTerrainRect(x, y, w, h) {
    console.log(x, y, w, h);
    x = Math.floor(x);
    y = Math.floor(y);
    broadcast("terrainChunk", {
        x: x,
        y: y,
        w: w + 1,
        h: h + 1,
        data: bctx.getImageData(x, y, w + 1, h + 1).data
    });
}
//Maths
function fixExpression(exp) {
    return exp.replace(/([^a-z]|^)([a-z])\(/gm, "$1$2*(");
}
function getCost(expression, settings) {
    expression = fixExpression(expression);
    var tree;
    try {
        tree = math.parse(expression);
    }
    catch (e) {
        return { err: e };
    }
    var cost = 0;
    var errs = [];
    tree.traverse(function (node, path, parent) {
        switch (node.type) {
            case "ConstantNode":
                if (node.value != undefined) {
                    cost += costs.char * node.value.toString().length;
                    cost += costs.constant;
                }
                break;
            case "SymbolNode":
                cost += costs[node.name];
                if (costs[node.name] == undefined) {
                    errs.push('Unknown symbol "' + node.name + '"');
                }
                break;
            case "OperatorNode":
                cost += costs[node.op];
                if (costs[node.op] == undefined) {
                    errs.push('Unknown operator "' + node.op + '"');
                }
                break;
        }
    });
    if (errs.length == 0) {
        cost *= Math.max(1, settings.lengthFactor);
        switch (settings.projectileType) {
            case "Tracer":
                cost *= 0.5;
                break;
            case "Explosive":
                cost = cost * 2 + 10;
                break;
        }
        return { cost: cost };
    }
    else {
        var err = "";
        for (var e in errs) {
            err += errs[e] + "<br>";
        }
        return { err: err };
    }
}
function updateCost() {
    var len = Number(elms.lengthInput.value);
    var cost = getCost(document.getElementById("expression").value, collectSettings());
    if (cost.err == undefined) {
        elms.cost.innerHTML = "Cost: " + cost.cost * len + "ϡ";
        elms.error.style.display = "none";
        elms.cost.style.display = "block";
    }
    else {
        elms.error.innerHTML = cost.err;
        elms.cost.style.display = "none";
        elms.error.style.display = "block";
    }
}
//Network
function updateTeams() {
    var myTeam = teams[players[elms.username.value].team];
    document.getElementById("money").innerHTML = myTeam.money + "ϡ<br>" + myTeam.cap + "ϡ Max<br>" + myTeam.perTick + "ϡ per tick";
}
function setStatus(status) {
    var msg = status;
    if (peer_id != null) {
        msg += "  |  ID: <b>" + peer_id + "</b> ROOM: <b>" + elms.roomname.value + "</b>";
    }
    msg += "  |   X/Y: <b>±" + cfg.w / cfg.scale / 2 + "/±" + cfg.h / cfg.scale / 2 + "</b>";
    document.getElementById("status").innerHTML = msg;
}
function broadcast(type, data) {
    Object.keys(clients).forEach(function (name) {
        clients[name].conn.send({ t: type, d: data });
    });
}
// Events
document.getElementById("expression").onkeyup = function (e) {
    updateCost();
    if (e.key == "Enter") {
        firePressed();
    }
};
elms.projectileType.onchange = updateCost;
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    var _a;
    var currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        _a = [
            array[randomIndex], array[currentIndex]
        ], array[currentIndex] = _a[0], array[randomIndex] = _a[1];
    }
    return array;
}
var s = "";
for (var c in costs) {
    s += c + ": " + costs[c] + "<br>";
}
document.getElementById("costList").innerHTML = s;
function crankit() {
    teams[0].cap = 100;
    teams[0].perTick = 10;
    teams[1].cap = 100;
    teams[1].perTick = 10;
}
