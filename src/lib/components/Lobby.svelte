<script>
  import { COLOR_CONFIG } from '../../../server/game/Board.js';

  let {
    playerName = $bindable(''),
    room = null,
    player = null,
    onCreateRoom = () => {},
    onJoinRoom = () => {},
    onStartGame = () => {},
    onLeaveRoom = () => {},
    onShowLeaderboard = () => {}
  } = $props();

  let mode = $state('HOME'); // 'HOME' | 'CREATE' | 'JOIN'
  let joinCode = $state('');
  let selectedTimer = $state(10);
  let selectedMaxPlayers = $state(4);
  let errorMessage = $state('');
  let copied = $state(false);
  let isSubmitting = $state(false);

  function handleCreate() {
    errorMessage = '';
    if (!playerName || playerName.trim().length < 2) {
      errorMessage = 'Silakan masukkan nama minimal 2 karakter.';
      return;
    }
    isSubmitting = true;
    onCreateRoom(
      {
        name: playerName.trim(),
        timer: selectedTimer,
        maxPlayers: selectedMaxPlayers
      },
      (err) => {
        isSubmitting = false;
        if (err) errorMessage = err;
      }
    );
  }

  function handleJoin() {
    errorMessage = '';
    if (!playerName || playerName.trim().length < 2) {
      errorMessage = 'Silakan masukkan nama minimal 2 karakter.';
      return;
    }
    if (!joinCode || joinCode.trim().length !== 6) {
      errorMessage = 'Kode kamar harus terdiri dari 6 karakter.';
      return;
    }
    isSubmitting = true;
    onJoinRoom(
      {
        name: playerName.trim(),
        code: joinCode.trim()
      },
      (err) => {
        isSubmitting = false;
        if (err) errorMessage = err;
      }
    );
  }

  function copyCode() {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }
</script>

