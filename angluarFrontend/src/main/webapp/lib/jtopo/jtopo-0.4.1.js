(function (window) {
    function Element() {
        this.initialize = function () {
            this.elementType = "element",
            this.serializedProperties = ["elementType"],
            this.propertiesStack = []
        },
        this.attr = function (e, t) {
            if (e != null && t != null) this[e] = t;
            else if (e != null) return this[e];
            return this
        },
        this.save = function () {
            var e = this,
                t = {};
            this.serializedProperties.forEach(function (n) {
                    t[n] = e[n]
                }),
            this.propertiesStack.push(t)
        },
        this.restore = function () {
            if (this.propertiesStack == null || this.propertiesStack.length == 0) return;
            var e = this,
                t = this.propertiesStack.pop();
            this.serializedProperties.forEach(function (n) {
                    e[n] = t[n]
                })
        },
        this.toJson = function () {
            var e = this,
                t = "{",
                n = this.serializedProperties.length;
            return this.serializedProperties.forEach(function (r, i) {
                    var s = e[r];
                    typeof s == "string" && (s = '"' + s + '"'),
                    t += '"' + r + '":' + s,
                    i + 1 < n && (t += ",")
                }),
            t += "}",
            t
        }
    }
    JTopo = {
        version: "0.4.1",
        zIndex_Container: 1,
        zIndex_Link: 2,
        zIndex_Node: 3,
        SceneMode: {
            normal: "normal",
            drag: "drag",
            edit: "edit",
            select: "select"
        },
        MouseCursor: {
            normal: "default",
            pointer: "pointer",
            top_left: "nw-resize",
            top_center: "n-resize",
            top_right: "ne-resize",
            middle_left: "e-resize",
            middle_right: "e-resize",
            bottom_left: "ne-resize",
            bottom_center: "n-resize",
            bottom_right: "nw-resize",
            move: "move",
            open_hand: "url(./img/cur/openhand.cur) 8 8, default",
            closed_hand: "url(./img/cur/closedhand.cur) 8 8, default"
        },
        createStageFromJson: function (jsonStr, canvas) {
            eval("var jsonObj = " + jsonStr);
            var stage = new JTopo.Stage(canvas);
            for (var k in jsonObj) k != "scenes" && (stage[k] = jsonObj[k]);
            var scenes = jsonObj.scenes;
            return scenes.forEach(function (e) {
                var t = new JTopo.Scene(stage);
                for (var n in e) n != "elements" && (t[n] = e[n]),
                n == "background" && (t.background = e[n]);
                var r = e.elements;
                r.forEach(function (e) {
                    var n = null,
                        r = e.elementType;
                    r == "node" ? n = new JTopo.Node : r == "CircleNode" && (n = new JTopo.CircleNode);
                    for (var i in e) n[i] = e[i];
                    t.add(n)
                })
            }),
            stage
        }
    },
    JTopo.Element = Element,
    window.JTopo = JTopo
})(window),


function (JTopo) {
    function MessageBus(e) {
        function n(e, n) {
            var r = [],
                i = 0;
            for (var s = 0; s < e.length; s++) {
                    var o = e[s],
                        u = t.messageMap[o];
                    u == null && (t.messageMap[o] = []);

                    function a(t) {
                            return r[s] = t,
                            i++,
                            i == e.length ? (i = 0, n.apply(null, r)) : null
                        }
                    t.messageMap[o].push(a),
                    t.messageCount++
                }
        }
        var t = this;
        this.name = e,
        this.messageMap = {},
        this.messageCount = 0,
        this.subscribe = function (e, r) {
            if (!typeof e == "string") n(e, r);
            else {
                var i = t.messageMap[e];
                i == null && (t.messageMap[e] = []),
                t.messageMap[e].push(r),
                t.messageCount++
            }
        },
        this.unsubscribe = function (e) {
            var n = t.messageMap[e];
            n != null && (t.messageMap[e] = null, delete t.messageMap[e], t.messageCount--)
        },
        this.publish = function (e, n, r) {
            var i = t.messageMap[e];
            if (i != null) for (var s = 0; s < i.length; s++) r ?
            function (e, t) {
                setTimeout(function () {
                    e(t)
                }, 10)
            }(i[s], n) : i[s](n)
        }
    }
    function getDistance(e, t) {
        var n = t.x - e.x,
            r = t.y - e.y;
        return Math.sqrt(n * n + r * r)
    }
    function getElementsBound(e) {
        var t = {
            left: Number.MAX_VALUE,
            right: Number.MIN_VALUE,
            top: Number.MAX_VALUE,
            bottom: Number.MIN_VALUE
        };
        for (var n = 0; n < e.length; n++) {
            var r = e[n];
            if (r instanceof JTopo.Link) continue;
            t.left > r.x && (t.left = r.x, t.leftNode = r),
            t.right < r.x + r.width && (t.right = r.x + r.width, t.rightNode = r),
            t.top > r.y && (t.top = r.y, t.topNode = r),
            t.bottom < r.y + r.height && (t.bottom = r.y + r.height, t.bottomNode = r)
        }
        return t.width = t.right - t.left,
        t.height = t.bottom - t.top,
        t
    }
    function mouseCoords(e) {
        return e = cloneEvent(e),
        e.pageX || e.pageY ? (e.x = e.pageX, e.y = e.pageY) : (e.x = e.clientX + document.body.scrollLeft - document.body.clientLeft, e.y = e.clientY + document.body.scrollTop - document.body.clientTop),
        e
    }
    function getEventPosition(e) {
        return e = cloneEvent(e) || mouseCoords(window.event),
        e.x = document.body.scrollLeft + (e.x || e.layerX),
        e.y = document.body.scrollTop + (e.y || e.layerY),
        JTopo.util.isIE && (e.x += document.documentElement.scrollLeft, e.y += document.documentElement.scrollTop),
        e
    }
    function rotatePoint(e, t, n, r, i) {
        var s = n - e,
            o = r - t,
            u = Math.sqrt(s * s + o * o),
            a = Math.atan2(o, s) + i;
        return {
                x: e + Math.cos(a) * u,
                y: t + Math.sin(a) * u
            }
    }
    function rotatePoints(e, t, n) {
        var r = [];
        for (var i = 0; i < t.length; i++) {
            var s = rotatePoint(e.x, e.y, t[i].x, t[i].y, n);
            r.push(s)
        }
        return r
    }
    function $foreach(e, t, n) {
        function i(r) {
            if (r == e.length) return;
            t(e[r]),
            setTimeout(function () {
                i(++r)
            }, n)
        }
        if (e.length == 0) return;
        var r = 0;
        i(r)
    }
    function $for(e, t, n, r) {
        function s(e) {
            if (e == t) return;
            n(t),
            setTimeout(function () {
                s(++e)
            }, r)
        }
        if (t < e) return;
        var i = 0;
        s(i)
    }
    function cloneEvent(e) {
        var t = {};
        for (var n in e) {
            if (n == "returnValue" || n == "keyLocation") continue;
            t[n] = e[n]
        }
        return t
    }
    function clone(e) {
        var t = {};
        for (var n in e) t[n] = e[n];
        return t
    }
    function isPointInRect(e, t) {
        var n = t.x,
            r = t.y,
            i = t.width,
            s = t.height;
        return e.x > n && e.x < n + i && e.y > r && e.y < r + s
    }
    function isPointInLine(e, t, n) {
        var r = JTopo.util.getDistance(t, n),
            i = JTopo.util.getDistance(t, e),
            s = JTopo.util.getDistance(n, e),
            o = Math.abs(i + s - r) <= .5;
        return o
    }
    function removeFromArray(e, t) {
        for (var n = 0; n < e.length; n++) {
            var r = e[n];
            if (r === t) {
                e = e.del(n);
                break
            }
        }
        return e
    }
    function randomColor() {
        return Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255)
    }
    function isIntsect(e, t) {}
    function getProperties(e, t) {
        var n = "";
        for (var r = 0; r < t.length; r++) {
            r > 0 && (n += ",");
            var i = e[t[r]];
            typeof i == "string" ? i = '"' + i + '"' : i == undefined && (i = null),
            n += t[r] + ":" + i + ""
        }
        return n
    }
    function loadStageFromJson(json, canvas) {
        var obj = eval(json),
            stage = new JTopo.Stage(canvas);
        for (var k in stageObj) {
                if (k == "scenes") {
                    var scenes = obj.scenes;
                    for (var i = 0; i < scenes.length; i++) {
                        var sceneObj = scenes[i],
                            scene = new JTopo.Scene(stage);
                        for (var p in sceneObj) {
                                if (p == "elements") {
                                    var nodeMap = {},
                                        elements = sceneObj.elements;
                                    for (var m = 0; m < elements.length; m++) {
                                            var elementObj = elements[m],
                                                type = elementObj.elementType,
                                                element;
                                            type == "Node" && (element = new JTopo.Node);
                                            for (var mk in elementObj) element[mk] = elementObj[mk];
                                            nodeMap[element.text] = element,
                                            scene.add(element)
                                        }
                                    continue
                                }
                                scene[p] = sceneObj[p]
                            }
                    }
                    continue
                }
                stage[k] = obj[k]
            }
        return console.log(stage),
        stage
    }
    function toJson(e) {
        var t = "backgroundColor,visible,mode,rotate,alpha,scaleX,scaleY,shadow,translateX,translateY,areaSelect,paintAll".split(","),
            n = "text,elementType,x,y,width,height,visible,alpha,rotate,scaleX,scaleY,fillColor,shadow,transformAble,zIndex,dragable,selected,showSelected,font,fontColor,textPosition,textOffsetX,textOffsetY".split(","),
            r = "{";
        r += "frames:" + e.frames,
        r += ", scenes:[";
        for (var i = 0; i < e.scenes.length; i++) {
                var s = e.scenes[i];
                r += "{",
                r += getProperties(s, t),
                r += ", elements:[";
                for (var o = 0; o < s.elements.length; o++) {
                    var u = s.elements[o];
                    o > 0 && (r += ","),
                    r += "{",
                    r += getProperties(u, n),
                    r += "}"
                }
                r += "]}"
            }
        return r += "]",
        r += "}",
        r
    }
    function changeColor(e, t, n, r, i) {
        var s = canvas.width = t.width,
            o = canvas.height = t.height;
        e.clearRect(0, 0, canvas.width, canvas.height),
        e.drawImage(t, 0, 0);
        var u = e.getImageData(0, 0, t.width, t.height),
            a = u.data;
        for (var f = 0; f < s; f++) for (var l = 0; l < o; l++) {
                var c = (f + l * s) * 4;
                a[c + 3] != 0 && (n != null && (a[c + 0] += n), r != null && (a[c + 1] += r), i != null && (a[c + 2] += i))
            }
        e.putImageData(u, 0, 0, 0, 0, t.width, t.height);
        var h = canvas.toDataURL();
        return alarmImageCache[t.src] = h,
        h
    }
    function genImageAlarm(e) {
        try {
            if (alarmImageCache[e.src]) return alarmImageCache[e.src];
            var t = new Image;
            return t.src = changeColor(graphics, e, 255),
            alarmImageCache[e.src] = t,
            t
        } catch (n) {}
        return null
    }

    function changeNodeStatusGreenColor(e, t, n, r, i) {
        var s = canvas.width = t.width,
            o = canvas.height = t.height;
        e.clearRect(0, 0, canvas.width, canvas.height),
            e.drawImage(t, 0, 0);
        var u = e.getImageData(0, 0, t.width, t.height),
            a = u.data;
        for (var f = 0; f < s; f++) for (var l = 0; l < o; l++) {
            var c = (f + l * s) * 4;
            a[c + 3] != 0 && (n != null && (a[c + 0] += n), r != null && (a[c + 1] += r), i != null && (a[c + 2] += i))
        }
        e.putImageData(u, 0, 0, 0, 0, t.width, t.height);
        var h = canvas.toDataURL();
        return nodeStatusGreenImageCache[t.src] = h,
            h
    }
    function genImageNodeStatusGreen(e) {
        try {
            if (nodeStatusGreenImageCache[e.src]) return nodeStatusGreenImageCache[e.src];
            var t = new Image;
            return t.src = changeNodeStatusGreenColor(graphics, e, 0,255,0),
                nodeStatusGreenImageCache[e.src] = t,
                t
        } catch (n) {}
        return null
    }

    function changeNodeStatusOrangeColor(e, t, n, r, i) {
        var s = canvas.width = t.width,
            o = canvas.height = t.height;
        e.clearRect(0, 0, canvas.width, canvas.height),
            e.drawImage(t, 0, 0);
        var u = e.getImageData(0, 0, t.width, t.height),
            a = u.data;
        for (var f = 0; f < s; f++) for (var l = 0; l < o; l++) {
            var c = (f + l * s) * 4;
            a[c + 3] != 0 && (n != null && (a[c + 0] += n), r != null && (a[c + 1] += r), i != null && (a[c + 2] += i))
        }
        e.putImageData(u, 0, 0, 0, 0, t.width, t.height);
        var h = canvas.toDataURL();
        return nodeStatusOrangeImageCache[t.src] = h,
            h
    }
    function genImageNodeStatusOrange(e) {
        try {
            if (nodeStatusOrangeImageCache[e.src]) return nodeStatusOrangeImageCache[e.src];
            var t = new Image;
            return t.src = changeNodeStatusOrangeColor(graphics, e, 255,165,0),
                nodeStatusOrangeImageCache[e.src] = t,
                t
        } catch (n) {}
        return null
    }

    function changeNodeStatusRedColor(e, t, n, r, i) {
        var s = canvas.width = t.width,
            o = canvas.height = t.height;
        e.clearRect(0, 0, canvas.width, canvas.height),
            e.drawImage(t, 0, 0);
        var u = e.getImageData(0, 0, t.width, t.height),
            a = u.data;
        for (var f = 0; f < s; f++) for (var l = 0; l < o; l++) {
            var c = (f + l * s) * 4;
            a[c + 3] != 0 && (n != null && (a[c + 0] += n), r != null && (a[c + 1] += r), i != null && (a[c + 2] += i))
        }
        e.putImageData(u, 0, 0, 0, 0, t.width, t.height);
        var h = canvas.toDataURL();
        return nodeStatusRedImageCache[t.src] = h,
            h
    }
    function genImageNodeStatusRed(e) {
        try {
            if (nodeStatusRedImageCache[e.src]) return nodeStatusRedImageCache[e.src];
            var t = new Image;
            return t.src = changeNodeStatusRedColor(graphics, e, 255,0,0),
                nodeStatusRedImageCache[e.src] = t,
                t
        } catch (n) {}
        return null
    }

    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame ||
    function (e) {
        setTimeout(e, 1e3 / 24)
    },
    Array.prototype.del = function (e) {
        if (typeof e != "number") {
            for (var t = 0; t < this.length; t++) if (this[t] === e) return this.slice(0, t).concat(this.slice(t + 1, this.length));
            return this
        }
        return e < 0 ? this : this.slice(0, e).concat(this.slice(e + 1, this.length))
    },
    [].indexOf || (Array.prototype.indexOf = function (e) {
        for (var t = 0; t < this.length; t++) if (this[t] === e) return t;
        return -1
    }),
    window.console || (window.console = {
        log: function (e) {},
        info: function (e) {},
        debug: function (e) {},
        warn: function (e) {},
        error: function (e) {}
    });
    var canvas = document.createElement("canvas"),
        graphics = canvas.getContext("2d"),
        nodeStatusRedImageCache = {},
        nodeStatusOrangeImageCache = {},
        nodeStatusGreenImageCache = {},
        alarmImageCache = {};
    JTopo.util = {
            rotatePoint: rotatePoint,
            rotatePoints: rotatePoints,
            getDistance: getDistance,
            getEventPosition: getEventPosition,
            mouseCoords: mouseCoords,
            MessageBus: MessageBus,
            isFirefox: navigator.userAgent.indexOf("Firefox") > 0,
            isIE: !! window.attachEvent && navigator.userAgent.indexOf("Opera") === -1,
            clone: clone,
            isPointInRect: isPointInRect,
            isPointInLine: isPointInLine,
            removeFromArray: removeFromArray,
            cloneEvent: cloneEvent,
            randomColor: randomColor,
            isIntsect: isIntsect,
            toJson: toJson,
            loadStageFromJson: loadStageFromJson,
            getElementsBound: getElementsBound,
            genImageNodeStatusRed: genImageNodeStatusRed,
            genImageNodeStatusOrange: genImageNodeStatusOrange,
            genImageNodeStatusGreen: genImageNodeStatusGreen,
            genImageAlarm: genImageAlarm
        },
    window.$for = $for,
    window.$foreach = $foreach
}(JTopo),


