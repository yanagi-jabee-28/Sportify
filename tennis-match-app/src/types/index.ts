// 基本的なデータ型定義

export interface Team {
	id: number;
	members: string[];
}

export interface Match {
	team1: number;
	team2: number;
	scoreTeam1: number;
	scoreTeam2: number;
	winner: number | null;
	isDraw: boolean;
}

export interface AppSettings {
	matchPoint: number;
}

export interface TournamentInfo {
	name: string;
	date: string;
	location: string;
	format: string;
}

export interface MatchSettings {
	scoringSystem: string;
	winCondition: string;
	maxSetsPerMatch: number;
	pointsPerSet: number;
	matchPoint: number;
}

export interface Config {
	teams: Team[];
	matchSettings: MatchSettings;
	tournamentInfo: TournamentInfo;
}

export interface TeamStatistics {
	teamId: number;
	teamName: string;
	wins: number;
	losses: number;
	draws: number;
	totalMatches: number;
	points: number;
	pointsAgainst: number;
	pointDifference: number;
	winRate: number;
	rank: number;
}

export interface FormationData {
	current: string;
	saved: Record<string, Team[]>;
}

export interface AppState {
	teams: Team[];
	absentTeam: Team;
	originalTeams: Team[];
	matches: Record<string, Match>;
	settings: AppSettings;
	teamParticipation: Record<number, boolean>;
	selectedMembers: Set<string>;
	formations: FormationData;
}

// CSVエクスポート用の型定義
export interface CSVExportData {
	tournamentInfo: TournamentInfo;
	systemSettings: SystemSettings;
	statistics: TournamentStatistics;
	teams: Team[];
	matches: Match[];
	teamStats: TeamStatistics[];
}

export interface SystemSettings {
	matchPoint: number;
	appVersion: string;
	exportDate: string;
}

export interface TournamentStatistics {
	totalTeams: number;
	totalMatches: number;
	completedMatches: number;
	pendingMatches: number;
	winLossMatches: number;
	drawMatches: number;
	progressRate: number;
	totalPoints: number;
	averagePointsPerMatch: number;
}

// 結果の型定義（エラーハンドリング用）
export type Result<T, E = Error> =
	| { success: true; data: T }
	| { success: false; error: E };

// バリデーション用の型定義
export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

// イベント用の型定義
export interface CustomEventDetail {
	type: string;
	data?: unknown;
}

// メンバー選択状態の型
export interface MemberSelectionState {
	selectedMembers: Set<string>;
	isSelecting: boolean;
}

// チーム編集状態の型
export interface TeamEditState {
	editingTeamId: number | null;
	isEditing: boolean;
}
