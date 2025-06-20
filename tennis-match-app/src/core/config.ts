// 設定ファイル読み込み・管理

import { Config, Team, MatchSettings, TournamentInfo } from "@/types/index.js";

/**
 * 設定管理クラス
 * config.jsonの読み込みと設定データの管理を行う
 */
export class ConfigManager {
	private config: Config | null = null;
	private readonly CONFIG_FILE_PATH = "/config.json";

	/**
	 * 設定ファイルを読み込み
	 */
	async loadConfig(): Promise<Config> {
		try {
			const response = await fetch(this.CONFIG_FILE_PATH);

			if (!response.ok) {
				throw new Error(
					`設定ファイルの読み込みに失敗しました: ${response.status}`,
				);
			}

			const configData = await response.json();

			// データの妥当性チェック
			if (!this.validateConfig(configData)) {
				throw new Error("設定ファイルの形式が正しくありません");
			}

			this.config = configData;
			return this.config;
		} catch (error) {
			console.error("Config loading error:", error);

			// フォールバック設定を返す
			const fallbackConfig = this.getFallbackConfig();
			this.config = fallbackConfig;

			// エラー通知
			this.notifyConfigError(
				error instanceof Error ? error.message : "不明なエラー",
			);

			return fallbackConfig;
		}
	}

	/**
	 * 現在の設定を取得
	 */
	getConfig(): Config | null {
		return this.config;
	}

	/**
	 * チーム一覧を取得
	 */
	getTeams(): Team[] {
		return this.config?.teams || [];
	}

	/**
	 * 試合設定を取得
	 */
	getMatchSettings(): MatchSettings {
		return this.config?.matchSettings || this.getDefaultMatchSettings();
	}

	/**
	 * 大会情報を取得
	 */
	getTournamentInfo(): TournamentInfo {
		return this.config?.tournamentInfo || this.getDefaultTournamentInfo();
	}

	/**
	 * 設定データの妥当性チェック
	 */
	private validateConfig(data: unknown): data is Config {
		if (!data || typeof data !== "object") {
			return false;
		}

		const config = data as Config;

		// チーム配列の確認
		if (!Array.isArray(config.teams)) {
			console.error("Config validation error: teams is not an array");
			return false;
		}

		// 各チームの妥当性チェック
		for (const team of config.teams) {
			if (!this.validateTeam(team)) {
				console.error("Config validation error: invalid team data", team);
				return false;
			}
		}

		// 試合設定の確認
		if (
			!config.matchSettings ||
			!this.validateMatchSettings(config.matchSettings)
		) {
			console.error("Config validation error: invalid match settings");
			return false;
		}

		// 大会情報の確認
		if (
			!config.tournamentInfo ||
			!this.validateTournamentInfo(config.tournamentInfo)
		) {
			console.error("Config validation error: invalid tournament info");
			return false;
		}

		return true;
	}

	/**
	 * チームデータの妥当性チェック
	 */
	private validateTeam(team: unknown): team is Team {
		if (!team || typeof team !== "object") {
			return false;
		}

		const t = team as Team;

		return (
			typeof t.id === "number" &&
			t.id > 0 &&
			typeof t.name === "string" &&
			t.name.trim().length > 0 &&
			typeof t.isActive === "boolean" &&
			Array.isArray(t.members) &&
			t.members.every(
				(member) => typeof member === "string" && member.trim().length > 0,
			)
		);
	}

	/**
	 * 試合設定の妥当性チェック
	 */
	private validateMatchSettings(settings: unknown): settings is MatchSettings {
		if (!settings || typeof settings !== "object") {
			return false;
		}

		const s = settings as MatchSettings;

		return (
			typeof s.matchPoint === "number" &&
			s.matchPoint > 0 &&
			s.matchPoint <= 99 &&
			typeof s.scoringSystem === "string" &&
			typeof s.winCondition === "string"
		);
	}

	/**
	 * 大会情報の妥当性チェック
	 */
	private validateTournamentInfo(info: unknown): info is TournamentInfo {
		if (!info || typeof info !== "object") {
			return false;
		}

		const i = info as TournamentInfo;

		return (
			typeof i.name === "string" &&
			i.name.trim().length > 0 &&
			typeof i.date === "string" &&
			typeof i.location === "string" &&
			typeof i.format === "string"
		);
	}

	/**
	 * フォールバック設定を生成
	 */
	private getFallbackConfig(): Config {
		return {
			teams: [
				{ id: 1, name: "チーム1", members: ["チーム1 メンバー1", "チーム1 メンバー2"], isActive: true },
				{ id: 2, name: "チーム2", members: ["チーム2 メンバー1", "チーム2 メンバー2"], isActive: true },
				{ id: 3, name: "チーム3", members: ["チーム3 メンバー1", "チーム3 メンバー2"], isActive: true },
				{ id: 4, name: "チーム4", members: ["チーム4 メンバー1", "チーム4 メンバー2"], isActive: true },
				{ id: 5, name: "チーム5", members: ["チーム5 メンバー1", "チーム5 メンバー2"], isActive: true },
			],
			matchSettings: this.getDefaultMatchSettings(),
			tournamentInfo: this.getDefaultTournamentInfo(),
		};
	}

	/**
	 * デフォルト試合設定
	 */
	private getDefaultMatchSettings(): MatchSettings {
		return {
			scoringSystem: "points",
			winCondition: "highestScore",
			maxSetsPerMatch: 3,
			pointsPerSet: 6,
			matchPoint: 7,
		};
	}

	/**
	 * デフォルト大会情報
	 */
	private getDefaultTournamentInfo(): TournamentInfo {
		const today = new Date();
		const dateStr = today.toLocaleDateString("ja-JP");

		return {
			name: "テニス大会",
			date: dateStr,
			location: "テニスコート",
			format: "総当たり戦",
		};
	}

	/**
	 * 設定読み込みエラーを通知
	 */
	private notifyConfigError(message: string): void {
		const event = new CustomEvent("showToast", {
			detail: {
				message: `設定読み込みエラー: ${message}`,
				type: "warning",
			},
		});
		document.dispatchEvent(event);
	}

	/**
	 * 設定を動的に更新
	 */
	updateMatchSettings(newSettings: Partial<MatchSettings>): void {
		if (!this.config) return;

		this.config.matchSettings = {
			...this.config.matchSettings,
			...newSettings,
		};

		// 設定変更を通知
		const event = new CustomEvent("configChange", {
			detail: {
				type: "matchSettings",
				settings: this.config.matchSettings,
			},
		});
		document.dispatchEvent(event);
	}

	/**
	 * チーム構成を動的に更新
	 */
	updateTeams(newTeams: Team[]): void {
		if (!this.config) return;

		this.config.teams = [...newTeams];

		// 設定変更を通知
		const event = new CustomEvent("configChange", {
			detail: {
				type: "teams",
				teams: this.config.teams,
			},
		});
		document.dispatchEvent(event);
	}

	/**
	 * デバッグ用: 設定をコンソールに出力
	 */
	debugLogConfig(): void {
		console.group("⚙️ Config Debug");
		console.log("Config loaded:", !!this.config);
		console.log("Teams:", this.getTeams());
		console.log("Match Settings:", this.getMatchSettings());
		console.log("Tournament Info:", this.getTournamentInfo());
		console.groupEnd();
	}
}

// グローバルインスタンス
export const configManager = new ConfigManager();