function (e, t) {
    function n(e) {
        return {
            hgap: 16,
            visible: !1,
            exportCanvas: t('<canvas style="display:none;"></canvas>')[0],
            getImage: function (t, n) {
                var r = e.getBound(),
                    i = 1,
                    s = 1;
                this.exportCanvas.width = e.canvas.width,
                this.exportCanvas.height = e.canvas.height,
                t != null && n != null ? (this.exportCanvas.width = t, this.exportCanvas.height = n, i = t / r.width, s = n / r.height) : (r.width > e.canvas.width && (this.exportCanvas.width = r.width), r.height > e.canvas.height && (this.exportCanvas.height = r.height));
                var o = this.exportCanvas.getContext("2d");
                return e.scenes.length > 0 && (o.save(), o.clearRect(0, 0, this.exportCanvas.width, this.exportCanvas.height), e.scenes.forEach(function (e) {
                        e.visible == 1 && (e.save(), e.translateX = 0, e.translateY = 0, e.scaleX = 1, e.scaleY = 1, o.scale(i, s), r.left < 0 && (e.translateX = Math.abs(r.left)), r.top < 0 && (e.translateY = Math.abs(r.top)), e.paintAll = !0, e.repaint(o), e.paintAll = !1, e.restore())
                    }), o.restore()),
                this.exportCanvas.toDataURL("image/png")
            },
            canvas: t('<canvas style="display:none;"></canvas>')[0],
            update: function () {
                this.eagleImageDatas = this.getData(e)
            },
            setSize: function (e, t) {
                this.width = this.canvas.width = e,
                this.height = this.canvas.height = t
            },
            getData: function (t, n) {
                f != null && l != null ? this.setSize(t, n) : this.setSize(200, 160);
                var r = this.canvas.getContext("2d");
                if (e.scenes.length > 0) {
                    r.save(),
                    r.clearRect(0, 0, this.canvas.width, this.canvas.height),
                    e.scenes.forEach(function (e) {
                        e.visible == 1 && (e.save(), e.centerAndZoom(null, null, r), e.repaint(r), e.restore())
                    });

                    function i(e) {
                        var t = e.stage.canvas.width,
                            n = e.stage.canvas.height,
                            r = t / e.scaleX / 2,
                            i = n / e.scaleY / 2;
                        return {
                                translateX: e.translateX + r - r * e.scaleX,
                                translateY: e.translateY + i - i * e.scaleY
                            }
                    }
                    var s = i(e.scenes[0]),
                        o = s.translateX * this.canvas.width / e.canvas.width * e.scenes[0].scaleX,
                        u = s.translateY * this.canvas.height / e.canvas.height * e.scenes[0].scaleY,
                        a = e.getBound(),
                        f = e.canvas.width / e.scenes[0].scaleX / a.width,
                        l = e.canvas.height / e.scenes[0].scaleY / a.height;
                    f > 1 && (f = 1),
                    l > 1 && (f = 1),
                    o *= f,
                    u *= l,
                    a.left < 0 && (o -= Math.abs(a.left) * (this.width / a.width)),
                    a.top < 0 && (u -= Math.abs(a.top) * (this.height / a.height)),
                    r.save(),
                    r.lineWidth = 1,
                    r.strokeStyle = "rgba(255,0,0,1)",
                    r.strokeRect(-o, -u, r.canvas.width * f, r.canvas.height * l),
                    r.restore();
                    var c = null;
                    try {
                            c = r.getImageData(0, 0, r.canvas.width, r.canvas.height)
                        } catch (h) {}
                    return c
                }
                return null
            },
            paint: function () {
                if (this.eagleImageDatas != null) {
                    var t = e.graphics;
                    t.save(),
                    t.fillStyle = "rgba(211,211,211,0.3)",
                    t.fillRect(e.canvas.width - this.canvas.width - this.hgap * 2, e.canvas.height - this.canvas.height - 1, e.canvas.width - this.canvas.width, this.canvas.height + 1),
                    t.fill(),
                    t.putImageData(this.eagleImageDatas, e.canvas.width - this.canvas.width - this.hgap, e.canvas.height - this.canvas.height),
                    t.restore()
                } else this.eagleImageDatas = this.getData(e)
            },
            eventHandler: function (e, t, n) {
                var r = t.x,
                    i = t.y;
                if (r > n.canvas.width - this.canvas.width && i > n.canvas.height - this.canvas.height) {
                        r = t.x - this.canvas.width,
                        i = t.y - this.canvas.height,
                        "mousedown" == e && (this.lastTranslateX = n.scenes[0].translateX, this.lastTranslateY = n.scenes[0].translateY);
                        if ("mousedrag" == e && n.scenes.length > 0) {
                            var s = t.dx,
                                o = t.dy,
                                u = n.getBound(),
                                a = this.canvas.width / n.scenes[0].scaleX / u.width,
                                f = this.canvas.height / n.scenes[0].scaleY / u.height;
                            n.scenes[0].translateX = this.lastTranslateX - s / a,
                            n.scenes[0].translateY = this.lastTranslateY - o / f
                        }
                        return
                    }
            }
        }
    }
    function r(r) {
        function o(t) {
            var n = e.util.getEventPosition(t),
                r = i.$canvas.offset();
            return n.offsetLeft = n.x - r.left,
            n.offsetTop = n.y - r.top,
            n.x = n.offsetLeft,
            n.y = n.offsetTop,
            n.target = null,
            n
        }
        function u(e) {
            s = !1,
            document.onselectstart = function () {
                return !1
            },
            this.mouseOver = !0;
            var t = o(e);
            i.dispatchEventToScenes("mouseover", t),
            i.dispatchEvent("mouseover", t)
        }
        function a(e) {
            s = !0,
            document.onselectstart = function () {
                return !0
            };
            var t = o(e);
            i.dispatchEventToScenes("mouseout", t),
            i.dispatchEvent("mouseout", t),
            i.animate == 0 ? i.needRepaint = !1 : i.needRepaint = !0
        }
        function f(e) {
            var t = o(e);
            i.mouseDown = !0,
            i.mouseDownX = t.x,
            i.mouseDownY = t.y,
            i.dispatchEventToScenes("mousedown", t),
            i.dispatchEvent("mousedown", t)
        }
        function l(e) {
            var t = o(e);
            i.dispatchEventToScenes("mouseup", t),
            i.dispatchEvent("mouseup", t),
            i.mouseDown = !1,
            i.animate == 0 ? i.needRepaint = !1 : i.needRepaint = !0
        }
        function c(e) {
            var t = o(e);
            i.mouseDown ? e.button == 0 && (t.dx = t.x - i.mouseDownX, t.dy = t.y - i.mouseDownY, i.dispatchEventToScenes("mousedrag", t), i.dispatchEvent("mousedrag", t), i.eagleEye.visible == 1 && i.eagleEye.update()) : (i.dispatchEventToScenes("mousemove", t), i.dispatchEvent("mousemove", t))
        }
        function h(e) {
            var t = o(e);
            i.dispatchEventToScenes("click", t),
            i.dispatchEvent("click", t)
        }
        function p(e) {
            var t = o(e);
            i.dispatchEventToScenes("dbclick", t),
            i.dispatchEvent("dbclick", t)
        }
        function d(e) {
            var t = o(e);
            i.dispatchEventToScenes("mousewheel", t),
            i.dispatchEvent("mousewheel", t),
            i.wheelZoom != null && (e.preventDefault ? e.preventDefault() : (e = e || window.event, e.returnValue = !1), i.eagleEye.visible == 1 && i.eagleEye.update())
        }
        function v(t) {
            e.util.isIE || !window.addEventListener ? (t.onmouseout = a, t.onmouseover = u, t.onmousedown = f, t.onmouseup = l, t.onmousemove = c, t.onclick = h, t.ondblclick = p, t.onmousewheel = d) : (t.addEventListener("mouseout", a), t.addEventListener("mouseover", u), t.addEventListener("mousedown", f), t.addEventListener("mouseup", l), t.addEventListener("mousemove", c), t.addEventListener("click", h), t.addEventListener("dblclick", p), e.util.isFirefox ? t.addEventListener("DOMMouseScroll", d) : t.addEventListener("mousewheel", d)),
            window.addEventListener && (window.addEventListener("keydown", function (t) {
                i.dispatchEventToScenes("keydown", e.util.cloneEvent(t));
                var n = t.keyCode;
                if (n == 37 || n == 38 || n == 39 || n == 40) t.preventDefault ? t.preventDefault() : (t = t || window.event, t.returnValue = !1)
            }, !0), window.addEventListener("keyup", function (t) {
                i.dispatchEventToScenes("keyup", e.util.cloneEvent(t));
                var n = t.keyCode;
                if (n == 37 || n == 38 || n == 39 || n == 40) t.preventDefault ? t.preventDefault() : (t = t || window.event, t.returnValue = !1)
            }, !0))
        }
        e.stage = this;
        var i = this;
        this.initialize = function (r) {
            v(r),
            this.canvas = r,
            this.$canvas = t(r),
            this.graphics = r.getContext("2d"),
            this.scenes = [],
            this.frames = 24,
            this.messageBus = new e.util.MessageBus,
            this.showToolbar = !0,
            this.toolbar = null,
            this.eagleEye = n(this),
            this.wheelZoom = null,
            this.mouseDownX = 0,
            this.mouseDownY = 0,
            this.mouseDown = !1,
            this.mouseOver = !1,
            this.needRepaint = !0,
            this.serializedProperties = ["frames", "wheelZoom"]
        },
        r != null && this.initialize(r);
        var s = !0;
        document.oncontextmenu = function (e) {
            return s
        },
        this.dispatchEventToScenes = function (e, t) {
            this.frames != 0 && (this.needRepaint = !0);
            if (this.showToolbar == 1 && this.toolbar != null) {
                var n = this.toolbar[e + "Handler"];
                if (n == null) throw new Error("从Stage分发事件到Scene出错，Scene对象没有该处理函数:" + e + "Handler");
                n.call(this.toolbar, t)
            }
            if (this.eagleEye.visible == 1 && e.indexOf("mouse") != -1) {
                var r = t.x,
                    s = t.y;
                if (r > this.width - this.eagleEye.width && s > this.height - this.eagleEye.height) {
                        this.eagleEye.eventHandler(e, t, this);
                        return
                    }
            }
            this.scenes.forEach(function (n) {
                if (n.visible == 1) {
                    if (i.showToolbar == 1 && t.y && t.y < 40) return;
                    var r = n[e + "Handler"];
                    if (r == null) throw new Error("从Stage分发事件到Scene出错，Scene对象没有该处理函数:" + e + "Handler");
                    r.call(n, t)
                }
            })
        },
        this.add = function (e) {
            for (var t = 0; t < this.scenes.length; t++) if (this.scenes[t] === e) return;
            e.addTo(this),
            this.scenes.push(e)
        },
        this.remove = function (e) {
            if (e == null) throw new Error("Stage.remove出错: 参数为null!");
            for (var t = 0; t < this.scenes.length; t++) if (this.scenes[t] === e) return e.stage = null,
            this.scenes = this.scenes.del(t),
            this;
            return this
        },
        this.clear = function () {
            this.scenes = []
        },
        this.addEventListener = function (e, t) {
            var n = this,
                r = function (e) {
                    t.call(n, e)
                };
            return this.messageBus.subscribe(e, r),
            this
        },
        this.removeEventListener = function (e) {
            this.messageBus.unsubscribe(e)
        },
        this.removeAllEventListener = function () {
            this.messageBus = new e.util.MessageBus
        },
        this.dispatchEvent = function (e, t) {
            return this.messageBus.publish(e, t),
            this
        };
        var m = "click,dbclick,mousedown,mouseup,mouseover,mouseout,mousemove,mousedrag,mousewheel".split(","),
            g = this;
        m.forEach(function (e) {
                g[e] = function (t) {
                    t != null ? this.addEventListener(e, t) : this.dispatchEvent(e)
                }
            }),
        this.saveImageInfo = function (e, t) {
                var n = this.eagleEye.getImage(e, t),
                    r = window.open("about:blank");
                return r.document.write("<img src='" + n + "' alt='from canvas'/>"),
                this
            },
        this.saveAsLocalImage = function (e, t) {
                var n = this.eagleEye.getImage(e, t);
                return n.replace("image/png", "image/octet-stream"),
                window.location.href = n,
                this
            },
        this.paint = function () {
                if (this.canvas == null) return;
                this.graphics.save(),
                this.graphics.clearRect(0, 0, this.width, this.height),
                this.scenes.forEach(function (e) {
                    e.visible == 1 && e.repaint(i.graphics)
                }),
                this.eagleEye.visible == 1 && this.eagleEye.paint(this),
                this.graphics.restore()
            },
        this.repaint = function () {
                if (this.frames == 0) return;
                if (this.frames < 0 && this.needRepaint == 0) return;
                this.paint(),
                this.frames < 0 && (this.needRepaint = !1)
            },
        this.zoom = function (e) {
                this.scenes.forEach(function (t) {
                    if (t.visible == 0) return;
                    t.zoom(e)
                })
            },
        this.zoomOut = function (e) {
                this.scenes.forEach(function (t) {
                    if (t.visible == 0) return;
                    t.zoomOut(e)
                })
            },
        this.zoomIn = function (e) {
                this.scenes.forEach(function (t) {
                    if (t.visible == 0) return;
                    t.zoomIn(e)
                })
            },
        this.centerAndZoom = function (e) {
                this.scenes.forEach(function (e) {
                    if (e.visible == 0) return;
                    e.centerAndZoom()
                })
            },
        this.setCenter = function (e, t) {
                var n = this;
                this.scenes.forEach(function (r) {
                    var i = e - n.canvas.width / 2,
                        s = t - n.canvas.height / 2;
                    r.translateX = -i,
                    r.translateY = -s
                })
            },
        this.getBound = function () {
                var e = {
                    left: Number.MAX_VALUE,
                    right: Number.MIN_VALUE,
                    top: Number.MAX_VALUE,
                    bottom: Number.MIN_VALUE
                };
                return this.scenes.forEach(function (t) {
                    var n = t.getElementsBound();
                    n.left < e.left && (e.left = n.left, e.leftNode = n.leftNode),
                    n.top < e.top && (e.top = n.top, e.topNode = n.topNode),
                    n.right > e.right && (e.right = n.right, e.rightNode = n.rightNode),
                    n.bottom > e.bottom && (e.bottom = n.bottom, e.bottomNode = n.bottomNode)
                }),
                e.width = e.right - e.left,
                e.height = e.bottom - e.top,
                e
            },
        this.toJson = function () {
                var t = this,
                    n = '{"version":"' + e.version + '",',
                    r = this.serializedProperties.length;
                return this.serializedProperties.forEach(function (e, r) {
                        var i = t[e];
                        typeof i == "string" && (i = '"' + i + '"'),
                        n += '"' + e + '":' + i + ","
                    }),
                n += '"scenes":[',
                this.scenes.forEach(function (e) {
                        n += e.toJson()
                    }),
                n += "]",
                n += "}",
                n
            },


        function () {
                i.frames == 0 ? setTimeout(arguments.callee, 100) : i.frames < 0 ? (i.repaint(), setTimeout(arguments.callee, 1e3 / -i.frames)) : (i.repaint(), setTimeout(arguments.callee, 1e3 / i.frames))
            }(),
        setTimeout(function () {
                i.mousewheel(function (e) {
                    var t = e.wheelDelta == null ? e.detail : e.wheelDelta;
                    this.wheelZoom != null && (t > 0 ? this.zoomIn(this.wheelZoom) : this.zoomOut(this.wheelZoom))
                }),
                i.paint()
            }, 300),
        setTimeout(function () {
                i.paint()
            }, 1e3),
        setTimeout(function () {
                i.paint()
            }, 3e3)
    }
    r.prototype = {
        get width() {
            return this.canvas.width
        },
        get height() {
            return this.canvas.height
        },
        set cursor(e) {
            this.canvas.style.cursor = e
        },
        get cursor() {
            return this.canvas.style.cursor
        },
        set mode(e) {
            this.scenes.forEach(function (t) {
                t.mode = e
            })
        }
    },
    e.Stage = r
}(JTopo, jQuery),


