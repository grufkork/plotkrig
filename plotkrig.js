(function (Peer, math) {
    'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var math__namespace = /*#__PURE__*/_interopNamespaceDefault(math);

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    // ONCE I WAS LIKE YOU
    // I BID MY TIME
    // I PAID MY DUES
    // TODO: //
    // , crashes game
    // show pregame box on restart
    // x Game not starting until action is performed
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
            giveInterval: 2000,
            //initialCap: 7, //100
            initialCap: 100,
            //initialCurrencyPerTick: 0.5, //20
            initialCurrencyPerTick: 20,
            displayPrecision: 1000,
            generationIncrease: {
                interval: 1000 * 60 * 2,
                amount: 0.3
            }
        },
        projectiles: {
            explosionSize: 15,
            blobSize: 10,
            wallWidth: 25,
            tracerCostMultiplier: 0.5
        }
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
        playerlist: document.getElementById("playerlist"),
        cost: document.getElementById("cost"),
        error: document.getElementById("error"),
        money: document.getElementById("money"),
        status: document.getElementById("status"),
        pregameControls: document.getElementById("pregameControls"),
        gameControls: document.getElementById("gameControls"),
        xSlider: document.getElementById("xSlider"),
        ySlider: document.getElementById("ySlider"),
        readyButton: document.getElementById("readyButton"),
        expression: document.getElementById("expression"),
        lengthInput: document.getElementById("lengthInput"),
        projectileType: document.getElementById("projectileType"),
        fuseSpan: document.getElementById("fuseSpan"),
        fuseInput: document.getElementById("fuseInput"),
        regenerateMap: document.getElementById("newMap"),
        backToLobby: document.getElementById("backToLobby"),
        adminControls: document.getElementById("adminControls")
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
        let now = Date.now();
        let isServer = elms.isServer.checked;
        if (state == "running" && isServer) {
            while (timeSinceCurrencyGiven + cfg.economy.giveInterval < now) {
                timeSinceCurrencyGiven += cfg.economy.giveInterval;
                for (let i = 0; i < targets.length; i++) {
                    if (targets[i].owner != -1 && targets[i].contestable && targets[i].effect == "c") {
                        targets[i].activate();
                    }
                }
                for (let i = 0; i < teams.length; i++) {
                    teams[i].money = Math.min(teams[i].cap, teams[i].money + teams[i].perTick);
                }
                broadcast("teams", teams);
                updateTeams();
            }
            if ((now - startTimestamp) / cfg.economy.generationIncrease.interval - generationIncreases > 1) {
                generationIncreases++;
                for (let i = 0; i < teams.length; i++) {
                    teams[i].perTick += cfg.economy.generationIncrease.amount;
                }
            }
        }
        if (!(redraw || plots.length > 0 && state == "running")) {
            requestAnimationFrame(draw);
            return;
        }
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
            let stop = false;
            while (plots[i].start + plots[i].length < now) {
                try {
                    let res = plots[i].expression.evaluate({ x: x * plots[i].direction, y: -y });
                    if (res instanceof math.number) {
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
                                    // Targets that still can be hit, and are hit
                                    if (targets[it].contestable) {
                                        // Targets that can switch owner
                                        if (targets[it].owner != players[plots[i].name].team) {
                                            // If target is not already owned by the team
                                            if (targets[it].op == "+") {
                                                // Targets that can be contested and perform addition
                                                if (targets[it].effect == "c") {
                                                    // Update cap-per-tick counter (display only)
                                                    teams[players[plots[i].name].team].capPerTick += targets[it].amount;
                                                    if (targets[it].owner != -1) {
                                                        teams[targets[it].owner].capPerTick -= targets[it].amount;
                                                    }
                                                }
                                                if (targets[it].effect == "g") {
                                                    // Update pertick counter (gold/sec)
                                                    teams[players[plots[i].name].team].perTick += targets[it].amount;
                                                    if (targets[it].owner != -1) {
                                                        teams[targets[it].owner].perTick -= targets[it].amount;
                                                    }
                                                }
                                            }
                                            targets[it].owner = players[plots[i].name].team;
                                            sendTargets();
                                            updateTeams();
                                        }
                                    }
                                    else {
                                        // Targets that can only be hit once
                                        targets[it].owner = players[plots[i].name].team;
                                        targets[it].activate();
                                        sendTargets();
                                        updateTeams();
                                    }
                                }
                            }
                        }
                        else if (plots[i].settings.projectileType == "Wall") {
                            if (plots[i].length >= plots[i].maxLength * plots[i].settings.fuse) {
                                let angle = Math.atan2(-dy, cfg.stepSize) * plots[i].direction + Math.PI / 2;
                                bctx.strokeStyle = "#666666";
                                bctx.lineWidth = 5;
                                bctx.lineCap = "round";
                                bctx.beginPath();
                                bctx.moveTo(x * cfg.scale + cfg.hw - Math.cos(angle) * cfg.projectiles.wallWidth, y * cfg.scale + cfg.hh - Math.sin(angle) * cfg.projectiles.wallWidth);
                                bctx.lineTo(x * cfg.scale + cfg.hw + Math.cos(angle) * cfg.projectiles.wallWidth, y * cfg.scale + cfg.hh + Math.sin(angle) * cfg.projectiles.wallWidth);
                                bctx.stroke();
                                terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                                sendTerrainRect(x * cfg.scale + cfg.hw - Math.cos(angle) * cfg.projectiles.wallWidth - 5, y * cfg.scale + cfg.hh - Math.sin(angle) * cfg.projectiles.wallWidth - 5, Math.cos(angle) * 2 * cfg.projectiles.wallWidth * cfg.scale + 10, Math.sin(angle) * 2 * cfg.projectiles.wallWidth * cfg.scale + 10);
                                updateTerrainImage();
                                stop = true;
                            }
                        }
                    }
                    if (Math.abs(x) > cfg.hw / cfg.scale || Math.abs(y) > cfg.hh / cfg.scale ||
                        (terrain != null && getPixel(x, y, 0) != 255) ||
                        plots[i].length > plots[i].maxLength) {
                        stop = true;
                        if (elms.isServer.checked) {
                            if (plots[i].settings.projectileType == "Explosive") {
                                bctx.fillStyle = "#ffffff";
                                bctx.beginPath();
                                bctx.ellipse(x * cfg.scale + cfg.hw, y * cfg.scale + cfg.hh, cfg.projectiles.explosionSize, cfg.projectiles.explosionSize, 0, 0, Math.PI * 2);
                                bctx.fill();
                                terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                                sendTerrainRect(x * cfg.scale + cfg.hw - cfg.projectiles.explosionSize, y * cfg.scale + cfg.hh - cfg.projectiles.explosionSize, cfg.projectiles.explosionSize * 2, cfg.projectiles.explosionSize * 2);
                                updateTerrainImage();
                            }
                            else if (plots[i].settings.projectileType == "Blob") {
                                bctx.fillStyle = "#aa1010";
                                bctx.beginPath();
                                bctx.ellipse(x * cfg.scale + cfg.hw, y * cfg.scale + cfg.hh, cfg.projectiles.blobSize, cfg.projectiles.blobSize, 0, 0, Math.PI * 2);
                                bctx.fill();
                                terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                                sendTerrainRect(x * cfg.scale + cfg.hw - cfg.projectiles.blobSize, y * cfg.scale + cfg.hh - cfg.projectiles.blobSize, cfg.projectiles.blobSize * 2, cfg.projectiles.blobSize * 2);
                                updateTerrainImage();
                            }
                        }
                        break;
                    }
                }
                catch (e) {
                    stop = true;
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
            if (state == "running" || p.team == self.team) {
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
            }
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
            ctx.fillText(t.effect.toUpperCase() + t.op, t.x * cfg.scale * mirror, t.y * cfg.scale);
            ctx.fillText(t.amount.toString(), t.x * cfg.scale * mirror, t.y * cfg.scale + 10);
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
    var state = "disconnected";
    var conn = null;
    var clients = {};
    var players = {};
    var serverClient = {
        ready: false,
    };
    var teams = [];
    var plots = [];
    var terrain = null;
    var terrainImage = null;
    var timeSinceCurrencyGiven;
    var startTimestamp;
    var generationIncreases;
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
        //port: 9000,
        //host: "139.59.209.179",
    };
    function connect() {
        if (state != "disconnected")
            return;
        setStatus("Connecting", false);
        state = "connecting";
        var peer = elms.isServer.checked ? new Peer("plotkrig-" + elms.roomname.value, settings) : new Peer("plotkrig-" + elms.roomname.value + "-" + elms.username.value, settings);
        peer.on("open", (id) => {
            console.log("Connection opened...");
            setStatus("Connection Open", false);
            if (elms.isServer.checked) {
                elms.login.style.display = "none";
                elms.lobby.style.display = "block";
                elms.start.style.display = "block";
                // Server code
                peer.on("connection", (con) => {
                    console.log("state", state);
                    con.on("data", (d) => {
                        let data = d;
                        console.log("Received>", data);
                        /*if(data == "Opened"){
                        }*/
                        switch (data.t) {
                            case "fireRequest":
                                tryPlot(con.label, data.d.expression, data.d.derivative, data.d.settings);
                                break;
                            case "status":
                                switch (data.d) {
                                    case "opened":
                                        if (state != "connecting") {
                                            console.log("Booting");
                                            con.send("gameInProgress");
                                            con.close();
                                            return;
                                        }
                                        else {
                                            let temp = Object.keys(clients);
                                            temp.splice(0, 0, elms.username.value);
                                            broadcast("plist", temp);
                                            elms.playerlist.innerHTML = temp.join("<br>");
                                        }
                                        break;
                                    case "terrainLoaded":
                                        clients[con.label].readyState = ReadyState.placing;
                                        let count = 0;
                                        for (let name in clients) {
                                            if (clients[name].readyState == ReadyState.placing) {
                                                count++;
                                            }
                                        }
                                        setStatus("Loaded: " + count + "/" + Object.keys(clients).length, false);
                                        if (count == Object.keys(clients).length) {
                                            state = "placing";
                                            broadcast("state", "placing");
                                            setStatus("Picking starting point", false);
                                        }
                                        break;
                                    case "ready":
                                        if (clients[con.label].readyState == ReadyState.placing) {
                                            clients[con.label].readyState = ReadyState.ready;
                                            checkIfAllReady();
                                        }
                                        break;
                                }
                                break;
                            case "positionChange":
                                if (clients[con.label].readyState == ReadyState.placing && state == "placing") {
                                    setPosition(data.d, con.label);
                                }
                                break;
                        }
                    });
                    con.on("error", (e) => {
                        console.log("Error from", con.label + ", kicking. \n", e);
                        try {
                            con.close();
                        }
                        catch (e) {
                            console.log("Error while closing:", e);
                        }
                        delete clients[con.label];
                        updatePlayerList();
                    });
                    con.on("close", () => {
                        console.log("Closed:", con.label);
                        delete clients[con.label];
                        updatePlayerList();
                        console.log(clients);
                    });
                    console.log("Connected >", con.label);
                    clients[con.label] = { conn: con, readyState: 0 };
                });
            }
            else {
                // Client code
                conn = peer.connect("plotkrig-" + elms.roomname.value, { label: elms.username.value });
                conn.on("data", d => {
                    let data = d;
                    console.log("Receive>", data);
                    // Register handlers
                    switch (data.t) {
                        case "plist":
                            elms.playerlist.innerHTML = data.d.join("<br>");
                            break;
                        case "state":
                            switch (data.d) {
                                case "lobby":
                                    setStatus("Connected", false);
                                    elms.lobby.style.display = "block";
                                    elms.game.style.display = "none";
                                    break;
                                case "pregame":
                                    setStatus("Starting game, loading data...", false);
                                    state = "pregame";
                                    elms.lobby.style.display = "none";
                                    elms.game.style.display = "block";
                                    elms.pregameControls.style.display = "none";
                                    elms.gameControls.style.display = "none";
                                    break;
                                case "placing":
                                    setStatus("Pick starting point", false);
                                    state = "placing";
                                    elms.pregameControls.style.display = "block";
                                    elms.gameControls.style.display = "none";
                                    break;
                                case "running":
                                    setStatus("Running", false);
                                    state = "running";
                                    elms.pregameControls.style.display = "none";
                                    elms.gameControls.style.display = "block";
                                    redraw = true;
                                    break;
                            }
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
                        case "terrain": // Deprecated
                            if (terrain == null)
                                terrain = new ImageData(cfg.w, cfg.h);
                            terrain.data.set(new Uint8ClampedArray(data.d));
                            bctx.putImageData(terrain, 0, 0);
                            updateTerrainImage();
                            redraw = true;
                            conn.send({ t: "status", d: "terrainLoaded" });
                            setStatus("Loaded, awaiting start...", false);
                            break;
                        case "terrainURI":
                            let image = new Image(cfg.w, cfg.h);
                            image.onload = () => {
                                if (terrain == null)
                                    terrain = new ImageData(cfg.w, cfg.h);
                                bctx.drawImage(image, 0, 0);
                                terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                                updateTerrainImage();
                                redraw = true;
                                conn.send({ t: "status", d: "terrainLoaded" });
                                setStatus("Loaded, awaiting start...", false);
                            };
                            image.src = data.d;
                            break;
                        case "terrainChunk":
                            let chunk = new ImageData(data.d.w, data.d.h);
                            chunk.data.set(new Uint8ClampedArray(data.d.data));
                            bctx.putImageData(chunk, data.d.x, data.d.y);
                            terrain = bctx.getImageData(0, 0, cfg.w, cfg.h);
                            updateTerrainImage();
                            redraw = true;
                            break;
                        case "teams":
                            teams = data.d;
                            updateTeams();
                            break;
                        case "targets":
                            targets = data.d;
                            redraw = true;
                            break;
                        case "gameInProgress":
                            elms.login.style.display = "block";
                            elms.lobby.style.display = "none";
                            setStatus("Game already in progress!", true);
                            break;
                        default:
                            console.log("Unknown message type>", data.t);
                            break;
                    }
                });
                conn.on("open", () => {
                    elms.login.style.display = "none";
                    elms.lobby.style.display = "block";
                    setStatus("Connected", false);
                    conn.send({ t: "status", d: "opened" });
                    console.log("Open");
                });
                conn.on("error", e => {
                    setStatus("Error: " + e, true);
                    console.error(e);
                });
                conn.on("close", () => {
                    setStatus("DISCONNECTED", true);
                    state = "disconnected";
                    console.log("Closed");
                });
            }
        });
        peer.on("error", (err) => {
            state = "disconnected";
            switch (err.type) {
                case "invalid-id":
                    setStatus("Invalid Username! (invalid-id)", true);
                    break;
                case "unavailable-id":
                    setStatus("Room and/or username already in use! (unavailable-id)", true);
                    break;
                case "network":
                    setStatus("Failed to connect to signalling server (network)", true);
                    break;
                case "browser-incompatible":
                    setStatus("Incompatible browser, no WebRTC. Try Chrome! (browser-incompatible)", true);
                    break;
                case "peer-unavailable":
                    setStatus("Peer unavailable", true);
                    break;
                case "server-error":
                    setStatus("Server unreachable (server-error)", true);
                    break;
                case "socket-error":
                    setStatus("Socket error", true);
                    break;
                case "socket-closed":
                    setStatus("Socket closed unexpectedly (socket-closed)", true);
                    break;
                case "webrtc":
                    setStatus("Native WebRTC error (webrtc)", true);
                    break;
                default:
                    setStatus("Unanticipated error: " + err.type, true);
                    break;
            }
        });
    }
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (elms.isServer.checked) {
                broadcast("state", "pregame");
                setStatus("Starting game...", false);
                setTeams();
                elms.adminControls.style.display = "block";
                elms.pregameControls.style.display = "block";
                elms.gameControls.style.display = "none";
                targets = [];
                serverClient.ready = false;
                for (let id in clients) {
                    if (clients[id].conn.open) {
                        clients[id].readyState = ReadyState.loading;
                    }
                    else {
                        console.log("Kicking disconnected client:", id);
                        delete clients[id];
                        updatePlayerList();
                    }
                }
                let names = Object.keys(clients);
                names.push(elms.username.value);
                let i = Math.round(Math.random());
                shuffle(names).forEach((name) => {
                    let teamIndex = i % 2;
                    let teamFromName = parseInt(name[0]);
                    if (teamFromName == 1 || teamFromName == 2) {
                        teamIndex = teamFromName - 1;
                    }
                    else {
                        i++;
                    }
                    players[name] = {
                        y: (Math.random() - 0.5) * cfg.h / cfg.scale,
                        x: cfg.w / cfg.scale / 2 - 0.5 - Math.random(),
                        team: teamIndex,
                        alive: true
                    };
                    if (teamIndex == 1)
                        players[name].x *= -1;
                });
                redraw = true;
                state = "pregame";
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
                    addTarget(15 * i, 20 * i, 0.7, "g", "+", 0.25, true);
                    addTarget(10 * i, 20 * i, 0.7, "g", "+", 0.25, true);
                    addTarget(5 * i, 10 * i, 0.5, "c", "*", 1.1, false);
                    addTarget(15 * i, 20 * i, 0.5, "c", "*", 1.1, false);
                    let a = 0.015;
                    addTarget(1 * i, 7 * i, 0.7, "c", "+", a, true);
                    addTarget(1 * i, 7 * i, 0.7, "c", "+", a, true);
                    addTarget(1 * i, 7 * i, 0.7, "c", "+", a, true);
                    addTarget(7 * i, 14 * i, 0.7, "c", "+", a, true);
                    addTarget(7 * i, 14 * i, 0.7, "c", "+", a, true);
                    addTarget(14 * i, 20 * i, 0.7, "c", "+", a, true);
                }
                // Cluster
                let clusterX, clusterY;
                do {
                    clusterX = Math.random() * 10 + 5;
                    clusterY = (Math.random() - 0.5) * cfg.h / cfg.scale;
                } while (collideCircleSimple(clusterX, clusterY, 2));
                for (let i = 0; i < Math.PI * 2; i += Math.PI / 3) {
                    let target = new Target(clusterX + Math.cos(i), clusterY + Math.sin(i), 0.5, "c", "+", 0.0035, true);
                    targets.push(target);
                    target = target.clone();
                    target.x *= -1;
                    targets.push(target);
                }
                let target = new Target(clusterX, clusterY, 0.5, "c", "+", 0.0035, true);
                targets.push(target);
                target = target.clone();
                target.x *= -1;
                targets.push(target);
                // Sync
                redraw = true;
                //broadcast("terrain", terrain.data);
                broadcast("terrainURI", bufferCanvas.toDataURL("image/png"));
                sendPlayers();
                sendTargets();
                broadcast("finished", {});
                timeSinceCurrencyGiven = startTimestamp = Date.now();
                generationIncreases = 0;
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
            projectileType: elms.projectileType.value,
            fuse: Number(elms.fuseInput.value)
        };
    }
    function tryPlot(name, expression, derivative, settings) {
        expression = fixExpression(expression);
        let cost = getCost(expression, settings);
        if (cost.cost == null)
            return;
        if (elms.isServer.checked) {
            if (teams[players[name].team].money < cost.cost || !players[name].alive)
                return;
            teams[players[name].team].money -= cost.cost;
            updateTeams();
        }
        plots.push({
            name: name,
            expression: math__namespace.compile(expression),
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
            teams[this.owner].cap = Math.round(teams[this.owner].cap * cfg.economy.displayPrecision) / cfg.economy.displayPrecision;
            teams[this.owner].perTick = Math.round(teams[this.owner].perTick * cfg.economy.displayPrecision) / cfg.economy.displayPrecision;
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
        return getPixel(x, y, 0) != 255 ||
            getPixel(x + r, y, 0) != 255 ||
            getPixel(x - r, y, 0) != 255 ||
            getPixel(x, y + r, 0) != 255 ||
            getPixel(x, y - r, 0) != 255;
    }
    function updateTerrainImage() {
        return __awaiter(this, void 0, void 0, function* () {
            terrainImage = yield createImageBitmap(terrain);
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
            tree = math__namespace.parse(expression);
            let cost = 0;
            let errs = [];
            tree.traverse((node, path, parent) => {
                switch (node.type) {
                    case "ConstantNode":
                        let value = node.value;
                        if (value != undefined) {
                            cost += costs.char * value.toString().length;
                            cost += costs.constant;
                        }
                        break;
                    case "SymbolNode":
                        let name = node.name;
                        if (costs[name] == undefined) {
                            errs.push('Unknown symbol "' + name + '"');
                        }
                        else {
                            cost += costs[name];
                        }
                        break;
                    case "OperatorNode":
                        let op = node.op;
                        if (costs[op] == undefined) {
                            errs.push('Unknown operator "' + op + '"');
                        }
                        else {
                            cost += costs[op];
                        }
                        break;
                }
            });
            if (errs.length == 0) {
                switch (settings.projectileType) {
                    case "Tracer":
                        cost *= cfg.projectiles.tracerCostMultiplier;
                        break;
                    case "Explosive":
                        cost = cost * 2 + 10;
                        break;
                    case "Wall":
                        cost = cost * 2.5 + 13;
                        break;
                    case "Blob":
                        cost = cost * 1.5 + 10;
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
        Number(elms.lengthInput.value);
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
            teams.push({ money: 0, cap: cfg.economy.initialCap, perTick: cfg.economy.initialCurrencyPerTick, capPerTick: 0 });
        }
    }
    //Network
    function updateTeams() {
        let myTeam = teams[players[elms.username.value].team];
        elms.money.innerHTML = Math.floor(myTeam.money * 10) / 10 + "ϡ<br>" + myTeam.cap + "ϡ Max<br>" + myTeam.perTick + "ϡ per tick<br>" + Math.round(myTeam.capPerTick * 1000) / 1000 + " cap per tick";
    }
    function setStatus(status, isError) {
        if (isError) {
            status = "<b style='color:red'>" + status + "</b>";
        }
        status += "  |   X/Y: <b>±" + cfg.w / cfg.scale / 2 + "/±" + cfg.h / cfg.scale / 2 + "</b>";
        elms.status.innerHTML = status;
    }
    function broadcast(type, data) {
        Object.keys(clients).forEach(name => {
            clients[name].conn.send({ t: type, d: data });
        });
    }
    function updatePlayerList() {
        let temp = Object.keys(clients);
        temp.splice(0, 0, elms.username.value);
        broadcast("plist", temp);
        elms.playerlist.innerHTML = temp.join("<br>");
    }
    function setPosition(pos, name) {
        pos.x = Math.max(0, Math.min(pos.x, 1));
        pos.y = Math.max(0, Math.min(pos.y, 1));
        players[name].x = (cfg.w / cfg.scale / 2 - 0.5 - pos.x * 1) * (players[name].team * 2 - 1);
        players[name].y = (pos.y - 0.5) * cfg.h / cfg.scale;
        redraw = true;
        broadcast("players", players);
    }
    function checkIfAllReady() {
        let count = 0;
        let max = Object.keys(clients).length + 1; //+1 for server
        for (let name in clients) {
            if (clients[name].readyState == ReadyState.ready) {
                count++;
            }
        }
        if (serverClient.ready) {
            count++;
            setStatus("Ready: " + count + "/" + max, false);
        }
        if (count == max) {
            elms.gameControls.style.display = "block";
            state = "running";
            broadcast("state", "running");
            setStatus("Running", false);
        }
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
    elms.readyButton.onclick = () => {
        setStatus("Ready, waiting for other players", false);
        if (elms.isServer.checked) {
            serverClient.ready = true;
            checkIfAllReady();
        }
        else {
            conn.send({ t: "status", d: "ready" });
        }
        elms.pregameControls.style.display = "none";
    };
    elms.xSlider.onchange = elms.ySlider.onchange = () => {
        if (elms.isServer.checked) {
            setPosition({ x: Number(elms.xSlider.value), y: Number(elms.ySlider.value) }, elms.username.value);
        }
        else {
            conn.send({ t: "positionChange", d: { x: elms.xSlider.value, y: elms.ySlider.value } });
        }
    };
    elms.regenerateMap.onclick = start;
    elms.backToLobby.onclick = () => {
        elms.game.style.display = "none";
        elms.lobby.style.display = "block";
        state = "connecting";
        broadcast("state", "lobby");
        for (let i in clients) {
            clients[i].readyState = ReadyState.loading;
        }
    };
    elms.fire.onclick = firePressed;
    elms.lengthInput.onchange = updateCost;
    elms.projectileType.onchange = () => {
        updateCost();
        elms.fuseSpan.style.display = elms.projectileType.value == "Wall" ? "block" : "none";
    };
    // Enums
    var ProjectileType;
    (function (ProjectileType) {
        ProjectileType[ProjectileType["Regular"] = 0] = "Regular";
        ProjectileType[ProjectileType["Tracer"] = 1] = "Tracer";
        ProjectileType[ProjectileType["Explosive"] = 2] = "Explosive";
        ProjectileType[ProjectileType["Wall"] = 3] = "Wall";
        ProjectileType[ProjectileType["Blob"] = 4] = "Blob";
    })(ProjectileType || (ProjectileType = {}));
    var ReadyState;
    (function (ReadyState) {
        ReadyState[ReadyState["loading"] = 0] = "loading";
        ReadyState[ReadyState["placing"] = 1] = "placing";
        ReadyState[ReadyState["ready"] = 2] = "ready";
    })(ReadyState || (ReadyState = {}));
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
    // Finish up
    let s = "";
    for (let c in costs) {
        s += c + ": " + costs[c] + "<br>";
    }
    document.getElementById("costList").innerHTML = s;

})(Peer, math);
