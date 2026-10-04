import { computeTokenTargetPosition, isSafeSquare } from './Board.js';
import { generateChallenge } from './MathDice.js';

export class LudoGame {
  constructor({ id, defaultTimer = 5, players }) {
    this.id = id;
    this.defaultTimer = Math.min(5, Math.max(3, Number(defaultTimer) || 5));
    this.currentTurnTimer = this.defaultTimer;
    this.players = players; // array of { id, name, color }
    this.currentTurnIndex = 0;
    this.consecutiveSixes = 0;
    this.pendingRoll = null;
    this.currentChallenge = null;
    this.state = 'WAITING_FOR_SPIN'; // 'WAITING_FOR_SPIN' | 'WAITING_FOR_INPUT' | 'WAITING_FOR_MOVE' | 'FINISHED'
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

  spinChallenge(playerId) {
    if (this.currentTurnPlayer.id !== playerId) {
      throw new Error('Bukan giliranmu');
    }
    if (this.state === 'WAITING_FOR_INPUT' && this.currentChallenge) {
      return this.currentChallenge;
    }
    this.currentChallenge = generateChallenge();
    this.state = 'WAITING_FOR_INPUT';
    return this.currentChallenge;
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
      this.state = 'WAITING_FOR_SPIN';
      this.currentChallenge = null;
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
      throw new Error('Not your turn to move or invalid game state');
    }

    const player = this.currentTurnPlayer;
    const tokens = this.tokens[playerId] || [];
    const token = tokens.find(t => t.id === tokenId);
    if (!token) throw new Error('Token not found');

    const targetPos = computeTokenTargetPosition({
      color: player.color,
      currentPos: token,
      steps: this.pendingRoll.steps,
      direction: this.pendingRoll.direction
    });

    if (!targetPos) {
      throw new Error('Invalid move for this token');
    }

    // Execute move
    token.type = targetPos.type;
    token.index = targetPos.index;

    // Check if token reached HOME
    const wasHome = token.type === 'HOME';

    // Capture logic (only on TRACK and not in SAFE_SQUARES)
    let captured = null;
    if (token.type === 'TRACK' && !isSafeSquare(token.index)) {
      // Check for opponent tokens on this square
      this.players.forEach(otherPlayer => {
        if (otherPlayer.id !== playerId) {
          const oppTokens = this.tokens[otherPlayer.id] || [];
          oppTokens.forEach(oppToken => {
            if (oppToken.type === 'TRACK' && oppToken.index === token.index) {
              // Send back to YARD
              oppToken.type = 'YARD';
              oppToken.index = oppToken.id;
              captured = {
                playerId: otherPlayer.id,
                victimPlayerId: otherPlayer.id,
                victimColor: otherPlayer.color,
                victimTokenId: oppToken.id
              };
            }
          });
        }
      });
    }

    // Check Win condition (all 4 tokens reached HOME)
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
    // 1) Rolled 6 or -6 (extraTurn)
    // 2) Captured an opponent's piece
    // 3) Successfully reached HOME
    const getsBonus = this.pendingRoll.extraTurn || captured !== null || wasHome;

    if (getsBonus) {
      if (this.pendingRoll.extraTurn) {
        // Roll 6 / -6: timer berkurang (3 detik)
        this.currentTurnTimer = 3;
      } else {
        // Capture / Home bonus: full timer reset (default max 5 detik)
        this.currentTurnTimer = this.defaultTimer;
      }
      this.pendingRoll = null;
      this.currentChallenge = null;
      this.state = 'WAITING_FOR_SPIN';
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
    this.currentTurnTimer = this.defaultTimer; // Kembali ke default 5 detik
    this.pendingRoll = null;
    this.currentChallenge = null;
    this.state = 'WAITING_FOR_SPIN';

    if (this.winners.length >= this.players.length) return;

    let count = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      count++;
    } while (this.winners.includes(this.currentTurnPlayer?.id) && count < this.players.length);
  }
}
