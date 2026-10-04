import { a5 as ensure_array_like, a6 as attr, a7 as stringify, a8 as attr_class, e as escape_html, a4 as derived, a9 as attr_style, aa as bind_props, ab as head } from "../../chunks/index.js";
import "socket.io-client";
const COLOR_CONFIG = {
  red: { index: 0, hex: "#EF4444", name: "Merah", start: 0, turning: 50 },
  green: { index: 1, hex: "#10B981", name: "Hijau", start: 13, turning: 11 },
  yellow: { index: 2, hex: "#F59E0B", name: "Kuning", start: 26, turning: 24 },
  blue: { index: 3, hex: "#3B82F6", name: "Biru", start: 39, turning: 37 }
};
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];
const TRACK_GRID_COORDS = {
  0: [6, 13],
  1: [6, 12],
  2: [6, 11],
  3: [6, 10],
  4: [6, 9],
  5: [5, 8],
  6: [4, 8],
  7: [3, 8],
  8: [2, 8],
  9: [1, 8],
  10: [0, 8],
  11: [0, 7],
  12: [0, 6],
  13: [1, 6],
  14: [2, 6],
  15: [3, 6],
  16: [4, 6],
  17: [5, 6],
  18: [6, 5],
  19: [6, 4],
  20: [6, 3],
  21: [6, 2],
  22: [6, 1],
  23: [6, 0],
  24: [7, 0],
  25: [8, 0],
  26: [8, 1],
  27: [8, 2],
  28: [8, 3],
  29: [8, 4],
  30: [8, 5],
  31: [9, 6],
  32: [10, 6],
  33: [11, 6],
  34: [12, 6],
  35: [13, 6],
  36: [14, 6],
  37: [14, 7],
  38: [14, 8],
  39: [13, 8],
  40: [12, 8],
  41: [11, 8],
  42: [10, 8],
  43: [9, 8],
  44: [8, 9],
  45: [8, 10],
  46: [8, 11],
  47: [8, 12],
  48: [8, 13],
  49: [8, 14],
  50: [7, 14],
  51: [6, 14]
};
const HOME_COLUMN_GRID_COORDS = {
  red: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9]
  ],
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7]
  ],
  yellow: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5]
  ],
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7]
  ]
};
const YARD_PIXEL_COORDS = {
  green: [
    { x: 75, y: 75 },
    { x: 165, y: 75 },
    { x: 75, y: 165 },
    { x: 165, y: 165 }
  ],
  yellow: [
    { x: 435, y: 75 },
    { x: 525, y: 75 },
    { x: 435, y: 165 },
    { x: 525, y: 165 }
  ],
  red: [
    { x: 75, y: 435 },
    { x: 165, y: 435 },
    { x: 75, y: 525 },
    { x: 165, y: 525 }
  ],
  blue: [
    { x: 435, y: 435 },
    { x: 525, y: 435 },
    { x: 435, y: 525 },
    { x: 525, y: 525 }
  ]
};
const HOME_PIXEL_COORDS = {
  red: { x: 300, y: 330 },
  green: { x: 270, y: 300 },
  yellow: { x: 300, y: 270 },
  blue: { x: 330, y: 300 }
};
function getTrackPixelCoords(trackIndex) {
  const coord = TRACK_GRID_COORDS[trackIndex];
  if (!coord) return { x: 300, y: 300 };
  return {
    x: coord[0] * 40 + 20,
    y: coord[1] * 40 + 20
  };
}
function getHomeColumnPixelCoords(color, index) {
  const list = HOME_COLUMN_GRID_COORDS[color];
  if (!list || !list[index]) return { x: 300, y: 300 };
  return {
    x: list[index][0] * 40 + 20,
    y: list[index][1] * 40 + 20
  };
}
function BoardSvg($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      players = [],
      tokens = {},
      validTokenIds = [],
      activePlayerId = null
    } = $$props;
    function getTokenCoordinates(playerColor, token, tokenId) {
      if (!token) return { x: 300, y: 300 };
      if (token.type === "YARD") {
        const yardList = YARD_PIXEL_COORDS[playerColor] || YARD_PIXEL_COORDS.red;
        return yardList[tokenId] || yardList[0];
      }
      if (token.type === "TRACK") {
        return getTrackPixelCoords(token.index);
      }
      if (token.type === "HOME_COLUMN") {
        return getHomeColumnPixelCoords(playerColor, token.index);
      }
      if (token.type === "HOME") {
        return HOME_PIXEL_COORDS[playerColor] || { x: 300, y: 300 };
      }
      return { x: 300, y: 300 };
    }
    const allRenderedTokens = derived(() => {
      const list = [];
      players.forEach((p) => {
        const playerTokens = tokens[p.id] || [];
        playerTokens.forEach((t) => {
          const baseCoords = getTokenCoordinates(p.color, t, t.id);
          const isEligible = activePlayerId === p.id && validTokenIds.includes(t.id);
          list.push({
            playerId: p.id,
            playerName: p.name,
            color: p.color,
            token: t,
            baseCoords,
            isEligible,
            // key for stacking
            coordKey: `${t.type}_${t.index}_${t.type === "YARD" ? t.id : ""}_${t.type === "HOME" ? p.color : ""}`
          });
        });
      });
      const grouped = {};
      list.forEach((item) => {
        if (!grouped[item.coordKey]) grouped[item.coordKey] = [];
        grouped[item.coordKey].push(item);
      });
      list.forEach((item) => {
        const group = grouped[item.coordKey];
        if (group.length > 1 && item.token.type !== "YARD") {
          const idx = group.indexOf(item);
          const total = group.length;
          const angle = idx / total * Math.PI * 2;
          const radius = Math.min(12, 5 + total * 2);
          item.renderX = item.baseCoords.x + Math.cos(angle) * radius;
          item.renderY = item.baseCoords.y + Math.sin(angle) * radius;
        } else {
          item.renderX = item.baseCoords.x;
          item.renderY = item.baseCoords.y;
        }
      });
      return list;
    });
    const trackCellsList = derived(() => {
      const cells = [];
      for (let i = 0; i < 52; i++) {
        const [col, row] = TRACK_GRID_COORDS[i];
        const isSafe = SAFE_SQUARES.includes(i);
        let specialType = null;
        if (i === 0) specialType = "START_RED";
        else if (i === 13) specialType = "START_GREEN";
        else if (i === 26) specialType = "START_YELLOW";
        else if (i === 39) specialType = "START_BLUE";
        else if (isSafe) specialType = "SAFE_STAR";
        cells.push({
          index: i,
          col,
          row,
          x: col * 40,
          y: row * 40,
          isSafe,
          specialType
        });
      }
      return cells;
    });
    $$renderer2.push(`<div class="w-full max-w-[580px] aspect-square mx-auto p-2 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl flex items-center justify-center"><svg viewBox="0 0 600 600" class="w-full h-full select-none rounded-2xl overflow-hidden shadow-inner bg-slate-950"><defs><radialGradient id="token-red" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#f87171"></stop><stop offset="50%" stop-color="#ef4444"></stop><stop offset="100%" stop-color="#991b1b"></stop></radialGradient><radialGradient id="token-green" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#4ade80"></stop><stop offset="50%" stop-color="#10b981"></stop><stop offset="100%" stop-color="#065f46"></stop></radialGradient><radialGradient id="token-yellow" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#fde047"></stop><stop offset="50%" stop-color="#f59e0b"></stop><stop offset="100%" stop-color="#92400e"></stop></radialGradient><radialGradient id="token-blue" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#60a5fa"></stop><stop offset="50%" stop-color="#3b82f6"></stop><stop offset="100%" stop-color="#1e3a8a"></stop></radialGradient><filter id="pawn-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"></feDropShadow></filter><filter id="active-glow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.9"></feDropShadow></filter></defs><rect x="0" y="0" width="600" height="600" fill="#f8fafc"></rect><g><rect x="0" y="0" width="240" height="240" fill="#10B981"></rect><rect x="30" y="30" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"></rect><!--[-->`);
    const each_array = ensure_array_like(YARD_PIXEL_COORDS.green);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let pt = each_array[i];
      $$renderer2.push(`<circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="22" fill="#d1fae5" stroke="#10b981" stroke-width="3"></circle><circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="8" fill="#a7f3d0"></circle>`);
    }
    $$renderer2.push(`<!--]--><text x="120" y="25" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">HIJAU</text></g><g><rect x="360" y="0" width="240" height="240" fill="#F59E0B"></rect><rect x="390" y="30" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"></rect><!--[-->`);
    const each_array_1 = ensure_array_like(YARD_PIXEL_COORDS.yellow);
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      let pt = each_array_1[i];
      $$renderer2.push(`<circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="22" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"></circle><circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="8" fill="#fde68a"></circle>`);
    }
    $$renderer2.push(`<!--]--><text x="480" y="25" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">KUNING</text></g><g><rect x="0" y="360" width="240" height="240" fill="#EF4444"></rect><rect x="30" y="390" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"></rect><!--[-->`);
    const each_array_2 = ensure_array_like(YARD_PIXEL_COORDS.red);
    for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
      let pt = each_array_2[i];
      $$renderer2.push(`<circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="22" fill="#fee2e2" stroke="#ef4444" stroke-width="3"></circle><circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="8" fill="#fecaca"></circle>`);
    }
    $$renderer2.push(`<!--]--><text x="120" y="385" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">MERAH</text></g><g><rect x="360" y="360" width="240" height="240" fill="#3B82F6"></rect><rect x="390" y="390" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"></rect><!--[-->`);
    const each_array_3 = ensure_array_like(YARD_PIXEL_COORDS.blue);
    for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
      let pt = each_array_3[i];
      $$renderer2.push(`<circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="22" fill="#dbeafe" stroke="#3b82f6" stroke-width="3"></circle><circle${attr("cx", pt.x)}${attr("cy", pt.y)} r="8" fill="#bfdbfe"></circle>`);
    }
    $$renderer2.push(`<!--]--><text x="480" y="385" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">BIRU</text></g><g id="track-cells"><!--[-->`);
    const each_array_4 = ensure_array_like(trackCellsList());
    for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
      let cell = each_array_4[$$index_4];
      const isStartRed = cell.specialType === "START_RED";
      const isStartGreen = cell.specialType === "START_GREEN";
      const isStartYellow = cell.specialType === "START_YELLOW";
      const isStartBlue = cell.specialType === "START_BLUE";
      const isSafeStar = cell.specialType === "SAFE_STAR";
      $$renderer2.push(`<rect${attr("x", cell.x)}${attr("y", cell.y)} width="40" height="40"${attr("fill", isStartRed ? "#ef4444" : isStartGreen ? "#10b981" : isStartYellow ? "#f59e0b" : isStartBlue ? "#3b82f6" : isSafeStar ? "#f1f5f9" : "#ffffff")} stroke="#cbd5e1" stroke-width="1"></rect>`);
      if (isStartRed) {
        $$renderer2.push(`<!--[0--><polygon${attr("points", `${stringify(cell.x + 20)},${stringify(cell.y + 8)} ${stringify(cell.x + 10)},${stringify(cell.y + 24)} ${stringify(cell.x + 16)},${stringify(cell.y + 24)} ${stringify(cell.x + 16)},${stringify(cell.y + 32)} ${stringify(cell.x + 24)},${stringify(cell.y + 32)} ${stringify(cell.x + 24)},${stringify(cell.y + 24)} ${stringify(cell.x + 30)},${stringify(cell.y + 24)}`)} fill="#ffffff"></polygon>`);
      } else if (isStartGreen) {
        $$renderer2.push(`<!--[1--><polygon${attr("points", `${stringify(cell.x + 32)},${stringify(cell.y + 20)} ${stringify(cell.x + 16)},${stringify(cell.y + 10)} ${stringify(cell.x + 16)},${stringify(cell.y + 16)} ${stringify(cell.x + 8)},${stringify(cell.y + 16)} ${stringify(cell.x + 8)},${stringify(cell.y + 24)} ${stringify(cell.x + 16)},${stringify(cell.y + 24)} ${stringify(cell.x + 16)},${stringify(cell.y + 30)}`)} fill="#ffffff"></polygon>`);
      } else if (isStartYellow) {
        $$renderer2.push(`<!--[2--><polygon${attr("points", `${stringify(cell.x + 20)},${stringify(cell.y + 32)} ${stringify(cell.x + 10)},${stringify(cell.y + 16)} ${stringify(cell.x + 16)},${stringify(cell.y + 16)} ${stringify(cell.x + 16)},${stringify(cell.y + 8)} ${stringify(cell.x + 24)},${stringify(cell.y + 8)} ${stringify(cell.x + 24)},${stringify(cell.y + 16)} ${stringify(cell.x + 30)},${stringify(cell.y + 16)}`)} fill="#ffffff"></polygon>`);
      } else if (isStartBlue) {
        $$renderer2.push(`<!--[3--><polygon${attr("points", `${stringify(cell.x + 8)},${stringify(cell.y + 20)} ${stringify(cell.x + 24)},${stringify(cell.y + 10)} ${stringify(cell.x + 24)},${stringify(cell.y + 16)} ${stringify(cell.x + 32)},${stringify(cell.y + 16)} ${stringify(cell.x + 32)},${stringify(cell.y + 24)} ${stringify(cell.x + 24)},${stringify(cell.y + 24)} ${stringify(cell.x + 24)},${stringify(cell.y + 30)}`)} fill="#ffffff"></polygon>`);
      } else if (isSafeStar) {
        $$renderer2.push(`<!--[4--><path${attr("d", `M ${stringify(cell.x + 20)} ${stringify(cell.y + 10)}
               L ${stringify(cell.x + 22.8)} ${stringify(cell.y + 16.5)}
               L ${stringify(cell.x + 29.5)} ${stringify(cell.y + 17.1)}
               L ${stringify(cell.x + 24.4)} ${stringify(cell.y + 21.6)}
               L ${stringify(cell.x + 25.9)} ${stringify(cell.y + 28.2)}
               L ${stringify(cell.x + 20)} ${stringify(cell.y + 24.8)}
               L ${stringify(cell.x + 14.1)} ${stringify(cell.y + 28.2)}
               L ${stringify(cell.x + 15.6)} ${stringify(cell.y + 21.6)}
               L ${stringify(cell.x + 10.5)} ${stringify(cell.y + 17.1)}
               L ${stringify(cell.x + 17.2)} ${stringify(cell.y + 16.5)} Z`)} fill="#64748b"></path>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></g><!--[-->`);
    const each_array_5 = ensure_array_like(HOME_COLUMN_GRID_COORDS.red);
    for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
      let [c, r] = each_array_5[$$index_5];
      $$renderer2.push(`<rect${attr("x", c * 40)}${attr("y", r * 40)} width="40" height="40" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"></rect>`);
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    const each_array_6 = ensure_array_like(HOME_COLUMN_GRID_COORDS.green);
    for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
      let [c, r] = each_array_6[$$index_6];
      $$renderer2.push(`<rect${attr("x", c * 40)}${attr("y", r * 40)} width="40" height="40" fill="#10b981" stroke="#ffffff" stroke-width="1.5"></rect>`);
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    const each_array_7 = ensure_array_like(HOME_COLUMN_GRID_COORDS.yellow);
    for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
      let [c, r] = each_array_7[$$index_7];
      $$renderer2.push(`<rect${attr("x", c * 40)}${attr("y", r * 40)} width="40" height="40" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"></rect>`);
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    const each_array_8 = ensure_array_like(HOME_COLUMN_GRID_COORDS.blue);
    for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
      let [c, r] = each_array_8[$$index_8];
      $$renderer2.push(`<rect${attr("x", c * 40)}${attr("y", r * 40)} width="40" height="40" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5"></rect>`);
    }
    $$renderer2.push(`<!--]--><g id="center-home"><polygon points="240,240 360,240 300,300" fill="#f59e0b" stroke="#ffffff" stroke-width="1"></polygon><polygon points="360,240 360,360 300,300" fill="#3b82f6" stroke="#ffffff" stroke-width="1"></polygon><polygon points="360,360 240,360 300,300" fill="#ef4444" stroke="#ffffff" stroke-width="1"></polygon><polygon points="240,360 240,240 300,300" fill="#10b981" stroke="#ffffff" stroke-width="1"></polygon><circle cx="300" cy="300" r="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"></circle><circle cx="300" cy="300" r="12" fill="#0f172a"></circle><path d="M 300 293
           L 302 297.5
           L 307 298
           L 303.2 301.2
           L 304.5 306
           L 300 303.5
           L 295.5 306
           L 296.8 301.2
           L 293 298
           L 298 297.5 Z" fill="#facc15"></path></g><g id="tokens-layer"><!--[-->`);
    const each_array_9 = ensure_array_like(allRenderedTokens());
    for (let $$index_9 = 0, $$length = each_array_9.length; $$index_9 < $$length; $$index_9++) {
      let item = each_array_9[$$index_9];
      const gradId = `token-${item.color}`;
      $$renderer2.push(`<g${attr("transform", `translate(${stringify(item.renderX)}, ${stringify(item.renderY)})`)}${attr_class(`transition-transform duration-300 ${item.isEligible ? "cursor-pointer" : ""}`)}${attr("filter", item.isEligible ? "url(#active-glow)" : "url(#pawn-shadow)")}>`);
      if (item.isEligible) {
        $$renderer2.push(`<!--[0--><circle cx="0" cy="0" r="18" fill="none" stroke="#ffffff" stroke-width="2.5" class="animate-ping opacity-75"></circle><circle cx="0" cy="0" r="16" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="3,3"></circle>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--><ellipse cx="0" cy="8" rx="12" ry="4" fill="rgba(0,0,0,0.35)"></ellipse><ellipse cx="0" cy="5" rx="11" ry="4"${attr("fill", `url(#${gradId})`)} stroke="#ffffff" stroke-width="0.8"></ellipse><path d="M -9,5 C -8,-2 -5,-8 0,-10 C 5,-8 8,-2 9,5 Z"${attr("fill", `url(#${gradId})`)} stroke="#ffffff" stroke-width="0.8"></path><circle cx="0" cy="-11" r="7"${attr("fill", `url(#${gradId})`)} stroke="#ffffff" stroke-width="0.8"></circle><circle cx="-2" cy="-13" r="2.2" fill="rgba(255, 255, 255, 0.75)"></circle><text x="0" y="-2" fill="#ffffff" font-size="7" font-weight="bold" text-anchor="middle" class="pointer-events-none">${escape_html(item.token.id + 1)}</text></g>`);
    }
    $$renderer2.push(`<!--]--></g></svg></div>`);
  });
}
function TurnHUD($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      activePlayer = null,
      myPlayerId = "",
      timeLeft = 10,
      totalTimer = 10,
      gameState = "WAITING_FOR_ROLL",
      currentChallenge = { screenNumber: 0, op: "+" },
      currentRoll = null
    } = $$props;
    let userNumberInput = "";
    const isMyTurn = derived(() => activePlayer?.id === myPlayerId);
    const activeColor = derived(() => activePlayer ? COLOR_CONFIG[activePlayer.color] : null);
    const isTimerPaused = derived(() => timeLeft === null || gameState === "WAITING_FOR_MOVE");
    const progressPercent = derived(() => isTimerPaused() ? 100 : Math.max(0, Math.min(100, (timeLeft ?? 10) / (totalTimer || 10) * 100)));
    $$renderer2.push(`<div class="w-full max-w-xl mx-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3"><div class="flex items-center justify-between gap-3"><div class="flex items-center gap-2 min-w-0"><div class="w-4 h-4 rounded-full flex-shrink-0 shadow"${attr_style(`background-color: ${stringify(activeColor()?.hex ?? "#64748b")}`)}></div> <div class="truncate"><span class="text-xs text-slate-400 font-medium">Giliran:</span> <strong class="text-sm font-bold text-white">${escape_html(activePlayer?.name ?? "Menunggu")}</strong> `);
    if (isMyTurn()) {
      $$renderer2.push(`<!--[0--><span class="ml-1 text-[11px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">(Kamu)</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex-shrink-0"><svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> `);
    if (isTimerPaused()) {
      $$renderer2.push(`<!--[0--><span class="text-[11px] font-bold text-emerald-400 font-mono">Timer Dijeda</span>`);
    } else {
      $$renderer2.push(`<!--[-1--><span${attr_class(`font-mono font-bold text-sm ${timeLeft <= 3 ? "text-rose-400 animate-pulse" : "text-slate-200"}`)}>${escape_html(timeLeft)}s</span>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800"><div${attr_class(`h-full transition-all duration-300 rounded-full ${isTimerPaused() ? "bg-emerald-500" : timeLeft <= 3 ? "bg-rose-500" : "bg-indigo-500"}`)}${attr_style(`width: ${stringify(progressPercent())}%;`)}></div></div> `);
    if (isMyTurn()) {
      $$renderer2.push("<!--[0-->");
      if (gameState === "WAITING_FOR_ROLL") {
        $$renderer2.push(`<!--[0--><div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3"><div class="flex items-center justify-between text-xs"><span class="text-slate-400 font-semibold uppercase tracking-wider">Tentukan Angka Kalkulasimu</span> <span class="text-[11px] text-slate-500">Angka di layar: <strong class="text-indigo-400 font-mono">${escape_html(currentChallenge?.screenNumber ?? 0)}</strong></span></div> <div class="flex items-center justify-center gap-2 font-mono text-lg font-black text-white py-1"><span class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-indigo-400">${escape_html(currentChallenge?.screenNumber ?? 0)}</span> <span class="text-xl text-amber-400">${escape_html(currentChallenge?.op ?? "+")}</span> <input type="number"${attr("value", userNumberInput)} placeholder="Angka kamu" class="w-32 px-3 py-1.5 bg-slate-900 border border-indigo-500/50 rounded-lg text-center text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"/> <span class="text-slate-500">=</span> <span class="text-slate-400 text-sm font-sans font-medium">?</span></div> <div class="flex items-center justify-center gap-1.5 pt-1"><span class="text-[11px] text-slate-500 mr-1">Target cepat:</span> <button type="button" class="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 transition" title="Kalkulasi otomatis agar hasil jadi +6">Target +6</button> <button type="button" class="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-amber-400 transition" title="Kalkulasi otomatis agar hasil jadi -6">Target -6</button> <button type="button" class="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition">Acak</button></div> <button type="button" class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="4"></rect><path d="M8 8h.01"></path><path d="M12 12h.01"></path><path d="M16 16h.01"></path></svg> <span>Hitung &amp; Lempar Dadu</span></button></div>`);
      } else if (gameState === "WAITING_FOR_MOVE") {
        $$renderer2.push(`<!--[1--><div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5"><div class="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2"><span class="text-slate-400 font-semibold uppercase tracking-wider">Hasil Dadu Matematika</span> <span class="text-[11px] font-mono text-indigo-400 font-bold">(${escape_html(currentRoll?.a ?? 0)}) ${escape_html(currentRoll?.op ?? "+")} (${escape_html(currentRoll?.b ?? 0)}) = ${escape_html(currentRoll?.raw ?? 0)}</span></div> <div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2">`);
        if (currentRoll?.raw === 0) {
          $$renderer2.push(`<!--[0--><span class="text-sm font-bold text-slate-400">Diam di Tempat (0 Langkah)</span>`);
        } else {
          $$renderer2.push(`<!--[-1--><span${attr_class(`text-sm font-black ${currentRoll?.direction === "FORWARD" ? "text-emerald-400" : "text-rose-400"}`)}>${escape_html(currentRoll?.direction === "FORWARD" ? "MAJU" : "MUNDUR")} ${escape_html(currentRoll?.steps ?? 0)} LANGKAH</span>`);
        }
        $$renderer2.push(`<!--]--></div> <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Waktu Dijeda</span></div> `);
        if (currentRoll?.steps === 6) {
          $$renderer2.push(`<!--[0--><div class="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-semibold flex items-center gap-2"><svg class="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> <span>Angka 6 / -6: Bidak bisa keluar dari pangkalan atau bergerak di papan. Mendapat giliran lagi!</span></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="text-[11px] text-slate-400 text-center font-medium">Klik salah satu bidak yang berdenyut di papan untuk bergerak.</div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1"><div class="text-xs text-slate-300 font-medium">`);
      if (gameState === "WAITING_FOR_ROLL") {
        $$renderer2.push(`<!--[0-->Menunggu <strong>${escape_html(activePlayer?.name ?? "pemain")}</strong> menentukan angka kalkulasi...`);
      } else if (gameState === "WAITING_FOR_MOVE") {
        $$renderer2.push(`<!--[1--><strong>${escape_html(activePlayer?.name ?? "Pemain")}</strong> menghasilkan ${escape_html(currentRoll?.steps ?? 0)} langkah (${escape_html(currentRoll?.direction === "FORWARD" ? "Maju" : "Mundur")}). Sedang memilih bidak...`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (currentChallenge) {
        $$renderer2.push(`<!--[0--><div class="text-[11px] text-slate-500 font-mono">Angka di layar: (${escape_html(currentChallenge.screenNumber)}) ${escape_html(currentChallenge.op)} [ ? ]</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Lobby($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      playerName = "",
      room = null,
      player = null,
      onCreateRoom = () => {
      },
      onJoinRoom = () => {
      },
      onStartGame = () => {
      },
      onLeaveRoom = () => {
      },
      onShowLeaderboard = () => {
      }
    } = $$props;
    $$renderer2.push(`<div class="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">`);
    if (!room) {
      $$renderer2.push(`<!--[0--><div class="text-center space-y-2"><div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-2 border border-indigo-500/30"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="4"></rect><path d="M8 8h.01"></path><path d="M12 12h.01"></path><path d="M16 16h.01"></path><path d="M16 8h.01"></path><path d="M8 16h.01"></path></svg></div> <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">Ludo Dadu Matematika</h1> <p class="text-sm text-slate-400">Multiplayer 2 sampai 4 pemain dengan dadu persamaan matematika dan safe zone.</p></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="space-y-2"><label for="player-name" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Nama Pemain</label> <input id="player-name" type="text" maxlength="15"${attr("value", playerName)} placeholder="Ketik namamu..." class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"/></div> `);
      {
        $$renderer2.push(`<!--[0--><div class="grid grid-cols-2 gap-3 pt-2"><button class="py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> <span>Buat Kamar</span></button> <button class="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-bold rounded-xl border border-slate-700 shadow-lg transition flex items-center justify-center gap-2"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-6 6 2-2m-8 8 2-2m2 2 4-4m-4 4-2-2m2 2-4-4"></path><circle cx="7.5" cy="15.5" r="4.5"></circle></svg> <span>Gabung Kamar</span></button></div> <div class="pt-2 text-center"><button class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">Lihat Peringkat &amp; Statistik Pemain</button></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="space-y-6"><div class="flex items-center justify-between border-b border-slate-800 pb-4"><div><div class="text-xs text-slate-400 font-semibold uppercase">Kode Kamar</div> <div class="text-3xl font-black font-mono tracking-widest text-indigo-400">${escape_html(room.code)}</div></div> <div class="flex items-center gap-2"><button class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition">${escape_html("Salin Kode")}</button> <button class="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold rounded-lg transition">Keluar</button></div></div> <div class="flex justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800"><span>Timer: <strong class="text-slate-200">${escape_html(room.defaultTimer)} detik</strong></span> <span>Kapasitas: <strong class="text-slate-200">${escape_html(room.players.length)} / ${escape_html(room.maxPlayers)}</strong></span></div> <div class="space-y-2"><div class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pemain Bergabung (${escape_html(room.players.length)})</div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"><!--[-->`);
      const each_array_2 = ensure_array_like(room.players);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let p = each_array_2[$$index_2];
        $$renderer2.push(`<div class="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl"><div class="w-4 h-4 rounded-full shadow-md flex-shrink-0"${attr_style(`background-color: ${stringify(COLOR_CONFIG[p.color]?.hex || "#6366f1")}`)}></div> <div class="flex-1 min-w-0"><div class="text-sm font-bold text-white truncate flex items-center gap-1.5"><span>${escape_html(p.name)}</span> `);
        if (p.connected === false) {
          $$renderer2.push(`<!--[0--><span class="text-[10px] text-rose-400 font-normal">(Terputus)</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="text-[10px] text-slate-500">Warna ${escape_html(COLOR_CONFIG[p.color]?.name || p.color || "Pemain")}</div></div> `);
        if (p.isHost) {
          $$renderer2.push(`<!--[0--><span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md flex-shrink-0">Host</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (player?.isHost) {
        $$renderer2.push(`<!--[0--><button${attr("disabled", room.players.length < 2, true)} class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-base rounded-xl shadow-lg transition active:scale-[0.98]">${escape_html(room.players.length < 2 ? "Menunggu Minimal 2 Pemain..." : "Mulai Permainan Sekarang")}</button>`);
      } else {
        $$renderer2.push(`<!--[-1--><div class="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400 animate-pulse">Menunggu Host memulai permainan...</div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { playerName });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let socket = null;
    let sessionId = "";
    let playerName = "";
    let currentRoom = null;
    let myPlayer = null;
    let gameView = "LOBBY";
    let tokens = {};
    let activePlayer = null;
    let timeLeft = 10;
    let totalTimer = 10;
    let gameState = "WAITING_FOR_ROLL";
    let currentChallenge = { screenNumber: 0, op: "+" };
    let currentRoll = null;
    let validTokenIds = [];
    let winners = [];
    function handleCreateRoom({ name, timer, maxPlayers }, callback) {
      localStorage.setItem("ludo_math_player_name", name);
      socket.emit("create_room", { name, timer, maxPlayers, sessionId }, (res) => {
        if (res && res.success) {
          currentRoom = res.room;
          myPlayer = res.player;
          localStorage.setItem("ludo_math_room_code", res.room.code);
          if (callback) callback(null);
        } else {
          if (callback) callback(res?.error || "Gagal membuat kamar.");
        }
      });
    }
    function handleJoinRoom({ name, code }, callback) {
      localStorage.setItem("ludo_math_player_name", name);
      socket.emit("join_room", { name, code, sessionId }, (res) => {
        if (res && res.success) {
          currentRoom = res.room;
          myPlayer = res.player;
          localStorage.setItem("ludo_math_room_code", res.room.code);
          if (res.gameStarted) {
            gameView = "PLAYING";
            tokens = res.tokens || {};
            activePlayer = res.activePlayer;
            totalTimer = res.currentTimer || 10;
            timeLeft = res.timeLeft ?? 10;
            gameState = res.gameState || "WAITING_FOR_ROLL";
            if (res.currentChallenge) currentChallenge = res.currentChallenge;
            currentRoll = res.currentRoll || null;
            validTokenIds = res.validTokenIds || [];
            winners = res.winners || [];
          }
          if (callback) callback(null);
        } else {
          if (callback) callback(res?.error || "Kamar tidak ditemukan.");
        }
      });
    }
    function handleStartGame() {
      if (!currentRoom) return;
      socket.emit("start_game", { code: currentRoom.code }, () => {
      });
    }
    function openLeaderboard() {
      return;
    }
    function leaveGame() {
      if (currentRoom && socket) {
        socket.emit("leave_room", { code: currentRoom.code });
      }
      localStorage.removeItem("ludo_math_room_code");
      currentRoom = null;
      myPlayer = null;
      gameView = "LOBBY";
      tokens = {};
      activePlayer = null;
      validTokenIds = [];
      currentRoll = null;
      winners = [];
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1uha8ag", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Ludo Dadu Matematika - Multiplayer</title>`);
        });
      });
      $$renderer3.push(`<main class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6"><header class="max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800 mb-4"><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="4"></rect><path d="M8 8h.01"></path><path d="M12 12h.01"></path><path d="M16 16h.01"></path><path d="M16 8h.01"></path><path d="M8 16h.01"></path></svg></div> <span class="font-extrabold text-base sm:text-lg tracking-tight text-white">Ludo Dadu Matematika</span></div> <div class="flex items-center gap-2 sm:gap-3"><button class="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-semibold transition flex items-center gap-1.5"><svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> <span>Peringkat</span></button> <button class="text-xs p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition"${attr("title", "Matikan Suara")}${attr("aria-label", "Matikan Suara")}>`);
      {
        $$renderer3.push(`<!--[0--><svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`);
      }
      $$renderer3.push(`<!--]--></button> `);
      if (gameView !== "LOBBY") {
        $$renderer3.push(`<!--[0--><button class="text-xs px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg text-rose-300 font-semibold transition">Keluar</button>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div></header> <div class="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto space-y-4">`);
      if (gameView === "LOBBY") {
        $$renderer3.push("<!--[1-->");
        Lobby($$renderer3, {
          room: currentRoom,
          player: myPlayer,
          onCreateRoom: handleCreateRoom,
          onJoinRoom: handleJoinRoom,
          onStartGame: handleStartGame,
          onLeaveRoom: leaveGame,
          onShowLeaderboard: openLeaderboard,
          get playerName() {
            return playerName;
          },
          set playerName($$value) {
            playerName = $$value;
            $$settled = false;
          }
        });
      } else if (gameView === "PLAYING") {
        $$renderer3.push("<!--[2-->");
        TurnHUD($$renderer3, {
          activePlayer,
          myPlayerId: sessionId,
          timeLeft,
          totalTimer,
          gameState,
          currentChallenge,
          currentRoll
        });
        $$renderer3.push(`<!----> `);
        BoardSvg($$renderer3, {
          players: currentRoom?.players ?? [],
          tokens,
          validTokenIds,
          activePlayerId: activePlayer?.id
        });
        $$renderer3.push(`<!---->`);
      } else if (gameView === "FINISHED") {
        $$renderer3.push(`<!--[3--><div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl"><div class="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30"><svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg></div> <h2 class="text-2xl font-black text-white">Permainan Selesai!</h2> <p class="text-sm text-slate-400">Selamat kepada para pemenang yang berhasil memasukkan seluruh bidaknya ke zona finish!</p> <div class="space-y-2"><!--[-->`);
        const each_array = ensure_array_like(winners);
        for (let idx = 0, $$length = each_array.length; idx < $$length; idx++) {
          let winnerId = each_array[idx];
          const p = currentRoom?.players.find((x) => x.id === winnerId);
          $$renderer3.push(`<div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800"><span class="font-bold text-amber-400 text-sm">Juara ${escape_html(idx + 1)}</span> <span class="font-bold text-white text-sm">${escape_html(p?.name ?? "Pemain")}</span></div>`);
        }
        $$renderer3.push(`<!--]--></div> <button class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition">Kembali ke Menu Utama</button></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div> <footer class="text-center py-4 text-xs text-slate-600">Ludo Dadu Matematika • Input angka untuk dikalkulasikan dengan angka layar • 6 atau -6 bergerak dua kali atau keluarkan bidak</footer> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></main>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
