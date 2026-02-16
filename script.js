

/*  1 FUENTE DE DATOS (BINANCE JUNTO AL ORO paxgusdt) */
var ws = new WebSocket(
  "wss://stream.binance.com:9443/stream?streams=" +
    "btcusdt@miniTicker/" +
    "ethusdt@miniTicker/" +
    "xmrusdt@miniTicker/" +
    "ltcusdt@miniTicker/" +
    "paxgusdt@miniTicker"
);

var simbolosBinance = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  XMRUSDT: "monero",
  LTCUSDT: "litecoin",
  PAXGUSDT: "oro"
};

const activos = [
  { nombre: "bitcoin", precioActual: null, datos: [] },
  { nombre: "ethereum", precioActual: null, datos: [] },
  { nombre: "monero", precioActual: null, datos: [] },
  { nombre: "litecoin", precioActual: null, datos: [] },
  { nombre: "oro", precioActual: null, datos: [] } // PAXG
];

var MAX_PUNTOS = 220;

/* 2 INFO TIEMPO REAL */

var horaActualEl = document.getElementById("horaActual");
var contadorMensajesEl = document.getElementById("contadorMensajes");
var ultimaActualizacionEl = document.getElementById("ultimaActualizacion");
var oroValorEl = document.getElementById("oroValor");

var contadorMensajes = 0;

