/* Arc Weld Equipments — main.js (plain JS)
   Mage-UI ports: preloader, follow-cursor dot, click-spark, split-text,
   counter, carousel, accordion, case-study cards, section reveals.
   All motion respects prefers-reduced-motion and pointer:fine gating. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Preloader ---------- */
  var pre = $("#preloader"), bar = $("#pl-bar"), pct = $("#pl-pct"), prog = 0;
  function finishPreloader() {
    if (!pre || pre.classList.contains("done")) return;
    pre.classList.add("done");
    setTimeout(function () { pre.remove(); }, 600);
  }
  if (reduced) { finishPreloader(); }
  else if (pre) {
    var tick = setInterval(function () {
      prog = Math.min(100, prog + Math.random() * 22 + 8);
      bar.style.width = prog + "%";
      pct.textContent = Math.floor(prog) + "%";
      if (prog >= 100) { clearInterval(tick); setTimeout(finishPreloader, 250); }
    }, 120);
    window.addEventListener("load", function () { prog = 100; });
    setTimeout(finishPreloader, 3500); /* safety: never trap the user */
  }

  /* ---------- Cursor effects (Mage-UI follow-cursor + click-spark) ---------- */
  if (!reduced && finePointer) {
    /* Follow dot — lerp lag 10, amber */
    (function () {
      var cv = document.createElement("canvas");
      cv.id = "cursor-dot";
      var ctx = cv.getContext("2d");
      var w = innerWidth, h = innerHeight, raf;
      var cur = { x: w / 2, y: h / 2 }, dot = { x: w / 2, y: h / 2 };
      function size() { w = innerWidth; h = innerHeight; cv.width = w; cv.height = h; }
      size();
      addEventListener("mousemove", function (e) { cur.x = e.clientX; cur.y = e.clientY; }, { passive: true });
      addEventListener("resize", size);
      (function loop() {
        dot.x += (cur.x - dot.x) / 10;
        dot.y += (cur.y - dot.y) / 10;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(245, 158, 11, .55)";
        ctx.beginPath(); ctx.arc(dot.x, dot.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(216, 35, 42, .85)";
        ctx.beginPath(); ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2); ctx.fill();
        raf = requestAnimationFrame(loop);
      })();
    })();
    /* Click spark — 8 amber/red lines burst, 400ms */
    (function () {
      var cv = document.createElement("canvas");
      cv.id = "cursor-spark";
      var ctx = cv.getContext("2d");
      var sparks = [];
      function size() { cv.width = innerWidth; cv.height = innerHeight; }
      size();
      addEventListener("resize", size);
      addEventListener("click", function (e) {
        for (var i = 0; i < 8; i++) {
          var a = (Math.PI * 2 * i) / 8 + Math.random() * .4;
          sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * (3 + Math.random() * 3), vy: Math.sin(a) * (3 + Math.random() * 3), life: 1 });
        }
      }, { passive: true });
      (function loop() {
        ctx.clearRect(0, 0, cv.width, cv.height);
        sparks = sparks.filter(function (s) { return s.life > 0; });
        sparks.forEach(function (s) {
          s.x += s.vx; s.y += s.vy; s.vx *= .92; s.vy *= .92; s.life -= .06;
          ctx.strokeStyle = "rgba(245, 158, 11, " + s.life + ")";
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3); ctx.stroke();
        });
        requestAnimationFrame(loop);
      })();
    })();
  }

  /* ---------- Split text (Mage-UI split-text, plain JS) ---------- */
  $$(".split-text").forEach(function (el) {
    var text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    text.split("").forEach(function (ch) {
      if (ch === " ") { el.appendChild(document.createTextNode(" ")); return; }
      var wrap = document.createElement("span");
      wrap.className = "split-letter";
      wrap.setAttribute("aria-hidden", "true");
      var top = document.createElement("span"); top.className = "top"; top.textContent = ch;
      var bot = document.createElement("span"); bot.className = "bot";
      var inner = document.createElement("span"); inner.textContent = ch;
      bot.appendChild(inner);
      wrap.appendChild(top); wrap.appendChild(bot);
      el.appendChild(wrap);
    });
  });

  /* ---------- Hero carousel ---------- */
  var slides = $$(".hero-slide"), dots = $$(".hero-dots button"), cur = 0, timer = null;
  function goTo(i) {
    cur = ((i % slides.length) + slides.length) % slides.length;
    slides.forEach(function (s, j) { s.classList.toggle("active", j === cur); });
    dots.forEach(function (d, j) { d.classList.toggle("active", j === cur); });
  }
  function restartAuto() {
    clearInterval(timer);
    if (!reduced) { timer = setInterval(function () { goTo(cur + 1); }, 6000); }
  }
  var prevBtn = document.getElementById("hero-prev");
  var nextBtn = document.getElementById("hero-next");
  if (prevBtn) { prevBtn.addEventListener("click", function () { goTo(cur - 1); restartAuto(); }); }
  if (nextBtn) { nextBtn.addEventListener("click", function () { goTo(cur + 1); restartAuto(); }); }
  dots.forEach(function (d, j) { d.addEventListener("click", function () { goTo(j); restartAuto(); }); });
  restartAuto();

  /* ---------- Counters (Mage-UI counter) ---------- */
  var counters = $$("[data-count]");
  var cObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; cObs.unobserve(el);
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      if (reduced) { el.textContent = target.toFixed(decimals); return; }
      var start = null, dur = 1400;
      (function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }, { threshold: .5 });
  counters.forEach(function (c) { cObs.observe(c); });

  /* ---------- Section reveals ---------- */
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); revObs.unobserve(en.target); }
    });
  }, { threshold: .12 });
  $$(".reveal").forEach(function (el) { reduced ? el.classList.add("in") : revObs.observe(el); });

  /* ---------- Mobile nav ---------- */
  var toggle = $("#nav-toggle"), nav = $("#main-nav");
  toggle && toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$("#main-nav a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); }); });

  /* ---------- Products: render, filter, search ---------- */
  var grid = $("#product-grid"), catWrap = $("#cat-blocks");
  var activeCat = "all", query = "";
  var catImg = {};
  CATEGORIES.forEach(function (c) { catImg[c.id] = c.img; });

  function catOf(p) { return CATEGORIES.find(function (c) { return c.id === p.cat; }); }

  function cardHTML(p) {
    var cat = catOf(p);
    return '<button class="p-card" data-id="' + p.id + '" type="button">' +
      '<span class="p-series">' + cat.short + ' · ' + p.series + '</span>' +
      '<h4>' + p.name + '</h4>' +
      '<p class="p-tag">' + p.tag + '</p>' +
      '<span class="p-foot"><b>View details →</b><span>Ask for quote</span></span>' +
      '</button>';
  }

  function render() {
    var q = query.trim().toLowerCase();
    var visible = 0;
    catWrap.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      if (activeCat !== "all" && activeCat !== cat.id) return;
      var items = PRODUCTS.filter(function (p) {
        if (p.cat !== cat.id) return false;
        if (!q) return true;
        return (p.name + " " + p.tag + " " + p.series + " " + cat.name).toLowerCase().indexOf(q) !== -1;
      });
      if (!items.length) return;
      visible += items.length;
      var block = document.createElement("div");
      block.className = "cat-block";
      block.innerHTML =
        '<div class="cat-head reveal in">' +
          '<img src="' + cat.img + '" alt="' + cat.name + ' — Arc Weld Equipments, Mumbai" loading="lazy">' +
          '<div><span class="code">' + cat.code + '</span><h3>' + cat.name + '</h3><p>' + cat.desc + '</p></div>' +
        '</div>' +
        '<div class="product-grid">' + items.map(cardHTML).join("") + '</div>';
      catWrap.appendChild(block);
    });
    $("#count-note").textContent = visible + " of " + PRODUCTS.length + " machines shown";
    $("#no-results").classList.toggle("show", visible === 0);
    $$(".p-card", catWrap).forEach(function (card) {
      card.addEventListener("click", function () { openProduct(card.getAttribute("data-id")); });
    });
  }

  $$(".chip[data-cat]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $$(".chip[data-cat]").forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      activeCat = chip.getAttribute("data-cat");
      render();
    });
  });
  var search = $("#product-search");
  search && search.addEventListener("input", function () { query = search.value; render(); });
  render();

  /* ---------- Product modal ---------- */
  var backdrop = $("#modal-backdrop"), modalBody = $("#modal-body"), lastFocus = null;
  function specRows(specs) {
    if (!specs) return "";
    var multi = specs[0].length > 2;
    var html = '<table class="spec-table"><tbody>';
    specs.forEach(function (row, i) {
      if (i === 0 && multi) {
        html += "<tr>" + row.map(function (c, j) { return j === 0 ? "<th>" + c + "</th>" : "<th>" + c + "</th>"; }).join("") + "</tr>";
      } else if (multi) {
        html += "<tr>" + row.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
      } else {
        html += "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>";
      }
    });
    return html + "</tbody></table>";
  }
  function openProduct(id) {
    var p = PRODUCTS.find(function (x) { return x.id === id; });
    if (!p) return;
    var cat = catOf(p);
    lastFocus = document.activeElement;
    var html = '<div class="modal-head">' +
      '<img src="' + cat.img + '" alt="' + p.name + ' — ' + cat.name + '">' +
      '<div class="scrim"></div>' +
      '<div class="mh-text"><span class="p-series">' + cat.name + ' · ' + p.series + '</span><h3>' + p.name + '</h3><p>' + p.tag + '</p></div>' +
      '<button class="modal-close" type="button" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button></div>' +
      '<div class="modal-body">' +
      '<h5>Salient features</h5><ul class="tick-list">' + p.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>";
    if (p.standard && p.standard.length) {
      html += '<h5>Standard</h5><div class="chip-list">' + p.standard.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div>";
    }
    if (p.optional && p.optional.length) {
      html += '<h5>Optional</h5><div class="chip-list">' + p.optional.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div>";
    }
    if (p.apps && p.apps.length) {
      html += '<h5>Applications</h5><div class="chip-list">' + p.apps.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div>";
    }
    if (p.specs) {
      html += '<h5>Technical specifications</h5>' + specRows(p.specs);
    } else {
      html += '<div class="spec-note"><b>Full specification sheet on request.</b> This model’s detailed specification table is available from Arc Weld — ask for a quote and the team will share the full sheet for this exact model.</div>';
    }
    html += '<div class="modal-cta">' +
      '<a class="btn btn-red" href="#quote" data-quote="' + p.name + '">Ask for a quote <span class="arrow">→</span></a>' +
      '<a class="btn btn-outline" href="tel:+912228591639">Call 022 2859 1639</a>' +
      '<a class="btn btn-outline" href="mailto:info@arcweld.in?subject=' + encodeURIComponent("Enquiry — " + p.name) + '">Email about this machine</a>' +
      '</div></div>';
    modalBody.innerHTML = html;
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    $(".modal-close", modalBody).addEventListener("click", closeProduct);
    $$("[data-quote]", modalBody).forEach(function (a) {
      a.addEventListener("click", function () {
        closeProduct();
        prefillQuote(a.getAttribute("data-quote"));
      });
    });
  }
  function closeProduct() {
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  backdrop.addEventListener("click", function (e) { if (e.target === backdrop) closeProduct(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeProduct(); });

  /* ---------- Vision / Mission / Values tabs ---------- */
  $$(".vm-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".vm-tab").forEach(function (t) { t.classList.remove("active"); });
      $$(".vm-panel").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      $("#" + tab.getAttribute("data-panel")).classList.add("active");
    });
  });

  /* ---------- FAQ accordion ---------- */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item), a = $(".faq-a", item);
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      $$(".faq-item.open").forEach(function (o) { o.classList.remove("open"); $(".faq-a", o).style.maxHeight = null; });
      if (!open) { item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
    });
  });

  /* ---------- Quote form ---------- */
  var form = $("#quote-form");
  function prefillQuote(product) {
    var sel = $("#q-product");
    if (sel) {
      var opt = Array.prototype.find.call(sel.options, function (o) { return o.value === product; });
      if (!opt) { var o2 = document.createElement("option"); o2.value = product; o2.textContent = product; sel.appendChild(o2); }
      sel.value = product;
    }
    var msg = $("#q-message");
    if (msg && !msg.value) msg.value = "Hello, I would like a quotation for the " + product + ". Please share the price and delivery details.";
  }
  window.prefillQuote = prefillQuote;
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$(".field[data-required]", form).forEach(function (f) {
        var input = $("input, select, textarea", f);
        var bad = !input.value || !input.value.trim();
        if (input.type === "email" && input.value) bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        if (input.type === "tel" && input.value) bad = input.value.replace(/\D/g, "").length < 10;
        f.classList.toggle("invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) { var first = $(".field.invalid input, .field.invalid select", form); first && first.focus(); return; }
      var name = $("#q-name").value.trim();
      var phone = $("#q-phone").value.trim();
      var email = $("#q-email").value.trim();
      var product = $("#q-product").value;
      var message = $("#q-message").value.trim();
      var subject = "Website enquiry — " + (product || "Welding / cutting machine");
      var body = "Name: " + name + "\nPhone: " + phone + "\nEmail: " + email + "\nMachine: " + (product || "Not specified") + "\n\n" + message;
      window.location.href = "mailto:info@arcweld.in?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      $("#form-ok").classList.add("show");
      form.reset();
    });
    $$(".field input, .field select, .field textarea", form).forEach(function (input) {
      input.addEventListener("input", function () { input.closest(".field").classList.remove("invalid"); });
    });
  }

  /* ---------- Footer year ---------- */
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
})();
