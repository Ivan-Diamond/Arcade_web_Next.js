/**
 * Utility class to handle game rewards and costs
 * Based on the Flutter app's reward system
 */
export class GameRewards {
  /**
   * Returns the maximum amount of coins that can be won for a specific game
   */
  static getMaxWinAmount(gameName: string): number {
    const gameNameUpper = gameName.toUpperCase();
    
    if (gameNameUpper.includes('COLOR') || gameNameUpper.includes('CATCH')) {
      // Yellow ball gives the highest reward in Color Game
      return 30;
    } else if (gameNameUpper.includes('BASE')) {
      return 5;
    } else if (gameNameUpper.includes('REBOUND')) {
      return 50;
    } else if (gameNameUpper.includes('PACHINKO')) {
      return 25;
    } else if (gameNameUpper.includes('RANDOM') || gameNameUpper.includes('HOLE')) {
      return 10;
    } else if (gameNameUpper.includes('ALIEN') || gameNameUpper.includes('SHIP')) {
      return 30;
    } else if (gameNameUpper.includes('SWEEPER')) {
      return 20;
    }
    
    // Default case for unknown games
    return 5;
  }
  
  /**
   * Returns formatted text for max win amount
   */
  static getFormattedMaxWinAmount(gameName: string): string {
    const maxWin = this.getMaxWinAmount(gameName);
    return `${maxWin} coins`;
  }
}
