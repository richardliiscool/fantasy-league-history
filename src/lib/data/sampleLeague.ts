import type { LeagueData } from "../domain/types";

export const sampleLeagueData = {
  managers: [
    { id: "manager-richard", displayName: "Richard Lia" },
    { id: "manager-maya", displayName: "Maya Patel" },
    { id: "manager-jamal", displayName: "Jamal Brooks" },
    { id: "manager-tessa", displayName: "Tessa Morgan" },
  ],
  seasons: [
    {
      id: "season-2023",
      year: 2023,
      label: "2023 Season",
      championManagerId: "manager-maya",
    },
    {
      id: "season-2024",
      year: 2024,
      label: "2024 Season",
    },
  ],
  teams: [
    {
      id: "team-2023-richard",
      seasonId: "season-2023",
      managerId: "manager-richard",
      name: "Waiver Wire Wizards",
    },
    {
      id: "team-2023-maya",
      seasonId: "season-2023",
      managerId: "manager-maya",
      name: "Red Zone Royalty",
    },
    {
      id: "team-2023-jamal",
      seasonId: "season-2023",
      managerId: "manager-jamal",
      name: "Fourth & Long",
    },
    {
      id: "team-2023-tessa",
      seasonId: "season-2023",
      managerId: "manager-tessa",
      name: "Bye Week Bullies",
    },
    {
      id: "team-2024-richard",
      seasonId: "season-2024",
      managerId: "manager-richard",
      name: "Waiver Wire Wizards",
    },
    {
      id: "team-2024-maya",
      seasonId: "season-2024",
      managerId: "manager-maya",
      name: "Red Zone Royalty",
    },
    {
      id: "team-2024-jamal",
      seasonId: "season-2024",
      managerId: "manager-jamal",
      name: "Fourth & Long",
    },
    {
      id: "team-2024-tessa",
      seasonId: "season-2024",
      managerId: "manager-tessa",
      name: "Bye Week Bullies",
    },
  ],
  weeks: [
    { id: "week-2023-1", seasonId: "season-2023", number: 1, label: "Week 1" },
    { id: "week-2023-2", seasonId: "season-2023", number: 2, label: "Week 2" },
    { id: "week-2023-3", seasonId: "season-2023", number: 3, label: "Week 3" },
    { id: "week-2023-4", seasonId: "season-2023", number: 4, label: "Week 4" },
    { id: "week-2024-1", seasonId: "season-2024", number: 1, label: "Week 1" },
    { id: "week-2024-2", seasonId: "season-2024", number: 2, label: "Week 2" },
    { id: "week-2024-3", seasonId: "season-2024", number: 3, label: "Week 3" },
  ],
  matchups: [
    {
      id: "matchup-2023-1-a",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-1",
      scores: [
        { teamId: "team-2023-richard", points: 132.4 },
        { teamId: "team-2023-maya", points: 128.1 },
      ],
    },
    {
      id: "matchup-2023-1-b",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-1",
      scores: [
        { teamId: "team-2023-jamal", points: 95.7 },
        { teamId: "team-2023-tessa", points: 141.2 },
      ],
    },
    {
      id: "matchup-2023-2-a",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-2",
      scores: [
        { teamId: "team-2023-richard", points: 88.6 },
        { teamId: "team-2023-jamal", points: 121.4 },
      ],
    },
    {
      id: "matchup-2023-2-b",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-2",
      scores: [
        { teamId: "team-2023-maya", points: 150.8 },
        { teamId: "team-2023-tessa", points: 149.6 },
      ],
    },
    {
      id: "matchup-2023-3-a",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-3",
      scores: [
        { teamId: "team-2023-richard", points: 164.3 },
        { teamId: "team-2023-tessa", points: 102 },
      ],
    },
    {
      id: "matchup-2023-3-b",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-3",
      scores: [
        { teamId: "team-2023-maya", points: 112.2 },
        { teamId: "team-2023-jamal", points: 112.2 },
      ],
    },
    {
      id: "matchup-2023-4-a",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-4",
      scores: [
        { teamId: "team-2023-richard", points: 117.9 },
        { teamId: "team-2023-maya", points: 139.1 },
      ],
    },
    {
      id: "matchup-2023-4-b",
      seasonId: "season-2023",
      gameType: "regular",
      weekId: "week-2023-4",
      scores: [
        { teamId: "team-2023-jamal", points: 130.5 },
        { teamId: "team-2023-tessa", points: 91.4 },
      ],
    },
    {
      id: "matchup-2024-1-a",
      seasonId: "season-2024",
      gameType: "regular",
      weekId: "week-2024-1",
      scores: [
        { teamId: "team-2024-richard", points: 143.2 },
        { teamId: "team-2024-jamal", points: 138.9 },
      ],
    },
    {
      id: "matchup-2024-1-b",
      seasonId: "season-2024",
      gameType: "regular",
      weekId: "week-2024-1",
      scores: [
        { teamId: "team-2024-maya", points: 101.6 },
        { teamId: "team-2024-tessa", points: 125.5 },
      ],
    },
    {
      id: "matchup-2024-2-a",
      seasonId: "season-2024",
      gameType: "regular",
      weekId: "week-2024-2",
      scores: [
        { teamId: "team-2024-richard", points: 109.8 },
        { teamId: "team-2024-tessa", points: 109.1 },
      ],
    },
    {
      id: "matchup-2024-2-b",
      seasonId: "season-2024",
      gameType: "regular",
      weekId: "week-2024-2",
      scores: [
        { teamId: "team-2024-maya", points: 133.7 },
        { teamId: "team-2024-jamal", points: 87.3 },
      ],
    },
    {
      id: "matchup-2024-3-a",
      seasonId: "season-2024",
      gameType: "regular",
      weekId: "week-2024-3",
      scores: [
        { teamId: "team-2024-richard", points: 76.4 },
        { teamId: "team-2024-maya", points: 118.6 },
      ],
    },
    {
      id: "matchup-2024-3-b",
      seasonId: "season-2024",
      gameType: "regular",
      weekId: "week-2024-3",
      scores: [
        { teamId: "team-2024-jamal", points: 147.9 },
        { teamId: "team-2024-tessa", points: 154.2 },
      ],
    },
  ],
} satisfies LeagueData;
