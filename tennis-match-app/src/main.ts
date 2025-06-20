// メインエントリーポイント

import { appState } from '@/core/state.js';
import { configManager } from '@/core/config.js';
import { DOMHelper, EventListenerManager } from '@/utils/dom.js';
import { Team, Match } from '@/types/index.js';

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
	 */	private initializeModals(): void {
		// スコア入力モーダルの初期設定
		const scoreModal = DOMHelper.querySelector('#scoreModal');
		if (scoreModal) {
			DOMHelper.setAriaAttribute(scoreModal, 'hidden', 'true');
			this.setupModalEvents(scoreModal);
		}

		// チーム編集モーダルの初期設定
		const teamEditorModal = DOMHelper.querySelector('#teamEditorModal');
		if (teamEditorModal) {
			DOMHelper.setAriaAttribute(teamEditorModal, 'hidden', 'true');
			this.setupModalEvents(teamEditorModal);
		}
	}

	/**
	 * モーダルのイベントリスナーを設定
	 */
	private setupModalEvents(modal: Element): void {
		// オーバーレイクリックで閉じる
		const overlay = DOMHelper.querySelector('.modal-overlay', modal);
		if (overlay) {
			EventListenerManager.addEventListener(overlay, 'click', () => {
				this.closeModal(modal);
			});
		}

		// 閉じるボタン
		const closeBtn = DOMHelper.querySelector('.modal-close', modal);
		if (closeBtn) {
			EventListenerManager.addEventListener(closeBtn, 'click', () => {
				this.closeModal(modal);
			});
		}

		// キャンセルボタン
		const cancelBtn = DOMHelper.querySelector('[data-action="cancel"]', modal);
		if (cancelBtn) {
			EventListenerManager.addEventListener(cancelBtn, 'click', () => {
				this.closeModal(modal);
			});
		}

		// ESCキーで閉じる
		EventListenerManager.addEventListener(document, 'keydown', (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !modal.hasAttribute('aria-hidden')) {
				this.closeModal(modal);
			}
		});
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
	 */	private setupTeamControlButtons(): void {
		// チーム編集ボタン
		const editTeamsBtn = DOMHelper.querySelector('#editTeamsBtn');
		if (editTeamsBtn) {
			EventListenerManager.addEventListener(editTeamsBtn, 'click', () => {
				this.openTeamEditorModal();
			});
		}

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

		// 試合結果クリアボタン
		const clearMatchesBtn = DOMHelper.querySelector('#clearMatchesBtn');
		if (clearMatchesBtn) {
			EventListenerManager.addEventListener(clearMatchesBtn, 'click', () => {
				this.clearAllMatches();
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
		console.log('⚡ 対戦表更新');

		const matchTable = DOMHelper.querySelector('#matchTable') as HTMLTableElement;
		if (!matchTable) return;

		const state = appState.getState();
		const activeTeams = state.teams.filter(team => team.isActive);

		if (activeTeams.length === 0) {
			// チームがない場合は空のテーブルを表示
			matchTable.innerHTML = `
				<thead>
					<tr>
						<th colspan="100%">アクティブなチームがありません</th>
					</tr>
				</thead>
				<tbody></tbody>
			`;
			this.updateMatchInfo(0, 0);
			return;
		}

		// ヘッダー行を生成
		const thead = matchTable.querySelector('thead');
		if (thead) {
			thead.innerHTML = '';
			const headerRow = DOMHelper.createElement('tr');

			// 左上の空セル
			const emptyCell = DOMHelper.createElement('th', {
				className: 'diagonal-cell'
			});
			headerRow.appendChild(emptyCell);

			// 各チームのヘッダー
			activeTeams.forEach(team => {
				const teamHeader = DOMHelper.createElement('th', {
					className: 'team-header-cell',
					scope: 'col'
				}, team.name);
				headerRow.appendChild(teamHeader);
			});

			thead.appendChild(headerRow);
		}

		// ボディ行を生成
		const tbody = matchTable.querySelector('tbody');
		if (tbody) {
			tbody.innerHTML = '';

			let totalMatches = 0;
			let completedMatches = 0;

			activeTeams.forEach((team1, i) => {
				const bodyRow = DOMHelper.createElement('tr');

				// チーム名のヘッダーセル
				const teamNameCell = DOMHelper.createElement('th', {
					className: 'team-header-cell',
					scope: 'row'
				}, team1.name);
				bodyRow.appendChild(teamNameCell);

				// 各対戦セル
				activeTeams.forEach((team2, j) => {
					const matchCell = DOMHelper.createElement('td', {
						className: 'match-cell'
					});

					if (i === j) {
						// 自分自身との対戦（対角線）
						matchCell.className = 'diagonal-cell';
					} else {
						// 実際の対戦セル
						totalMatches++;

						// 既存の試合データを確認
						const existingMatch = state.matches.find(match =>
							(match.team1Id === team1.id && match.team2Id === team2.id) ||
							(match.team1Id === team2.id && match.team2Id === team1.id)
						);

						if (existingMatch) {
							// 完了した試合
							completedMatches++;
							matchCell.classList.add('completed');

							const score1 = existingMatch.team1Id === team1.id ?
								existingMatch.team1Score : existingMatch.team2Score;
							const score2 = existingMatch.team1Id === team1.id ?
								existingMatch.team2Score : existingMatch.team1Score;

							const scoreDiv = DOMHelper.createElement('div', {
								className: 'match-score'
							}, `${score1} - ${score2}`);

							const statusDiv = DOMHelper.createElement('div', {
								className: 'match-status'
							}, '完了');

							matchCell.appendChild(scoreDiv);
							matchCell.appendChild(statusDiv);
						} else if (team1.members.length > 0 && team2.members.length > 0) {
							// 未完了だが対戦可能
							matchCell.classList.add('pending');

							const statusDiv = DOMHelper.createElement('div', {
								className: 'match-status'
							}, '未実施');

							matchCell.appendChild(statusDiv);

							// クリックでスコア入力モーダルを開く
							EventListenerManager.addEventListener(matchCell, 'click', () => {
								this.openScoreInputModal(team1, team2);
							});
						} else {
							// 対戦不可能（メンバーがいない）
							matchCell.classList.add('unavailable');

							const statusDiv = DOMHelper.createElement('div', {
								className: 'match-status'
							}, '対戦不可');

							matchCell.appendChild(statusDiv);
						}
					}

					bodyRow.appendChild(matchCell);
				});

				tbody.appendChild(bodyRow);
			});

			this.updateMatchInfo(totalMatches, completedMatches);
		}
	}
	private renderStandingsTable(): void {
		console.log('📊 順位表更新');

		const standingsTable = DOMHelper.querySelector('#standingsTable') as HTMLTableElement;
		const standingsTableBody = DOMHelper.querySelector('#standingsTableBody');

		if (!standingsTable || !standingsTableBody) return;

		const state = appState.getState();
		const activeTeams = state.teams.filter(team => team.isActive);

		if (activeTeams.length === 0) {
			standingsTableBody.innerHTML = '<tr><td colspan="9">アクティブなチームがありません</td></tr>';
			return;
		}

		// 各チームの統計を計算
		const teamStats = activeTeams.map(team => {
			let wins = 0;
			let losses = 0;
			let draws = 0;
			let pointsFor = 0;
			let pointsAgainst = 0;

			state.matches.forEach(match => {
				if (match.team1Id === team.id) {
					pointsFor += match.team1Score;
					pointsAgainst += match.team2Score;

					if (match.winner === team.id) wins++;
					else if (match.winner === null) draws++;
					else losses++;
				} else if (match.team2Id === team.id) {
					pointsFor += match.team2Score;
					pointsAgainst += match.team1Score;

					if (match.winner === team.id) wins++;
					else if (match.winner === null) draws++;
					else losses++;
				}
			});

			const totalMatches = wins + losses + draws;
			const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
			const pointDifference = pointsFor - pointsAgainst;

			return {
				team,
				wins,
				losses,
				draws,
				totalMatches,
				pointsFor,
				pointsAgainst,
				pointDifference,
				winRate
			};
		});

		// 順位でソート（勝率 > 得失点差 > 得点）
		teamStats.sort((a, b) => {
			if (a.winRate !== b.winRate) return b.winRate - a.winRate;
			if (a.pointDifference !== b.pointDifference) return b.pointDifference - a.pointDifference;
			return b.pointsFor - a.pointsFor;
		});

		// テーブル行を生成
		standingsTableBody.innerHTML = '';
		teamStats.forEach((stat, index) => {
			const row = DOMHelper.createElement('tr');

			// 順位
			const rankCell = DOMHelper.createElement('td', {
				className: `rank-cell rank-${index + 1}`
			}, (index + 1).toString());

			// チーム名
			const teamNameCell = DOMHelper.createElement('td', {
				className: `team-name ${stat.team.isActive ? '' : 'team-inactive'}`
			}, stat.team.name);

			// 勝利数
			const winsCell = DOMHelper.createElement('td', {
				className: 'wins'
			}, stat.wins.toString());

			// 敗北数
			const lossesCell = DOMHelper.createElement('td', {
				className: 'losses'
			}, stat.losses.toString());

			// 引分数
			const drawsCell = DOMHelper.createElement('td', {
				className: 'draws'
			}, stat.draws.toString());

			// 勝率
			const winRateCell = DOMHelper.createElement('td', {
				className: 'win-rate'
			}, `${stat.winRate.toFixed(1)}%`);

			// 得点
			const pointsForCell = DOMHelper.createElement('td', {
				className: 'points'
			}, stat.pointsFor.toString());

			// 失点
			const pointsAgainstCell = DOMHelper.createElement('td', {},
				stat.pointsAgainst.toString());

			// 得失点差
			const pointDiffCell = DOMHelper.createElement('td', {
				className: stat.pointDifference >= 0 ? 'wins' : 'losses'
			}, stat.pointDifference >= 0 ? `+${stat.pointDifference}` : stat.pointDifference.toString());

			row.appendChild(rankCell);
			row.appendChild(teamNameCell);
			row.appendChild(winsCell);
			row.appendChild(lossesCell);
			row.appendChild(drawsCell);
			row.appendChild(winRateCell);
			row.appendChild(pointsForCell);
			row.appendChild(pointsAgainstCell);
			row.appendChild(pointDiffCell);

			standingsTableBody.appendChild(row);
		});
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
		appState.updateMatches([]);
		this.showToast('全試合結果をクリアしました', 'success');
	}

	/**
	 * 対戦情報の更新
	 */
	private updateMatchInfo(totalMatches: number, completedMatches: number): void {
		const totalMatchesEl = DOMHelper.querySelector('#totalMatches');
		const completedMatchesEl = DOMHelper.querySelector('#completedMatches');
		const progressRateEl = DOMHelper.querySelector('#progressRate');

		if (totalMatchesEl) DOMHelper.setTextContent(totalMatchesEl, totalMatches.toString());
		if (completedMatchesEl) DOMHelper.setTextContent(completedMatchesEl, completedMatches.toString());
		if (progressRateEl) {
			const rate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
			DOMHelper.setTextContent(progressRateEl, `${rate}%`);
		}
	}

	/**
	 * スコア入力モーダルを開く
	 */
	private openScoreInputModal(team1: Team, team2: Team): void {
		const scoreModal = DOMHelper.querySelector('#scoreModal');
		if (!scoreModal) return;

		// チーム名をラベルに設定
		const team1Label = DOMHelper.querySelector('#scoreTeam1Label');
		const team2Label = DOMHelper.querySelector('#scoreTeam2Label');

		if (team1Label) DOMHelper.setTextContent(team1Label, team1.name);
		if (team2Label) DOMHelper.setTextContent(team2Label, team2.name);

		// 既存のスコアがあれば設定
		const state = appState.getState();
		const existingMatch = state.matches.find(match =>
			(match.team1Id === team1.id && match.team2Id === team2.id) ||
			(match.team1Id === team2.id && match.team2Id === team1.id)
		);

		const scoreTeam1Input = DOMHelper.querySelector('#scoreTeam1') as HTMLInputElement;
		const scoreTeam2Input = DOMHelper.querySelector('#scoreTeam2') as HTMLInputElement;

		if (existingMatch) {
			const score1 = existingMatch.team1Id === team1.id ?
				existingMatch.team1Score : existingMatch.team2Score;
			const score2 = existingMatch.team1Id === team1.id ?
				existingMatch.team2Score : existingMatch.team1Score;

			if (scoreTeam1Input) scoreTeam1Input.value = score1.toString();
			if (scoreTeam2Input) scoreTeam2Input.value = score2.toString();
		} else {
			if (scoreTeam1Input) scoreTeam1Input.value = '';
			if (scoreTeam2Input) scoreTeam2Input.value = '';
		}

		// フォーム送信ハンドラーを設定
		const scoreForm = DOMHelper.querySelector('#scoreForm');
		if (scoreForm) {
			// 既存のイベントリスナーをクリア
			const newForm = scoreForm.cloneNode(true) as HTMLFormElement;
			scoreForm.parentNode?.replaceChild(newForm, scoreForm);

			EventListenerManager.addEventListener(newForm, 'submit', (e: Event) => {
				e.preventDefault();
				this.handleScoreSubmit(team1, team2);
			});
		}

		this.openModal(scoreModal);
	}

	/**
	 * スコア送信処理
	 */
	private handleScoreSubmit(team1: Team, team2: Team): void {
		const scoreTeam1Input = DOMHelper.querySelector('#scoreTeam1') as HTMLInputElement;
		const scoreTeam2Input = DOMHelper.querySelector('#scoreTeam2') as HTMLInputElement;

		if (!scoreTeam1Input || !scoreTeam2Input) return;

		const score1 = parseInt(scoreTeam1Input.value, 10);
		const score2 = parseInt(scoreTeam2Input.value, 10);

		if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
			this.showToast('有効なスコアを入力してください', 'error');
			return;
		}

		// 試合結果を保存
		const match: Match = {
			team1Id: team1.id,
			team2Id: team2.id,
			team1Score: score1,
			team2Score: score2,
			winner: score1 > score2 ? team1.id : score2 > score1 ? team2.id : null,
			isDraw: score1 === score2,
			isCompleted: true
		};

		appState.updateMatch(match);

		const scoreModal = DOMHelper.querySelector('#scoreModal');
		if (scoreModal) this.closeModal(scoreModal);

		this.showToast(`${team1.name} vs ${team2.name} のスコアを保存しました`, 'success');
	}

	/**
	 * チーム編集モーダルを開く
	 */
	private openTeamEditorModal(): void {
		const teamEditorModal = DOMHelper.querySelector('#teamEditorModal');
		if (!teamEditorModal) return;

		// 現在のチーム構成をテキストエリアに設定
		const teamMembersInput = DOMHelper.querySelector('#teamMembersInput') as HTMLTextAreaElement;
		if (teamMembersInput) {
			const state = appState.getState();
			const allMembers = state.teams.flatMap(team => team.members).concat(state.absentTeam.members);
			teamMembersInput.value = allMembers.join('\n');
		}

		// フォーム送信ハンドラーを設定
		const teamEditorForm = DOMHelper.querySelector('#teamEditorForm');
		if (teamEditorForm) {
			// 既存のイベントリスナーをクリア
			const newForm = teamEditorForm.cloneNode(true) as HTMLFormElement;
			teamEditorForm.parentNode?.replaceChild(newForm, teamEditorForm);

			EventListenerManager.addEventListener(newForm, 'submit', (e: Event) => {
				e.preventDefault();
				this.handleTeamEditorSubmit();
			});
		}

		this.openModal(teamEditorModal);
	}

	/**
	 * チーム編集送信処理
	 */
	private handleTeamEditorSubmit(): void {
		const teamMembersInput = DOMHelper.querySelector('#teamMembersInput') as HTMLTextAreaElement;
		if (!teamMembersInput) return;

		const membersList = teamMembersInput.value
			.split('\n')
			.map(member => member.trim())
			.filter(member => member.length > 0);

		if (membersList.length === 0) {
			this.showToast('メンバーを入力してください', 'error');
			return;
		}

		// 新しいメンバーリストでチームを再構成
		// この部分は後で実装
		this.showToast('チーム編集機能は開発中です', 'info');

		const teamEditorModal = DOMHelper.querySelector('#teamEditorModal');
		if (teamEditorModal) this.closeModal(teamEditorModal);
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
	 */	private showLoading(): void {
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
	 * モーダルを開く
	 */
	private openModal(modal: Element): void {
		DOMHelper.setAriaAttribute(modal, 'hidden', 'false');
		DOMHelper.setVisible(modal as HTMLElement, true);

		// フォーカスを最初の入力要素に移動
		const firstInput = DOMHelper.querySelector<HTMLElement>('input, textarea, button', modal);
		if (firstInput) {
			setTimeout(() => firstInput.focus(), 100);
		}

		// bodyのスクロールを無効化
		document.body.style.overflow = 'hidden';
	}

	/**
	 * モーダルを閉じる
	 */
	private closeModal(modal: Element): void {
		DOMHelper.setAriaAttribute(modal, 'hidden', 'true');
		DOMHelper.setVisible(modal as HTMLElement, false);

		// bodyのスクロールを復元
		document.body.style.overflow = '';
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
