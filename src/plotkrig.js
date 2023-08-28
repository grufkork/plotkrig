'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Peer from "peerjs";
import { number } from "mathjs";
import * as math from "mathjs";
//Fix x(value)
var cfg = {
    w: 1000,
    hw: -1,
    h: 600,
    hh: -1,
    scale: 20,
    basePlotSpeed: 250,
    stepSize: 0.005,
    playerSize: 0.5,
    playerSizeSquared: -1,
    economy: {
        giveDelay: 2000,
        startCap: 7,
        startCurrencyPerTick: 0.5,
        precision: 1000
    },
    explosionSize: 15
};
const costs = {
    'constant': 1,
    'char': 0,
    '+': 1,
    '-': 1,
    '*': 1,
    '/': 1,
    '^': 2,
    'log': 2,
    'sqrt': 3,
    'sin': 2,
    'cos': 2,
    'tan': 2,
    'asin': 2,
    'acos': 2,
    'atan': 5,
    'abs': 2,
    'pi': 1,
    'e': 1,
    'x': 1,
    'y': 6,
};
cfg.playerSizeSquared = cfg.playerSize ** 2;
cfg.hw = cfg.w / 2;
cfg.hh = cfg.h / 2;
const elms = {
    connect: document.getElementById("connect"),
    start: document.getElementById("start"),
    fire: document.getElementById("fire"),
    login: document.getElementById("login"),
    lobby: document.getElementById("lobby"),
    game: document.getElementById("game"),
    username: document.getElementById("username"),
    roomname: document.getElementById("roomname"),
    isServer: document.getElementById("isServer"),
    expression: document.getElementById("expression"),
    playerlist: document.getElementById("playerlist"),
    cost: document.getElementById("cost"),
    error: document.getElementById("error"),
    money: document.getElementById("money"),
    status: document.getElementById("status"),
    lengthInput: document.getElementById("lengthInput"),
    projectileType: document.getElementById("projectileType"),
    regenerateMap: document.getElementById("newMap")
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
    let now = Date.now();
    let isServer = elms.isServer.checked;
    if (isServer) {
        while (timeSinceCurrencyGiven + cfg.economy.giveDelay < now) {
            timeSinceCurrencyGiven += cfg.economy.giveDelay;
            for (let i = 0; i < targets.length; i++) {
                if (targets[i].contestable && targets[i].owner != -1) {
                    targets[i].activate();
                }
            }
            for (let i = 0; i < teams.length; i++) {
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
    for (let i = plots.length - 1; i >= 0; i--) {
        if (plots[i].crashTime != 0) {
            if (now - plots[i].crashTime > 10000) {
                plots.splice(i, 1);
            }
            continue;
        }
        let x = plots[i].points[plots[i].points.length - 1][0];
        let y = plots[i].points[plots[i].points.length - 1][1];
        let dy;
        let stop = false;
        while (plots[i].start + plots[i].length < now) {
            let res = plots[i].expression.evaluate({ x: x * plots[i].direction, y: -y });
            if (res instanceof number) {
                stop = true;
                break;
            }
            let dy = res * cfg.stepSize;
            y += -dy;
            x += cfg.stepSize * plots[i].direction;
            plots[i].length += Math.sqrt(cfg.stepSize ** 2 + dy ** 2) * cfg.basePlotSpeed;
            if (isServer) {
                if (plots[i].settings.projectileType == "Regular" || plots[i].settings.projectileType == "Explosive") {
                    for (let p in players) {
                        if (players[p].alive && p != plots[i].name && (x - players[p].x) ** 2 + (y - players[p].y) ** 2 < cfg.playerSizeSquared) {
                            players[p].alive = false;
                            broadcast("kill", { name: p });
                        }
                    }
                    for (let it = 0; it < targets.length; it++) {
                        if ((targets[it].contestable || targets[it].owner == -1) && (x - targets[it].x) ** 2 + (y - targets[it].y) ** 2 < targets[it].sizesq) {
                            if (targets[it].contestable) {
                                if (targets[it].owner == -1 || targets[it].owner != players[plots[i].name].team) {
                                    targets[it].owner = players[plots[i].name].team;
                                    sendTargets();
                                    updateTeams();
                                }
                            }
                            else {
                                targets[it].owner = players[plots[i].name].team;
                                targets[it].activate();
                                sendTargets();
                                updateTeams();
                            }
                        }
                    }
                }
            }
            if (Math.abs(x) > cfg.hw / cfg.scale || Math.abs(y) > cfg.hh / cfg.scale ||
                (terrain != null && getPixel(x, y, 0) < 10) ||
                plots[i].length > plots[i].maxLength) {
                stop = true;
                if (elms.isServer.checked && plots[i].settings.projectileType == "Explosive") {
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
        if (stop) {
            plots[i].crashTime = now;
        }
        else {
            plots[i].points.push([x, y]);
        }
    }
    //Draw
    let self = players[elms.username.value];
    let mirror = self.x > 0 ? -1 : 1;
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
    Object.keys(players).forEach(name => {
        let p = players[name];
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
        ctx.fillText(name, p.x * cfg.scale * mirror, p.y * cfg.scale - 10);
    });
    for (let i = 0; i < targets.length; i++) {
        let t = targets[i];
        if (t.contestable) {
            if (t.owner == -1) { // Unowned capture point
                ctx.strokeStyle = "#000000";
                ctx.fillStyle = "#333333";
                ctx.lineWidth = 1;
            }
            else { // Captured capture point
                ctx.lineWidth = 3;
                ctx.fillStyle = "#000000";
                if (t.owner == self.team) {
                    ctx.strokeStyle = "#27c200";
                }
                else {
                    ctx.strokeStyle = "#bf0d00";
                }
            }
        }
        else {
            if (t.owner == -1) { // Uncaptured one-off
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 2;
                ctx.fillStyle = "#333333";
            }
            else { // Captured one-off
                ctx.lineWidth = 1;
                if (t.owner == self.team) {
                    ctx.strokeStyle = "#8bff6e";
                }
                else {
                    ctx.strokeStyle = "#ff7d7d";
                }
                ctx.fillStyle = "#888888";
            }
        }
        ctx.beginPath();
        ctx.ellipse(t.x * cfg.scale * mirror, t.y * cfg.scale, t.size * cfg.scale, t.size * cfg.scale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(t.effect + t.op + t.amount, t.x * cfg.scale * mirror, t.y * cfg.scale + 5);
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < plots.length; i++) {
        let fade = now - plots[i].crashTime;
        let xEnd = plots[i].points[plots[i].points.length - 1][0] * cfg.scale * mirror;
        let yEnd = plots[i].points[plots[i].points.length - 1][1] * cfg.scale;
        if (plots[i].crashTime == 0) {
            if (plots[i].settings.projectileType == "Tracer") {
                ctx.fillStyle = "rgb(70, 230, 255)";
                ctx.beginPath();
                ctx.arc(xEnd, yEnd, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            else {
                let flicker = Math.random();
                if (plots[i].settings.projectileType == "Explosive") {
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
            ctx.arc(xEnd, yEnd, 20, Math.PI * 2 * (plots[i].length / plots[i].maxLength) - Math.PI * 0.5, Math.PI * 1.5);
            ctx.stroke();
            ctx.lineWidth = 1;
        }
        else if (fade < 80) {
            ctx.fillStyle = "#ffb752";
            ctx.beginPath();
            ctx.arc(xEnd, yEnd, fade / 20 + 30, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = "rgba(0,0,0," + (plots[i].crashTime == 0 ? 1 : 1 - fade / 5000);
        ctx.beginPath();
        for (let n = 0; n < plots[i].points.length; n++) {
            ctx.lineTo(plots[i].points[n][0] * cfg.scale * mirror, plots[i].points[n][1] * cfg.scale);
        }
        ctx.stroke();
        // hsl(50, 100%, 50%)
    }
    ctx.restore();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.beginPath();
    let a = Date.now() / 500 % (2 * Math.PI);
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
var teams = [];
var plots = [];
var terrain = null;
var terrainImage = null;
var timeSinceCurrencyGiven;
var targets = [];
const settings = {
    config: {
        'iceServers': [
            {
                url: 'stun:stun.l.google.com:19302',
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
    },
    port: 9000,
    host: "139.59.209.179",
};
function connect() {
    if (state != "disconnected")
        return;
    setStatus("Connecting");
    state = "connecting";
    var peer = elms.isServer.checked ? new Peer("plotkrig-" + elms.roomname.value, settings) : new Peer("plotkrig-" + elms.roomname.value + "-" + elms.username.value, settings);
    peer.on("open", (id) => {
        console.log("Connection open");
        setStatus("Connection Open");
        elms.login.style.display = "none";
        elms.lobby.style.display = "block";
        if (elms.isServer.checked) {
            // Server code
            peer.on("connection", (con) => {
                con.on("data", (data) => {
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
                                    let count = 0;
                                    for (let name in clients) {
                                        if (clients[name].ready) {
                                            count++;
                                        }
                                    }
                                    setStatus("Ready: " + count + "/" + Object.keys(clients).length);
                                    if (count == Object.keys(clients).length) {
                                        state = "running";
                                        broadcast("gameStarted", {});
                                        setStatus("Running");
                                    }
                                    break;
                            }
                            break;
                    }
                });
                con.on("error", (e) => {
                    console.log(e);
                });
                con.on("close", () => {
                    console.log("Closed");
                });
                console.log("Connected >", con.label);
                clients[con.label] = { conn: con, ready: false };
            });
        }
        else {
            // Client code
            conn = peer.connect("plotkrig-" + elms.roomname.value, { label: elms.username.value });
            conn.on("data", data => {
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
                        players[data.d.name].alive = false;
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
                        let chunk = new ImageData(data.d.w, data.d.h);
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
            conn.on("open", () => {
                setStatus("Connected");
                conn.send({ t: "status", d: "opened" });
                console.log("Open");
            });
            conn.on("error", e => {
                setStatus("Error: " + e);
                console.log(e);
            });
            conn.on("close", () => {
                setStatus("<b style='color:red'>DISCONNECTED</b>");
                console.log("Closed");
            });
        }
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        if (elms.isServer.checked) {
            setStatus("Starting game...");
            setTeams();
            elms.regenerateMap.style.display = "block";
            targets = [];
            let names = Object.keys(clients);
            names.push(elms.username.value);
            let i = Math.round(Math.random());
            shuffle(names).forEach((name) => {
                players[name] = {
                    y: (Math.random() - 0.5) * cfg.h / cfg.scale,
                    x: cfg.w / cfg.scale / 2 - 0.5 - Math.random(),
                    team: i % 2,
                    alive: true
                };
                if (i % 2 == 0)
                    players[name].x *= -1;
                i++;
            });
            redraw = true;
            state = "game";
            elms.lobby.style.display = "none";
            elms.game.style.display = "block";
            // Generate Map
            bctx.fillStyle = "white";
            bctx.fillRect(0, 0, cfg.w, cfg.h);
            bctx.fillStyle = "black";
            for (let x = 0; x < cfg.hw / cfg.scale - 3; x += 4) {
                for (let n = 0; n < 1 + x / 15; n++) {
                    bctx.beginPath();
                    let r = x < 7 ?
                        Math.random() * 75 + 20
                        : Math.random() * 30 + 15;
                    let a = (Math.random() * 1.5 + 0.5) * Math.PI;
                    bctx.ellipse(cfg.hw - (x + Math.random()) * cfg.scale, Math.random() * cfg.h, r, r, 0, a, a + (0.5 + Math.random()) * Math.PI * 2);
                    bctx.fill();
                }
            }
            // Mirror half map
            terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
            yield updateTerrainImage();
            bctx.save();
            bctx.scale(-1, 1);
            bctx.drawImage(terrainImage, 0, 0, cfg.w / 2, cfg.h, -cfg.w, 0, cfg.w / 2, cfg.h);
            bctx.restore();
            terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
            yield updateTerrainImage();
            // Place targets
            for (let i = -1; i <= 0; i += 2) {
                addTarget(10 * i, 20 * i, 0.7, "g", "+", 0.25, false);
                addTarget(10 * i, 20 * i, 0.7, "g", "+", 0.25, false);
                addTarget(5 * i, 10 * i, 0.5, "c", "*", 1.1, false);
                addTarget(15 * i, 20 * i, 0.5, "c", "*", 1.1, false);
                let a = 0.005;
                addTarget(1 * i, 7 * i, 0.7, "c", "+", a, true);
                addTarget(1 * i, 7 * i, 0.7, "c", "+", a, true);
                addTarget(1 * i, 7 * i, 0.7, "c", "+", a, true);
                addTarget(7 * i, 14 * i, 0.7, "c", "+", a, true);
                addTarget(7 * i, 14 * i, 0.7, "c", "+", a, true);
                addTarget(14 * i, 20 * i, 0.7, "c", "+", a, true);
            }
            let clusterX, clusterY;
            do {
                clusterX = Math.random() * 10 + 5;
                clusterY = (Math.random() - 0.5) * cfg.h / cfg.scale;
            } while (collideCircleSimple(clusterX, clusterY, 2));
            for (let i = 0; i < Math.PI * 2; i += Math.PI / 3) {
                let target = new Target(clusterX + Math.cos(i), clusterY + Math.sin(i), 0.7, "c", "+", 0.002, true);
                targets.push(target);
                target = target.clone();
                target.x *= -1;
                targets.push(target);
            }
            broadcast("starting", {});
            broadcast("terrain", terrain.data);
            sendPlayers();
            sendTargets();
            broadcast("finished", {});
            timeSinceCurrencyGiven = Date.now();
        }
    });
}
function addTarget(x1, x2, size, effect, op, amount, contestable) {
    while (true) {
        let target = new Target(Math.random() * (x2 - x1) + x1, (Math.random() - 0.5) * cfg.h / cfg.scale, size, effect, op, amount, contestable);
        if (!collideCircleSimple(target.x, target.y, target.size)) {
            targets.push(target);
            target = target.clone();
            target.x *= -1;
            targets.push(target);
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
        tryPlot(elms.username.value, elms.expression.value, 1, collectSettings());
    }
    else {
        conn.send({ t: "fireRequest", d: {
                expression: elms.expression.value,
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
    let cost = getCost(expression, settings);
    if (cost.cost == null)
        return;
    if (elms.isServer.checked) {
        if (teams[players[name].team].money < cost.cost)
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
class Target {
    constructor(x, y, size, effect, op, amount, contestable) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.sizesq = size ** 2;
        this.effect = effect;
        this.op = op;
        this.amount = amount;
        this.contestable = contestable;
        this.owner = -1;
    }
    activate() {
        switch (this.op) {
            case "+":
                switch (this.effect) {
                    case "g":
                        teams[this.owner].perTick += this.amount;
                        break;
                    case "c":
                        teams[this.owner].cap += this.amount;
                        break;
                }
                break;
            case "*":
                switch (this.effect) {
                    case "g":
                        teams[this.owner].perTick *= this.amount;
                        break;
                    case "c":
                        teams[this.owner].cap *= this.amount;
                        break;
                }
                break;
        }
        teams[this.owner].cap = Math.round(teams[this.owner].cap * cfg.economy.precision) / cfg.economy.precision;
        teams[this.owner].perTick = Math.round(teams[this.owner].perTick * cfg.economy.precision) / cfg.economy.precision;
    }
    clone() {
        return new Target(this.x, this.y, this.size, this.effect, this.op, this.amount, this.contestable);
    }
}
// ---- Helper functions ----
//Graphics
function getPixel(x, y, channel) {
    x = Math.floor(x * cfg.scale) + cfg.hw;
    y = Math.floor(y * cfg.scale) + cfg.hh;
    return terrain.data[(cfg.w * y + x) * 4 + channel];
}
function collideCircleSimple(x, y, r) {
    return getPixel(x, y, 0) == 0 ||
        getPixel(x + r, y, 0) == 0 ||
        getPixel(x - r, y, 0) == 0 ||
        getPixel(x, y + r, 0) == 0 ||
        getPixel(x, y - r, 0) == 0;
}
function updateTerrainImage() {
    return __awaiter(this, void 0, void 0, function* () {
        terrainImage = yield createImageBitmap(terrain);
    });
}
function updateTerrainImageDeferred() {
    createImageBitmap(terrain).then(image => {
        terrainImage = image;
    });
}
function sendTerrainRect(x, y, w, h) {
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
    let tree;
    try {
        tree = math.parse(expression);
        let cost = 0;
        let errs = [];
        tree.traverse((node, path, parent) => {
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
            switch (settings.projectileType) {
                case "Tracer":
                    cost *= 0.5;
                    break;
                case "Explosive":
                    cost = cost * 2 + 10;
                    break;
            }
            cost *= Math.max(1, settings.lengthFactor);
            return { cost: cost, err: null };
        }
        else {
            let err = "";
            for (let e in errs) {
                err += errs[e] + "<br>";
            }
            return { err: err, cost: null };
        }
    }
    catch (e) {
        if (e instanceof Error) {
            return { err: e.toString(), cost: null };
        }
    }
}
function updateCost() {
    let len = Number(elms.lengthInput.value);
    let cost = getCost(elms.expression.value, collectSettings());
    if (cost.err == null) {
        elms.cost.innerHTML = "Cost: " + cost.cost + "ϡ";
        elms.error.style.display = "none";
        elms.cost.style.display = "block";
    }
    else {
        elms.error.innerHTML = cost.err;
        elms.cost.style.display = "none";
        elms.error.style.display = "block";
    }
}
function setTeams() {
    teams = [];
    for (let i = 0; i < 2; i++) {
        teams.push({ money: 0, cap: cfg.economy.startCap, perTick: cfg.economy.startCurrencyPerTick });
    }
}
//Network
function updateTeams() {
    let myTeam = teams[players[elms.username.value].team];
    elms.money.innerHTML = Math.floor(myTeam.money * 10) / 10 + "ϡ<br>" + myTeam.cap + "ϡ Max<br>" + myTeam.perTick + "ϡ per tick";
}
function setStatus(status) {
    if (peer_id != null) {
        status += "  |  ID: <b>" + peer_id + "</b> ROOM: <b>" + elms.roomname.value + "</b>";
    }
    status += "  |   X/Y: <b>±" + cfg.w / cfg.scale / 2 + "/±" + cfg.h / cfg.scale / 2 + "</b>";
    elms.status.innerHTML = status;
}
function broadcast(type, data) {
    Object.keys(clients).forEach(name => {
        clients[name].conn.send({ t: type, d: data });
    });
}
// Events
elms.expression.onkeyup = (e) => {
    updateCost();
    if (e.key == "Enter") {
        firePressed();
    }
};
elms.connect.onclick = connect;
elms.start.onclick = start;
elms.regenerateMap.onclick = start;
elms.fire.onclick = firePressed;
elms.lengthInput.onchange = updateCost;
elms.projectileType.onchange = updateCost;
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
let s = "";
for (let c in costs) {
    s += c + ": " + costs[c] + "<br>";
}
document.getElementById("costList").innerHTML = s;
function crankit() {
    teams[0].cap = 100;
    teams[0].perTick = 10;
    teams[1].cap = 100;
    teams[1].perTick = 10;
}