function (e) {
    function t(n) {
        function i(e, t, n, r) {
            return function (i) {
                i.beginPath(),
                i.strokeStyle = "rgba(0,0,236,0.5)",
                i.fillStyle = "rgba(0,0,236,0.1)",
                i.rect(e, t, n, r),
                i.fill(),
                i.stroke(),
                i.closePath()
            }
        }
        var r = this;
        this.initialize = function () {
            t.prototype.initialize.apply(this, arguments),
            this.messageBus = new e.util.MessageBus,
            this.elementType = "scene",
            this.elements = [],
            this.zIndexMap = {},
            this.zIndexArray = [],
            this.backgroundColor = "255,255,255",
            this.visible = !0,
            this.alpha = 0,
            this.scaleX = 1,
            this.scaleY = 1,
            this.mode = e.SceneMode.normal,
            this.translate = !0,
            this.translateX = 0,
            this.translateY = 0,
            this.lastTranslateX = 0,
            this.lastTranslateY = 0,
            this.mouseDown = !1,
            this.mouseDownX = null,
            this.mouseDownY = null,
            this.mouseDownEvent = null,
            this.areaSelect = !0,
            this.operations = [],
            this.selectedElements = [],
            this.paintAll = !1;
            var n = "background,backgroundColor,mode,paintAll,areaSelect,translate,translateX,translateY,lastTranslatedX,lastTranslatedY,alpha,visible,scaleX,scaleY".split(",");
            this.serializedProperties = this.serializedProperties.concat(n)
        },
        this.initialize(),
        this.setBackground = function (e) {
            this.background = e
        },
        this.addTo = function (e) {
            if (this.stage === e || e == null) return;
            this.stage = e
        },
        n != null && (n.add(this), this.addTo(n)),
        this.getElements = function () {
            return this.elements
        },
        this.show = function () {
            this.visible = !0
        },
        this.hide = function () {
            this.visible = !1
        },
        this.paint = function (e) {
            if (this.visible == 0 || this.stage == null) return;
            e.save(),
            this.paintBackgroud(e),
            e.restore(),
            e.save(),
            e.scale(this.scaleX, this.scaleY);
            if (this.translate == 1) {
                var t = this.getOffsetTranslate(e);
                e.translate(t.translateX, t.translateY)
            }
            this.paintElements(e),
            e.restore(),
            e.save(),
            this.paintOperations(e, this.operations),
            e.restore()
        },
        this.repaint = function (e) {
            if (this.visible == 0) return;
            this.paint(e)
        },
        this.paintBackgroud = function (e) {
            this.background != null ? e.drawImage(this.background, 0, 0, e.canvas.width, e.canvas.height) : (e.beginPath(), e.fillStyle = "rgba(" + this.backgroundColor + "," + this.alpha + ")", e.fillRect(0, 0, e.canvas.width, e.canvas.height), e.closePath())
        },
        this.getDisplayedElements = function () {
            var e = [];
            for (var t = 0; t < this.zIndexArray.length; t++) {
                var n = this.zIndexArray[t],
                    r = this.zIndexMap[n];
                for (var i = 0; i < r.length; i++) {
                        var s = r[i];
                        this.isVisiable(s) && e.push(s)
                    }
            }
            return e
        },
        this.getDisplayedNodes = function () {
            var t = [];
            for (var n = 0; n < this.elements.length; n++) {
                var r = this.elements[n];
                if (!(r instanceof e.Node)) continue;
                this.isVisiable(r) && t.push(r)
            }
            return t
        },
        this.paintElements = function (t, n) {
            for (var r = 0; r < this.zIndexArray.length; r++) {
                var i = this.zIndexArray[r],
                    s = this.zIndexMap[i];
                for (var o = 0; o < s.length; o++) {
                        var u = s[o];
                        if (this.paintAll != 1 && !this.isVisiable(u)) continue;
                        t.save();
                        if (u.transformAble == 1) {
                            var a = u.getCenterLocation();
                            t.translate(a.x, a.y),
                            u.rotate && t.rotate(u.rotate),
                            u.scaleX && u.scaleY ? t.scale(u.scaleX, u.scaleY) : u.scaleX ? t.scale(u.scaleX, 1) : u.scaleY && t.scale(1, u.scaleY)
                        }
                        u.shadow == 1 && (t.shadowBlur = u.shadowBlur, t.shadowColor = u.shadowColor, t.shadowOffsetX = u.shadowOffsetX, t.shadowOffsetY = u.shadowOffsetY),
                        u instanceof e.InteractiveElement && (u.selected || u.isMouseOver) && u.showSelected == 1 && u.paintSelected(t),
                        u.paint(t),
                        t.restore()
                    }
            }
        },
        this.getOffsetTranslate = function (e) {
            var t = this.stage.canvas.width,
                n = this.stage.canvas.height;
            e != null && e != "move" && (t = e.canvas.width, n = e.canvas.height);
            var r = t / this.scaleX / 2,
                i = n / this.scaleY / 2,
                s = {
                    translateX: this.translateX + (r - r * this.scaleX),
                    translateY: this.translateY + (i - i * this.scaleY)
                };
            return s
        },
        this.isVisiable = function (t) {
            if (t.visible != 1) return !1;
            if (t instanceof e.Link) return !0;
            var n = this.getOffsetTranslate(),
                r = t.x + n.translateX,
                i = t.y + n.translateY;
            r *= this.scaleX,
            i *= this.scaleY;
            var s = r + t.width * this.scaleX,
                o = i + t.height * this.scaleY;
            return r > this.stage.canvas.width || i > this.stage.canvas.height || s < 0 || o < 0 ? !1 : !0
        },
        this.paintOperations = function (e, t) {
            for (var n = 0; n < t.length; n++) t[n](e)
        },
        this.findElements = function (e) {
            var t = [];
            for (var n = 0; n < this.elements.length; n++) e(this.elements[n]) == 1 && t.push(this.elements[n]);
            return t
        },
        this.getElementsByClass = function (e) {
            return this.findElements(function (t) {
                return t instanceof e
            })
        },
        this.addOperation = function (e) {
            return this.operations.push(e),
            this
        },
        this.clearOperations = function () {
            return this.operations = [],
            this
        },
        this.getElementByXY = function (t, n) {
            var r = null;
            for (var i = this.zIndexArray.length - 1; i >= 0; i--) {
                var s = this.zIndexArray[i],
                    o = this.zIndexMap[s];
                for (var u = o.length - 1; u >= 0; u--) {
                        var a = o[u];
                        if (a instanceof e.InteractiveElement && this.isVisiable(a) && a.isInBound(t, n)) return r = a,
                        r
                    }
            }
            return r
        },
        this.add = function (e) {
            this.elements.push(e),
            this.zIndexMap[e.zIndex] == null && (this.zIndexMap[e.zIndex] = [], this.zIndexArray.push(e.zIndex), this.zIndexArray.sort(function (e, t) {
                return e - t
            })),
            this.zIndexMap["" + e.zIndex].push(e)
        },
        this.remove = function (t) {
            this.elements = e.util.removeFromArray(this.elements, t);
            var n = this.zIndexMap[t.zIndex];
            n && (this.zIndexMap[t.zIndex] = e.util.removeFromArray(n, t))
        },
        this.clear = function () {
            this.elements = [],
            this.operations = [],
            this.zIndexArray = [],
            this.zIndexMap = {}
        },
        this.addToSelected = function (e) {
            this.selectedElements.push(e)
        },
        this.cancleAllSelected = function (e) {
            for (var t = 0; t < this.selectedElements.length; t++) this.selectedElements[t].unselectedHandler(e);
            this.selectedElements = []
        },
        this.notInSelectedNodes = function (e) {
            for (var t = 0; t < this.selectedElements.length; t++) if (e === this.selectedElements[t]) return !1;
            return !0
        },
        this.removeFromSelected = function (e) {
            for (var t = 0; t < this.selectedElements.length; t++) {
                var n = this.selectedElements[t];
                e === n && (this.selectedElements = this.selectedElements.del(t))
            }
        },
        this.toSceneEvent = function (t) {
            var n = e.util.clone(t);
            n.x /= this.scaleX,
            n.y /= this.scaleY;
            if (this.translate == 1) {
                var r = this.getOffsetTranslate();
                n.x -= r.translateX,
                n.y -= r.translateY
            }
            return n.dx != null && (n.dx /= this.scaleX, n.dy /= this.scaleY),
            this.currentElement != null && (n.target = this.currentElement),
            n
        },
        this.selectElement = function (e) {
            var t = r.getElementByXY(e.x, e.y);
            if (t != null) {
                e.target = t,
                t.mousedownHander(e),
                t.selectedHandler(e);
                if (r.notInSelectedNodes(t)) e.ctrlKey || r.cancleAllSelected(),
                r.addToSelected(t);
                else {
                    e.ctrlKey == 1 && (t.unselectedHandler(), this.removeFromSelected(t));
                    for (var n = 0; n < this.selectedElements.length; n++) {
                        var i = this.selectedElements[n];
                        i.selectedHandler()
                    }
                }
            } else e.ctrlKey || r.cancleAllSelected();
            this.currentElement = t
        },
        this.mousedownHandler = function (t) {
            var n = this.toSceneEvent(t);
            this.mouseDown = !0,
            this.mouseDownX = n.x,
            this.mouseDownY = n.y,
            this.mouseDownEvent = n;
            if (this.mode == e.SceneMode.normal) this.selectElement(n),
            (this.currentElement == null || this.currentElement instanceof e.Link) && this.translate == 1 && (this.lastTranslateX = this.translateX, this.lastTranslateY = this.translateY);
            else {
                if (this.mode == e.SceneMode.drag && this.translate == 1) {
                    this.lastTranslateX = this.translateX,
                    this.lastTranslateY = this.translateY;
                    return
                }
                this.mode == e.SceneMode.select && this.selectElement(n)
            }
            r.dispatchEvent("mousedown", n)
        },
        this.mouseupHandler = function (t) {
            this.stage.cursor != e.MouseCursor.normal && (this.stage.cursor = e.MouseCursor.normal),
            r.clearOperations();
            var n = this.toSceneEvent(t);
            this.currentElement != null && (n.target = r.currentElement, this.currentElement.mouseupHandler(n)),
            this.dispatchEvent("mouseup", n),
            this.mouseDown = !1
        },
        this.dragElements = function (t) {
            if (this.currentElement != null && this.currentElement.dragable == 1) for (var n = 0; n < this.selectedElements.length; n++) {
                var r = this.selectedElements[n];
                if (r.dragable == 0) continue;
                var i = r.selectedLocation.x + t.dx,
                    s = r.selectedLocation.y + t.dy;
                r.setLocation(i, s);
                var o = e.util.clone(t);
                o.target = r,
                r.mousedragHandler(o)
            }
        },
        this.mousedragHandler = function (t) {
            var n = this.toSceneEvent(t);
            if (this.mode == e.SceneMode.normal) this.currentElement == null || this.currentElement instanceof e.Link ? this.translate == 1 && (this.stage.cursor = e.MouseCursor.closed_hand, this.translateX = this.lastTranslateX + n.dx, this.translateY = this.lastTranslateY + n.dy) : this.dragElements(n);
            else {
                if (this.mode == e.SceneMode.drag) {
                    this.translate == 1 && (this.stage.cursor = e.MouseCursor.closed_hand, this.translateX = this.lastTranslateX + n.dx, this.translateY = this.lastTranslateY + n.dy);
                    return
                }
                this.mode == e.SceneMode.select && (this.currentElement != null ? this.dragElements(n) : this.areaSelect == 1 && this.areaSelectHandle(n))
            }
            this.dispatchEvent("mousedrag", n)
        },
        this.areaSelectHandle = function (e) {
            var t = e.offsetLeft,
                n = e.offsetTop,
                s = this.mouseDownEvent.offsetLeft,
                o = this.mouseDownEvent.offsetTop,
                u = t >= s ? s : t,
                a = n >= o ? o : n,
                f = Math.abs(e.dx) * this.scaleX,
                l = Math.abs(e.dy) * this.scaleY,
                c = new i(u, a, f, l);
            r.clearOperations().addOperation(c),
            t = e.x,
            n = e.y,
            s = this.mouseDownEvent.x,
            o = this.mouseDownEvent.y,
            u = t >= s ? s : t,
            a = n >= o ? o : n,
            f = Math.abs(e.dx),
            l = Math.abs(e.dy);
            var h = u + f,
                p = a + l;
            for (var d = 0; d < r.elements.length; d++) {
                    var v = r.elements[d];
                    v.x > u && v.x + v.width < h && v.y > a && v.y + v.height < p && r.notInSelectedNodes(v) && (v.selectedHandler(e), r.addToSelected(v))
                }
        },
        this.mousemoveHandler = function (t) {
            this.mousecoord = {
                x: t.x,
                y: t.y
            };
            var n = this.toSceneEvent(t);
            if (this.mode == e.SceneMode.drag) {
                this.stage.cursor = e.MouseCursor.open_hand;
                return
            }
            this.mode == e.SceneMode.normal ? this.stage.cursor = e.MouseCursor.normal : this.mode == e.SceneMode.select && (this.stage.cursor = e.MouseCursor.normal);
            var i = r.getElementByXY(n.x, n.y);
            i != null ? (r.mouseOverelement && r.mouseOverelement !== i && (n.target = i, r.mouseOverelement.mouseoutHandler(n)), r.mouseOverelement = i, i.isMouseOver == 0 ? (n.target = i, i.mouseoverHandler(n), r.dispatchEvent("mouseover", n)) : (n.target = i, i.mousemoveHandler(n), r.dispatchEvent("mousemove", n))) : r.mouseOverelement && (n.target = i, r.mouseOverelement.mouseoutHandler(n), r.mouseOverelement = null, r.dispatchEvent("mouseout", n)),
            r.dispatchEvent("mousemove", n)
        },
        this.mouseoverHandler = function (e) {
            var t = this.toSceneEvent(e);
            this.dispatchEvent("mouseover", t)
        },
        this.mouseoutHandler = function (e) {
            var t = this.toSceneEvent(e);
            this.dispatchEvent("mouseout", t)
        },
        this.clickHandler = function (e) {
            var t = this.toSceneEvent(e);
            this.currentElement && (t.target = this.currentElement, this.currentElement.clickHandler(t)),
            this.dispatchEvent("click", t)
        },
        this.dbclickHandler = function (e) {
            var t = this.toSceneEvent(e);
            this.currentElement ? (t.target = this.currentElement, this.currentElement.dbclickHandler(t)) : r.cancleAllSelected(),
            this.dispatchEvent("dbclick", t)
        },
        this.mousewheelHandler = function (e) {
            var t = this.toSceneEvent(e);
            this.dispatchEvent("mousewheel", t)
        },
        this.keydownHandler = function (e) {
            this.dispatchEvent("keydown", e)
        },
        this.keyupHandler = function (e) {
            this.dispatchEvent("keyup", e)
        },
        this.addEventListener = function (e, t) {
            var n = this,
                r = function (e) {
                    t.call(n, e)
                };
            return this.messageBus.subscribe(e, r),
            this
        },
        this.removeEventListener = function (e) {
            this.messageBus.unsubscribe(e)
        },
        this.removeAllEventListener = function () {
            this.messageBus = new e.util.MessageBus
        },
        this.dispatchEvent = function (e, t) {
            return this.messageBus.publish(e, t),
            this
        };
        var s = "click,dbclick,mousedown,mouseup,mouseover,mouseout,mousemove,mousedrag,mousewheel".split(","),
            o = this;
        return s.forEach(function (e) {
                o[e] = function (t) {
                    t != null ? this.addEventListener(e, t) : this.dispatchEvent(e)
                }
            }),
        this.zoom = function (e, t) {
                e != null && e != 0 && (this.scaleX = e),
                t != null && t != 0 && (this.scaleY = t)
            },
        this.zoomOut = function (e) {
                if (e == 0) return;
                e == null && (e = .8),
                this.scaleX /= e,
                this.scaleY /= e
            },
        this.zoomIn = function (e) {
                if (e == 0) return;
                e == null && (e = .8),
                this.scaleX *= e,
                this.scaleY *= e
            },
        this.getBound = function () {
                return {
                    left: 0,
                    top: 0,
                    right: this.stage.canvas.width,
                    bottom: this.stage.canvas.height,
                    width: this.stage.canvas.width,
                    height: this.stage.canvas.height
                }
            },
        this.getElementsBound = function () {
                return e.util.getElementsBound(this.elements)
            },
        this.translateToCenter = function (e) {
                var t = this.getElementsBound(),
                    n = this.stage.canvas.width / 2 - (t.left + t.right) / 2,
                    r = this.stage.canvas.height / 2 - (t.top + t.bottom) / 2;
                e && (n = e.canvas.width / 2 - (t.left + t.right) / 2, r = e.canvas.height / 2 - (t.top + t.bottom) / 2),
                this.translateX = n,
                this.translateY = r
            },
        this.setCenter = function (e, t) {
                var n = e - this.stage.canvas.width / 2,
                    r = t - this.stage.canvas.height / 2;
                this.translateX = -n,
                this.translateY = -r
            },
        this.centerAndZoom = function (e, t, n) {
                this.translateToCenter(n);
                if (e == null || t == null) {
                    var r = this.getElementsBound(),
                        i = r.right - r.left,
                        s = r.bottom - r.top,
                        o = this.stage.canvas.width / i,
                        u = this.stage.canvas.height / s;
                    n && (o = n.canvas.width / i, u = n.canvas.height / s);
                    var a = Math.min(o, u);
                    if (a > 1) return;
                    this.zoom(a, a)
                }
                this.zoom(e, t)
            },
        this.getCenterLocation = function () {
                return {
                    x: r.stage.canvas.width / 2,
                    y: r.stage.canvas.height / 2
                }
            },
        this.doLayout = function (e) {
                e && e(this, this.elements)
            },
        this.toJson = function () {
                var e = this,
                    t = "{",
                    n = this.serializedProperties.length;
                this.serializedProperties.forEach(function (n, r) {
                        var i = e[n];
                        n == "background" && (i = e._background.src),
                        typeof i == "string" && (i = '"' + i + '"'),
                        t += '"' + n + '":' + i + ","
                    }),
                t += '"elements":[';
                var r = this.elements.length;
                return this.elements.forEach(function (e, n) {
                        t += e.toJson(),
                        n + 1 < r && (t += ",")
                    }),
                t += "]",
                t += "}",
                t
            },
        r
    }
    t.prototype = new e.Element;
    var n = {};
    Object.defineProperties(t.prototype, {
        background: {
            get: function () {
                return this._background
            },
            set: function (e) {
                var t = this;
                if (typeof e == "string") {
                    var r = n[e];
                    r == null && (r = new Image, r.src = e, r.onload = function () {
                        n[e] = r
                    }),
                    this._background = r
                } else this._background = e
            }
        }
    }),
    e.Scene = t
}(JTopo),


