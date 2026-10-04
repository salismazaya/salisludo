<script>
  import { onMount } from 'svelte';
  import { getSocket } from '$lib/socket.js';
  import { sounds } from '$lib/sound.js';
  import BoardSvg from '$lib/components/BoardSvg.svelte';
  import DiceModal from '$lib/components/DiceModal.svelte';
  import TurnHUD from '$lib/components/TurnHUD.svelte';
  import Lobby from '$lib/components/Lobby.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import '../app.css';

  let socket = $state(null);
  let playerName = $state('');
  let currentRoom = $state(null);
  let myPlayer = $state(null);
  let gameView = $state('LOBBY'); // 'LOBBY' | 'PLAYING' | 'FINISHED'

  // Live game state
  let tokens = $state({});
  let activePlayer = $state(null);
  let timeLeft = $state(10);
  let totalTimer = $state(10);
  let gameState = $state('WAITING_FOR_ROLL');
  let currentRoll = $state(null);
  let showDiceModal = $state(false);
  let validTokenIds = $state([]);
  let winners = $state([]);
  let showLeaderboard = $state(false);
  let leaderboardData = $state([]);
  let soundEnabled = $state(true);

  onMount(() => {
    const savedName = localStorage.getItem('ludo_math_player_name');
    if (savedName) playerName = savedName;

    socket = getSocket();
    if (!socket) return;

    socket.on('room_updated', (room) => {
      currentRoom = room;
    });

    socket.on('game_started', ({ players, tokens: initialTokens, activePlayer: active, currentTimer }) => {
      gameView = 'PLAYING';
      tokens = initialTokens;
      activePlayer = active;
      totalTimer = currentTimer;
      timeLeft = currentTimer;
      gameState = 'WAITING_FOR_ROLL';
      currentRoll = null;
      showDiceModal = false;
      validTokenIds = [];
      winners = [];
    });

    socket.on('timer_tick', (data) => {
      timeLeft = data.timeLeft;
      totalTimer = data.totalTimer;
    });

    socket.on('dice_rolled', ({ roll, validTokenIds: valid, autoSkip }) => {
      if (soundEnabled) sounds.playRoll();
      currentRoll = roll;
      validTokenIds = valid;
      showDiceModal = true;
      gameState = autoSkip ? 'WAITING_FOR_ROLL' : 'WAITING_FOR_MOVE';

      if (roll.extraTurn && soundEnabled) {
        sounds.playExtraTurn();
      }
    });

    socket.on('token_moved', ({ tokens: updatedTokens, captured, extraTurn, nextPlayer, currentTimer, finished, winners: winList }) => {
      tokens = updatedTokens;
      activePlayer = nextPlayer;
      totalTimer = currentTimer;
      timeLeft = currentTimer;
      gameState = 'WAITING_FOR_ROLL';
      validTokenIds = [];
      showDiceModal = false;

      if (captured && soundEnabled) {
        sounds.playCapture();
      }
      if (extraTurn && soundEnabled) {
        sounds.playExtraTurn();
      }

      if (finished) {
        gameView = 'FINISHED';
        winners = winList;
        if (soundEnabled) sounds.playExtraTurn();
      }
    });

    socket.on('turn_timeout', ({ nextPlayer, currentTimer }) => {
      activePlayer = nextPlayer;
      totalTimer = currentTimer;
      timeLeft = currentTimer;
      gameState = 'WAITING_FOR_ROLL';
      validTokenIds = [];
      showDiceModal = false;
    });

    socket.on('turn_passed', ({ nextPlayer, currentTimer }) => {
      activePlayer = nextPlayer;
      totalTimer = currentTimer;
      timeLeft = currentTimer;
      gameState = 'WAITING_FOR_ROLL';
      validTokenIds = [];
      showDiceModal = false;
    });

    socket.on('player_left', ({ room }) => {
      currentRoom = room;
    });
  });

  function handleCreateRoom({ name, timer, maxPlayers }) {
    localStorage.setItem('ludo_math_player_name', name);
    socket.emit('create_room', { name, timer, maxPlayers }, (res) => {
      if (res.success) {
        currentRoom = res.room;
        myPlayer = res.player;
      }
    });
  }

  function handleJoinRoom({ name, code }) {
    localStorage.setItem('ludo_math_player_name', name);
    socket.emit('join_room', { name, code }, (res) => {
      if (res.success) {
        currentRoom = res.room;
        myPlayer = res.player;
      }
    });
  }

  function handleStartGame() {
    if (!currentRoom) return;
    socket.emit('start_game', { code: currentRoom.code }, () => {});
  }

  function handleRollDice() {
    if (!currentRoom) return;
    socket.emit('roll_dice', { code: currentRoom.code }, () => {});
  }

  function handleSelectToken(tokenId) {
    if (!currentRoom) return;
    showDiceModal = false;
    socket.emit('move_token', { code: currentRoom.code, tokenId }, () => {});
  }

  function openLeaderboard() {
    if (!socket) return;
    socket.emit('get_leaderboard', (res) => {
      leaderboardData = res?.leaderboard ?? [];
      showLeaderboard = true;
    });
  }

  function leaveGame() {
    window.location.reload();
  }
