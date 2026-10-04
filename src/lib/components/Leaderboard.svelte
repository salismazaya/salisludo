<script>
  let { leaderboard = [], onClose = () => {} } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
  <div class="w-full max-w-lg bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000] space-y-4 text-black">
    <div class="flex items-center justify-between border-b-3 border-black pb-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-[#FFE600] text-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <h2 class="text-lg font-black uppercase tracking-tight text-black">Papan Peringkat</h2>
      </div>
      <button
        onclick={onClose}
        class="text-black hover:bg-slate-200 p-1 border-2 border-black shadow-[1px_1px_0px_#000] transition"
        aria-label="Tutup dialog"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Table of stats from SQLite -->
    {#if leaderboard.length === 0}
      <div class="py-10 text-center space-y-2">
        <p class="text-sm font-black text-black uppercase">Belum ada statistik pertandingan tersimpan.</p>
        <p class="text-xs text-slate-700 font-bold">Selesaikan game pertama untuk mencatatkan namamu di papan peringkat!</p>
      </div>
    {:else}
      <div class="overflow-x-auto max-h-80 border-2 border-black">
        <table class="w-full text-left text-xs text-black border-collapse">
          <thead class="text-[11px] uppercase tracking-wider bg-[#FFE600] border-b-2 border-black sticky top-0 font-black">
            <tr>
              <th class="py-2.5 px-3 border-r border-black">No</th>
              <th class="py-2.5 px-3 border-r border-black">Pemain</th>
              <th class="py-2.5 px-3 text-center border-r border-black">Menang</th>
              <th class="py-2.5 px-3 text-center border-r border-black">Main</th>
              <th class="py-2.5 px-3 text-center border-r border-black">Makan</th>
              <th class="py-2.5 px-3 text-center">Roll 6</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black font-mono">
            {#each leaderboard as player, idx}
              <tr class="hover:bg-amber-100/60 transition">
                <td class="py-2 px-3 font-sans font-bold border-r border-black">{idx + 1}</td>
                <td class="py-2 px-3 font-black font-sans uppercase border-r border-black">{player.name}</td>
                <td class="py-2 px-3 text-center font-black text-black border-r border-black">{player.games_won}</td>
                <td class="py-2 px-3 text-center font-bold text-slate-700 border-r border-black">{player.games_played}</td>
                <td class="py-2 px-3 text-center font-bold text-rose-600 border-r border-black">{player.total_captures}</td>
                <td class="py-2 px-3 text-center font-bold text-blue-600">{player.total_sixes}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