function (e) {
    function t() {
        this.initialize = function () {
            t.prototype.initialize.apply(this, arguments),
            this.elementType = "displayElement",
            this.x = 0,
            this.y = 0,
            this.width = 32,
            this.height = 32,
            this.visible = !0,
            this.alpha = 1,
            this.rotate = 0,
            this.scaleX = 1,
            this.scaleY = 1,
            this.strokeColor = "22,124,255",
            this.fillColor = "22,124,255",
            this.shadow = !e.util.isFirefox,
            this.shadowBlur = 5,
            this.shadowColor = "rgba(0,0,0,0.5)",
            this.shadowOffsetX = 3,
            this.shadowOffsetY = 6,
            this.transformAble = !1,
            this.zIndex = 0;
            var n = "x,y,width,height,visible,alpha,rotate,scaleX,scaleY,strokeColor,fillColor,shadow,shadowColor,shadowOffsetX,shadowOffsetY,transformAble,zIndex".split(",");
            this.serializedProperties = this.serializedProperties.concat(n)
        },
        this.initialize(),
        this.paint = function (e) {
            e.beginPath(),
            e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
            e.rect(-this.width / 2, -this.height / 2, this.width, this.height),
            e.fill(),
            e.stroke(),
            e.closePath()
        },
        this.getLocation = function (e, t) {
            return {
                x: this.x,
                y: this.y
            }
        },
        this.setLocation = function (e, t) {
            return this.x = e,
            this.y = t,
            this
        },
        this.getCenterLocation = function () {
            return {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2
            }
        },
        this.setCenterLocation = function (e, t) {
            return this.x = e - this.width / 2,
            this.y = t - this.height / 2,
            this
        },
        this.getSize = function () {
            return {
                width: this.width,
                height: this.heith
            }
        },
        this.setSize = function (e, t) {
            return this.width = e,
            this.height = t,
            this
        },
        this.getBound = function () {
            return {
                left: this.x,
                top: this.y,
                right: this.x + this.width,
                bottom: this.y + this.height,
                width: this.width,
                height: this.height
            }
        },
        this.setBound = function (e, t, n, r) {
            return this.setLocation(e, t),
            this.setSize(n, r),
            this
        },
        this.getDisplayBound = function () {
            return {
                left: this.x,
                top: this.y,
                right: this.x + this.width * this.scaleX,
                bottom: this.y + this.height * this.scaleY
            }
        },
        this.getDisplaySize = function () {
            return {
                width: this.width * this.scaleX,
                height: this.height * this.scaleY
            }
        }
    }
    function n() {
        this.initialize = function () {
            n.prototype.initialize.apply(this, arguments),
            this.elementType = "interactiveElement",
            this.dragable = !1,
            this.selected = !1,
            this.showSelected = !0,
            this.selectedLocation = null,
            this.isMouseOver = !1;
            var e = "dragable,selected,showSelected,isMouseOver".split(",");
            this.serializedProperties = this.serializedProperties.concat(e)
        },
        this.initialize(),
        this.paintSelected = function (e) {
            e.save(),
            e.beginPath(),
            e.strokeStyle = "rgba(168,202,255, 0.9)",
            e.fillStyle = "rgba(168,202,236,0.7)",
            e.rect(-this.width / 2 - 3, -this.height / 2 - 3, this.width + 6, this.height + 6),
            e.fill(),
            e.stroke(),
            e.closePath(),
            e.restore()
        },
        this.isInBound = function (e, t) {
            return e > this.x && e < this.x + this.width * this.scaleX && t > this.y && t < this.y + this.height * this.scaleY
        },
        this.selectedHandler = function () {
            this.selected = !0,
            this.selectedLocation = {
                x: this.x,
                y: this.y
            }
        },
        this.unselectedHandler = function () {
            this.selected = !1,
            this.selectedLocation = null
        },
        this.dbclickHandler = function (e) {
            this.dispatchEvent("dbclick", e)
        },
        this.clickHandler = function (e) {
            this.dispatchEvent("click", e)
        },
        this.mousedownHander = function (e) {
            this.dispatchEvent("mousedown", e)
        },
        this.mouseupHandler = function (e) {
            this.dispatchEvent("mouseup", e)
        },
        this.mouseoverHandler = function (e) {
            this.isMouseOver = !0,
            this.dispatchEvent("mouseover", e)
        },
        this.mousemoveHandler = function (e) {
            this.dispatchEvent("mousemove", e)
        },
        this.mouseoutHandler = function (e) {
            this.isMouseOver = !1,
            this.dispatchEvent("mouseout", e)
        },
        this.mousedragHandler = function (e) {
            this.dispatchEvent("mousedrag", e)
        },
        this.addEventListener = function (t, n) {
            var r = this,
                i = function (e) {
                    n.call(r, e)
                };
            return this.messageBus || (this.messageBus = new e.util.MessageBus),
            this.messageBus.subscribe(t, i),
            this
        },
        this.dispatchEvent = function (e, t) {
            return this.messageBus ? (this.messageBus.publish(e, t), this) : null
        },
        this.removeEventListener = function (e) {
            this.messageBus.unsubscribe(e)
        },
        this.removeAllEventListener = function () {
            this.messageBus = new e.util.MessageBus
        };
        var t = "click,dbclick,mousedown,mouseup,mouseover,mouseout,mousemove,mousedrag".split(","),
            r = this;
        t.forEach(function (e) {
                r[e] = function (t) {
                    t != null ? this.addEventListener(e, t) : this.dispatchEvent(e)
                }
            })
    }
    t.prototype = new e.Element,
    n.prototype = new t,
    e.DisplayElement = t,
    e.InteractiveElement = n
}(JTopo),