</script>

<svelte:head>
  <title>Ludo Dadu Matematika - Multiplayer</title>
</svelte:head>

<main class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6">
  <!-- Navigation Header -->
  <header class="max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800 mb-4">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🎲</span>
      <span class="font-extrabold text-base sm:text-lg tracking-tight text-white">
        Ludo Dadu Matematika
      </span>
    </div>

    <div class="flex items-center gap-3">
      <button
        onclick={openLeaderboard}
        class="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-semibold transition"
      >
        🏆 Peringkat
      </button>

      <button
        onclick={() => (soundEnabled = !soundEnabled)}
        class="text-xs p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition"
        title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
        aria-label={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      {#if gameView !== 'LOBBY'}
        <button
          onclick={leaveGame}
          class="text-xs px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg text-rose-300 font-semibold transition"
        >
          Keluar
        </button>
      {/if}
    </div>
  </header>

  <!-- Body Content -->
  <div class="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto space-y-4">
    {#if gameView === 'LOBBY'}
      <Lobby
        bind:playerName
        room={currentRoom}
        player={myPlayer}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartGame={handleStartGame}
        onShowLeaderboard={openLeaderboard}
      />
    {:else if gameView === 'PLAYING'}
      <!-- Turn HUD -->
      <TurnHUD
        {activePlayer}
        myPlayerId={socket?.id}
        {timeLeft}
        {totalTimer}
        {gameState}
        {validTokenIds}
        onRoll={handleRollDice}
      />

      <!-- Scalable SVG Board -->
      <BoardSvg
        players={currentRoom?.players ?? []}
        {tokens}
        {validTokenIds}
        activePlayerId={activePlayer?.id}
        onTokenClick={handleSelectToken}
      />

      <!-- Dice Math Explanation Modal -->
      {#if showDiceModal}
        <DiceModal
          roll={currentRoll}
          onClose={() => (showDiceModal = false)}
        />
      {/if}
    {:else if gameView === 'FINISHED'}
      <!-- Game Over / Winner Screen -->
      <div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div class="text-5xl animate-bounce">🏆</div>
        <h2 class="text-2xl font-black text-white">Permainan Selesai!</h2>
        <p class="text-sm text-slate-400">
          Selamat kepada para pemenang yang berhasil memasukkan seluruh bidaknya ke zona finish!
        </p>

        <div class="space-y-2">
          {#each winners as winnerId, idx}
            {@const p = currentRoom?.players.find(x => x.id === winnerId)}
            <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span class="font-bold text-amber-400 text-sm">Juara {idx + 1}</span>
              <span class="font-bold text-white text-sm">{p?.name ?? 'Pemain'}</span>
            </div>
          {/each}
        </div>

        <button
          onclick={leaveGame}
          class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
        >
          Kembali ke Menu Utama
        </button>
      </div>
    {/if}
  </div>

  <!-- Footer Info -->
  <footer class="text-center py-4 text-xs text-slate-600">
    Ludo Dadu Matematika &bull; Aturan Dadu: 7 jadi 1, 8 jadi 2, 5 jadi 5, 0 diam, 6 lempar lagi (waktu giliran dibagi 2)
  </footer>

  <!-- Leaderboard Modal Dialog -->
  {#if showLeaderboard}
    <Leaderboard
      leaderboard={leaderboardData}
      onClose={() => (showLeaderboard = false)}
    />
  {/if}
</main>
