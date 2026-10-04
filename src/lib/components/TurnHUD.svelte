<script>
  import { COLOR_CONFIG } from '../../../server/game/Board.js';

  let {
    activePlayer = null,
    myPlayerId = '',
    timeLeft = 10,
    totalTimer = 10,
    gameState = 'WAITING_FOR_ROLL',
    validTokenIds = [],
    currentChallenge = null,
    currentRoll = null,
    onSpin = () => {},
    onRoll = () => {}
  } = $props();

  let userNumberInput = $state('');

  // Hapus input angka saat selesai move / challenge direset
  $effect(() => {
    if (!currentChallenge) {
      userNumberInput = '';
    }
  });

  const isMyTurn = $derived(activePlayer?.id === myPlayerId);
  const activeColor = $derived(activePlayer ? COLOR_CONFIG[activePlayer.color] : null);
  // Timer dijeda jika belum roll (currentChallenge null) atau sedang memilih bidak
  const isTimerPaused = $derived(timeLeft === null || !currentChallenge || gameState === 'WAITING_FOR_MOVE');
  const progressPercent = $derived(
    isTimerPaused ? 100 : Math.max(0, Math.min(100, ((timeLeft ?? 10) / (totalTimer || 10)) * 100))
  );

  function handleSubmitRoll() {
    let num = Number(userNumberInput);
    if (userNumberInput === '' || isNaN(num)) {
      num = 0;
    }
    onRoll(Math.round(num));
    userNumberInput = '';
  }
</script>

