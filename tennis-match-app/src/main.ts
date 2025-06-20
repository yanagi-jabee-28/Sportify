// メインエントリーポイント

import { appState } from '@/core/state.js';
import { configManager } from '@/core/config.js';
import { DOMHelper, EventListenerManager } from '@/utils/dom.js';

/**
 * アプリケーションメインクラス
 */
class TennisMatchApp {
	private isInitialized = false;
	private loadingIndicator: HTMLElement | null = null;

	constructor() {
		this.init();
	}

	/**
	 * アプリケーション初期化
	 */
	private async init(): Promise<void> {
		try {
			console.log('🎾 テニス試合管理システム - 初期化開始');

			// ローディング表示
			this.showLoading();

			// DOM準備完了まで待機
			if (document.readyState === 'loading') {
				await new Promise(resolve => {
					document.addEventListener('DOMContentLoaded', resolve);
				});
			}

			// 設定ファイル読み込み
			await this.loadConfiguration();

			// UI初期化
			this.initializeUI();

			// イベントリスナー設定
			this.setupEventListeners();

			// 初期表示更新
			this.updateUI();

			// ローディング非表示
			this.hideLoading();

			this.isInitialized = true;
			console.log('✅ アプリケーション初期化完了');

		} catch (error) {
			console.error('❌ アプリケーション初期化エラー:', error);
			this.handleInitializationError(error);
		}
	}

	/**
	 * 設定ファイル読み込み
	 */
	private async loadConfiguration(): Promise<void> {
		console.log('📄 設定ファイル読み込み中...');

		const config = await configManager.loadConfig();

		// 初期チーム構成を設定
		const teams = config.teams;
		appState.updateTeams(teams);
		appState.setOriginalTeams(teams);

		// 初期参加設定（全チーム参加）
		const participationMap: Record<number, boolean> = {};
		teams.forEach(team => {
			participationMap[team.id] = true;
		});
		appState.setAllTeamParticipation(participationMap);

		// マッチポイント設定
		appState.updateSettings({ matchPoint: config.matchSettings.matchPoint });

		console.log('✅ 設定ファイル読み込み完了');
	}

	/**
	 * UI初期化
	 */
	private initializeUI(): void {
		console.log('🎨 UI初期化中...');

		// 基本要素の確認
		this.validateRequiredElements();

		// ヘッダー設定
		this.initializeHeader();

		// チームセクション初期化
		this.initializeTeamSection();

		// 試合セクション初期化
		this.initializeMatchSection();

		// 順位セクション初期化
		this.initializeStandingsSection();

		// モーダル初期化
		this.initializeModals();

		// トースト初期化
		this.initializeToast();

		console.log('✅ UI初期化完了');
	}

	/**
	 * 必須要素の確認
	 */
	private validateRequiredElements(): void {
		const requiredElements = [
			'teamsList',
			'matchTable',
			'standingsTable',
			'scoreModal',
			'toast',
			'matchPointInput',
			'exportBtn'
		];

		for (const elementId of requiredElements) {
			const element = DOMHelper.querySelector(`#${elementId}`);
			if (!element) {
				throw new Error(`必須要素が見つかりません: #${elementId}`);
			}
		}
	}

	/**
	 * ヘッダー初期化
	 */
	private initializeHeader(): void {
		const matchPointInput = DOMHelper.querySelector<HTMLInputElement>('#matchPointInput');
		if (matchPointInput) {
			const currentSettings = appState.getState().settings;
			matchPointInput.value = currentSettings.matchPoint.toString();
		}
	}

	/**
	 * チームセクション初期化
	 */
	private initializeTeamSection(): void {
		// チーム一覧を初期表示
		this.renderTeams();

		// 選択パレットを初期化
		this.updateSelectedMembersPalette();
	}

	/**
	 * 試合セクション初期化
	 */
	private initializeMatchSection(): void {
		// 対戦表を初期表示
		this.renderMatchTable();
	}

	/**
	 * 順位セクション初期化
	 */
	private initializeStandingsSection(): void {
		// 順位表を初期表示
		this.renderStandingsTable();
	}

	/**
	 * モーダル初期化
	 */
	private initializeModals(): void {
		// スコア入力モーダルの初期設定
		const scoreModal = DOMHelper.querySelector('#scoreModal');
		if (scoreModal) {
			DOMHelper.setAriaAttribute(scoreModal, 'hidden', 'true');
		}
	}

	/**
	 * トースト初期化
	 */
	private initializeToast(): void {
		const toast = DOMHelper.querySelector('#toast');
		if (toast) {
			DOMHelper.setAriaAttribute(toast, 'hidden', 'true');
		}
	}