function formatearHora(ms) {
  var d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

setInterval(function () {
  if (horaActualEl) horaActualEl.innerText = formatearHora(Date.now());
}, 1000);



var menu = document.getElementById("menuMonedas");
var tooltip = document.getElementById("tooltip");

var contexto1 = document.getElementById("contexto1");
var contexto2 = document.getElementById("contexto2");

var formatoUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function obtenerActivo(nombre) {
  return activos.find((a) => a.nombre === nombre);
}

function clampSeries(arr, max) {
  if (arr.length > max) arr.splice(0, arr.length - max);
}

function nearestByTime(arr, t) {
  if (!arr || arr.length === 0) return null;
  const bisect = d3.bisector((d) => d.fecha).left;
  const i = bisect(arr, t, 1);
  const a = arr[i - 1];
  const b = arr[i];
  if (!b) return a;
  return (t - a.fecha > b.fecha - t) ? b : a;
}


var margen = { top: 10, right: 30, bottom: 30, left: 80 };
var ancho = 820 - margen.left - margen.right;
var alto = 320 - margen.top - margen.bottom;

// ------- GRAFICO 1 PRECIO -------
const svgPrecio = d3
  .select("#chartPrecio")
  .append("svg")
  .attr("width", ancho + margen.left + margen.right)
  .attr("height", alto + margen.top + margen.bottom)
  .append("g")
  .attr("transform", `translate(${margen.left},${margen.top})`);

svgPrecio.append("rect").attr("width", ancho).attr("height", alto).attr("fill", "#F3EBDD");

const defs1 = svgPrecio.append("defs");
const gradPrecio = defs1.append("linearGradient")
  .attr("id", "gradPrecio")
  .attr("x1", "0%").attr("y1", "0%")
  .attr("x2", "100%").attr("y2", "0%");
gradPrecio.append("stop").attr("offset", "0%").attr("stop-color", "#E8D7B1");
gradPrecio.append("stop").attr("offset", "100%").attr("stop-color", "#C6A969");

const x1 = d3.scaleTime().range([0, ancho]);
const y1 = d3.scaleLinear().range([alto, 0]);
const ejeX1 = d3.axisBottom().scale(x1);
const ejeY1 = d3.axisLeft().scale(y1);

svgPrecio.append("g").attr("transform", `translate(0, ${alto})`).attr("class", "ejeX ejeX1");
svgPrecio.append("g").attr("class", "ejeY ejeY1");

const genLineaPrecio = d3.line()
  .x((d) => x1(d.fecha))
  .y((d) => y1(d.precio));

svgPrecio.append("g").attr("class", "focusPrecio").append("circle")
  .attr("r", 5).attr("stroke", "#C6A969").attr("stroke-width", 2).attr("fill", "#FBF7EF");

svgPrecio.append("rect")
  .attr("class", "overlayPrecio")
  .attr("width", ancho)
  .attr("height", alto)
  .attr("fill", "transparent");

// ------- GRAFICO 2 VOLATILIDAD -----
const svgVol = d3
  .select("#chartVolatilidad")
  .append("svg")
  .attr("width", ancho + margen.left + margen.right)
  .attr("height", alto + margen.top + margen.bottom)
  .append("g")
  .attr("transform", `translate(${margen.left},${margen.top})`);

svgVol.append("rect").attr("width", ancho).attr("height", alto).attr("fill", "#F3EBDD");

const defs2 = svgVol.append("defs");

// GRDIANTE PARA EL ACTIVO SELECCIONADO
const gradActPct = defs2.append("linearGradient")
  .attr("id", "gradActPct")
  .attr("x1", "0%").attr("y1", "0%")
  .attr("x2", "100%").attr("y2", "0%");
gradActPct.append("stop").attr("offset", "0%").attr("stop-color", "#E8D7B1");
gradActPct.append("stop").attr("offset", "100%").attr("stop-color", "#C6A969");


const gradOroPct = defs2.append("linearGradient")
  .attr("id", "gradOroPct")
  .attr("x1", "0%").attr("y1", "0%")
  .attr("x2", "100%").attr("y2", "0%");
gradOroPct.append("stop").attr("offset", "0%").attr("stop-color", "#D7E6D0");
gradOroPct.append("stop").attr("offset", "100%").attr("stop-color", "#6BA368");



const x2 = d3.scaleTime().range([0, ancho]);
const y2 = d3.scaleLinear().range([alto, 0]);
const ejeX2 = d3.axisBottom().scale(x2);
const ejeY2 = d3.axisLeft().scale(y2).tickFormat((v) => v + "%");

svgVol.append("g").attr("transform", `translate(0, ${alto})`).attr("class", "ejeX ejeX2");
svgVol.append("g").attr("class", "ejeY ejeY2");

const genLineaPct = d3.line()
  .x((d) => x2(d.fecha))
  .y((d) => y2(d.pct));

svgVol.append("g").attr("class", "focusAct").append("circle")
  .attr("r", 5).attr("stroke", "#C6A969").attr("stroke-width", 2).attr("fill", "#FBF7EF");

svgVol.append("g").attr("class", "focusOro").append("circle")
  .attr("r", 5).attr("stroke", "#6BA368").attr("stroke-width", 2).attr("fill", "#FBF7EF");

svgVol.append("rect")
  .attr("class", "overlayVol")
  .attr("width", ancho)
  .attr("height", alto)
  .attr("fill", "transparent");


function seriePct(serie) {
  if (!serie || serie.length === 0) return [];
  const base = serie[0].precio;
  if (!base || base === 0) return [];
  return serie.map((d) => ({
    fecha: d.fecha,
    pct: ((d.precio - base) / base) * 100
  }));
}


function renderPrecio(activo) {
  if (!activo || activo.datos.length === 0) return;

  x1.domain(d3.extent(activo.datos, (d) => d.fecha));
  y1.domain([
    d3.min(activo.datos, (d) => d.precio),
    d3.max(activo.datos, (d) => d.precio)
  ]);

  svgPrecio.selectAll(".ejeX1").transition().duration(200).call(ejeX1);
  svgPrecio.selectAll(".ejeY1").transition().duration(200).call(ejeY1);

  svgPrecio.selectAll(".lineaPrecio")
    .data([activo.datos])
    .join("path")
    .attr("class", "lineaPrecio")
    .attr("fill", "none")
    .attr("stroke", "url(#gradPrecio)")
    .attr("stroke-width", 3)
    .transition().duration(200)
    .attr("d", genLineaPrecio);

  svgPrecio.select(".overlayPrecio")
    .on("mousemove", function (event) {
      const [mx] = d3.pointer(event, this);
      const t = x1.invert(mx);
      const p = nearestByTime(activo.datos, t);
      if (!p) return;

      svgPrecio.select(".focusPrecio")
        .attr("transform", `translate(${x1(p.fecha)},${y1(p.precio)})`);

      if (tooltip) {
        tooltip.innerHTML =
          `<div class="t-title">${activo.nombre}</div>` +
          `<div class="row"><span class="name">Hora</span><span class="val">${formatearHora(p.fecha)}</span></div>` +
          `<div class="row"><span class="name">Precio</span><span class="val">${formatoUSD.format(p.precio)}</span></div>`;
        tooltip.style.opacity = 1;
        tooltip.style.left = event.pageX + 14 + "px";
        tooltip.style.top = event.pageY + 14 + "px";
      }
    })
    .on("mouseleave", function () {
      if (tooltip) tooltip.style.opacity = 0;
    });
}



function renderVolatilidad(activoSeleccionado) {
  const oro = obtenerActivo("oro");
  if (!activoSeleccionado || activoSeleccionado.datos.length === 0) return;
  if (!oro || oro.datos.length === 0) return;

  const actPct = seriePct(activoSeleccionado.datos);
  const oroPct = seriePct(oro.datos);

  const todas = actPct.concat(oroPct);
  if (todas.length === 0) return;

  x2.domain(d3.extent(todas, (d) => d.fecha));

  const minPct = d3.min(todas, (d) => d.pct);
  const maxPct = d3.max(todas, (d) => d.pct);
  const pad = ((maxPct - minPct) * 0.12) || 1;
  y2.domain([minPct - pad, maxPct + pad]);

  svgVol.selectAll(".ejeX2").transition().duration(200).call(ejeX2);
  svgVol.selectAll(".ejeY2").transition().duration(200).call(ejeY2);

// ACTIVO SELECCIONADO
  svgVol.selectAll(".lineaActPct")
    .data([actPct])
    .join("path")
    .attr("class", "lineaActPct")
    .attr("fill", "none")
    .attr("stroke", "url(#gradActPct)")
    .attr("stroke-width", 3)
    .transition().duration(200)
    .attr("d", genLineaPct);

// ORO CRIPTO
  svgVol.selectAll(".lineaOroPct")
    .data([oroPct])
    .join("path")
    .attr("class", "lineaOroPct")
    .attr("fill", "none")
    .attr("stroke", "url(#gradOroPct)")
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "6 4")
    .transition().duration(200)
    .attr("d", genLineaPct);

  svgVol.select(".overlayVol")
    .on("mousemove", function (event) {
      const [mx] = d3.pointer(event, this);
      const t = x2.invert(mx);

      const pA = nearestByTime(actPct, t);
      const pO = nearestByTime(oroPct, t);

      if (pA) svgVol.select(".focusAct").attr("transform", `translate(${x2(pA.fecha)},${y2(pA.pct)})`);
      if (pO) svgVol.select(".focusOro").attr("transform", `translate(${x2(pO.fecha)},${y2(pO.pct)})`);

      if (tooltip) {
        tooltip.innerHTML =
          `<div class="t-title">Fluctuación (%)</div>` +
          `<div class="row"><span class="name">Hora</span><span class="val">${formatearHora(t)}</span></div>` +
          `<div class="row"><span class="name">${activoSeleccionado.nombre}</span><span class="val">${pA ? pA.pct.toFixed(2) : "—"}%</span></div>` +
          `<div class="row"><span class="name">Oro (PAXG)</span><span class="val">${pO ? pO.pct.toFixed(2) : "—"}%</span></div>`;
        tooltip.style.opacity = 1;
        tooltip.style.left = event.pageX + 14 + "px";
        tooltip.style.top = event.pageY + 14 + "px";
      }
    })
    .on("mouseleave", function () {
      if (tooltip) tooltip.style.opacity = 0;
    });
}

