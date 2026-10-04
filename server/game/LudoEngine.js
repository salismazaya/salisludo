import { computeTokenTargetPosition, isSafeSquare } from './Board.js';
import { generateChallenge } from './MathDice.js';

export class LudoGame {
  constructor({ id, defaultTimer = 10, players }) {
    this.id = id;
    this.defaultTimer = Number(defaultTimer) || 10;
    this.currentTurnTimer = this.defaultTimer;
    this.players = players; // array of { id, name, color }
    this.currentTurnIndex = 0;
    this.consecutiveSixes = 0;
    this.pendingRoll = null;
    this.currentChallenge = generateChallenge();
    this.state = 'WAITING_FOR_ROLL'; // 'WAITING_FOR_ROLL' | 'WAITING_FOR_MOVE' | 'FINISHED'
    this.winners = [];

    // Initialize 4 tokens per player
    this.tokens = {};
    players.forEach(p => {
      this.tokens[p.id] = [0, 1, 2, 3].map(tokenId => ({
        id: tokenId,
        type: 'YARD',
        index: tokenId
      }));
    });
  }

  get currentTurnPlayer() {
    return this.players[this.currentTurnIndex];
  }

  applyRoll(rollResult) {
    this.pendingRoll = rollResult;

    // Rule: Check for 3 consecutive sixes penalty
    if (rollResult.extraTurn && rollResult.steps === 6) {
      this.consecutiveSixes += 1;
      if (this.consecutiveSixes >= 3) {
        // Penalty: Turn passes immediately to next player
        this.nextTurn();
        return {
          autoSkip: true,
          validTokenIds: [],
          penalty: 'THREE_CONSECUTIVE_SIXES'
        };
      }
    } else {
      this.consecutiveSixes = 0;
    }

    // Check valid moves for current player
    const validTokenIds = this.getValidMoves(this.currentTurnPlayer.id);

    if (validTokenIds.length === 0) {
      this.state = 'WAITING_FOR_ROLL';
      return { autoSkip: true, validTokenIds: [] };
    }

    this.state = 'WAITING_FOR_MOVE';
    return { autoSkip: false, validTokenIds };
  }

  getValidMoves(playerId) {
    if (!this.pendingRoll) return [];
    const player = this.players.find(p => p.id === playerId);
    if (!player) return [];
    const tokens = this.tokens[playerId] || [];
    const valid = [];

    tokens.forEach(tok => {
      // Tokens already finished in HOME cannot move
      if (tok.type === 'HOME') return;

      const target = computeTokenTargetPosition({
        color: player.color,
        currentPos: tok,
        steps: this.pendingRoll.steps,
        direction: this.pendingRoll.direction
      });
      if (target) {
        valid.push(tok.id);
      }
    });

    return valid;
  }

  moveToken(playerId, tokenId) {
    if (this.currentTurnPlayer.id !== playerId || this.state !== 'WAITING_FOR_MOVE') {
      return { success: false, reason: 'NOT_YOUR_TURN' };
    }

    const player = this.players.find(p => p.id === playerId);
    const token = this.tokens[playerId]?.[tokenId];
    if (!token) return { success: false, reason: 'TOKEN_NOT_FOUND' };

    const target = computeTokenTargetPosition({
      color: player.color,
      currentPos: token,
      steps: this.pendingRoll.steps,
      direction: this.pendingRoll.direction
    });

    if (!target) return { success: false, reason: 'INVALID_MOVE' };

    const wasHome = target.type === 'HOME';

    // Move token to target
    token.type = target.type;
    token.index = target.index;

    let captured = null;
    // Check capture on TRACK if target not a safe square
    if (target.type === 'TRACK' && !isSafeSquare(target.index)) {
      for (const p of this.players) {
        if (p.id === playerId) continue;
        for (const oppTok of this.tokens[p.id]) {
          if (oppTok.type === 'TRACK' && oppTok.index === target.index) {
            oppTok.type = 'YARD';
            oppTok.index = oppTok.id;
            captured = { playerId: p.id, tokenId: oppTok.id, playerName: p.name };
            break;
          }
        }
        if (captured) break;
      }
    }

    // Check if player won (all 4 tokens home)
    const finishedTokens = this.tokens[playerId].filter(t => t.type === 'HOME').length;
    if (finishedTokens === 4 && !this.winners.includes(playerId)) {
      this.winners.push(playerId);
      if (this.winners.length >= this.players.length - 1) {
        this.state = 'FINISHED';
        return {
          success: true,
          finished: true,
          winners: this.winners,
          captured
        };
      }
    }

    // Extra turn condition:
    // 1) Rolled positive 6
    // 2) Captured an opponent's piece
    // 3) Successfully reached HOME
    const getsBonus = this.pendingRoll.extraTurn || captured !== null || wasHome;

    if (getsBonus) {
      if (this.pendingRoll.extraTurn) {
        // Roll 6 / -6: timer is halved (minimum 2s)
        this.currentTurnTimer = Math.max(2, Math.floor(this.currentTurnTimer / 2));
      } else {
        // Capture / Home bonus: full timer reset
        this.currentTurnTimer = this.defaultTimer;
      }
      this.pendingRoll = null;
      this.currentChallenge = generateChallenge();
      this.state = 'WAITING_FOR_ROLL';
    } else {
      this.nextTurn();
    }

    return {
      success: true,
      captured,
      extraTurn: getsBonus,
      nextPlayer: this.currentTurnPlayer,
      currentTimer: this.currentTurnTimer,
      currentChallenge: this.currentChallenge,
      finished: false,
      winners: this.winners
    };
  }

  nextTurn() {
    this.consecutiveSixes = 0;
    this.currentTurnTimer = this.defaultTimer;
    this.pendingRoll = null;
    this.currentChallenge = generateChallenge();
    this.state = 'WAITING_FOR_ROLL';

    if (this.winners.length >= this.players.length) return;

    let count = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      count++;
    } while (this.winners.includes(this.currentTurnPlayer?.id) && count < this.players.length);
  }
}