function (e) {
    function n(r) {
        this.initialize = function (t) {
            n.prototype.initialize.apply(this, arguments),
            this.elementType = "node",
            this.zIndex = e.zIndex_Node,
            this.text = t,
            this.font = "12px Consolas",
            this.fontColor = "255,255,255",
            this.dragable = !0,
            this.textPosition = "Bottom_Center",
            this.textOffsetX = 0,
            this.textOffsetY = 0,
            this.transformAble = !0;
            var r = "text,font,fontColor,textPosition,textOffsetX,textOffsetY".split(",");
            this.serializedProperties = this.serializedProperties.concat(r)
        },
        this.initialize(r),
        this.paint = function (e) {
            this.image ? e.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height) : (e.beginPath(), e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")", e.rect(-this.width / 2, -this.height / 2, this.width, this.height), e.fill(), e.closePath()),
            this.paintText(e)
        },
        this.paintText = function (e) {
            var t = this.text;
            if (t == null || t == "") return;
            e.beginPath(),
            e.font = this.font;
            var n = e.measureText(t).width,
                r = e.measureText("田").width;
            e.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")";
            var i = this.getTextPostion(this.textPosition, n, r);
            e.fillText(t, i.x, i.y),
            e.closePath()
        },
        this.getTextPostion = function (e, t, n) {
            var r = null;
            return e == null || e == "Bottom_Center" ? r = {
                x: -this.width / 2 + (this.width - t) / 2,
                y: this.height / 2 + n
            } : e == "Top_Center" ? r = {
                x: -this.width / 2 + (this.width - t) / 2,
                y: -this.height / 2 - n / 2
            } : e == "Top_Right" ? r = {
                x: this.width / 2,
                y: -this.height / 2 - n / 2
            } : e == "Top_Left" ? r = {
                x: -this.width / 2 - t,
                y: -this.height / 2 - n / 2
            } : e == "Bottom_Right" ? r = {
                x: this.width / 2,
                y: this.height / 2 + n
            } : e == "Bottom_Left" ? r = {
                x: -this.width / 2 - t,
                y: this.height / 2 + n
            } : e == "Middle_Center" ? r = {
                x: -this.width / 2 + (this.width - t) / 2,
                y: n / 2
            } : e == "Middle_Right" ? r = {
                x: this.width / 2,
                y: n / 2
            } : e == "Middle_Left" && (r = {
                x: -this.width / 2 - t,
                y: n / 2
            }),
            this.textOffsetX != null && (r.x += this.textOffsetX),
            this.textOffsetY != null && (r.y += this.textOffsetY),
            r
        },
//        this.setImage = function (n, r) {
//            if (n == null) throw new Error("Node.setImage(): 参数Image对象为空!");
//            var i = this;
//            if (typeof n == "string") {
//                var s = t[n];
//                s == null ? (s = new Image, s.src = n, s.onload = function () {
//                    t[n] = s,
//                        r == 1 && i.setSize(s.width, s.height);
//                    var o = e.util.genImageAlarm(s);
//                    o && (s.alarm = o)
//                }) : r && this.setSize(s.width, s.height),
//                    this.image = s
//            } else this.image = n,
//                r == 1 && this.setSize(n.width, n.height)
//        }

//        this.setImage = function (n, r) {
//            if (n == null) throw new Error("Node.setImage(): 参数Image对象为空!");
//            var i = this;
//            if (typeof n == "string") {
//                var s = t[n];
//                console.log("s 是啥" + new Date().toLocaleString() + s);
//                s == null ? (s = new Image, s.src = n, s.onload = function () {
//                    t[n] = s,
//                    r == 1 && i.setSize(s.width, s.height);
//                    console.log("s null" + new Date().toLocaleString() + s);
//                    var o = e.util.genImageAlarm(s);
//                    o && (s.alarm = o)
//                }) : r && this.setSize(s.width, s.height),
//                this.image = s, console.log("s 非null" + new Date().toLocaleString() + s)
//            } else this.image = n,
//            r == 1 && this.setSize(n.width, n.height)
//        }

            this.setImage = function (n, r) {
                if (n == null) throw new Error("Node.setImage(): 参数Image对象为空!");
                var i = this;
                if (typeof n == "string") {
                    var s = t[n];
                    s == null ? (s = new Image, s.src = n, s.onload = function () {
                        t[n] = s,
                            r == 1 && i.setSize(s.width, s.height);
                        var o = e.util.genImageAlarm(s);
                        o && (s.alarm = o);
                        var sGreen = e.util.genImageNodeStatusGreen(s);
                        sGreen && (s.statusGreen = sGreen);
                        var sOrange = e.util.genImageNodeStatusOrange(s);
                        sOrange && (s.statusOrange = sOrange);
                        var sRed = e.util.genImageNodeStatusRed(s);
                        sRed && (s.statusRed = sRed)
                    }) : (r && this.setSize(s.width, s.height), s.onload = function () {
                        var o = e.util.genImageAlarm(s);
                        o && (s.alarm = o);
                        var sGreen = e.util.genImageNodeStatusGreen(s);
                        sGreen && (s.statusGreen = sGreen);
                        var sOrange = e.util.genImageNodeStatusOrange(s);
                        sOrange && (s.statusOrange = sOrange);
                        var sRed = e.util.genImageNodeStatusRed(s);
                        sRed && (s.statusRed = sRed)
                    }),
                    this.image = s
                } else this.image = n,
                    r == 1 && this.setSize(n.width, n.height)
            }
    }
    function r(e) {
        r.prototype.initialize.apply(this, arguments)
    }
    function i(e) {
        this.initialize(),
        this.text = e,
        this.elementType = "TextNode",
        this.paint = function (e) {
            e.beginPath(),
            e.font = this.font,
            this.width = e.measureText(this.text).width,
            this.height = e.measureText("田").width,
            e.strokeStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
            e.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
            e.fillText(this.text, -this.width / 2, this.height / 2),
            e.closePath()
        },
        this.paintSelected = function (e) {
            e.save(),
            e.beginPath(),
            e.font = this.font,
            e.strokeStyle = "rgba(168,202,255, 0.9)",
            e.fillStyle = "rgba(168,202,236,0.7)",
            e.rect(-this.width / 2 - 3, -this.height / 2 - 3, this.width + 6, this.height + 6),
            e.fill(),
            e.stroke(),
            e.closePath(),
            e.restore()
        }
    }
    function s(e, t, n) {
        this.initialize(),
        this.text = e,
        this.href = t,
        this.target = n,
        this.elementType = "LinkNode",
        this.isVisited = !1,
        this.visitedColor = null,
        this.paint = function (e) {
            e.beginPath(),
            e.font = this.font,
            this.width = e.measureText(this.text).width,
            this.height = e.measureText("田").width,
            this.isVisited && this.visitedColor != null ? (e.strokeStyle = "rgba(" + this.visitedColor + ", " + this.alpha + ")", e.fillStyle = "rgba(" + this.visitedColor + ", " + this.alpha + ")") : (e.strokeStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")", e.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")"),
            e.fillText(this.text, -this.width / 2, this.height / 2),
            this.isMouseOver && (e.moveTo(-this.width / 2, this.height), e.lineTo(this.width / 2, this.height), e.stroke()),
            e.closePath()
        },
        this.paintSelected = function (e) {},
        this.mousemove(function () {
            var e = document.getElementsByTagName("canvas");
            if (e && e.length > 0) for (var t = 0; t < e.length; t++) e[t].style.cursor = "pointer"
        }),
        this.mouseout(function () {
            var e = document.getElementsByTagName("canvas");
            if (e && e.length > 0) for (var t = 0; t < e.length; t++) e[t].style.cursor = "default"
        }),
        this.click(function () {
            this.target == "_blank" ? window.open(this.href) : location = this.href,
            this.isVisited = !0
        })
    }
    function o(e) {
        this.initialize(arguments),
        this._radius = 20,
        this.beginDegree = 0,
        this.endDegree = 2 * Math.PI,
        this.text = e,
        this.paint = function (e) {
            e.save(),
            e.beginPath(),
            e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
            e.arc(0, 0, this.radius, this.beginDegree, this.endDegree, !0),
            e.fill(),
            e.closePath(),
            e.restore(),
            this.paintText(e)
        },
        this.paintSelected = function (e) {
            e.save(),
            e.beginPath(),
            e.strokeStyle = "rgba(168,202,255, 0.9)",
            e.fillStyle = "rgba(168,202,236,0.7)",
            e.arc(0, 0, this.radius + 3, this.beginDegree, this.endDegree, !0),
            e.fill(),
            e.stroke(),
            e.closePath(),
            e.restore()
        }
    }
    function u(e, t, n) {
        this.initialize(),
        this.frameImages = e || [],
        this.frameIndex = 0,
        this.isStop = !0;
        var r = t || 1e3;
        this.repeatPlay = !1;
        var i = this;
        this.nextFrame = function () {
            if (this.isStop) return;
            if (this.frameImages.length == null) return;
            this.frameIndex++;
            if (this.frameIndex >= this.frameImages.length) {
                if (!this.repeatPlay) return;
                this.frameIndex = 0
            }
            this.setImage(this.frameImages[this.frameIndex], n),
            setTimeout(function () {
                i.nextFrame()
            }, r / e.length)
        }
    }
    function a(e, t, n, r, i) {
        this.initialize();
        var s = this;
        this.setImage(e),
        this.frameIndex = 0,
        this.isPause = !0,
        this.repeatPlay = !1;
        var o = r || 1e3;
        i = i || 0,
        this.paint = function (e) {
            if (!this.image) return;
            var t = this.width,
                r = this.height;
            e.save(),
            e.beginPath(),
            e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")";
            var s = (Math.floor(this.frameIndex / n) + i) * r,
                o = Math.floor(this.frameIndex % n) * t;
            e.drawImage(this.image, o, s, t, r, -t / 2, -r / 2, t, r),
            e.fill(),
            e.closePath(),
            e.restore()
        },
        this.nextFrame = function () {
            if (this.isStop) return;
            this.frameIndex++;
            if (this.frameIndex >= t * n) {
                if (!this.repeatPlay) return;
                this.frameIndex = 0
            }
            setTimeout(function () {
                if (s.isStop) return;
                s.nextFrame()
            }, o / (t * n))
        }
    }
    function f() {
        var e = null;
        return arguments.length <= 3 ? e = new u(arguments[0], arguments[1], arguments[2]) : e = new a(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]),
        e.stop = function () {
            e.isStop = !0
        },
        e.play = function () {
            e.isStop = !1,
            e.frameIndex = 0,
            e.nextFrame()
        },
        e
    }
    var t = {};
    n.prototype = new e.InteractiveElement,
    r.prototype = new n,
    i.prototype = new r,
    s.prototype = new i,
    o.prototype = new r,
    Object.defineProperties(o.prototype, {
        radius: {
            get: function () {
                return this._radius
            },
            set: function (e) {
                this._radius = e;
                var t = this.radius * 2,
                    n = this.radius * 2;
                this.width = t,
                this.height = n
            }
        }
    }),
    u.prototype = new r,
    a.prototype = new r,
    f.prototype = new r,
    e.Node = r,
    e.TextNode = i,
    e.LinkNode = s,
    e.CircleNode = o,
    e.AnimateNode = f
}(JTopo),


