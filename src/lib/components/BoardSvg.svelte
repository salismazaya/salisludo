<script>
  import { PLAYER_COLORS, COLOR_CONFIG, TOTAL_TRACK_CELLS, isSafeSquare, getStartSquare } from '../../../server/game/Board6.js';

  let {
    players = [],
    tokens = {},
    validTokenIds = [],
    activePlayerId = null,
    onTokenClick = () => {}
  } = $props();

  const CX = 500;
  const CY = 500;
  const TRACK_RADIUS = 350;
  const YARD_RADIUS = 435;
  const HOME_START_RADIUS = 285;
  const HOME_END_RADIUS = 105;

  // 72 track squares coordinates
  function getTrackCoords(index) {
    const angle = ((index * 360) / TOTAL_TRACK_CELLS - 90) * (Math.PI / 180);
    return {
      x: CX + TRACK_RADIUS * Math.cos(angle),
      y: CY + TRACK_RADIUS * Math.sin(angle)
    };
  }

  // Home column coordinates (0..5)
  function getHomeColumnCoords(playerIndex, stepIndex) {
    const angle = (playerIndex * 60 - 90) * (Math.PI / 180);
    const radius = HOME_START_RADIUS - stepIndex * ((HOME_START_RADIUS - HOME_END_RADIUS) / 5);
    return {
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle)
    };
  }

  // Yard coordinates for player
  function getYardSlotCoords(playerIndex, slotIndex) {
    const angle = (playerIndex * 60 - 90) * (Math.PI / 180);
    const baseX = CX + YARD_RADIUS * Math.cos(angle);
    const baseY = CY + YARD_RADIUS * Math.sin(angle);
    const offsets = [
      { dx: -18, dy: -18 },
      { dx: 18, dy: -18 },
      { dx: -18, dy: 18 },
      { dx: 18, dy: 18 }
    ];
    return {
      x: baseX + offsets[slotIndex].dx,
      y: baseY + offsets[slotIndex].dy
    };
  }

  // Home Center coordinates
  function getHomeCenterCoords(playerIndex) {
    const angle = (playerIndex * 60 - 90) * (Math.PI / 180);
    return {
      x: CX + 40 * Math.cos(angle),
      y: CY + 40 * Math.sin(angle)
    };
  }

  function getTokenPosition(player, token) {
    const pIdx = COLOR_CONFIG[player.color]?.index ?? 0;
    if (token.type === 'YARD') {
      return getYardSlotCoords(pIdx, token.index);
    }
    if (token.type === 'TRACK') {
      return getTrackCoords(token.index);
    }
    if (token.type === 'HOME_COLUMN') {
      return getHomeColumnCoords(pIdx, token.index);
    }
    if (token.type === 'HOME') {
      return getHomeCenterCoords(pIdx);
    }
    return { x: CX, y: CY };
  }
</script>

