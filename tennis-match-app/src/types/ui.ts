// UI関連の型定義

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSave: (data: unknown) => void;
}

export interface ToastOptions {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  position?: "top" | "bottom";
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface ScoreInputData {
  matchId: string;
  team1Score: number;
  team2Score: number;
}

export interface TeamEditorData {
  teamId: number;
  members: string[];
}

// DOM要素の型定義
export interface DOMElements {
  container: HTMLElement;
  teamsList: HTMLElement;
  matchTable: HTMLElement;
  standingsTable: HTMLElement;
  scoreModal: HTMLElement;
  toast: HTMLElement;
}

// テーブル行の型定義
export interface MatchTableCell {
  element: HTMLTableCellElement;
  match: {
    team1: number;
    team2: number;
  } | null;
}

export interface StandingsTableRow {
  teamId: number;
  rank: number;
  element: HTMLTableRowElement;
}

// フォーム要素の型定義
export interface FormElements {
  scoreInput1: HTMLInputElement;
  scoreInput2: HTMLInputElement;
  submitButton: HTMLButtonElement;
  cancelButton: HTMLButtonElement;
}

// イベントハンドラーの型定義
export type EventHandler<T = Event> = (event: T) => void;
export type ClickHandler = EventHandler<MouseEvent>;
export type ChangeHandler = EventHandler<Event>;
export type SubmitHandler = EventHandler<SubmitEvent>;

// カスタムイベントの型定義
export interface TeamClickEvent extends CustomEvent {
  detail: {
    teamId: number;
    action: "assign" | "edit" | "toggle";
  };
}

export interface ScoreInputEvent extends CustomEvent {
  detail: {
    matchId: string;
    team1Score: number;
    team2Score: number;
  };
}

export interface MemberSelectEvent extends CustomEvent {
  detail: {
    memberName: string;
    isSelected: boolean;
  };
}

// レスポンシブデザイン用の型定義
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  isTouchDevice: boolean;
}

// アニメーション関連の型定義
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface TransitionConfig {
  property: string;
  duration: number;
  timingFunction: string;
}

// テーマ・スタイル関連の型定義
export interface ColorScheme {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
}

export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

// 状態管理用の型定義
export interface UIState {
  isLoading: boolean;
  activeModal: string | null;
  selectedTeamId: number | null;
  showDebugPanel: boolean;
  viewport: ViewportInfo;
}

// エラー表示用の型定義
export interface ErrorDisplayOptions {
  title?: string;
  message: string;
  details?: string;
  actions?: Array<{
    label: string;
    handler: () => void;
  }>;
}