function (e) {
    function t(n, r, i) {
        this.initialize = function (n, r, i) {
            t.prototype.initialize.apply(this, arguments),
            this.elementType = "link",
            this.zIndex = e.zIndex_Link;
            if (arguments.length == 0) return;
            this.text = i,
            this.nodeA = n,
            this.nodeZ = r,
            this.font = "12px Consolas",
            this.fontColor = "255,255,255",
            this.lineWidth = 2,
            this.lineJoin = "miter",
            this.font = "12px Consolas",
            this.fontColor = "255,255,255",
            this.transformAble = !1;
            var s = "text,font,fontColor,lineWidth,lineJoin".split(",");
            this.serializedProperties = this.serializedProperties.concat(s)
        },
        this.initialize(n, r, i),
        this.paint = function (e) {
            if (!this.nodeA || !this.nodeZ) return;
            var t = this.nodeA;
            e.beginPath(),
            e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
            e.lineWidth = this.lineWidth,
            this.nodeA === this.nodeZ ? e.arc(this.nodeA.x, this.nodeA.y, n.width / 2, 0, 2 * Math.PI) : (e.moveTo(this.nodeA.x + this.nodeA.width / 2, this.nodeA.y + this.nodeA.height / 2), e.lineTo(this.nodeZ.x + this.nodeZ.width / 2, this.nodeZ.y + this.nodeZ.height / 2)),
            e.stroke(),
            e.closePath(),
            this.paintText(e)
        },
        this.paintText = function (e) {
            if (this.text && this.text.length > 0) {
                e.beginPath(),
                e.font = this.font;
                var t = e.measureText(this.text).width,
                    n = e.measureText("田").width;
                e.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
                e.fillText(this.text, this.nodeA.x + (this.nodeZ.x - this.nodeA.x) / 2, this.nodeA.y + (this.nodeZ.y - this.nodeA.y) / 2),
                e.stroke(),
                e.closePath()
            }
        },
        this.paintSelected = function (e) {
            if (!this.nodeA || !this.nodeZ) return;
            var t = this.nodeA;
            e.beginPath(),
            e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
            e.lineWidth = this.lineWidth,
            this.nodeA === this.nodeZ ? e.arc(this.nodeA.x, this.nodeA.y, n.width / 2, 0, 2 * Math.PI) : (e.moveTo(this.nodeA.x + this.nodeA.width / 2, this.nodeA.y + this.nodeA.height / 2), e.lineTo(this.nodeZ.x + this.nodeZ.width / 2, this.nodeZ.y + this.nodeZ.height / 2)),
            e.stroke(),
            e.closePath()
        },
        this.isInBound = function (t, n) {
            var r = this.nodeA.getCenterLocation(),
                i = this.nodeZ.getCenterLocation(),
                s = e.util.isPointInLine({
                    x: t,
                    y: n
                }, r, i);
            return s
        }
    }
    function n(t, r, i, s) {
        this.initialize = function () {
            n.prototype.initialize.apply(this, arguments),
            this.fold = s || "x"
        },
        this.initialize(t, r, i, s),
        this.paint = function (e) {
            if (!this.nodeA || !this.nodeZ) return;
            var t = this.nodeA.getCenterLocation(),
                n = this.nodeZ.getCenterLocation(),
                r = {
                    x: n.x,
                    y: t.y
                };
            this.fold == "y" && (r = {
                    x: t.x,
                    y: n.y
                }),
            e.save(),
            e.beginPath(),
            e.lineJoin = this.lineJoin,
            e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
            e.lineWidth = this.lineWidth,
            e.moveTo(t.x, t.y),
            e.lineTo(r.x, r.y),
            e.lineTo(n.x, n.y),
            e.stroke(),
            e.closePath(),
            e.restore(),
            this.paintText(e)
        },
        this.paintText = function (e) {
            if (this.text && this.text.length > 0) {
                e.font = this.font;
                var t = e.measureText(this.text).width,
                    n = e.measureText("田").width;
                e.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")";
                var r = this.nodeA.getCenterLocation(),
                    i = this.nodeZ.getCenterLocation(),
                    s = {
                        x: i.x,
                        y: r.y
                    };
                this.fold == "y" && (s = {
                        x: r.x,
                        y: i.y
                    });
                var o = s.x - t / 2,
                    u = s.y - n / 2;
                e.fillText(this.text, o, u),
                e.closePath()
            }
        },
        this.paintSelected = function (e) {
            this.paint(e)
        },
        this.isInBound = function (t, n) {
            var r = this.nodeA.getCenterLocation(),
                i = this.nodeZ.getCenterLocation(),
                s = {
                    x: i.x,
                    y: r.y
                };
            this.fold == "y" && (s = {
                    x: r.x,
                    y: i.y
                });
            var o = e.util.isPointInLine({
                    x: t,
                    y: n
                }, r, s) || e.util.isPointInLine({
                    x: t,
                    y: n
                }, i, s);
            return o
        }
    }
    function r(t, n, i) {
        this.initialize = function () {
            r.prototype.initialize.apply(this, arguments),
            this.arrowsSize = 20,
            this.fillArrows = !1
        },
        this.initialize(t, n, i),
        this.paint = function (e) {
            if (!this.nodeA || !this.nodeZ) return;
            e.beginPath(),
            e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
            e.lineWidth = this.lineWidth,
            e.lineJoin = this.lineJoin;
            var t = {
                x: this.nodeA.x + this.nodeA.width / 2,
                y: this.nodeA.y + this.nodeA.height / 2
            },
                n = {
                    x: this.nodeZ.x + this.nodeZ.width / 2,
                    y: this.nodeZ.y + this.nodeZ.height / 2
                },
                r = Math.atan2(t.y - n.y, t.x - n.x);
            n.x = n.x + Math.cos(r) * this.nodeZ.width / 2,
            n.y = n.y + Math.sin(r) * this.nodeZ.height / 2;
            var i = .4,
                s = {
                    x: n.x + Math.cos(r - i) * this.arrowsSize,
                    y: n.y + Math.sin(r - i) * this.arrowsSize
                },
                o = {
                    x: n.x + Math.cos(r + i) * this.arrowsSize,
                    y: n.y + Math.sin(r + i) * this.arrowsSize
                };
            e.moveTo(this.nodeA.x + this.nodeA.width / 2, this.nodeA.y + this.nodeA.height / 2),
            e.lineTo(s.x + (o.x - s.x) / 2, s.y + (o.y - s.y) / 2),
            e.stroke(),
            e.closePath(),
            e.beginPath(),
            e.moveTo(s.x, s.y),
            e.lineTo(n.x, n.y),
            e.lineTo(o.x, o.y),
            e.lineTo(s.x, s.y),
            this.fillArrows == 1 && (e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")", e.fill()),
            e.stroke(),
            e.closePath()
        },
        this.paintSelected = function (e) {
            if (!this.nodeA || !this.nodeZ) return;
            var n = this.nodeA;
            e.beginPath(),
            e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
            e.lineWidth = this.lineWidth,
            this.nodeA === this.nodeZ ? e.arc(this.nodeA.x, this.nodeA.y, t.width / 2, 0, 2 * Math.PI) : (e.moveTo(this.nodeA.x + this.nodeA.width / 2, this.nodeA.y + this.nodeA.height / 2), e.lineTo(this.nodeZ.x + this.nodeZ.width / 2, this.nodeZ.y + this.nodeZ.height / 2)),
            e.stroke(),
            e.closePath()
        },
        this.isInBound = function (t, n) {
            var r = this.nodeA.getCenterLocation(),
                i = this.nodeZ.getCenterLocation(),
                s = e.util.isPointInLine({
                    x: t,
                    y: n
                }, r, i);
            return s
        }
    }
    function i(e, t, n, r) {
        this.initialize = function () {
            i.prototype.initialize.apply(this, arguments),
            this.arrowsSize = 20,
            this.fillArrows = !1,
            this.fold = r || "x"
        },
        this.initialize(e, t, n, r),
        this.paint = function (e) {
            if (!this.nodeA || !this.nodeZ) return;
            var t = this.nodeA.x,
                n = this.nodeA.y,
                r = this.nodeZ.x,
                i = this.nodeZ.y,
                s = t,
                o = n;
            if (t == r || n == i) {
                    e.beginPath(),
                    e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
                    e.lineWidth = this.lineWidth,
                    e.lineJoin = this.lineJoin;
                    var u = {
                        x: this.nodeA.x + this.nodeA.width / 2,
                        y: this.nodeA.y + this.nodeA.height / 2
                    },
                        a = {
                            x: this.nodeZ.x + this.nodeZ.width / 2,
                            y: this.nodeZ.y + this.nodeZ.height / 2
                        },
                        f = Math.atan2(u.y - a.y, u.x - a.x);
                    a.x = a.x + Math.cos(f) * this.nodeZ.width / 2,
                    a.y = a.y + Math.sin(f) * this.nodeZ.height / 2;
                    var l = .4,
                        c = {
                            x: a.x + Math.cos(f - l) * this.arrowsSize,
                            y: a.y + Math.sin(f - l) * this.arrowsSize
                        },
                        h = {
                            x: a.x + Math.cos(f + l) * this.arrowsSize,
                            y: a.y + Math.sin(f + l) * this.arrowsSize
                        };
                    e.lineTo(c.x + (h.x - c.x) / 2, c.y + (h.y - c.y) / 2),
                    e.stroke(),
                    e.closePath(),
                    e.beginPath(),
                    e.moveTo(c.x, c.y),
                    e.lineTo(a.x, a.y),
                    e.lineTo(h.x, h.y),
                    e.lineTo(c.x, c.y),
                    this.fillArrows == 1 && (e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")", e.fill()),
                    e.closePath(),
                    e.stroke()
                } else {
                    this.fold == "x" ? s = t + (r - t) : o = n + (i - n),
                    e.beginPath(),
                    e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
                    e.lineWidth = this.lineWidth,
                    e.lineJoin = this.lineJoin,
                    e.moveTo(t + this.nodeA.width / 2, n + this.nodeA.height / 2),
                    e.lineTo(s + this.nodeA.width / 2, o + this.nodeA.height / 2);
                    var u = {
                        x: s + this.nodeA.width / 2,
                        y: o + this.nodeA.height / 2
                    },
                        a = {
                            x: this.nodeZ.x + this.nodeZ.width / 2,
                            y: this.nodeZ.y + this.nodeZ.height / 2
                        },
                        f = Math.atan2(u.y - a.y, u.x - a.x);
                    a.x = a.x + Math.cos(f) * this.nodeZ.width / 2,
                    a.y = a.y + Math.sin(f) * this.nodeZ.height / 2;
                    var l = .4,
                        c = {
                            x: a.x + Math.cos(f - l) * this.arrowsSize,
                            y: a.y + Math.sin(f - l) * this.arrowsSize
                        },
                        h = {
                            x: a.x + Math.cos(f + l) * this.arrowsSize,
                            y: a.y + Math.sin(f + l) * this.arrowsSize
                        };
                    e.lineTo(c.x + (h.x - c.x) / 2, c.y + (h.y - c.y) / 2),
                    e.stroke(),
                    e.closePath(),
                    e.beginPath(),
                    e.moveTo(c.x, c.y),
                    e.lineTo(a.x, a.y),
                    e.lineTo(h.x, h.y),
                    e.lineTo(c.x, c.y),
                    this.fillArrows == 1 && (e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")", e.fill()),
                    e.stroke(),
                    e.closePath()
                }
        },
        this.paintSelected = function (e) {},
        this.isInBound = function (e, t) {}
    }
    function s(e, t, n) {
        this.initialize = function () {
            i.prototype.initialize.apply(this, arguments),
            this.flexional = {
                direction: "vertical",
                extend: function () {
                    return 20
                }
            }
        },
        this.initialize(e, t, n);
        var r = this.paintText;
        this.paint = function (e) {
            if (!this.nodeA || !this.nodeZ) return;
            var t = this.nodeA.x,
                n = this.nodeA.y,
                i = this.nodeZ.x,
                s = this.nodeZ.y;
            e.beginPath(),
            e.lineJoin = this.lineJoin,
            e.strokeStyle = "rgba(" + this.strokeColor + "," + this.alpha + ")",
            e.lineWidth = this.lineWidth;
            if (t == i || n == s) e.moveTo(this.nodeA.x + this.nodeA.width / 2, this.nodeA.y + this.nodeA.height / 2),
            e.lineTo(this.nodeZ.x + this.nodeZ.width / 2, this.nodeZ.y + this.nodeZ.height / 2);
            else {
                    var o = this.flexional.direction == "horizontal" ? this.flexional.extend() : 0,
                        u = this.flexional.direction == "vertical" ? this.flexional.extend() : 0;
                    o *= i - t > 0 ? 1 : -1,
                    u *= s - n > 0 ? 1 : -1,
                    e.moveTo(t + this.nodeA.width / 2, n + this.nodeA.height / 2),
                    e.lineTo(t + this.nodeA.width / 2 + o, n + this.nodeA.height / 2 + u),
                    e.lineTo(i + this.nodeA.width / 2 - o, s + this.nodeA.height / 2 - u),
                    e.lineTo(i + this.nodeA.width / 2, s + this.nodeA.height / 2)
                }
            e.stroke(),
            e.closePath(),
            r.call(this, e)
        },
        this.paintSelected = function (e) {},
        this.isInBound = function (e, t) {}
    }
    function o(e, t, n) {
        this.initialize = function () {
            i.prototype.initialize.apply(this, arguments)
        },
        this.initialize(e, t, n),
        this.flexional.extend = function () {
            return this.flexional.direction == "horizontal" ? Math.abs(t.x - e.x) / 2 : Math.abs(t.y - e.y) / 2
        },
        this.paintSelected = function (e) {},
        this.isInBound = function (e, t) {}
    }
    t.prototype = new e.InteractiveElement,
    n.prototype = new t,
    r.prototype = new t,
    i.prototype = new t,
    s.prototype = new t,
    o.prototype = new s,
    e.Link = t,
    e.FoldLink = n,
    e.ArrowsLink = r,
    e.ArrowsFoldLink = i,
    e.FlexionalLink = s,
    e.OrthogonalLink = o
}(JTopo),


