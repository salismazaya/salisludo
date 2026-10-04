<script>
  let {
    onJoin = () => {},
    onCreate = () => {},
    room = null,
    onStartGame = () => {},
    myPlayerId = ''
  } = $props();

  let playerName = $state(
    typeof window !== 'undefined' ? localStorage.getItem('ludo_player_name') || '' : ''
  );

  let mode = $state('HOME'); // 'HOME' | 'CREATE' | 'JOIN'
  let joinCode = $state('');
  let selectedTimer = $state(5);
  let selectedMaxPlayers = $state(4);
  let errorMessage = $state('');
  let copied = $state(false);

  function handleCreate() {
    if (!playerName.trim()) {
      errorMessage = 'Nama pemain tidak boleh kosong';
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludo_player_name', playerName.trim());
    }
    errorMessage = '';
    onCreate({
      name: playerName.trim(),
      timer: selectedTimer,
      maxPlayers: selectedMaxPlayers
    });
  }

  function handleJoin() {
    if (!playerName.trim()) {
      errorMessage = 'Nama pemain tidak boleh kosong';
      return;
    }
    if (!joinCode.trim()) {
      errorMessage = 'Kode kamar tidak boleh kosong';
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludo_player_name', playerName.trim());
    }
    errorMessage = '';
    onJoin({
      name: playerName.trim(),
      code: joinCode.trim().toUpperCase()
    });
  }

  function copyCode() {
    if (room?.code && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(room.code);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }

  const isHost = $derived(room?.players?.[0]?.id === myPlayerId);
  const canStart = $derived(isHost && room?.players?.length >= 2);
</script>

<div class="w-full max-w-md mx-auto">
  {#if !room}
    <!-- Lobby Card: Neobrutalism Form -->
    <div class="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      <!-- Title & Branding -->
      <div class="text-center space-y-2 border-b-4 border-black pb-5">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-[#FFE600] border-3 border-black shadow-[3px_3px_0px_#000] text-black mb-1">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="0" />
            <path d="M8 8h.01" />
            <path d="M12 12h.01" />
            <path d="M16 16h.01" />
            <path d="M16 8h.01" />
            <path d="M8 16h.01" />
          </svg>
        </div>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-black uppercase">
          SalisLudo
        </h1>
        <p class="text-xs sm:text-sm font-bold text-slate-800">
          Multiplayer 2 s.d. 4 pemain dengan dadu persamaan matematika seru.
        </p>
      </div>

      <!-- Error Banner -->
      {#if errorMessage}
        <div class="p-3 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_#000] text-xs text-black font-black text-center">
          {errorMessage}
        </div>
      {/if}

      <!-- Name Input -->
      <div class="space-y-1.5">
        <label for="player-name" class="block text-xs font-black text-black uppercase tracking-wider">
          Nama Pemain
        </label>
        <input
          id="player-name"
          type="text"
          maxlength="15"
          bind:value={playerName}
          placeholder="Ketik namamu..."
          class="w-full px-4 py-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000] text-black font-black placeholder-slate-400 focus:outline-none focus:bg-[#FFF9C4] transition"
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
            class="py-3.5 px-4 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs sm:text-sm tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] transition flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Buat Kamar</span>
          </button>
          <button
            onclick={() => { errorMessage = ''; mode = 'JOIN'; }}
            class="py-3.5 px-4 bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs sm:text-sm tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] transition flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21 2-2 2m-6 6 2-2m-8 8 2-2m2 2 4-4m-4 4-2-2m2 2-4-4" />
              <circle cx="7.5" cy="15.5" r="4.5" />
            </svg>
            <span>Gabung</span>
          </button>
        </div>
      {:else if mode === 'CREATE'}
        <!-- Custom Timer & Max Players (2..4) -->
        <div class="space-y-4 pt-2 border-t-2 border-black">
          <div>
            <span class="block text-xs font-black uppercase tracking-wider mb-2 text-black">
              Batas Waktu per Giliran (Maks 5 Detik)
            </span>
            <div class="grid grid-cols-3 gap-2">
              {#each [3, 4, 5] as sec}
                <button
                  type="button"
                  onclick={() => (selectedTimer = sec)}
                  class="py-2.5 font-black text-sm border-2 border-black transition {selectedTimer === sec ? 'bg-[#FFEB3B] text-black shadow-[3px_3px_0px_#000]' : 'bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000]'}"
                >
                  {sec} Detik
                </button>
              {/each}
            </div>
          </div>

          <div>
            <span class="block text-xs font-black uppercase tracking-wider mb-2 text-black">
              Kapasitas Pemain
            </span>
            <div class="grid grid-cols-3 gap-2">
              {#each [2, 3, 4] as num}
                <button
                  type="button"
                  onclick={() => (selectedMaxPlayers = num)}
                  class="py-2.5 font-black text-sm border-2 border-black transition {selectedMaxPlayers === num ? 'bg-[#FFEB3B] text-black shadow-[3px_3px_0px_#000]' : 'bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000]'}"
                >
                  {num} Pemain
                </button>
              {/each}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onclick={() => { errorMessage = ''; mode = 'HOME'; }}
              class="py-3 px-4 bg-white hover:bg-slate-100 active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Kembali
            </button>
            <button
              type="button"
              onclick={handleCreate}
              class="py-3 px-4 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      {:else if mode === 'JOIN'}
        <div class="space-y-4 pt-2 border-t-2 border-black">
          <div class="space-y-1.5">
            <label for="room-code" class="block text-xs font-black text-black uppercase tracking-wider">
              Kode Kamar (6 Huruf)
            </label>
            <input
              id="room-code"
              type="text"
              maxlength="6"
              bind:value={joinCode}
              placeholder="CONTOH: AB12CD"
              class="w-full px-4 py-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000] text-black font-mono font-black text-center uppercase tracking-widest placeholder-slate-400 focus:outline-none focus:bg-[#FFF9C4] transition"
              onkeydown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
            />
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onclick={() => { errorMessage = ''; mode = 'HOME'; }}
              class="py-3 px-4 bg-white hover:bg-slate-100 active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Kembali
            </button>
            <button
              type="button"
              onclick={handleJoin}
              class="py-3 px-4 bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Masuk Kamar
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Room Waiting Room (Neobrutalism) -->
    <div class="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      <div class="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-slate-700">Kode Kamar</span>
          <div class="text-3xl font-black font-mono tracking-wider text-black">
            {room.code}
          </div>
        </div>
        <button
          onclick={copyCode}
          class="px-3.5 py-2 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] transition flex items-center gap-1.5"
        >
          {#if copied}
            <span>Disalin!</span>
          {:else}
            <span>Salin Kode</span>
          {/if}
        </button>
      </div>

      <!-- Player List in Room -->
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs font-black uppercase text-black">
          <span>Pemain Tergabung</span>
          <span>{room.players.length} / {room.maxPlayers}</span>
        </div>

        <div class="space-y-2">
          {#each room.players as p, idx}
            <div class="flex items-center justify-between p-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000]">
              <div class="flex items-center gap-3">
                <span class="w-3.5 h-3.5 border-2 border-black shadow-[1px_1px_0px_#000]" style="background-color: {p.color === 'red' ? '#ef4444' : p.color === 'green' ? '#10b981' : p.color === 'yellow' ? '#f59e0b' : '#3b82f6'};"></span>
                <span class="font-black text-sm text-black uppercase">{p.name}</span>
                {#if p.id === myPlayerId}
                  <span class="text-[10px] font-black uppercase bg-[#FFE600] px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                    Kamu
                  </span>
                {/if}
              </div>
              {#if idx === 0}
                <span class="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">
                  Host
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Start Button for Host -->
      {#if isHost}
        <button
          onclick={onStartGame}
          disabled={!canStart}
          class="w-full py-3.5 px-4 font-black uppercase text-sm tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] transition flex items-center justify-center gap-2 {canStart ? 'bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer' : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'}"
        >
          {canStart ? 'Mulai Permainan Sekarang' : 'Menunggu Minimal 2 Pemain...'}
        </button>
      {:else}
        <div class="p-3 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000] text-center text-xs font-black uppercase text-black">
          Menunggu Host memulai permainan...
        </div>
      {/if}
    </div>
  {/if}
</div>