<div class="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
  {#if !room}
    <!-- Title & Brand -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-2 border border-indigo-500/30">
        <!-- Clean Dice SVG Icon -->
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="4" />
          <path d="M8 8h.01" />
          <path d="M12 12h.01" />
          <path d="M16 16h.01" />
          <path d="M16 8h.01" />
          <path d="M8 16h.01" />
        </svg>
      </div>
      <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
        SalisLudo
      </h1>
      <p class="text-sm text-slate-400">
        Multiplayer 2 sampai 4 pemain dengan dadu persamaan matematika dan safe zone.
      </p>
    </div>

    <!-- Error Banner -->
    {#if errorMessage}
      <div class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 text-center font-medium animate-shake">
        {errorMessage}
      </div>
    {/if}

    <!-- Name Input (Name-Only Login) -->
    <div class="space-y-2">
      <label for="player-name" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Nama Pemain
      </label>
      <input
        id="player-name"
        type="text"
        maxlength="15"
        bind:value={playerName}
        placeholder="Ketik namamu..."
        class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            if (mode === 'CREATE') handleCreate();
            else if (mode === 'JOIN') handleJoin();
          }
        }}
      />
    </div>

    {#if mode === 'HOME'}
      <div class="grid grid-cols-2 gap-3 pt-2">
        <button
          onclick={() => { errorMessage = ''; mode = 'CREATE'; }}
          class="py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Buat Kamar</span>
        </button>
        <button
          onclick={() => { errorMessage = ''; mode = 'JOIN'; }}
          class="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-bold rounded-xl border border-slate-700 shadow-lg transition flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21 2-2 2m-6 6 2-2m-8 8 2-2m2 2 4-4m-4 4-2-2m2 2-4-4" />
            <circle cx="7.5" cy="15.5" r="4.5" />
          </svg>
          <span>Gabung Kamar</span>
        </button>
      </div>

      <div class="pt-2 text-center">
        <button
          onclick={onShowLeaderboard}
          class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
        >
          Lihat Peringkat & Statistik Pemain
        </button>
      </div>
    {:else if mode === 'CREATE'}
      <!-- Custom Timer & Max Players (2..4) -->
      <div class="space-y-4 pt-2 border-t border-slate-800">
        <div>
          <span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Batas Waktu per Giliran
          </span>
          <div class="grid grid-cols-4 gap-2">
            {#each [10, 15, 20, 30] as sec}
              <button
                type="button"
                onclick={() => (selectedTimer = sec)}
                class="py-2 rounded-lg font-bold text-sm border transition {selectedTimer === sec ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}"
              >
                {sec}s
              </button>
            {/each}
          </div>
        </div>

        <div>
          <span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Maksimal Pemain (Maksimal 4)
          </span>
          <div class="grid grid-cols-3 gap-2">
            {#each [2, 3, 4] as count}
              <button
                type="button"
                onclick={() => (selectedMaxPlayers = count)}
                class="py-2 rounded-lg font-bold text-sm border transition {selectedMaxPlayers === count ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}"
              >
                {count} Pemain
              </button>
            {/each}
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            onclick={() => { errorMessage = ''; mode = 'HOME'; }}
            class="w-1/3 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onclick={handleCreate}
            class="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition active:scale-[0.98]"
          >
            {isSubmitting ? 'Membuat...' : 'Mulai Buat Kamar'}
          </button>
        </div>
      </div>
    {:else if mode === 'JOIN'}
      <!-- Room Code Input -->
      <div class="space-y-4 pt-2 border-t border-slate-800">
        <div>
          <label for="join-code" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Kode Kamar (6 Huruf)
          </label>
          <input
            id="join-code"
            type="text"
            maxlength="6"
            bind:value={joinCode}
            placeholder="CONTOH: ABC123"
            class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            onkeydown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
          />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            onclick={() => { errorMessage = ''; mode = 'HOME'; }}
            class="w-1/3 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onclick={handleJoin}
            class="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition active:scale-[0.98]"
          >
            {isSubmitting ? 'Masuk...' : 'Masuk Sekarang'}
          </button>
        </div>
      </div>
    {/if}
  {:else}
    <!-- In Room Lobby Screen -->
    <div class="space-y-6">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div class="text-xs text-slate-400 font-semibold uppercase">Kode Kamar</div>
          <div class="text-3xl font-black font-mono tracking-widest text-indigo-400">
            {room.code}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            onclick={copyCode}
            class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
          >
            {copied ? 'Tersalin!' : 'Salin Kode'}
          </button>
          <button
            onclick={onLeaveRoom}
            class="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold rounded-lg transition"
          >
            Keluar
          </button>
        </div>
      </div>

      <!-- Settings summary -->
      <div class="flex justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <span>Timer: <strong class="text-slate-200">{room.defaultTimer} detik</strong></span>
        <span>Kapasitas: <strong class="text-slate-200">{room.players.length} / {room.maxPlayers}</strong></span>
      </div>

      <!-- Player List -->
      <div class="space-y-2">
        <div class="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Pemain Bergabung ({room.players.length})
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {#each room.players as p}
            <div class="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div
                class="w-4 h-4 rounded-full shadow-md flex-shrink-0"
                style="background-color: {COLOR_CONFIG[p.color]?.hex || '#6366f1'}"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <span>{p.name}</span>
                  {#if p.connected === false}
                    <span class="text-[10px] text-rose-400 font-normal">(Terputus)</span>
                  {/if}
                </div>
                <div class="text-[10px] text-slate-500">Warna {COLOR_CONFIG[p.color]?.name || p.color || 'Pemain'}</div>
              </div>
              {#if p.isHost}
                <span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md flex-shrink-0">
                  Host
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Action Button -->
      {#if player?.isHost}
        <button
          onclick={onStartGame}
          disabled={room.players.length < 2}
          class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-base rounded-xl shadow-lg transition active:scale-[0.98]"
        >
          {room.players.length < 2 ? 'Menunggu Minimal 2 Pemain...' : 'Mulai Permainan Sekarang'}
        </button>
      {:else}
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400 animate-pulse">
          Menunggu Host memulai permainan...
        </div>
      {/if}
    </div>
  {/if}
</div>
