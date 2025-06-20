// アプリケーション状態管理

import {
	AppState,
	Team,
	Match,
	AppSettings,
	FormationData,
} from "@/types/index.js";

/**
 * アプリケーション状態管理クラス
 * 中央集権的な状態管理とLocalStorage連携を提供
 */
export class AppStateManager {
	private state: AppState;
	private readonly STORAGE_KEY = "tennisMatchData";
	private readonly PARTICIPATION_KEY = "teamParticipation";
	private readonly FORMATIONS_KEY = "savedFormations";

	constructor() {
		this.state = this.getInitialState();
		this.loadFromStorage();
	}

	/**
	 * 初期状態の生成
	 */
	private getInitialState(): AppState {
		return {
			teams: [],
			absentTeam: { id: 6, name: "未割り当て", members: [], isActive: true },
			originalTeams: [],
			matches: [],
			settings: { matchPoint: 7 },
			teamParticipation: {},
			selectedMembers: new Set(),
			formations: {
				current: "デフォルト",
				saved: {},
			},
		};
	}

	/**
	 * 現在の状態を取得
	 */
	getState(): AppState {
		return {
			...this.state,
			selectedMembers: new Set(this.state.selectedMembers),
		};
	}

	/**
	 * チーム一覧を更新
	 */
	updateTeams(teams: Team[]): void {
		this.state.teams = [...teams];
		this.saveToStorage();
		this.notifyStateChange("teams");
	}

	/**
	 * 欠席チームを更新
	 */
	updateAbsentTeam(team: Team): void {
		this.state.absentTeam = { ...team };
		this.saveToStorage();
		this.notifyStateChange("absentTeam");
	}

	/**
	 * 試合結果を更新
	 */
	updateMatches(matches: Match[]): void {
		this.state.matches = [...matches];
		this.saveToStorage();
		this.notifyStateChange("matches");
	}

	/**
	 * 単一試合結果を更新または追加
	 */
	updateMatch(match: Match): void {
		const existingIndex = this.state.matches.findIndex(m =>
			(m.team1Id === match.team1Id && m.team2Id === match.team2Id) ||
			(m.team1Id === match.team2Id && m.team2Id === match.team1Id)
		);

		if (existingIndex >= 0) {
			this.state.matches[existingIndex] = { ...match };
		} else {
			this.state.matches.push({ ...match });
		}

		this.saveToStorage();
		this.notifyStateChange("matches");
	}

	/**
	 * 設定を更新
	 */
	updateSettings(settings: Partial<AppSettings>): void {
		this.state.settings = { ...this.state.settings, ...settings };
		this.saveToStorage();
		this.notifyStateChange("settings");
	}

	/**
	 * チーム参加状態を更新
	 */
	updateTeamParticipation(teamId: number, isParticipating: boolean): void {
		this.state.teamParticipation[teamId] = isParticipating;
		this.saveParticipationToStorage();
		this.notifyStateChange("teamParticipation");
	}

	/**
	 * 全チーム参加状態を設定
	 */
	setAllTeamParticipation(participationMap: Record<number, boolean>): void {
		this.state.teamParticipation = { ...participationMap };
		this.saveParticipationToStorage();
		this.notifyStateChange("teamParticipation");
	}

	/**
	 * 選択メンバーを更新
	 */
	updateSelectedMembers(members: Set<string>): void {
		this.state.selectedMembers = new Set(members);
		this.notifyStateChange("selectedMembers");
	}

	/**
	 * メンバー選択状態を切り替え
	 */
	toggleMemberSelection(memberName: string): boolean {
		if (this.state.selectedMembers.has(memberName)) {
			this.state.selectedMembers.delete(memberName);
			this.notifyStateChange("selectedMembers");
			return false;
		} else {
			this.state.selectedMembers.add(memberName);
			this.notifyStateChange("selectedMembers");
			return true;
		}
	}

	/**
	 * 選択メンバーをクリア
	 */
	clearSelectedMembers(): void {
		this.state.selectedMembers.clear();
		this.notifyStateChange("selectedMembers");
	}

	/**
	 * 編成データを更新
	 */
	updateFormations(formations: FormationData): void {
		this.state.formations = { ...formations };
		this.saveFormationsToStorage();
		this.notifyStateChange("formations");
	}

	/**
	 * オリジナル構成を設定
	 */
	setOriginalTeams(teams: Team[]): void {
		this.state.originalTeams = teams.map((team) => ({
			...team,
			members: [...team.members],
		}));
		this.saveToStorage();
	}

	/**
	 * オリジナル構成に戻す
	 */
	resetToOriginalTeams(): void {
		if (this.state.originalTeams.length > 0) {
			this.state.teams = this.state.originalTeams.map((team) => ({
				...team,
				members: [...team.members],
			}));
			this.clearSelectedMembers();
			this.saveToStorage();
			this.notifyStateChange("teams");
		}
	}

	/**
	 * 全メンバーを未割り当てにする
	 */
	clearAllMembers(): void {
		// 全チームのメンバーを欠席チームに移動
		const allMembers: string[] = [];

		for (const team of this.state.teams) {
			allMembers.push(...team.members);
			team.members = [];
		}

		this.state.absentTeam.members = [
			...this.state.absentTeam.members,
			...allMembers,
		];

		this.clearSelectedMembers();
		this.saveToStorage();
		this.notifyStateChange("teams");
		this.notifyStateChange("absentTeam");
	}

