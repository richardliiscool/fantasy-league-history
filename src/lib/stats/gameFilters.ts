import { isRecordEligibleGame, type GameResult } from "./leagueStats";

export type GameScope = "official" | "regular" | "playoff" | "consolation";

export const GAME_SCOPE_LABELS: Record<GameScope, string> = {
  official: "Official",
  regular: "Regular",
  playoff: "Playoffs",
  consolation: "Consolation",
};

export const filterGameResultsByScope = (
  gameResults: GameResult[],
  scope: GameScope,
) => {
  if (scope === "official") {
    return gameResults.filter(isRecordEligibleGame);
  }

  return gameResults.filter((game) => game.gameType === scope);
};