<div class="relative w-full max-w-[700px] aspect-square mx-auto select-none">
  <svg viewBox="0 0 1000 1000" class="w-full h-full drop-shadow-2xl">
    <!-- Board Base Background -->
    <circle cx={CX} cy={CY} r="485" fill="#1e293b" stroke="#334155" stroke-width="8" />

    <!-- Center Trophy Destination Area -->
    <circle cx={CX} cy={CY} r="85" fill="#0f172a" stroke="#475569" stroke-width="4" />
    <text x={CX} y={CY + 10} text-anchor="middle" font-size="32" fill="#fbbf24">🏆</text>

    <!-- 6 Player Arms / Wedges in Center -->
    {#each PLAYER_COLORS as color, idx}
      {@const angle1 = ((idx * 60 - 120) * Math.PI) / 180}
      {@const angle2 = ((idx * 60 - 60) * Math.PI) / 180}
      {@const x1 = CX + 85 * Math.cos(angle1)}
      {@const y1 = CY + 85 * Math.sin(angle1)}
      {@const x2 = CX + 85 * Math.cos(angle2)}
      {@const y2 = CY + 85 * Math.sin(angle2)}
      <path
        d={`M ${CX} ${CY} L ${x1} ${y1} A 85 85 0 0 1 ${x2} ${y2} Z`}
        fill={COLOR_CONFIG[color].hex}
        opacity="0.25"
      />
    {/each}

    <!-- 72 Perimeter Track Squares -->
    {#each Array(TOTAL_TRACK_CELLS) as _, i}
      {@const coords = getTrackCoords(i)}
      {@const isSafe = isSafeSquare(i)}
      {@const playerStartIndex = PLAYER_COLORS.findIndex(c => getStartSquare(c) === i)}
      {@const startColor = playerStartIndex !== -1 ? COLOR_CONFIG[PLAYER_COLORS[playerStartIndex]].hex : null}

      <g transform={`translate(${coords.x}, ${coords.y})`}>
        <rect
          x="-14"
          y="-14"
          width="28"
          height="28"
          rx="6"
          fill={startColor ? startColor : isSafe ? '#475569' : '#1e293b'}
          stroke={isSafe ? '#fbbf24' : '#334155'}
          stroke-width={isSafe ? 2.5 : 1.5}
        />
        {#if isSafe}
          <text x="0" y="4" text-anchor="middle" font-size="12" fill="#fbbf24" font-weight="bold">★</text>
        {:else}
          <text x="0" y="3" text-anchor="middle" font-size="8" fill="#64748b">{i}</text>
        {/if}
      </g>
    {/each}

    <!-- Home Columns for each of the 6 players (6 steps each) -->
    {#each PLAYER_COLORS as color, pIdx}
      {#each Array(6) as _, step}
        {@const coords = getHomeColumnCoords(pIdx, step)}
        <g transform={`translate(${coords.x}, ${coords.y})`}>
          <rect
            x="-13"
            y="-13"
            width="26"
            height="26"
            rx="5"
            fill={COLOR_CONFIG[color].hex}
            opacity="0.85"
            stroke="#ffffff"
            stroke-width="1.5"
          />
          <text x="0" y="3" text-anchor="middle" font-size="9" fill="#ffffff" font-weight="bold">{step + 1}</text>
        </g>
      {/each}
    {/each}

    <!-- Yard Bases for joined players -->
    {#each PLAYER_COLORS as color, pIdx}
      {@const angle = (pIdx * 60 - 90) * (Math.PI / 180)}
      {@const bx = CX + YARD_RADIUS * Math.cos(angle)}
      {@const by = CY + YARD_RADIUS * Math.sin(angle)}
      <g transform={`translate(${bx}, ${by})`}>
        <circle r="46" fill="#0f172a" stroke={COLOR_CONFIG[color].hex} stroke-width="3" />
        <!-- 4 Slot Holders -->
        {#each [
          { dx: -18, dy: -18 },
          { dx: 18, dy: -18 },
          { dx: -18, dy: 18 },
          { dx: 18, dy: 18 }
        ] as slot}
          <circle cx={slot.dx} cy={slot.dy} r="11" fill="#1e293b" stroke={COLOR_CONFIG[color].hex} stroke-dasharray="2 2" />
        {/each}
      </g>
    {/each}

    <!-- Render Tokens for Active Players -->
    {#each players as player}
      {#if tokens[player.id]}
        {#each tokens[player.id] as token}
          {@const pos = getTokenPosition(player, token)}
          {@const isEligible = activePlayerId === player.id && validTokenIds.includes(token.id)}
          <g
            transform={`translate(${pos.x}, ${pos.y})`}
            class={isEligible ? 'token-active-pulse cursor-pointer' : ''}
            onclick={() => isEligible && onTokenClick(token.id)}
            role="button"
            tabindex={isEligible ? 0 : -1}
            onkeydown={(e) => {
              if (isEligible && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onTokenClick(token.id);
              }
            }}
          >
            <!-- Token Shadow -->
            <circle cx="2" cy="3" r="13" fill="#000000" opacity="0.4" />
            <!-- Token Body -->
            <circle
              cx="0"
              cy="0"
              r="12"
              fill={COLOR_CONFIG[player.color].hex}
              stroke="#ffffff"
              stroke-width="2.5"
            />
            <!-- Token Center ID -->
            <text x="0" y="4" text-anchor="middle" font-size="10" fill="#ffffff" font-weight="black">
              {token.id + 1}
            </text>
          </g>
        {/each}
      {/if}
    {/each}
  </svg>
</div>