function (e) {
    function t(n) {
        this.initialize = function () {
            t.prototype.initialize.apply(this, null),
            this.elementType = "container",
            this.zIndex = e.zIndex_Container,
            this.width = 100,
            this.height = 100,
            this.elements = [],
            this.alpha = .5,
            this.dragable = !0,
            this.childDragble = !0,
            this.visible = !0,
            this.fillColor = "10,100,80",
            this.borderColor = "0,255,0",
            this.layout = new e.Layout.AutoBoundLayout
        },
        this.initialize(n),
        this.add = function (e) {
            this.elements.push(e),
            e.dragable = this.childDragble
        },
        this.remove = function (e) {
            for (var t = 0; t < this.elements.length; t++) if (this.elements[t] === e) {
                e.parentContainer = null,
                this.elements = this.elements.del(t),
                e.lastParentContainer = this;
                break
            }
        },
        this.removeAll = function () {
            this.elements = []
        },
        this.setLocation = function (e, t) {
            var n = e - this.x,
                r = t - this.y;
            this.x = e,
            this.y = t;
            for (var i = 0; i < this.elements.length; i++) {
                    var s = this.elements[i];
                    s.setLocation(s.x + n, s.y + r)
                }
        },
        this.doLayout = function (e) {
            e && e(this, this.elements)
        },
        this.paint = function (e) {
            if (!this.visible) return;
            this.layout && this.layout(this, this.elements),
            e.beginPath(),
            e.shadowBlur = 9,
            e.shadowColor = "rgba(0,0,0,0.5)",
            e.shadowOffsetX = 3,
            e.shadowOffsetY = 3,
            e.strokeStyle = "rgba(" + this.borderColor + "," + this.alpha + ")",
            e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")",
            e.rect(this.x, this.y, this.width, this.height),
            e.fill(),
            e.stroke(),
            e.closePath()
        },
        this.paintSelected = function (e) {}
    }
    t.prototype = new e.InteractiveElement,
    e.Container = t
}(JTopo),


function (e) {
    function t(e, t) {
        return function (n) {
            var r = n.elements;
            if (r.length <= 0) return;
            var i = n.getBound(),
                s = r[0],
                o = (i.width - s.width) / t,
                u = (i.height - s.height) / e,
                a = r.length,
                f = 0;
            for (var l = 0; l < e; l++) for (var c = 0; c < t; c++) {
                    var h = r[f++],
                        p = i.left + o / 2 + c * o,
                        d = i.top + u / 2 + l * u;
                    h.setLocation(p, d);
                    if (f >= r.length) return
                }
        }
    }
    function n(e, t) {
        return e == null && (e = 0),
        t == null && (t = 0),


        function (n) {
            var r = n.elements;
            if (r.length <= 0) return;
            var i = n.getBound(),
                s = i.left,
                o = i.top;
            for (var u = 0; u < r.length; u++) {
                    var a = r[u];
                    s + a.width >= i.right && (s = i.left, o += t + a.height),
                    a.setLocation(s, o),
                    s += e + a.width
                }
        }
    }
    function r() {
        return function (e, t) {
            if (t.length > 0) {
                var n = 1e7,
                    r = -1e7,
                    i = 1e7,
                    s = -1e7,
                    o = r - n,
                    u = s - i;
                for (var a = 0; a < t.length; a++) {
                        var f = t[a];
                        f.x <= n && (n = f.x),
                        f.x >= r && (r = f.x),
                        f.y <= i && (i = f.y),
                        f.y >= s && (s = f.y),
                        o = r - n + f.width,
                        u = s - i + f.height
                    }
                e.x = n,
                e.y = i,
                e.width = o,
                e.height = u
            }
        }
    }
    function i(e, t, n, r) {
        return e == null && (e = 0),
        t == null && (t = e),
        n == null && (n = 0, r = 2 * Math.PI),


        function (i) {
            var s = i.elements;
            if (s.length <= 0) return;
            var o = i.getBound(),
                u = o.left + o.width / 2,
                a = o.top + o.height / 2,
                f = n,
                l = (r - n) / s.length;
            for (var c = 0; c < s.length; c++) {
                    var h = s[c],
                        p = u + Math.cos(f) * e,
                        d = a + Math.sin(f) * t;
                    h.setLocation(p, d),
                    f += l
                }
        }
    }
    function s(t) {
        var n = [],
            r = t.filter(function (t) {
                return t instanceof e.Link ? !0 : (n.push(t), !1)
            });
        return t = n.filter(function (e) {
                for (var t = 0; t < r.length; t++) if (r[t].nodeZ === e) return !1;
                return !0
            }),
        t = t.filter(function (e) {
                for (var t = 0; t < r.length; t++) if (r[t].nodeA === e) return !0;
                return !1
            }),
        t
    }
    function o(e) {
        var t = 0,
            n = 0;
        return e.forEach(function (e) {
                t += e.width,
                n += e.height
            }),
        {
                width: t / e.length,
                height: n / e.length
            }
    }
    function u(e, t, n, r) {
        t.x += n,
        t.y += r;
        var i = m(e, t);
        for (var s = 0; s < i.length; s++) u(e, i[s], n, r)
    }
    function a(e, t) {
        function r(t, i) {
            var s = m(e, t);
            n[i] == null && (n[i] = {}, n[i].nodes = [], n[i].childs = []),
            n[i].nodes.push(t),
            n[i].childs.push(s);
            for (var o = 0; o < s.length; o++) r(s[o], i + 1),
            s[o].parent = t
        }
        var n = [];
        return r(t, 0),
        n
    }
    function f(t, n, r) {
        return function (i) {
            function f(s, o) {
                var f = e.Layout.getTreeDeep(s, o),
                    l = a(s, o),
                    c = l["" + f].nodes;
                for (var h = 0; h < c.length; h++) {
                        var p = c[h],
                            d = (h + 1) * (n + 10),
                            v = f * r;
                        t != "down" && (t == "up" ? v = -v : t == "left" ? (d = -f * r, v = (h + 1) * (n + 10)) : t == "right" && (d = f * r, v = (h + 1) * (n + 10))),
                        p.setLocation(d, v)
                    }
                for (var m = f - 1; m >= 0; m--) {
                        var g = l["" + m].nodes,
                            y = l["" + m].childs;
                        for (var h = 0; h < g.length; h++) {
                                var b = g[h],
                                    w = y[h];
                                t == "down" ? b.y = m * r : t == "up" ? b.y = -m * r : t == "left" ? b.x = -m * r : t == "right" && (b.x = m * r);
                                if (w.length > 0) {
                                        if (t == "down" || t == "up") b.x = (w[0].x + w[w.length - 1].x) / 2;
                                        else if (t == "left" || t == "right") b.y = (w[0].y + w[w.length - 1].y) / 2
                                    } else if (h > 0) if (t == "down" || t == "up") b.x = g[h - 1].x + g[h - 1].width + n;
                                else if (t == "left" || t == "right") b.y = g[h - 1].y + g[h - 1].height + n;
                                if (h > 0) if (t == "down" || t == "up") {
                                        if (b.x < g[h - 1].x + g[h - 1].width) {
                                            var E = g[h - 1].x + g[h - 1].width + n,
                                                S = Math.abs(E - b.x);
                                            for (var x = h; x < g.length; x++) u(i.elements, g[x], S, 0)
                                        }
                                    } else if (t == "left" || t == "right") if (b.y < g[h - 1].y + g[h - 1].height) {
                                        var T = g[h - 1].y + g[h - 1].height + n,
                                            N = Math.abs(T - b.y);
                                        for (var x = h; x < g.length; x++) u(i.elements, g[x], 0, N)
                                    }
                            }
                    }
                return
            }
            var s = null;
            if (n == null) {
                s = o(i.elements),
                n = s.width;
                if (t == "left" || t == "right") n = s.width + 10
            }
            r == null && (s == null && (s = o(i.elements)), r = s.height * 2),
            t == null && (t = "down");
            var l = e.Layout.getRootNodes(i.elements);
            if (l.length > 0) {
                f(i.elements, l[0]);
                var c = e.util.getElementsBound(i.elements),
                    h = i.getCenterLocation(),
                    p = h.x - (c.left + c.right) / 2,
                    d = h.y - (c.top + c.bottom) / 2;
                i.elements.forEach(function (t) {
                        t instanceof e.Node && (t.x += p, t.y += d)
                    })
            }
        }
    }
    function i(t, n, r) {
        return function (t) {
            function n(e, t, r) {
                var i = m(e, t);
                if (i.length == 0) return;
                r == null && (r = 200);
                var s = 2 * Math.PI / i.length;
                i.forEach(function (i, o) {
                    var u = t.x + r * Math.cos(s * o),
                        a = t.y + r * Math.sin(s * o);
                    i.setLocation(u, a),
                    n(e, i, r / 2)
                })
            }
            var r = e.Layout.getRootNodes(t.elements);
            if (r.length > 0) {
                n(t.elements, r[0]);
                var i = e.util.getElementsBound(t.elements),
                    s = t.getCenterLocation(),
                    o = s.x - (i.left + i.right) / 2,
                    u = s.y - (i.top + i.bottom) / 2;
                t.elements.forEach(function (t) {
                        t instanceof e.Node && (t.x += o, t.y += u)
                    })
            }
        }
    }
    function l(e, t, n, r, i, s) {
        var o = [];
        for (var u = 0; u < n; u++) for (var a = 0; a < r; a++) o.push({
            x: e + a * i,
            y: t + u * s
        });
        return o
    }
    function c(e, t, n, r, i, s) {
        var o = i ? i : 0,
            u = s ? s : 2 * Math.PI,
            a = u - o,
            f = a / n,
            l = [];
        o += f / 2;
        for (var c = o; c <= u; c += f) {
                var h = e + Math.cos(c) * r,
                    p = t + Math.sin(c) * r;
                l.push({
                        x: h,
                        y: p
                    })
            }
        return l
    }
    function h(e, t, n, r, i, s) {
        var o = s || "bottom",
            u = [];
        if (o == "bottom") {
                var a = e - n / 2 * r + r / 2;
                for (var f = 0; f <= n; f++) u.push({
                    x: a + f * r,
                    y: t + i
                })
            } else if (o == "top") {
                var a = e - n / 2 * r + r / 2;
                for (var f = 0; f <= n; f++) u.push({
                    x: a + f * r,
                    y: t - i
                })
            } else if (o == "right") {
                var a = t - n / 2 * r + r / 2;
                for (var f = 0; f <= n; f++) u.push({
                    x: e + i,
                    y: a + f * r
                })
            } else if (o == "left") {
                var a = t - n / 2 * r + r / 2;
                for (var f = 0; f <= n; f++) u.push({
                    x: e - i,
                    y: a + f * r
                })
            }
        return u
    }
    function p(e, t, n, r, i, s) {
        var o = s || "horizontal",
            u = [],
            a = Math.round(n / 2),
            f = e + r;
        if (o == "horizontal") {
                for (var l = 0; l < a; l++) u.push({
                    x: f + l * r,
                    y: t - i
                });
                for (var l = a; l <= n; l++) u.push({
                    x: f + l * r,
                    y: t + i
                })
            } else o == "vertical";
        return u
    }
    function l(e, t, n, r, i, s) {
        var o = [];
        for (var u = 0; u < n; u++) for (var a = 0; a < r; a++) o.push({
            x: e + a * i,
            y: t + u * s
        });
        return o
    }
    function d(e, t) {
        if (!e.layout) return;
        var n = e.layout,
            r = n.type,
            i = null,
            s = e.getCenterLocation();
        if (r == "star") i = c(s.x, s.y, t.length, e.layout.radius, e.layout.beginDegree, e.layout.endDegree);
        else if (r == "tree") i = h(s.x, s.y, t.length, n.width, n.height, n.direction);
        else {
                if (r != "grid") return;
                i = l(e.x, e.y, n.rows, n.cols, n.horizontal || 0, n.vertical || 0)
            }
        for (var o = 0; o < t.length; o++) t[o].setCenterLocation(i[o].x, i[o].y)
    }
    function v(e, t) {
        for (var n = 0; n < t.length; n++) {
            var r = m(e, t[n]);
            if (r.length > 0) return !1
        }
        return !0
    }
    function m(t, n) {
        var r = [];
        for (var i = 0; i < t.length; i++) t[i] instanceof e.Link && t[i].nodeA === n && r.push(t[i].nodeZ);
        return r
    }
    function g(e, t) {
        var n = m(e, t);
        if (n.length == 0) return null;
        d(t, n);
        if (v(e, n)) return null;
        for (var r = 0; r < n.length; r++) g(e, n[r]);
        return null
    }
    function y(t, n) {
        function a(e, t, n) {
            var a = e.x - t.x,
                f = e.y - t.y;
            o += a * r,
            u += f * r,
            o *= i,
            u *= i,
            u += s,
            t.x += o,
            t.y += u
        }
        function c() {
            if (++f > 150) return;
            for (var e = 0; e < l.length; e++) {
                if (l[e] == t) continue;
                a(t, l[e], l)
            }
            setTimeout(c, 1e3 / 24)
        }
        var r = .01,
            i = .95,
            s = -5,
            o = 0,
            u = 0,
            f = 0,
            l = n.getElementsByClass(e.Node);
        c()
    }
    function b(e, t) {
        function r(e, t, i) {
            var s = m(e, t);
            n < i && (n = i);
            for (var o = 0; o < s.length; o++) r(e, s[o], i + 1)
        }
        var n = 0;
        return r(e, t, 0),
        n
    }
    e.layout = e.Layout = {
        layoutNode: g,
        getNodeChilds: m,
        adjustPosition: d,
        springLayout: y,
        getTreeDeep: b,
        getRootNodes: s,
        GridLayout: t,
        FlowLayout: n,
        AutoBoundLayout: r,
        CircleLayout: i,
        TreeLayout: f
    }
}(JTopo),


