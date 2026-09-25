(function () {
    "use strict";

    var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
    var apiUrl = script?.getAttribute("data-api") || "/api/chat";
    var baslik = script?.getAttribute("data-baslik") || "Toli Asistan";

    var origin = script?.src ? new URL(script.src).origin : window.location.origin;

    if (apiUrl.startsWith("/")) {
        apiUrl = origin + apiUrl;
    }

    var avatarUrl = script?.getAttribute("data-avatar") || origin + "/toli.jpeg";

    var ACCENT = "#c41e24";

    var QUICK = [
        "5 yaşında oğlum için zeka oyunu önerir misin?",
        "Quick Math gerekliliği ve önemi nedir?",
        "Matematik geliştiren oyunlar hangileri?",
        "750 TL üzeri kargo bedava mı?",
        "Pırıl lisanslı oyunlar neler?",
    ];

    var host = document.createElement("div");
    host.id = "toli-asistan-root";
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: "open" });

    var style = document.createElement("style");
    style.textContent =
        ":host{all:initial;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
        ".launcherWrap{position:fixed;right:24px;bottom:24px;z-index:99998}" +
        ".launcherWrap.is-hidden{display:none!important}" +
        ".launcherWrapInner{position:relative;flex-shrink:0}" +
        ".teaser{position:absolute;right:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#fff;color:#1a2744;border:none;border-radius:999px;padding:7px 12px;font-size:12px;line-height:1.2;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.12);white-space:nowrap;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility .18s ease}" +
        ".launcherWrapInner:hover .teaser,.launcherWrapInner:focus-within .teaser{opacity:1;visibility:visible;pointer-events:auto}" +
        ".launcher{width:68px;height:68px;border-radius:50%;padding:0;cursor:pointer;border:2px solid " +
        ACCENT +
        ";overflow:visible;background:#fff;box-shadow:0 10px 30px rgba(196,30,36,.35);display:block;position:relative;box-sizing:border-box;transition:transform .2s ease,box-shadow .2s ease}" +
        ".launcher img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}" +
        ".launcher:hover{transform:scale(1.04);box-shadow:0 12px 34px rgba(196,30,36,.42)}" +
        ".launcherPing{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#c41e24;opacity:.45;animation:toliPing 1.6s cubic-bezier(0,0,.2,1) infinite;pointer-events:none}" +
        ".launcherDot{position:absolute;top:2px;right:2px;width:10px;height:10px;background:#c41e24;border:2px solid #fff;border-radius:50%;z-index:1}" +
        "@keyframes toliPing{0%{transform:scale(1);opacity:.5}75%,100%{transform:scale(2.2);opacity:0}}" +
        ".panel{position:fixed;right:24px;bottom:24px;left:auto;width:min(420px,calc(100vw - 32px));height:min(650px,calc(100vh - 32px));z-index:99999;background:#f7f7f8;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden;border:none}" +
        ".panel.open{display:flex}" +
        ".head{background:" +
        ACCENT +
        ";color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}" +
        ".headTitle{display:flex;align-items:center;gap:10px;min-width:0}" +
        ".headTitle img{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.35);flex-shrink:0}" +
        ".headMeta{min-width:0}" +
        ".head strong{font-size:15px;font-weight:600;display:block}" +
        ".headSub{font-size:12px;color:rgba(255,255,255,.72);display:flex;align-items:center;gap:6px;margin-top:2px}" +
        ".onlineDot{width:7px;height:7px;border-radius:50%;background:#4ade80;flex-shrink:0}" +
        ".close{background:none;border:none;color:#fff;width:auto;height:auto;cursor:pointer;font-size:28px;line-height:1;padding:0 2px;opacity:.92}" +
        ".close:hover{opacity:1}" +
        ".msgs{flex:1 1 auto;min-height:0;overflow:auto;padding:16px 14px;background:#f7f7f8}" +
        ".row{display:flex;margin:10px 0;gap:8px;align-items:flex-end}" +
        ".row.user{justify-content:flex-end}" +
        ".row.bot{justify-content:flex-start;align-items:flex-start}" +
        ".avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-top:2px;border:1px solid #e5e5e5;background:#fff}" +
        ".bubble{max-width:85%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}" +
        ".bubble.user{background:#c41e24;color:#fff;border-bottom-right-radius:6px}" +
        ".bubble.bot{background:#fff;color:#1a1a1a;border:1px solid #ececec;border-bottom-left-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
        ".botCol{display:flex;flex-direction:column;max-width:calc(100% - 36px);gap:8px;min-width:0}" +
        ".welcome .bubble.bot{max-width:100%}" +
        ".welcomeHint{font-size:13px;color:#666;margin:4px 0 10px;line-height:1.45}" +
        ".chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}" +
        ".chip{background:#fff;border:1px solid #e2e2e2;color:#222;border-radius:999px;padding:8px 12px;font-size:12px;line-height:1.35;cursor:pointer;text-align:left;max-width:100%}" +
        ".chip:hover{border-color:#c41e24;color:#c41e24;background:#fff5f5}" +
        ".cards{display:flex;flex-direction:column;gap:8px;width:100%}" +
        ".card{display:flex;gap:10px;background:#fff;border:1px solid #ececec;border-radius:14px;padding:10px;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(0,0,0,.04)}" +
        ".card:hover{border-color:#d8d8d8}" +
        ".card img{width:72px;height:72px;object-fit:contain;border-radius:10px;flex-shrink:0}" +
        ".card h4{margin:0 0 4px;font-size:13px;color:#c41e24;font-weight:600}" +
        ".card p{margin:0;font-size:12px;color:#666;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
        ".priceRow{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:4px}" +
        ".priceOld{font-size:12px;color:#888;text-decoration:line-through}" +
        ".price{font-weight:700;color:#1a1a1a;font-size:13px}" +
        ".priceBadge{font-size:10px;background:" +
        ACCENT +
        ";color:#fff;padding:2px 7px;border-radius:6px;font-weight:600}" +
        ".foot{padding:12px 12px 8px;border-top:1px solid #ececec;display:flex;gap:8px;background:#fff}" +
        ".dipnot{font-size:10.5px;color:#8b93a8;text-align:center;padding:0 12px 10px;background:#fff;flex-shrink:0;line-height:1.35}" +
        ".foot input{flex:1;border:1px solid #ddd;border-radius:999px;padding:11px 14px;font-size:14px;outline:none;background:#fafafa}" +
        ".foot input:focus{border-color:#c41e24;background:#fff}" +
        ".foot button.sendBtn{width:44px;height:44px;min-width:44px;background:" +
        ACCENT +
        ";color:#fff;border:none;border-radius:50%;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}" +
        ".foot button.sendBtn svg{width:18px;height:18px;display:block}" +
        ".foot button:disabled{opacity:.45;cursor:not-allowed}" +
        ".typing{font-size:12px;color:#888;padding:0 16px 8px;background:#f7f7f8}";
    shadow.appendChild(style);

    var launcherWrap = document.createElement("div");
    launcherWrap.className = "launcherWrap";

    var teaser = document.createElement("button");
    teaser.type = "button";
    teaser.className = "teaser";
    teaser.textContent = "Merhaba, ben Toli! Bir sorunuz mu var?";

    var launcherInner = document.createElement("div");
    launcherInner.className = "launcherWrapInner";

    var launcher = document.createElement("button");
    launcher.className = "launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", baslik);
    var launcherImg = document.createElement("img");
    launcherImg.src = avatarUrl;
    launcherImg.alt = baslik;
    launcher.appendChild(launcherImg);
    var ping = document.createElement("span");
    ping.className = "launcherPing";
    ping.setAttribute("aria-hidden", "true");
    var dot = document.createElement("span");
    dot.className = "launcherDot";
    dot.setAttribute("aria-hidden", "true");
    launcherInner.appendChild(teaser);
    launcherInner.appendChild(launcher);
    launcher.appendChild(ping);
    launcher.appendChild(dot);

    launcherWrap.appendChild(launcherInner);

    var panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML =
        '<div class="head">' +
        '<div class="headTitle"><img src="' +
        avatarUrl +
        '" alt="" /><div class="headMeta"><strong>' +
        'Toli</strong><span class="headSub">Toli Games oyun danışmanı</span></div></div>' +
        '<button type="button" class="close" aria-label="Kapat">×</button></div>' +
        '<div class="msgs" id="msgs"></div>' +
        '<div class="typing" id="typing" hidden>Yanıt yazılıyor…</div>' +
        '<div class="foot"><input id="inp" placeholder="Sorunuzu yazın…" autocomplete="off" /><button type="button" id="send" class="sendBtn" aria-label="Gönder"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
        '<p class="dipnot">Yanıtlar toligames.com katalog verisinden üretilir. Satın alma ve resmi işlemler için mağaza sayfasını kullanın.</p>';

    shadow.appendChild(launcherWrap);
    shadow.appendChild(panel);

    var msgsEl = shadow.getElementById("msgs");
    var inp = shadow.getElementById("inp");
    var sendBtn = shadow.getElementById("send");
    var typingEl = shadow.getElementById("typing");
    var closeBtn = shadow.querySelector(".close");

    function truncateExcerpt(text, maxLen) {
        if (!text) return "";
        var t = String(text).replace(/\s+/g, " ").trim();
        if (t.length <= maxLen) return t;
        var cut = t.slice(0, maxLen);
        var lastSpace = cut.lastIndexOf(" ");
        if (lastSpace > maxLen * 0.55) cut = cut.slice(0, lastSpace);
        cut = cut.replace(/[\s,;:.!?-]+$/g, "");
        return cut + "...";
    }

    function sanitizeText(raw) {
        if (!raw) return "";
        var t = raw;
        t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
        t = t.replace(/\*([^*]+)\*/g, "$1");
        t = t.replace(/^#{1,6}\s+/gm, "");
        t = t.replace(/\nKaynak\s*:[^\n]*/gi, "");
        t = t.replace(/^Kaynak\s*:[^\n]*\n?/gim, "");
        t = t.replace(/\bBAĞLAM(?:da|daki)?\b[^.\n]*/gi, "toligames.com mağazamızda");
        t = t.replace(/\bbağlam(?:da|daki)?\b/gi, "mağazamızda");
        return t.replace(/\n{3,}/g, "\n\n").trim();
    }

    function scrollBottom() {
        msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    function showWelcome() {
        var row = document.createElement("div");
        row.className = "row bot welcome";

        var av = document.createElement("img");
        av.className = "avatar";
        av.src = avatarUrl;
        av.alt = "";

        var col = document.createElement("div");
        col.className = "botCol";

        var bubble = document.createElement("div");
        bubble.className = "bubble bot";
        bubble.textContent =
            "Merhaba, ben Toli! Toli Games zeka oyunları, puzzle ve kitaplar hakkında yaşa ve ilgi alanına göre öneri sunabilir; ürün özellikleri ve fiyatları resmi katalog verisinden yanıtlarım.";

        var chips = document.createElement("div");
        chips.className = "chips";
        QUICK.forEach(function (q) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "chip";
            b.textContent = q;
            b.addEventListener("click", function () {
                sendMessage(q);
            });
            chips.appendChild(b);
        });

        col.appendChild(bubble);
        col.appendChild(chips);
        row.appendChild(av);
        row.appendChild(col);
        msgsEl.appendChild(row);
        scrollBottom();
    }

    function openPanel() {
        launcherWrap.classList.add("is-hidden");
        panel.classList.add("open");
        inp.focus();
        if (!msgsEl.dataset.greeted) {
            msgsEl.dataset.greeted = "1";
            showWelcome();
        }
    }

    function closePanel() {
        panel.classList.remove("open");
        launcherWrap.classList.remove("is-hidden");
    }

    launcher.addEventListener("click", openPanel);
    teaser.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);

    function askQuestion(text) {
        openPanel();
        if (text) {
            window.setTimeout(function () {
                sendMessage(text);
            }, 80);
        }
    }

    window.ToliAsistan = {
        open: openPanel,
        close: closePanel,
        ask: askQuestion,
    };

    function appendUser(text) {
        var row = document.createElement("div");
        row.className = "row user";
        var bubble = document.createElement("div");
        bubble.className = "bubble user";
        bubble.textContent = text;
        row.appendChild(bubble);
        msgsEl.appendChild(row);
        scrollBottom();
    }

    function createBotRow() {
        var row = document.createElement("div");
        row.className = "row bot";
        var av = document.createElement("img");
        av.className = "avatar";
        av.src = avatarUrl;
        av.alt = "";
        var col = document.createElement("div");
        col.className = "botCol";
        var bubble = document.createElement("div");
        bubble.className = "bubble bot";
        col.appendChild(bubble);
        row.appendChild(av);
        row.appendChild(col);
        msgsEl.appendChild(row);
        scrollBottom();
        return { bubble: bubble, col: col };
    }

    function renderCards(container, items) {
        if (!items || !items.length) return;
        var wrap = document.createElement("div");
        wrap.className = "cards";
        items.forEach(function (p) {
            var a = document.createElement("a");
            a.className = "card";
            a.href = p.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            var img = document.createElement("img");
            img.src = p.gorsel || "";
            img.alt = p.ad;
            img.onerror = function () {
                img.style.display = "none";
            };
            var body = document.createElement("div");
            var h = document.createElement("h4");
            h.textContent = p.ad;
            var priceRow = document.createElement("div");
            priceRow.className = "priceRow";
            if (p.fiyat_liste && p.indirim_yuzde) {
                var oldP = document.createElement("span");
                oldP.className = "priceOld";
                oldP.textContent = p.fiyat_liste;
                var curP = document.createElement("span");
                curP.className = "price";
                curP.textContent = p.fiyat || "";
                var badge = document.createElement("span");
                badge.className = "priceBadge";
                badge.textContent = "%" + p.indirim_yuzde;
                priceRow.appendChild(oldP);
                priceRow.appendChild(curP);
                priceRow.appendChild(badge);
            } else {
                var single = document.createElement("span");
                single.className = "price";
                single.textContent = p.fiyat || "";
                priceRow.appendChild(single);
            }
            var sm = document.createElement("p");
            sm.textContent = truncateExcerpt(p.ozet || "", 88);
            body.appendChild(h);
            body.appendChild(priceRow);
            if (sm.textContent) body.appendChild(sm);
            a.appendChild(img);
            a.appendChild(body);
            wrap.appendChild(a);
        });
        container.appendChild(wrap);
        scrollBottom();
    }

    var busy = false;

    async function sendMessage(preset) {
        var text = (typeof preset === "string" ? preset : inp.value || "").trim();
        if (!text || busy) return;
        busy = true;
        sendBtn.disabled = true;
        inp.value = "";
        appendUser(text);
        typingEl.hidden = false;

        var botParts = createBotRow();
        var full = "";

        try {
            var res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });
            if (!res.ok || !res.body) {
                botParts.bubble.textContent = "Bağlantı hatası. Lütfen tekrar deneyin.";
                return;
            }
            var reader = res.body.getReader();
            var decoder = new TextDecoder();
            var buf = "";
            while (true) {
                var chunk = await reader.read();
                if (chunk.done) break;
                buf += decoder.decode(chunk.value, { stream: true });
                var parts = buf.split("\n\n");
                buf = parts.pop() || "";
                for (var i = 0; i < parts.length; i++) {
                    var line = parts[i].trim();
                    if (!line.startsWith("data:")) continue;
                    try {
                        var ev = JSON.parse(line.slice(5).trim());
                        if (ev.type === "delta" && ev.content) {
                            full += ev.content;
                            botParts.bubble.textContent = sanitizeText(full);
                            scrollBottom();
                        } else if (ev.type === "products") {
                            renderCards(botParts.col, ev.items);
                        } else if (ev.type === "error") {
                            botParts.bubble.textContent = ev.message || "Hata oluştu.";
                        }
                    } catch (e) {
                        /* ignore */
                    }
                }
            }
            full = sanitizeText(full);
            botParts.bubble.textContent = full || "Yanıt alınamadı.";
        } catch (err) {
            botParts.bubble.textContent = "Ağ hatası: " + (err.message || "bilinmiyor");
        } finally {
            typingEl.hidden = true;
            busy = false;
            sendBtn.disabled = false;
            inp.focus();
        }
    }

    sendBtn.addEventListener("click", function () {
        sendMessage();
    });
    inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") sendMessage();
    });
})();