	/**
	 * 参加チーム一覧を取得
	 */
	getParticipatingTeams(): Team[] {
		return this.state.teams.filter(
			(team) => this.state.teamParticipation[team.id] !== false,
		);
	}

	/**
	 * LocalStorageからデータを読み込み
	 */
	private loadFromStorage(): void {
		try {
			// メインデータ
			const savedData = localStorage.getItem(this.STORAGE_KEY);
			if (savedData) {
				const parsedData = JSON.parse(savedData);

				// 基本データの復元
				if (parsedData.teams) this.state.teams = parsedData.teams;
				if (parsedData.absentTeam)
					this.state.absentTeam = parsedData.absentTeam;
				if (parsedData.originalTeams)
					this.state.originalTeams = parsedData.originalTeams;
				if (parsedData.matches) this.state.matches = parsedData.matches;
				if (parsedData.settings) this.state.settings = parsedData.settings;
			}

			// 参加状態データ
			const participationData = localStorage.getItem(this.PARTICIPATION_KEY);
			if (participationData) {
				this.state.teamParticipation = JSON.parse(participationData);
			}

			// 編成データ
			const formationsData = localStorage.getItem(this.FORMATIONS_KEY);
			if (formationsData) {
				this.state.formations = JSON.parse(formationsData);
			}
		} catch (error) {
			console.error("データ読み込みエラー:", error);
			this.showErrorMessage("保存されたデータの読み込みに失敗しました");
		}
	}

	/**
	 * メインデータをLocalStorageに保存
	 */
	private saveToStorage(): void {
		try {
			const dataToSave = {
				teams: this.state.teams,
				absentTeam: this.state.absentTeam,
				originalTeams: this.state.originalTeams,
				matches: this.state.matches,
				settings: this.state.settings,
			};

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
		} catch (error) {
			console.error("データ保存エラー:", error);
			this.showErrorMessage("データの保存に失敗しました");
		}
	}

	/**
	 * 参加状態をLocalStorageに保存
	 */
	private saveParticipationToStorage(): void {
		try {
			localStorage.setItem(
				this.PARTICIPATION_KEY,
				JSON.stringify(this.state.teamParticipation),
			);
		} catch (error) {
			console.error("参加状態保存エラー:", error);
		}
	}

	/**
	 * 編成データをLocalStorageに保存
	 */
	private saveFormationsToStorage(): void {
		try {
			localStorage.setItem(
				this.FORMATIONS_KEY,
				JSON.stringify(this.state.formations),
			);
		} catch (error) {
			console.error("編成データ保存エラー:", error);
		}
	}

	/**
	 * 状態変更を通知
	 */
	private notifyStateChange(changedProperty: keyof AppState): void {
		const event = new CustomEvent("appStateChange", {
			detail: {
				property: changedProperty,
				state: this.getState(),
			},
		});
		document.dispatchEvent(event);
	}

	/**
	 * エラーメッセージを表示
	 */
	private showErrorMessage(message: string): void {
		const event = new CustomEvent("showToast", {
			detail: {
				message,
				type: "error",
			},
		});
		document.dispatchEvent(event);
	}

	/**
	 * デバッグ用: 状態をコンソールに出力
	 */
	debugLogState(): void {
		console.group("🎾 App State Debug");
		console.log("Teams:", this.state.teams);
		console.log("Absent Team:", this.state.absentTeam);
		console.log("Matches:", this.state.matches);
		console.log("Settings:", this.state.settings);
		console.log("Team Participation:", this.state.teamParticipation);
		console.log("Selected Members:", Array.from(this.state.selectedMembers));
		console.log("Formations:", this.state.formations);
		console.groupEnd();
	}

	/**
	 * LocalStorageをクリア
	 */
	clearStorage(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			localStorage.removeItem(this.PARTICIPATION_KEY);
			localStorage.removeItem(this.FORMATIONS_KEY);

			// 状態をリセット
			this.state = this.getInitialState();
			this.notifyStateChange("teams");
		} catch (error) {
			console.error("ストレージクリアエラー:", error);
		}
	}

	/**
	 * 統計データを取得
	 */
	getStatistics() {
		const participatingTeams = this.getParticipatingTeams();
		const totalMatches = this.getTotalPossibleMatches(
			participatingTeams.length,
		);
		const completedMatches = Object.keys(this.state.matches).length;

		return {
			totalTeams: participatingTeams.length,
			totalMatches,
			completedMatches,
			progressRate:
				totalMatches > 0
					? Math.round((completedMatches / totalMatches) * 100)
					: 0,
			pendingMatches: totalMatches - completedMatches,
		};
	}

	/**
	 * 可能な総試合数を計算
	 */
	private getTotalPossibleMatches(teamCount: number): number {
		return teamCount > 1 ? (teamCount * (teamCount - 1)) / 2 : 0;
	}
}

// グローバルインスタンス
export const appState = new AppStateManager();