	/**
	 * イベントリスナー設定
	 */
	private setupEventListeners(): void {
		console.log('🔗 イベントリスナー設定中...');

		// アプリケーション状態変更
		EventListenerManager.addEventListener(document, 'appStateChange', (event: CustomEvent) => {
			this.handleStateChange(event.detail);
		});

		// 設定変更
		EventListenerManager.addEventListener(document, 'configChange', (event: CustomEvent) => {
			this.handleConfigChange(event.detail);
		});

		// トースト表示
		EventListenerManager.addEventListener(document, 'showToast', (event: CustomEvent) => {
			this.showToast(event.detail.message, event.detail.type);
		});

		// マッチポイント設定
		const matchPointInput = DOMHelper.querySelector<HTMLInputElement>('#matchPointInput');
		if (matchPointInput) {
			EventListenerManager.addEventListener(matchPointInput, 'change', () => {
				this.handleMatchPointChange(matchPointInput);
			});
		}

		// エクスポートボタン
		const exportBtn = DOMHelper.querySelector('#exportBtn');
		if (exportBtn) {
			EventListenerManager.addEventListener(exportBtn, 'click', () => {
				this.handleExport();
			});
		}

		// デバッグトグル
		const debugToggleBtn = DOMHelper.querySelector('#debugToggleBtn');
		if (debugToggleBtn) {
			EventListenerManager.addEventListener(debugToggleBtn, 'click', () => {
				this.toggleDebugPanel();
			});
		}

		// チーム管理ボタン
		this.setupTeamControlButtons();

		// デバッグボタン
		this.setupDebugButtons();

		console.log('✅ イベントリスナー設定完了');
	}

	/**
	 * チーム管理ボタンのイベント設定
	 */
	private setupTeamControlButtons(): void {
		const resetTeamsBtn = DOMHelper.querySelector('#resetTeamsBtn');
		if (resetTeamsBtn) {
			EventListenerManager.addEventListener(resetTeamsBtn, 'click', () => {
				appState.resetToOriginalTeams();
			});
		}

		const clearAllMembersBtn = DOMHelper.querySelector('#clearAllMembersBtn');
		if (clearAllMembersBtn) {
			EventListenerManager.addEventListener(clearAllMembersBtn, 'click', () => {
				appState.clearAllMembers();
			});
		}

		const clearSelectionBtn = DOMHelper.querySelector('#clearSelectionBtn');
		if (clearSelectionBtn) {
			EventListenerManager.addEventListener(clearSelectionBtn, 'click', () => {
				appState.clearSelectedMembers();
			});
		}
	}

	/**
	 * デバッグボタンのイベント設定
	 */
	private setupDebugButtons(): void {
		const generateRandomScoresBtn = DOMHelper.querySelector('#generateRandomScoresBtn');
		if (generateRandomScoresBtn) {
			EventListenerManager.addEventListener(generateRandomScoresBtn, 'click', () => {
				this.generateRandomScores();
			});
		}

		const clearAllMatchesBtn = DOMHelper.querySelector('#clearAllMatchesBtn');
		if (clearAllMatchesBtn) {
			EventListenerManager.addEventListener(clearAllMatchesBtn, 'click', () => {
				this.clearAllMatches();
			});
		}
	}

	/**
	 * 状態変更ハンドラー
	 */
	private handleStateChange(detail: { property: string; state: any }): void {
		console.log('📊 状態変更:', detail.property);

		switch (detail.property) {
			case 'teams':
			case 'absentTeam':
				this.renderTeams();
				this.renderMatchTable();
				this.renderStandingsTable();
				break;
			case 'selectedMembers':
				this.updateSelectedMembersPalette();
				this.updateTeamHeaders();
				break;
			case 'teamParticipation':
				this.updateTeamParticipationDisplay();
				this.renderMatchTable();
				this.renderStandingsTable();
				break;
			case 'matches':
				this.renderMatchTable();
				this.renderStandingsTable();
				break;
			case 'settings':
				this.updateMatchPointDisplay();
				break;
		}
	}

	/**
	 * 設定変更ハンドラー
	 */
	private handleConfigChange(detail: { type: string;[key: string]: any }): void {
		console.log('⚙️ 設定変更:', detail.type);

		if (detail.type === 'matchSettings') {
			appState.updateSettings({ matchPoint: detail.settings.matchPoint });
		}
	}