// ACTUALIZAR TODO

function actualizarTodo() {
  const activoSel = obtenerActivo(menu.value);
  const oro = obtenerActivo("oro");
  if (!activoSel) return;

  if (oro && oro.precioActual != null && oroValorEl) {
    oroValorEl.innerText = oro.precioActual.toFixed(2);
  }

  if (contexto1 && activoSel.precioActual != null) {
    contexto1.innerText =
      "Precio actual de " + activoSel.nombre + ": " + formatoUSD.format(activoSel.precioActual) + " USD.";
  }

  if (contexto2 && activoSel.datos.length > 0 && activoSel.precioActual != null) {
    const base = activoSel.datos[0].precio;
    const diff = activoSel.precioActual - base;
    const diffAbs = Math.abs(diff);

    if (diff > 0) {
      contexto2.innerText = "Desde que abriste esta página, subió " + formatoUSD.format(diffAbs) + " USD.";
      contexto2.style.color = "#6BA368";
    } else if (diff < 0) {
      contexto2.innerText = "Desde que abriste esta página, bajó " + formatoUSD.format(diffAbs) + " USD.";
      contexto2.style.color = "#D97B66";
    } else {
      contexto2.innerText = "Desde que abriste esta página, no ha cambiado.";
      contexto2.style.color = "#7A6F5A";
    }
  }

  renderPrecio(activoSel);
  renderVolatilidad(activoSel);
}

if (menu) menu.onchange = actualizarTodo;

ws.onmessage = function (mensaje) {
  const data = JSON.parse(mensaje.data);
  if (!data || !data.data || !data.data.s) return;


  contadorMensajes += 1;
  if (contadorMensajesEl) contadorMensajesEl.innerText = contadorMensajes;
  if (ultimaActualizacionEl) ultimaActualizacionEl.innerText = formatearHora(Date.now());

  const simbolo = data.data.s; // ej: BTCUSDT
  const nombre = simbolosBinance[simbolo];
  if (!nombre) return;

  const precio = Number(data.data.c);
  if (Number.isNaN(precio)) return;

  const obj = obtenerActivo(nombre);
  if (!obj) return;

  obj.precioActual = precio;
  obj.datos.push({ fecha: Date.now(), precio: precio });
  clampSeries(obj.datos, MAX_PUNTOS);


  const sel = menu ? menu.value : "bitcoin";
  if (nombre === "oro" || nombre === sel) {
    actualizarTodo();
  }
};