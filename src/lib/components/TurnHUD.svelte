<script>
  import { COLOR_CONFIG } from '../../../server/game/Board.js';

  let {
    activePlayer = null,
    myPlayerId = '',
    timeLeft = 10,
    totalTimer = 10,
    gameState = 'WAITING_FOR_ROLL',
    validTokenIds = [],
    onRoll = () => {}
  } = $props();

  const isMyTurn = $derived(activePlayer?.id === myPlayerId);
  const activeColor = $derived(activePlayer ? COLOR_CONFIG[activePlayer.color] : null);
  const progressPercent = $derived(Math.max(0, Math.min(100, (timeLeft / (totalTimer || 10)) * 100)));
</script>

<div class="w-full max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
  <!-- Active Player Header & Timer -->
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

    <!-- Timer Countdown Badge with SVG icon -->
    <div class="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex-shrink-0">
      <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span class="font-mono font-bold text-sm {timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}">
        {timeLeft}s
      </span>
    </div>
  </div>

  <!-- Smooth Animated Progress Bar -->
  <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
    <div
      class="h-full transition-all duration-300 rounded-full {timeLeft <= 3 ? 'bg-rose-500' : 'bg-indigo-500'}"
      style="width: {progressPercent}%;"
    ></div>
  </div>

  <!-- Action Controls -->
  {#if isMyTurn}
    {#if gameState === 'WAITING_FOR_ROLL'}
      <button
        onclick={onRoll}
        class="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="4" />
          <path d="M8 8h.01" />
          <path d="M12 12h.01" />
          <path d="M16 16h.01" />
          <path d="M16 8h.01" />
          <path d="M8 16h.01" />
        </svg>
        <span>Lempar Dadu Matematika</span>
      </button>
    {:else if gameState === 'WAITING_FOR_MOVE'}
      <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-xs text-amber-300 font-semibold">
        Pilih salah satu bidak yang berdenyut di papan untuk bergerak!
      </div>
    {/if}
  {:else}
    <div class="text-center text-xs text-slate-400 py-2">
      Menunggu {activePlayer?.name ?? 'pemain'} menyelesaikan langkahnya...
    </div>
  {/if}
</div>