	/**
	 * マッチポイント変更ハンドラー
	 */
	private handleMatchPointChange(input: HTMLInputElement): void {
		const value = parseInt(input.value, 10);
		if (value >= 1 && value <= 99) {
			appState.updateSettings({ matchPoint: value });
			this.showToast(`マッチポイントを ${value} に設定しました`, 'success');
		} else {
			input.value = appState.getState().settings.matchPoint.toString();
			this.showToast('マッチポイントは1-99の範囲で設定してください', 'warning');
		}
	}

	/**
	 * エクスポートハンドラー
	 */
	private handleExport(): void {
		try {
			// TODO: CSVエクスポート機能を実装
			this.showToast('CSVエクスポート機能は準備中です', 'info');
		} catch (error) {
			console.error('Export error:', error);
			this.showToast('エクスポートに失敗しました', 'error');
		}
	}

	/**
	 * UI更新メソッド群（スタブ）
	 */
	private updateUI(): void {
		// 基本的なUI更新処理
		this.renderTeams();
		this.renderMatchTable();
		this.renderStandingsTable();
	}

	private renderTeams(): void {
		// TODO: チーム表示実装
		console.log('🏆 チーム表示更新');
	}

	private renderMatchTable(): void {
		// TODO: 対戦表実装
		console.log('⚡ 対戦表更新');
	}

	private renderStandingsTable(): void {
		// TODO: 順位表実装
		console.log('📊 順位表更新');
	}

	private updateSelectedMembersPalette(): void {
		// TODO: 選択パレット実装
		console.log('🎯 選択パレット更新');
	}

	private updateTeamHeaders(): void {
		// TODO: チームヘッダー更新実装
		console.log('🔄 チームヘッダー更新');
	}

	private updateTeamParticipationDisplay(): void {
		// TODO: 参加状態表示実装
		console.log('✅ 参加状態表示更新');
	}

	private updateMatchPointDisplay(): void {
		// TODO: マッチポイント表示実装
		console.log('🎯 マッチポイント表示更新');
	}
	/**
   * デバッグ機能
   */
	private toggleDebugPanel(): void {
		const debugPanel = DOMHelper.querySelector<HTMLElement>('#debugPanel');
		if (debugPanel) {
			const isHidden = debugPanel.hasAttribute('hidden');
			DOMHelper.setVisible(debugPanel, isHidden);
		}
	}

	private generateRandomScores(): void {
		// TODO: ランダムスコア生成実装
		this.showToast('ランダムスコア生成機能は準備中です', 'info');
	}

	private clearAllMatches(): void {
		appState.updateMatches({});
		this.showToast('全試合結果をクリアしました', 'success');
	}

	/**
	 * トースト通知表示
	 */
	private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
		// TODO: トースト実装
		console.log(`🔔 Toast [${type}]: ${message}`);
	}

	/**
	 * ローディング表示
	 */
	private showLoading(): void {
		this.loadingIndicator = DOMHelper.querySelector('#loadingIndicator');
		if (this.loadingIndicator) {
			DOMHelper.setVisible(this.loadingIndicator, true);
		}
	}

	/**
	 * ローディング非表示
	 */
	private hideLoading(): void {
		if (this.loadingIndicator) {
			DOMHelper.setVisible(this.loadingIndicator, false);
		}
	}

	/**
	 * 初期化エラーハンドラー
	 */
	private handleInitializationError(error: unknown): void {
		this.hideLoading();

		const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';

		// エラー表示
		const errorHtml = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        text-align: center;
        z-index: 10000;
      ">
        <h2 style="color: #f44336; margin-bottom: 1rem;">初期化エラー</h2>
        <p style="margin-bottom: 1.5rem;">${DOMHelper.sanitizeHTML(errorMessage)}</p>
        <button onclick="location.reload()" style="
          background: #1976d2;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        ">再読み込み</button>
      </div>
    `;

		document.body.insertAdjacentHTML('beforeend', errorHtml);
	}

	/**
	 * アプリケーション終了処理
	 */
	public destroy(): void {
		if (this.isInitialized) {
			EventListenerManager.clearAllEventListeners();
			console.log('🔚 アプリケーション終了処理完了');
		}
	}
}

// アプリケーション起動
let app: TennisMatchApp;

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		app = new TennisMatchApp();
		setupDevtools();
	});
} else {
	app = new TennisMatchApp();
	setupDevtools();
}

// ページ離脱時の終了処理
window.addEventListener('beforeunload', () => {
	if (app) {
		app.destroy();
	}
});

// 開発用グローバル変数
function setupDevtools(): void {
	try {
		(window as any).TennisMatchApp = {
			app,
			appState,
			configManager,
			DOMHelper,
			EventListenerManager
		};
	} catch (error) {
		console.log('Devtools setup skipped');
	}
}
