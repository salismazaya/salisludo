<script>
  let { roll = null, onClose = () => {} } = $props();
</script>

{#if roll}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-5">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Hasil Dadu Matematika</span>
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

      <!-- Math Equation Display -->
      <div class="bg-slate-950 rounded-xl p-4 border border-slate-800">
        <div class="text-slate-400 text-xs mb-1 font-medium">Persamaan Terpilih</div>
        <div class="text-3xl font-black font-mono tracking-wide text-indigo-400">
          ({roll.a}) {roll.op} ({roll.b}) = <span class="text-amber-400">{roll.raw}</span>
        </div>
      </div>

      <!-- Dadu Conversion Explainer -->
      <div class="space-y-2">
        {#if roll.raw === 0}
          <div class="text-xl font-bold text-slate-300">
            Angka 0: Diam di Tempat
          </div>
          <p class="text-sm text-slate-400">
            Hasil perhitungan adalah 0, sehingga bidak tetap di posisinya.
          </p>
        {:else}
          <div class="flex items-center justify-center gap-3">
            <span class="text-2xl font-black {roll.direction === 'FORWARD' ? 'text-emerald-400' : 'text-rose-400'}">
              {roll.direction === 'FORWARD' ? 'MAJU' : 'MUNDUR'} {roll.steps} LANGKAH
            </span>
          </div>
          <p class="text-xs text-slate-400">
            Nilai mentah {roll.raw} dimodulo 6 menghasilkan {roll.steps} langkah {roll.direction === 'FORWARD' ? 'ke depan' : 'ke belakang'}.
          </p>
        {/if}
      </div>

      <!-- Extra Turn Alert for 6 -->
      {#if roll.extraTurn}
        <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 space-y-1">
          <div class="font-bold text-sm flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Mendapatkan Giliran Tambahan!</span>
          </div>
          <div class="text-xs text-amber-400/80">
            Karena menghasilkan angka 6, kamu dapat melempar dadu lagi dengan waktu giliran dibagi 2.
          </div>
        </div>
      {/if}

      <button
        onclick={onClose}
        class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition active:scale-[0.98]"
      >
        Pilih Bidak untuk Bergerak
      </button>
    </div>
  </div>
{/if}
