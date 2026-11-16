/* Buddy — Arc Weld Equipments chat assistant (plain JS, no backend).
   Knowledge is fed ONLY from this site's verified facts:
   - Company facts below (from arcweld.in, as on the site)
   - PRODUCTS + CATEGORIES from assets/js/products.js (40 machines)
   Buddy never invents prices or specifications. Prices are always
   "quoted on request" and point to the enquiry form / email / phone. */
(function () {
  "use strict";
  var COMPANY = {
    name: "Arc Weld Equipments Pvt Ltd",
    about: "Manufacturer of a complete range of plasma cutting & inverter welding machines, based in Sakinaka, Mumbai. Backed by technocrat engineers with over 30 years of experience in the welding and cutting field. 1000+ IGBT-based inverter welding machines sold.",
    address: "5, Patel Industrial Estate, Near Safed Pool Bus Stop, Safed Pool, Sakinaka, Mumbai 400072",
    phone: "022 2859 1639",
    phone2: "022 2859 6611",
    mobile: "+91 98201 63252, +91 99201 63252",
    email: "info@arcweld.in",
    hours: "Monday to Saturday: 9:00 AM – 6:00 PM. Sunday: Closed.",
    warranty: "Every machine carries a 1-year product warranty, followed by after-sales service from our own engineers.",
    delivery: "Most machines are available ex-stock and can be loaded the same day from our Sakinaka factory. Specialty machines are made and sent in 7–10 days after your order is confirmed.",
    testing: "All machines are 100% tested prior to loading, to guarantee full compliance with the published specifications. Weld trials can be arranged on request.",
    iso: "ISO 9001:2000 Certified Company Since 2013.",
    industries: "Oil & gas, petrochemical, shipbuilding, offshore, construction, automotive, pressure vessels and railways."
  };

  function norm(s) { return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
  /* Whole-word / whole-phrase match only — "machines" must NOT match "hi". */
  function has(q, words) { var padded = " " + q + " "; return words.some(function (w) { return padded.indexOf(" " + w + " ") !== -1; }); }
  function catOf(p) { return CATEGORIES.find(function (c) { return c.id === p.cat; }); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function productCard(p, withBrochure) {
    var cat = catOf(p);
    var h = "<div class='buddy-product'><b>" + esc(p.name) + "</b> <span class='buddy-cat'>" + esc(cat.short) + " · " + esc(p.series) + "</span><br>" +
      esc(p.tag) + "<br>";
    if (p.specs) {
      var rows = p.specs.filter(function (r) { return r.length === 2; }).slice(0, 4);
      if (rows.length) {
        h += rows.map(function (r) { return esc(r[0]) + ": <b>" + esc(r[1]) + "</b>"; }).join(" · ") + "<br>";
      } else {
        h += "Full spec table in the product details.<br>";
      }
    } else {
      h += "Full specification sheet available on request.<br>";
    }
    h += "<span class='buddy-actions'>" +
      "<button type='button' data-buddy-view='" + p.id + "'>View details</button>" +
      (withBrochure === false ? "" : " <a href='assets/brochures/" + p.id + ".pdf' download>Download brochure (PDF)</a>") +
      " <button type='button' data-buddy-quote='" + esc(p.name) + "'>Ask for a quote</button>" +
      "</span></div>";
    return h;
  }

  var STOPWORDS = ["machine", "machines", "welding", "cutting", "specs", "spec", "specification", "details", "detail", "show", "me", "tell", "about", "the", "a", "an", "please", "give", "list", "all", "what", "is", "are", "for", "of", "and", "do", "you", "make", "have"];
  function findProducts(q) {
    var tokens = norm(q).split(" ").filter(function (t) { return t.length > 1 && STOPWORDS.indexOf(t) === -1; });
    if (!tokens.length) return [];
    var qClean = norm(q).replace(/\b(specs|spec|specification|details|machine|machines)\b/g, " ").replace(/\s+/g, " ").trim();
    var scored = PRODUCTS.map(function (p) {
      var cat = catOf(p);
      var hay = norm(p.name + " " + p.id + " " + p.tag + " " + p.series + " " + cat.name + " " + cat.short + " " + cat.code);
      var hayWords = hay.split(" ");
      var nameWords = norm(p.name).split(" ");
      var score = 0;
      if (qClean && norm(p.name) === qClean) score += 10;
      else if (qClean && norm(p.name).indexOf(qClean) === 0) score += 5;
      tokens.forEach(function (t) {
        if (hayWords.indexOf(t) !== -1) score += (nameWords.indexOf(t) !== -1 ? 3 : 1);
      });
      return { p: p, score: score };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 3).map(function (x) { return x.p; });
  }

  function answer(raw) {
    var q = norm(raw);
    if (!q) return "Please type your question — for example, try “ARC 400 specs”, “warranty”, or “address”.";
    if (has(q, ["hi", "hello", "hey", "namaste", "good morning", "good afternoon"])) {      return "Hello! I'm <b>Buddy</b>, Arc Weld's assistant. Ask me about any of our 40 welding & cutting machines, prices, warranty, delivery, or our Sakinaka factory — or tap a suggestion below.";
    }
    if (has(q, ["thank", "thanks", "thank you"])) return "You're welcome! Anything else — a machine, a quotation, or our address? You can also call us on <a href='tel:+912228591639'>022 2859 1639</a>.";
    if (has(q, ["price", "cost", "rate", "quotation", "quote", "how much", "charges"])) {
      return "Prices are <b>quoted on request</b> — they depend on the exact model and quantity. Tell me the machine name (e.g. “ARC 400”) and I'll show its details, then you can <a href='#quote'>ask for a free quotation</a> or email <a href='mailto:info@arcweld.in'>info@arcweld.in</a>. You can also call <a href='tel:+912228591639'>022 2859 1639</a>.";
    }
    if (has(q, ["hours", "timing", "open", "close", "closed", "when are you open", "working hours"])) {
      return "<b>Working hours:</b> " + esc(COMPANY.hours) + "<br>Factory & office: " + esc(COMPANY.address) + ".";
    }
    if (has(q, ["where", "address", "location", "located", "reach", "visit", "direction", "map", "sakinaka"])) {
      return "<b>Visit us:</b> " + esc(COMPANY.address) + ".<br>Hours: " + esc(COMPANY.hours) + "<br><a href='#contact'>See us on the map</a> · Call <a href='tel:+912228591639'>022 2859 1639</a>.";
    }
    if (has(q, ["phone", "call", "contact", "mobile", "number", "email", "mail"])) {
      return "<b>Contact Arc Weld:</b><br>Phone (landline): <a href='tel:+912228591639'>022 2859 1639</a> · <a href='tel:+912228596611'>022 2859 6611</a><br>Mobile: " + esc(COMPANY.mobile) + "<br>Email: <a href='mailto:info@arcweld.in'>info@arcweld.in</a><br>Hours: " + esc(COMPANY.hours);
    }
    if (has(q, ["warranty", "guarantee"])) {
      return "<b>Warranty:</b> " + esc(COMPANY.warranty);
    }
    if (has(q, ["delivery", "dispatch", "stock", "how fast", "how long", "loading", "available", "lead time"])) {
      return "<b>Delivery:</b> " + esc(COMPANY.delivery) + "<br>" + esc(COMPANY.testing);
    }
    if (has(q, ["service", "repair", "after sales", "support", "maintenance", "spare"])) {
      return "<b>Service & support:</b> " + esc(COMPANY.warranty) + " " + esc(COMPANY.testing);
    }
    if (has(q, ["about", "company", "who are you", "experience", "iso", "history", "how old", "years"])) {
      return "<b>" + esc(COMPANY.name) + "</b><br>" + esc(COMPANY.about) + "<br>" + esc(COMPANY.iso) + "<br>Industries we serve: " + esc(COMPANY.industries) + ".";
    }
    if (has(q, ["brochure", "pdf", "catalogue", "catalog", "download"])) {
      return "Every machine has its own <b>PDF brochure</b> — open any machine's details and tap “Download Brochure (PDF)”. Or tell me the machine name and I'll link its brochure here. Try “ARC 200 brochure”.";
    }
    if (q === "machines" || q === "machine" || has(q, ["all machines", "list", "products", "what do you make", "what machines", "show me", "categories", "range"])) {
      var lines = CATEGORIES.map(function (c) {
        var n = PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
        return "<b>" + esc(c.short) + "</b> — " + n + " models";
      }).join("<br>");
      return "<b>We make 40 machines in 8 ranges:</b><br>" + lines + "<br>Tell me a type (e.g. “TIG” or “plasma”) or a model (e.g. “ARC 400”) and I'll show the machines.";
    }
    var matches = findProducts(q);
    if (matches.length) {
      var h = matches.length === 1 ? "Here's the machine you asked about:" : "Here are the closest matches:";
      return h + "<br>" + matches.map(function (p) { return productCard(p, true); }).join("");
    }
    // Category-only query (e.g. just "tig" with no model match still lands here via findProducts, so this is the true fallback)
    return "I don't have that exact detail — I only answer from Arc Weld's published catalogue, so I won't guess. Try a machine name (e.g. “ARC 400”, “MIG 600”, “Plasma Cut 100I”), or ask about <b>price</b>, <b>warranty</b>, <b>delivery</b>, <b>address</b> or <b>contact</b>. For anything else, our engineers will help: call <a href='tel:+912228591639'>022 2859 1639</a> or email <a href='mailto:info@arcweld.in'>info@arcweld.in</a>.";
  }

  /* ---------- UI wiring ---------- */
  var fab = document.getElementById("buddy-fab");
  var panel = document.getElementById("buddy-panel");
  var closeBtn = document.getElementById("buddy-close");
  var log = document.getElementById("buddy-log");
  var form = document.getElementById("buddy-form");
  var input = document.getElementById("buddy-input");
  var greeted = false;

  function addMsg(html, who) {
    var d = document.createElement("div");
    d.className = "buddy-msg " + who;
    if (who === "user") { d.textContent = html; }
    else { d.innerHTML = html; }
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function typing() {
    var d = document.createElement("div");
    d.className = "buddy-msg bot buddy-typing";
    d.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function ask(text) {
    if (!text.trim()) return;
    addMsg(text, "user");
    input.value = "";
    var t = typing();
    setTimeout(function () {
      t.remove();
      addMsg(answer(text), "bot");
      bindActions();
    }, 450);
  }
  function bindActions() {
    var views = log.querySelectorAll("[data-buddy-view]");
    Array.prototype.forEach.call(views, function (b) {
      if (b.dataset.bound) return; b.dataset.bound = "1";
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-buddy-view");
        toggle(false);
        if (window.openProductById) { window.openProductById(id); }
        else { location.hash = "#products"; }
      });
    });
    var quotes = log.querySelectorAll("[data-buddy-quote]");
    Array.prototype.forEach.call(quotes, function (b) {
      if (b.dataset.bound) return; b.dataset.bound = "1";
      b.addEventListener("click", function () {
        toggle(false);
        if (window.prefillQuote) { window.prefillQuote(b.getAttribute("data-buddy-quote")); }
        location.hash = "#quote";
        var q = document.getElementById("q-name");
        if (q) { setTimeout(function () { q.focus(); }, 350); }
      });
    });
  }
  function toggle(open) {
    var willOpen = typeof open === "boolean" ? open : !panel.classList.contains("open");
    panel.classList.toggle("open", willOpen);
    fab.setAttribute("aria-expanded", willOpen ? "true" : "false");
    if (willOpen) {
      if (!greeted) {
        greeted = true;
        addMsg("Hi! I'm <b>Buddy</b> — Arc Weld's assistant. 👋<br>Ask me about any machine, price, warranty or delivery — no need to scroll. Try “ARC 400 specs” or “What is the warranty?”.", "bot");
      }
      setTimeout(function () { input.focus(); }, 250);
    }
  }
  if (fab && panel) {
    fab.addEventListener("click", function () { toggle(); });
    closeBtn && closeBtn.addEventListener("click", function () { toggle(false); });
    form && form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });
    var chips = panel.querySelectorAll("[data-buddy-chip]");
    Array.prototype.forEach.call(chips, function (c) {
      c.addEventListener("click", function () { ask(c.getAttribute("data-buddy-chip")); });
    });
  }
  // Exposed for testing / other scripts
  window.Buddy = { answer: answer, findProducts: findProducts, ask: ask };
})();
