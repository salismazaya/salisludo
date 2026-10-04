<script>
  let { leaderboard = [], onClose = () => {} } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
  <div class="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-white">Peringkat & Statistik Pemain</h2>
      </div>
      <button
        onclick={onClose}
        class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        aria-label="Tutup dialog"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Table of stats from SQLite -->
    {#if leaderboard.length === 0}
      <!-- Empty State (Antislop R-27) -->
      <div class="py-10 text-center space-y-2">
        <div class="w-10 h-10 mx-auto text-slate-600 flex items-center justify-center">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <p class="text-sm text-slate-400 font-medium">Belum ada statistik pertandingan tersimpan.</p>
        <p class="text-xs text-slate-500">Selesaikan game pertama untuk mencatatkan namamu di papan peringkat!</p>
      </div>
    {:else}
      <div class="overflow-x-auto max-h-80">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-950/50 sticky top-0">
            <tr>
              <th class="py-2.5 px-3">No</th>
              <th class="py-2.5 px-3">Pemain</th>
              <th class="py-2.5 px-3 text-center">Menang</th>
              <th class="py-2.5 px-3 text-center">Main</th>
              <th class="py-2.5 px-3 text-center">Makan</th>
              <th class="py-2.5 px-3 text-center">Roll 6</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 font-mono">
            {#each leaderboard as player, idx}
              <tr class="hover:bg-slate-800/40 transition">
                <td class="py-2 px-3 text-slate-500 font-sans">{idx + 1}</td>
                <td class="py-2 px-3 font-bold font-sans text-white">{player.name}</td>
                <td class="py-2 px-3 text-center font-bold text-amber-400">{player.games_won}</td>
                <td class="py-2 px-3 text-center text-slate-400">{player.games_played}</td>
                <td class="py-2 px-3 text-center text-rose-400">{player.total_captures}</td>
                <td class="py-2 px-3 text-center text-indigo-400">{player.total_sixes}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <button
      onclick={onClose}
      class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition text-xs"
    >
      Tutup
    </button>
  </div>
</div>
