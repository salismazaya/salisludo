import { a5 as head, a6 as attr, a3 as escape_html, a7 as ensure_array_like, a8 as attr_style, a9 as stringify, aa as bind_props } from '../../chunks/index.js-j6664L0K.js';
import 'socket.io-client';
import '../../chunks/utils.js-DBwpgn00.js';
import '../../chunks/utils2.js-BQzn9ikS.js';

const COLOR_CONFIG = {
  red: { index: 0, hex: "#EF4444", name: "Merah" },
  green: { index: 1, hex: "#10B981", name: "Hijau" },
  yellow: { index: 2, hex: "#F59E0B", name: "Kuning" },
  blue: { index: 3, hex: "#3B82F6", name: "Biru" },
  purple: { index: 4, hex: "#8B5CF6", name: "Ungu" },
  orange: { index: 5, hex: "#F97316", name: "Oranye" }
};
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
      onShowLeaderboard = () => {
      }
    } = $$props;
    $$renderer2.push(`<div class="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">`);
    if (!room) {
      $$renderer2.push(`<!--[0--><div class="text-center space-y-2"><div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 text-3xl mb-2 border border-indigo-500/30">🎲</div> <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">Ludo Dadu Matematika</h1> <p class="text-sm text-slate-400">Multiplayer 6 pemain dengan dadu persamaan matematika dan safe zone.</p></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="space-y-2"><label for="player-name" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Nama Pemain</label> <input id="player-name" type="text" maxlength="15"${attr("value", playerName)} placeholder="Ketik namamu..." class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"/></div> `);
      {
        $$renderer2.push(`<!--[0--><div class="grid grid-cols-2 gap-3 pt-2"><button class="py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"><span>➕</span> <span>Buat Kamar</span></button> <button class="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-bold rounded-xl border border-slate-700 shadow-lg transition flex items-center justify-center gap-2"><span>🔑</span> <span>Gabung Kamar</span></button></div> <div class="pt-2 text-center"><button class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">Lihat Peringkat &amp; Statistik Pemain</button></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push(`<!--[-1--><div class="space-y-6"><div class="flex items-center justify-between border-b border-slate-800 pb-4"><div><div class="text-xs text-slate-400 font-semibold uppercase">Kode Kamar</div> <div class="text-3xl font-black font-mono tracking-widest text-indigo-400">${escape_html(room.code)}</div></div> <button class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition">${escape_html("Salin Kode")}</button></div> <div class="flex justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800"><span>Timer: <strong class="text-slate-200">${escape_html(room.defaultTimer)} detik</strong></span> <span>Kapasitas: <strong class="text-slate-200">${escape_html(room.players.length)} / ${escape_html(room.maxPlayers)}</strong></span></div> <div class="space-y-2"><div class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pemain Bergabung (${escape_html(room.players.length)})</div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"><!--[-->`);
      const each_array_2 = ensure_array_like(room.players);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let p = each_array_2[$$index_2];
        $$renderer2.push(`<div class="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl"><div class="w-4 h-4 rounded-full shadow-md"${attr_style(`background-color: ${stringify(COLOR_CONFIG[p.color].hex)}`)}></div> <div class="flex-1 min-w-0"><div class="text-sm font-bold text-white truncate">${escape_html(p.name)}</div> <div class="text-[10px] text-slate-500">Warna ${escape_html(COLOR_CONFIG[p.color].name)}</div></div> `);
        if (p.isHost) {
          $$renderer2.push(`<!--[0--><span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md">Host</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (player?.isHost) {
        $$renderer2.push(`<!--[0--><button${attr("disabled", room.players.length < 2, true)} class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-base rounded-xl shadow-lg transition active:scale-[0.98]">${escape_html(room.players.length < 2 ? "Menunggu Minimal 2 Pemain..." : "Mulai Permainan Sekarang")}</button>`);
      } else {
        $$renderer2.push(`<!--[-1--><div class="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">Menunggu Host memulai permainan...</div>`);
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
    let playerName = "";
    let currentRoom = null;
    let myPlayer = null;
    function handleCreateRoom({ name, timer, maxPlayers }) {
      localStorage.setItem("ludo_math_player_name", name);
      socket.emit("create_room", { name, timer, maxPlayers }, (res) => {
        if (res.success) {
          currentRoom = res.room;
          myPlayer = res.player;
        }
      });
    }
    function handleJoinRoom({ name, code }) {
      localStorage.setItem("ludo_math_player_name", name);
      socket.emit("join_room", { name, code }, (res) => {
        if (res.success) {
          currentRoom = res.room;
          myPlayer = res.player;
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
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1uha8ag", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>Ludo Dadu Matematika - Multiplayer</title>`);
        });
      });
      $$renderer3.push(`<main class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6"><header class="max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800 mb-4"><div class="flex items-center gap-2"><span class="text-2xl">🎲</span> <span class="font-extrabold text-base sm:text-lg tracking-tight text-white">Ludo Dadu Matematika</span></div> <div class="flex items-center gap-3"><button class="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-semibold transition">🏆 Peringkat</button> <button class="text-xs p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition"${attr("title", "Matikan Suara")}${attr("aria-label", "Matikan Suara")}>${escape_html("🔊")}</button> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div></header> <div class="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto space-y-4">`);
      {
        $$renderer3.push("<!--[0-->");
        Lobby($$renderer3, {
          room: currentRoom,
          player: myPlayer,
          onCreateRoom: handleCreateRoom,
          onJoinRoom: handleJoinRoom,
          onStartGame: handleStartGame,
          onShowLeaderboard: openLeaderboard,
          get playerName() {
            return playerName;
          },
          set playerName($$value) {
            playerName = $$value;
            $$settled = false;
          }
        });
      }
      $$renderer3.push(`<!--]--></div> <footer class="text-center py-4 text-xs text-slate-600">Ludo Dadu Matematika • Aturan Dadu: 7 jadi 1, 8 jadi 2, 5 jadi 5, 0 diam, 6 lempar lagi (waktu giliran dibagi 2)</footer> `);
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

export { _page as default };
//# sourceMappingURL=_page.svelte.js-DEVCNPvD.js.map