function (e) {
    function t() {
        var t = new e.CircleNode;
        return t.radius = 150,
        t.colors = ["#3666B0", "#2CA8E0", "#77D1F6"],
        t.datas = [.3, .3, .4],
        t.titles = ["A", "B", "C"],
        t.paint = function (e) {
            var n = t.radius * 2,
                r = t.radius * 2;
            t.width = n,
            t.height = r;
            var i = 0;
            for (var s = 0; s < this.datas.length; s++) {
                    var o = this.datas[s] * Math.PI * 2;
                    e.save(),
                    e.beginPath(),
                    e.fillStyle = t.colors[s],
                    e.moveTo(0, 0),
                    e.arc(0, 0, this.radius, i, i + o, !1),
                    e.fill(),
                    e.closePath(),
                    e.restore(),
                    e.beginPath(),
                    e.font = this.font;
                    var u = this.titles[s] + ": " + (this.datas[s] * 100).toFixed(2) + "%",
                        a = e.measureText(u).width,
                        f = e.measureText("田").width,
                        l = (i + i + o) / 2,
                        c = this.radius * Math.cos(l),
                        h = this.radius * Math.sin(l);
                    l > Math.PI / 2 && l <= Math.PI ? c -= a : l > Math.PI && l < 2 * Math.PI * 3 / 4 ? c -= a : l > 2 * Math.PI * .75,
                    e.fillStyle = "#FFFFFF",
                    e.fillText(u, c, h),
                    e.moveTo(this.radius * Math.cos(l), this.radius * Math.sin(l)),
                    l > Math.PI / 2 && l < 2 * Math.PI * 3 / 4 && (c -= a),
                    l > Math.PI,
                    e.fill(),
                    e.stroke(),
                    e.closePath(),
                    i += o
                }
        },
        t
    }
    function n() {
        var t = new e.Node;
        return t.showSelected = !1,
        t.width = 250,
        t.height = 180,
        t.colors = ["#3666B0", "#2CA8E0", "#77D1F6"],
        t.datas = [.3, .3, .4],
        t.titles = ["A", "B", "C"],
        t.paint = function (e) {
            var n = 0,
                r = 3,
                i = (this.width - r) / this.datas.length;
            e.save(),
            e.beginPath(),
            e.fillStyle = "#FFFFFF",
            e.strokeStyle = "#FFFFFF",
            e.moveTo(-this.width / 2 - 1, -this.height / 2),
            e.lineTo(-this.width / 2 - 1, this.height / 2 + 3),
            e.lineTo(this.width / 2 + r + 1, this.height / 2 + 3),
            e.stroke(),
            e.closePath(),
            e.restore();
            for (var s = 0; s < this.datas.length; s++) {
                    e.save(),
                    e.beginPath(),
                    e.fillStyle = t.colors[s];
                    var o = this.datas[s],
                        u = s * (i + r) - this.width / 2,
                        a = this.height - o - this.height / 2;
                    e.fillRect(u, a, i, o);
                    var f = "" + parseInt(this.datas[s]),
                        l = e.measureText(f).width,
                        c = e.measureText("田").width;
                    e.fillStyle = "#FFFFFF",
                    e.fillText(f, u + (i - l) / 2, a - c),
                    e.fillText(this.titles[s], u + (i - l) / 2, this.height / 2 + c),
                    e.fill(),
                    e.closePath(),
                    e.restore()
                }
        },
        t
    }
    e.BarChartNode = n,
    e.PieChartNode = t
}(JTopo),


function (e) {
    function t(t, n) {
        var r = null,
            i;
        return {
                stop: function () {
                    return i ? (window.clearInterval(i), r && r.publish("stop"), this) : this
                },
                start: function () {
                    var e = this;
                    return i = setInterval(function () {
                        t.call(e)
                    }, n),
                    this
                },
                onStop: function (t) {
                    return r == null && (r = new e.util.MessageBus),
                    r.subscribe("stop", t),
                    this
                }
            }
    }
    function n(e, n) {
        n = n || {};
        var r = n.gravity || .1,
            i = n.dx || 0,
            s = n.dy || 5,
            o = n.stop,
            u = n.interval || 30,
            a = new t(function () {
                o && o() ? (s = .5, this.stop()) : (s += r, e.setLocation(e.x + i, e.y + s))
            }, u);
        return a
    }
    function r(e, n, r, i, s) {
        var o = 1e3 / 24,
            u = {};
        for (var a in n) {
                var f = n[a],
                    l = f - e[a];
                u[a] = {
                        oldValue: e[a],
                        targetValue: f,
                        step: l / r * o,
                        isDone: function (t) {
                            var n = this.step > 0 && e[t] >= this.targetValue || this.step < 0 && e[t] <= this.targetValue;
                            return n
                        }
                    }
            }
        var c = new t(function () {
                var t = !0;
                for (var r in n) u[r].isDone(r) || (e[r] += u[r].step, t = !1);
                if (t) {
                    if (!i) return this.stop();
                    for (var r in n) if (s) {
                        var o = u[r].targetValue;
                        u[r].targetValue = u[r].oldValue,
                        u[r].oldValue = o,
                        u[r].step = -u[r].step
                    } else e[r] = u[r].oldValue
                }
                return this
            }, o);
        return c
    }
    function i(t, n) {
        function s(n, i, s, o, u) {
            var a = new e.Node;
            return a.setImage(t.image),
            a.setSize(t.width, t.height),
            a.style = r,
            a.setLocation(n, i),
            a.paint = function (e) {
                e.save(),
                e.arc(0, 0, s, o, u),
                e.clip(),
                e.beginPath(),
                this.image != null ? e.drawImage(this.image, -this.width / 2, -this.height / 2) : (e.fillStyle = "rgba(" + this.style.fillStyle + "," + this.alpha + ")", e.rect(this.x, this.y, this.width, this.height), e.fill()),
                e.closePath(),
                e.restore()
            },
            a
        }
        var r = t.style,
            i = n.angle,
            o = i,
            u = i + Math.PI,
            a = s(t.x, t.y, t.width, o, u),
            f = s(t.x, t.y, t.width, o + Math.PI, o);
        return [a, f]
    }
    function s(e) {
        e == null && (e = {});
        var t = e.spring || .1,
            n = e.friction || .8,
            r = e.grivity || 0,
            i = e.wind || 0,
            s = e.minLength || 0;
        return {
                items: [],
                timer: null,
                isPause: !1,
                addNode: function (e, t) {
                    var n = {
                        node: e,
                        target: t,
                        vx: 0,
                        vy: 0
                    };
                    return this.items.push(n),
                    this
                },
                play: function (e) {
                    this.stop(),
                    e = e == null ? 1e3 / 24 : e;
                    var t = this;
                    this.timer = setInterval(function () {
                        t.nextFrame()
                    }, e)
                },
                stop: function () {
                    this.timer != null && window.clearInterval(this.timer)
                },
                nextFrame: function () {
                    for (var e = 0; e < this.items.length; e++) {
                        var i = this.items[e],
                            o = i.node,
                            u = i.target,
                            a = i.vx,
                            f = i.vy,
                            l = u.x - o.x,
                            c = u.y - o.y,
                            h = Math.atan2(c, l);
                        if (s != 0) {
                                var p = u.x - Math.cos(h) * s,
                                    d = u.y - Math.sin(h) * s;
                                a += (p - o.x) * t,
                                f += (d - o.y) * t
                            } else a += l * t,
                        f += c * t;
                        a *= n,
                        f *= n,
                        f += r,
                        o.x += a,
                        o.y += f,
                        i.vx = a,
                        i.vy = f
                    }
                }
            }
    }
    e.Animate = {},
    e.Effect = {},
    e.Animate.gravity = n,
    e.Animate.stepByStep = r,
    e.Effect.splitTwoPiece = i,
    e.Effect.spring = s
}(JTopo),


function (e) {
    function n(e, t) {
        var n = [];
        if (e.length == 0) return n;
        var r = t.match(/^\s*(\w+)\s*$/);
        if (r != null) {
            var i = e.filter(function (e) {
                return e.elementType == r[1]
            });
            i != null && i.length > 0 && (n = n.concat(i))
        } else {
            var s = !1;
            r = t.match(/\s*(\w+)\s*\[\s*(\w+)\s*([>=<])\s*['"](\S+)['"]\s*\]\s*/);
            if (r == null || r.length < 5) r = t.match(/\s*(\w+)\s*\[\s*(\w+)\s*([>=<])\s*(\d+(\.\d+)?)\s*\]\s*/),
            s = !0;
            if (r != null && r.length >= 5) {
                var o = r[1],
                    u = r[2],
                    a = r[3],
                    f = r[4];
                i = e.filter(function (e) {
                        if (e.elementType != o) return !1;
                        var t = e[u];
                        return s == 1 && (t = parseInt(t)),
                        a == "=" ? t == f : a == ">" ? t > f : a == "<" ? t < f : a == "<=" ? t <= f : a == ">=" ? t >= f : a == "!=" ? t != f : !1
                    }),
                i != null && i.length > 0 && (n = n.concat(i))
            }
        }
        return n
    }
    function r(e) {
        e.find = function (e) {
            return i.call(this, e)
        },
        t.forEach(function (t) {
            e[t] = function (e) {
                for (var n = 0; n < this.length; n++) this[n][t](e);
                return this
            }
        });
        if (e.length > 0) {
            var n = e[0];
            for (var r in n) {
                var s = n[r];
                typeof s == "function" &&
                function (t) {
                    e[r] = function () {
                        var n = [];
                        for (var r = 0; r < e.length; r++) n.push(t.apply(e[r], arguments));
                        return n
                    }
                }(s)
            }
        }
        return e.attr = function (e, t) {
            if (e != null && t != null) for (var n = 0; n < this.length; n++) this[n][e] = t;
            else {
                if (e != null && typeof e == "string") {
                    var r = [];
                    for (var n = 0; n < this.length; n++) r.push(this[n][e]);
                    return r
                }
                if (e != null) for (var n = 0; n < this.length; n++) for (var i in e) this[n][i] = e[i]
            }
            return this
        },
        e
    }
    function i(t) {
        var i = [],
            s = [];
        this instanceof e.Stage ? (i = this.scenes, s = s.concat(i)) : this instanceof e.Scene ? i = [this] : s = this,
        i.forEach(function (e) {
                s = s.concat(e.elements)
            });
        var o = null;
        return typeof t == "function" ? o = s.filter(t) : o = n(s, t),
        o = r(o),
        o
    }
//    e.Node.prototype.paint = function (e) {
//        this.image ? this.alarm != null && this.image.alarm != null ? (e.drawImage(this.image.alarm, -this.width / 2, -this.height / 2, this.width, this.height), this.paintAlarmText(e)) : e.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height) : (e.beginPath(), e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")", e.rect(-this.width / 2, -this.height / 2, this.width, this.height), e.fill(), e.closePath()),
//        this.paintText(e)
//    },
    e.Node.prototype.paint = function (e) {
        if (this.image) {
            if (this.alarm != null && this.image.alarm != null) {
//                e.drawImage(this.image.alarm, -this.width / 2, -this.height / 2, this.width, this.height), this.paintAlarmText(e)
                if (this.elStatus == "on" && null != this.image.statusGreen){
                    e.drawImage(this.image.statusGreen, -this.width / 2, -this.height / 2, this.width, this.height);
                } else if (this.elStatus == "green" && null != this.image.statusGreen){
                    e.drawImage(this.image.statusGreen, -this.width / 2, -this.height / 2, this.width, this.height);
                } else if (this.elStatus == "orange" && null != this.image.statusOrange){
                    e.drawImage(this.image.statusOrange, -this.width / 2, -this.height / 2, this.width, this.height);
                } else if (this.elStatus == "red" && null != this.image.statusRed){
                    e.drawImage(this.image.statusRed, -this.width / 2, -this.height / 2, this.width, this.height);
                } else {
                    e.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
                }
                this.paintAlarmText(e)
            } else {
                //e.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)

                if (this.elStatus == "on" && null != this.image.statusGreen){
                    e.drawImage(this.image.statusGreen, -this.width / 2, -this.height / 2, this.width, this.height);
                } else if (this.elStatus == "green" && null != this.image.statusGreen){
                    e.drawImage(this.image.statusGreen, -this.width / 2, -this.height / 2, this.width, this.height);
                } else if (this.elStatus == "orange" && null != this.image.statusOrange){
                    e.drawImage(this.image.statusOrange, -this.width / 2, -this.height / 2, this.width, this.height);
                } else if (this.elStatus == "red" && null != this.image.statusRed){
                    e.drawImage(this.image.statusRed, -this.width / 2, -this.height / 2, this.width, this.height);
                } else {
                    e.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
                }
            }
        } else {
            e.beginPath(), e.fillStyle = "rgba(" + this.fillColor + "," + this.alpha + ")", e.rect(-this.width / 2, -this.height / 2, this.width, this.height), e.fill(), e.closePath()
        }
        this.paintText(e)
    },
    e.Node.prototype.paintAlarmText = function (e) {
        if (this.alarm == "") return;
        e.beginPath(),
        e.font = this.alarmFont || "10px 微软雅黑";
        var t = e.measureText(this.alarm).width + 6,
            n = e.measureText("田").width + 6,
            r = this.width / 2 - t / 2,
            i = -this.height / 2 - n - 8;
//        e.strokeStyle = "rgba(255,0,0, 0.5)",
//        e.fillStyle = "rgba(255,0,0, 0.5)",
        e.strokeStyle = this.alarmStyle,
        e.fillStyle = this.alarmStyle,
        e.lineCap = "round",
        e.lineWidth = 1,
        e.moveTo(r, i),
        e.lineTo(r + t, i),
        e.lineTo(r + t, i + n),
        e.lineTo(r + t / 2 + 6, i + n),
        e.lineTo(r + t / 2, i + n + 8),
        e.lineTo(r + t / 2 - 6, i + n),
        e.lineTo(r, i + n),
        e.lineTo(r, i),
        e.fill(),
        e.stroke(),
        e.closePath(),
        e.beginPath(),
        e.strokeStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
        e.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")",
        e.fillText(this.alarm, r + 2, i + n - 4),
        e.closePath()
    };
    var t = "click,mousedown,mouseup,mouseover,mouseout,mousedrag,keydown,keyup".split(",");
    e.Stage.prototype.find = i,
    e.Scene.prototype.find = i
}(JTopo)