<div class="w-full max-w-xl mx-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
  <!-- Active Player Header & Timer Status -->
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2.5 min-w-0">
      <!-- Kelap-kelip Active Player Beacon Dot -->
      <span class="relative flex h-3.5 w-3.5 flex-shrink-0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: {activeColor?.hex ?? '#10b981'}"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 shadow-sm" style="background-color: {activeColor?.hex ?? '#10b981'}"></span>
      </span>

      <div class="truncate flex items-center gap-1.5">
        <span class="text-xs text-slate-400 font-medium">Giliran:</span>
        <strong class="text-sm font-black text-white">{activePlayer?.name ?? 'Menunggu'}</strong>
        {#if isMyTurn}
          <span class="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            Kamu
          </span>
        {/if}
      </div>

      <!-- Kelap-kelip status badge -->
      <div class="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black tracking-wide animate-pulse">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span>AKTIF</span>
      </div>
    </div>

    <!-- Timer Countdown Badge -->
    <div class="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex-shrink-0">
      <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {#if !currentChallenge && gameState !== 'WAITING_FOR_MOVE'}
        <span class="text-[11px] font-bold text-slate-400 font-mono">
          Menunggu Roll
        </span>
      {:else if isTimerPaused}
        <span class="text-[11px] font-bold text-emerald-400 font-mono">
          Timer Dijeda
        </span>
      {:else}
        <span class="font-mono font-bold text-sm {timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}">
          {timeLeft}s
        </span>
      {/if}
    </div>
  </div>

  <!-- Animated Progress Bar -->
  <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
    <div
      class="h-full transition-all duration-300 rounded-full {isTimerPaused ? 'bg-emerald-500' : (timeLeft <= 3 ? 'bg-rose-500' : 'bg-indigo-500')}"
      style="width: {progressPercent}%;"
    ></div>
  </div>

  <!-- Main Turn Interaction Area -->
  {#if isMyTurn}
    {#if gameState !== 'WAITING_FOR_MOVE' && !currentChallenge}
      <!-- STEP 1: Tombol Roll Dadu Dulu (Timer belum berjalan) -->
      <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
        <p class="text-xs text-slate-300 font-medium">
          Sekarang giliranmu! Timer belum berjalan. Silakan lempar dadu untuk memulai kalkulasi.
        </p>
        <button
          type="button"
          onclick={onSpin}
          class="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="4" />
            <path d="M8 8h.01" />
            <path d="M12 12h.01" />
            <path d="M16 16h.01" />
            <path d="M16 8h.01" />
            <path d="M8 16h.01" />
          </svg>
          <span>Roll Dadu Sekarang</span>
        </button>
      </div>

    {:else if gameState !== 'WAITING_FOR_MOVE' && currentChallenge}
      <!-- STEP 2: Soal Muncul Setelah Roll Dadu (Timer Berjalan) -->
      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-semibold uppercase tracking-wider">
            Tentukan Angka Kalkulasimu
          </span>
          <span class="text-[11px] text-slate-400 font-mono">
            Rentang layar: -20 s.d. 20
          </span>
        </div>

        <!-- Equation Visual with Manual Input (TANPA SHORTCUT CHEAT) -->
        <div class="flex items-center justify-center gap-2 font-mono text-lg font-black text-white py-1">
          <span class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-indigo-400">
            {currentChallenge.screenNumber}
          </span>
          <span class="text-xl text-amber-400">
            {currentChallenge.op}
          </span>
          <input
            type="number"
            bind:value={userNumberInput}
            placeholder="Ketik angka..."
            class="w-36 px-3 py-1.5 bg-slate-900 border border-indigo-500/50 rounded-lg text-center text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            onkeydown={(e) => {
              if (e.key === 'Enter') handleSubmitRoll();
            }}
          />
          <span class="text-slate-500">=</span>
          <span class="text-slate-400 text-sm font-sans font-medium">?</span>
        </div>

        <p class="text-[11px] text-slate-500 text-center">
          Kalkulasikan sendiri di kepalamu untuk mendapatkan angka dadu target (-6 atau 6 untuk keluar pangkalan)!
        </p>

        <!-- Submit Roll Button -->
        <button
          type="button"
          onclick={handleSubmitRoll}
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Hitung & Selesaikan Dadu</span>
        </button>
      </div>

    {:else if gameState === 'WAITING_FOR_MOVE'}
      <!-- STEP 3: Hasil Kalkulasi Non-blocking & Instruksi Memilih Bidak -->
      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
          <span class="text-slate-400 font-semibold uppercase tracking-wider">Hasil Dadu Matematika</span>
          <span class="text-[11px] font-mono text-indigo-400 font-bold">
            ({currentRoll?.a ?? 0}) {currentRoll?.op ?? '+'} ({currentRoll?.b ?? 0}) = {currentRoll?.raw ?? 0}
          </span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            {#if currentRoll?.raw === 0}
              <span class="text-sm font-bold text-slate-400">Diam di Tempat (0 Langkah)</span>
            {:else}
              <span class="text-sm font-black {currentRoll?.direction === 'FORWARD' ? 'text-emerald-400' : 'text-rose-400'}">
                {currentRoll?.direction === 'FORWARD' ? 'MAJU' : 'MUNDUR'} {currentRoll?.steps ?? 0} LANGKAH
              </span>
            {/if}
          </div>

          <span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Waktu Dijeda
          </span>
        </div>

        <!-- Special Alert for 6 or -6 -->
        {#if currentRoll?.steps === 6}
          <div class="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-semibold flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Angka 6 / -6: Bidak bisa keluar dari pangkalan atau bergerak di papan. Mendapat giliran lagi!</span>
          </div>
        {/if}

        <div class="text-[11px] text-slate-400 text-center font-medium">
          Klik salah satu bidak yang berdenyut di papan untuk bergerak.
        </div>
      </div>
    {/if}

  {:else}
    <!-- Opponent Turn View -->
    <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
      <div class="text-xs text-slate-300 font-medium">
        {#if !currentChallenge && gameState !== 'WAITING_FOR_MOVE'}
          Menunggu <strong>{activePlayer?.name ?? 'pemain'}</strong> melempar dadu...
        {:else if currentChallenge && gameState !== 'WAITING_FOR_MOVE'}
          <strong>{activePlayer?.name ?? 'Pemain'}</strong> sedang menghitung di kepalanya...
        {:else if gameState === 'WAITING_FOR_MOVE'}
          <strong>{activePlayer?.name ?? 'Pemain'}</strong> menghasilkan {currentRoll?.steps ?? 0} langkah ({currentRoll?.direction === 'FORWARD' ? 'Maju' : 'Mundur'}). Sedang memilih bidak...
        {/if}
      </div>
      {#if currentChallenge}
        <div class="text-[11px] text-slate-500 font-mono">
          Angka di layar: ({currentChallenge.screenNumber}) {currentChallenge.op} [ ? ]
        </div>
      {/if}
    </div>
  {/if}
</div>
