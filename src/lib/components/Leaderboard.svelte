<script>
  let { leaderboard = [], onClose = () => {} } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
  <div class="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">🏆</span>
        <h2 class="text-lg font-bold text-white">Peringkat & Statistik Pemain</h2>
      </div>
      <button
        onclick={onClose}
        class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        aria-label="Tutup dialog"
      >
        ✕
      </button>
    </div>

    <!-- Table of stats from SQLite -->
    {#if leaderboard.length === 0}
      <!-- Empty State (Antislop R-27) -->
      <div class="py-10 text-center space-y-2">
        <div class="text-3xl text-slate-600">📊</div>
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
