<script>
  import { COLOR_CONFIG } from '../../../server/game/Board.js';

  let {
    activePlayer = null,
    myPlayerId = '',
    timeLeft = 10,
    totalTimer = 10,
    gameState = 'WAITING_FOR_ROLL',
    validTokenIds = [],
    currentChallenge = { screenNumber: 0, op: '+' },
    currentRoll = null,
    onRoll = () => {}
  } = $props();

  let userNumberInput = $state('');

  const isMyTurn = $derived(activePlayer?.id === myPlayerId);
  const activeColor = $derived(activePlayer ? COLOR_CONFIG[activePlayer.color] : null);
  const isTimerPaused = $derived(timeLeft === null || gameState === 'WAITING_FOR_MOVE');
  const progressPercent = $derived(
    isTimerPaused ? 100 : Math.max(0, Math.min(100, ((timeLeft ?? 10) / (totalTimer || 10)) * 100))
  );

  function handleSubmitRoll() {
    let num = Number(userNumberInput);
    if (userNumberInput === '' || isNaN(num)) {
      // Default to 0 or quick random
      num = 0;
    }
    onRoll(Math.round(num));
  }

  function setTargetResult(target) {
    const screenNum = currentChallenge?.screenNumber ?? 0;
    const op = currentChallenge?.op ?? '+';
    // If op === '+': screenNum + input = target => input = target - screenNum
    // If op === '-': screenNum - input = target => input = screenNum - target
    let needed = op === '+' ? target - screenNum : screenNum - target;
    userNumberInput = String(needed);
  }

  function setRandomNumber() {
    userNumberInput = String(Math.floor(Math.random() * 201) - 100);
  }
</script>

<div class="w-full max-w-xl mx-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
  <!-- Active Player Header & Timer Status -->
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2 min-w-0">
      <div
        class="w-4 h-4 rounded-full flex-shrink-0 shadow"
        style="background-color: {activeColor?.hex ?? '#64748b'}"
      ></div>
      <div class="truncate">
        <span class="text-xs text-slate-400 font-medium">Giliran: </span>
        <strong class="text-sm font-bold text-white">{activePlayer?.name ?? 'Menunggu'}</strong>
        {#if isMyTurn}
          <span class="ml-1 text-[11px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
            (Kamu)
          </span>
        {/if}
      </div>
    </div>

    <!-- Timer Countdown Badge -->
    <div class="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex-shrink-0">
      <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {#if isTimerPaused}
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
    {#if gameState === 'WAITING_FOR_ROLL'}
      <!-- Interactive Math Input & Calculation -->
      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-semibold uppercase tracking-wider">
            Tentukan Angka Kalkulasimu
          </span>
          <span class="text-[11px] text-slate-500">
            Angka di layar: <strong class="text-indigo-400 font-mono">{currentChallenge?.screenNumber ?? 0}</strong>
          </span>
        </div>

        <!-- Equation Visual with Input -->
        <div class="flex items-center justify-center gap-2 font-mono text-lg font-black text-white py-1">
          <span class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-indigo-400">
            {currentChallenge?.screenNumber ?? 0}
          </span>
          <span class="text-xl text-amber-400">
            {currentChallenge?.op ?? '+'}
          </span>
          <input
            type="number"
            bind:value={userNumberInput}
            placeholder="Angka kamu"
            class="w-32 px-3 py-1.5 bg-slate-900 border border-indigo-500/50 rounded-lg text-center text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            onkeydown={(e) => {
              if (e.key === 'Enter') handleSubmitRoll();
            }}
          />
          <span class="text-slate-500">=</span>
          <span class="text-slate-400 text-sm font-sans font-medium">?</span>
        </div>

        <!-- Strategy Shortcuts -->
        <div class="flex items-center justify-center gap-1.5 pt-1">
          <span class="text-[11px] text-slate-500 mr-1">Target cepat:</span>
          <button
            type="button"
            onclick={() => setTargetResult(6)}
            class="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 transition"
            title="Kalkulasi otomatis agar hasil jadi +6"
          >
            Target +6
          </button>
          <button
            type="button"
            onclick={() => setTargetResult(-6)}
            class="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-amber-400 transition"
            title="Kalkulasi otomatis agar hasil jadi -6"
          >
            Target -6
          </button>
          <button
            type="button"
            onclick={setRandomNumber}
            class="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition"
          >
            Acak
          </button>
        </div>

        <!-- Submit Roll Button -->
        <button
          type="button"
          onclick={handleSubmitRoll}
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="4" />
            <path d="M8 8h.01" />
            <path d="M12 12h.01" />
            <path d="M16 16h.01" />
          </svg>
          <span>Hitung & Lempar Dadu</span>
        </button>
      </div>
    {:else if gameState === 'WAITING_FOR_MOVE'}
      <!-- Inline Roll Result (Non-blocking: No popup) -->
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
        {#if gameState === 'WAITING_FOR_ROLL'}
          Menunggu <strong>{activePlayer?.name ?? 'pemain'}</strong> menentukan angka kalkulasi...
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
