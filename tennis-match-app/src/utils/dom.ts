// DOM操作ユーティリティ

/**
 * 型安全なDOM要素取得・操作ユーティリティ
 */
export class DOMHelper {
	/**
	 * 要素を取得（型安全）
	 */
	static querySelector<T extends Element>(
		selector: string,
		parent: Document | Element = document,
	): T | null {
		return parent.querySelector<T>(selector);
	}

	/**
	 * 複数要素を取得（型安全）
	 */
	static querySelectorAll<T extends Element>(
		selector: string,
		parent: Document | Element = document,
	): NodeListOf<T> {
		return parent.querySelectorAll<T>(selector);
	}

	/**
	 * 要素を作成（型安全）
	 */
	static createElement<K extends keyof HTMLElementTagNameMap>(
		tagName: K,
		attributes?: Record<string, string>,
		textContent?: string,
	): HTMLElementTagNameMap[K] {
		const element = document.createElement(tagName);

		if (attributes) {
			Object.entries(attributes).forEach(([key, value]) => {
				if (key === "className") {
					element.className = value;
				} else if (key === "textContent") {
					element.textContent = value;
				} else {
					element.setAttribute(key, value);
				}
			});
		}

		if (textContent) {
			element.textContent = textContent;
		}

		return element;
	}

	/**
	 * クラスの切り替え
	 */
	static toggleClass(
		element: Element,
		className: string,
		force?: boolean,
	): boolean {
		return element.classList.toggle(className, force);
	}

	/**
	 * クラスの追加
	 */
	static addClass(element: Element, ...classNames: string[]): void {
		element.classList.add(...classNames);
	}

	/**
	 * クラスの削除
	 */
	static removeClass(element: Element, ...classNames: string[]): void {
		element.classList.remove(...classNames);
	}

	/**
	 * 属性の設定
	 */
	static setAttribute(element: Element, name: string, value: string): void {
		element.setAttribute(name, value);
	}

	/**
	 * 属性の取得
	 */
	static getAttribute(element: Element, name: string): string | null {
		return element.getAttribute(name);
	}

	/**
	 * データ属性の設定
	 */
	static setDataAttribute(element: Element, name: string, value: string): void {
		element.setAttribute(`data-${name}`, value);
	}

	/**
	 * データ属性の取得
	 */
	static getDataAttribute(element: Element, name: string): string | null {
		return element.getAttribute(`data-${name}`);
	}

	/**
	 * 要素を空にする
	 */
	static empty(element: Element): void {
		element.innerHTML = "";
	}

	/**
	 * 要素を削除
	 */
	static remove(element: Element): void {
		element.remove();
	}

	/**
	 * 子要素を追加
	 */
	static append(parent: Element, ...children: (Element | string)[]): void {
		parent.append(...children);
	}

	/**
	 * 要素の前に挿入
	 */
	static insertBefore(newElement: Element, referenceElement: Element): void {
		referenceElement.parentNode?.insertBefore(newElement, referenceElement);
	}

	/**
	 * 要素の後に挿入
	 */
	static insertAfter(newElement: Element, referenceElement: Element): void {
		referenceElement.parentNode?.insertBefore(
			newElement,
			referenceElement.nextSibling,
		);
	}

	/**
	 * HTMLをサニタイズ
	 */
	static sanitizeHTML(str: string): string {
		const div = document.createElement("div");
		div.textContent = str;
		return div.innerHTML;
	}
	/**
	 * 要素が表示されているかチェック
	 */
	static isVisible(element: Element): boolean {
		if (element instanceof HTMLElement) {
			return !!(
				element.offsetWidth ||
				element.offsetHeight ||
				element.getClientRects().length
			);
		}
		return element.getClientRects().length > 0;
	}

	/**
	 * 要素をスクロール表示
	 */
	static scrollIntoView(
		element: Element,
		options?: ScrollIntoViewOptions,
	): void {
		element.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			...options,
		});
	}

	/**
	 * フォーカスを設定
	 */
	static focus(element: HTMLElement): void {
		element.focus();
	}

	/**
	 * 要素の寸法を取得
	 */
	static getBounds(element: Element): DOMRect {
		return element.getBoundingClientRect();
	}

	/**
	 * 要素内のテキストを取得
	 */
	static getTextContent(element: Element): string {
		return element.textContent || "";
	}

	/**
	 * 要素の値を取得（input要素用）
	 */
	static getValue(
		element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
	): string {
		return element.value;
	}

	/**
	 * 要素の値を設定（input要素用）
	 */
	static setValue(
		element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
		value: string,
	): void {
		element.value = value;
	}

	/**
	 * チェックボックス・ラジオボタンの状態を取得
	 */
	static isChecked(element: HTMLInputElement): boolean {
		return element.checked;
	}

	/**
	 * チェックボックス・ラジオボタンの状態を設定
	 */
	static setChecked(element: HTMLInputElement, checked: boolean): void {
		element.checked = checked;
	}

	/**
	 * 要素を無効/有効化
	 */
	static setDisabled(element: HTMLElement, disabled: boolean): void {
		if ("disabled" in element) {
			(element as HTMLInputElement | HTMLButtonElement).disabled = disabled;
		}

		if (disabled) {
			element.setAttribute("aria-disabled", "true");
		} else {
			element.removeAttribute("aria-disabled");
		}
	}

	/**
	 * ARIA属性を設定
	 */
	static setAriaAttribute(element: Element, name: string, value: string): void {
		element.setAttribute(`aria-${name}`, value);
	}

	/**
	 * 要素を表示/非表示
	 */
	static setVisible(element: HTMLElement, visible: boolean): void {
		if (visible) {
			element.style.display = "";
			element.removeAttribute("hidden");
			this.setAriaAttribute(element, "hidden", "false");
		} else {
			element.style.display = "none";
			element.setAttribute("hidden", "");
			this.setAriaAttribute(element, "hidden", "true");
		}
	}

	/**
	 * CSSカスタムプロパティを設定
	 */
	static setCSSCustomProperty(
		name: string,
		value: string,
		element: HTMLElement = document.documentElement,
	): void {
		element.style.setProperty(`--${name}`, value);
	}

	/**
	 * CSSカスタムプロパティを取得
	 */
	static getCSSCustomProperty(
		name: string,
		element: HTMLElement = document.documentElement,
	): string {
		return getComputedStyle(element).getPropertyValue(`--${name}`).trim();
	}

	/**
	 * 要素のテキストを設定
	 */
	static setTextContent(element: Element, text: string): void {
		element.textContent = text;
	}
}

/**
 * イベントリスナー管理クラス
 * メモリリークを防ぐためのイベントリスナー管理
 */
export class EventListenerManager {
	private static listeners = new Map<
		Element | Document,
		Map<string, EventListener>
	>();

	/**
	 * イベントリスナーを追加
	 */
	static addEventListener<T extends Event>(
		element: Element | Document,
		event: string,
		handler: (event: T) => void,
		options?: boolean | AddEventListenerOptions,
	): void {
		// 既存のリスナーを削除
		this.removeEventListener(element, event);

		// 新しいリスナーを追加
		element.addEventListener(event, handler as EventListener, options);

		// 管理マップに登録
		if (!this.listeners.has(element)) {
			this.listeners.set(element, new Map());
		}
		this.listeners.get(element)!.set(event, handler as EventListener);
	}

	/**
	 * イベントリスナーを更新
	 */
	static updateEventListener<T extends Event>(
		element: Element | Document,
		event: string,
		handler: (event: T) => void,
		options?: boolean | AddEventListenerOptions,
	): void {
		this.addEventListener(element, event, handler, options);
	}

	/**
	 * イベントリスナーを削除
	 */
	static removeEventListener(element: Element | Document, event: string): void {
		const elementListeners = this.listeners.get(element);
		if (elementListeners && elementListeners.has(event)) {
			const handler = elementListeners.get(event)!;
			element.removeEventListener(event, handler);
			elementListeners.delete(event);

			if (elementListeners.size === 0) {
				this.listeners.delete(element);
			}
		}
	}

	/**
	 * 要素の全イベントリスナーを削除
	 */
	static removeAllEventListeners(element: Element | Document): void {
		const elementListeners = this.listeners.get(element);
		if (elementListeners) {
			for (const [event, handler] of elementListeners) {
				element.removeEventListener(event, handler);
			}
			this.listeners.delete(element);
		}
	}

	/**
	 * 全てのイベントリスナーをクリア
	 */
	static clearAllEventListeners(): void {
		for (const [element, eventMap] of this.listeners) {
			for (const [event, handler] of eventMap) {
				element.removeEventListener(event, handler);
			}
		}
		this.listeners.clear();
	}
}

/**
 * アニメーション・トランジションヘルパー
 */
export class AnimationHelper {
	/**
	 * 要素をフェードイン
	 */
	static fadeIn(element: HTMLElement, duration = 300): Promise<void> {
		return new Promise((resolve) => {
			element.style.opacity = "0";
			element.style.display = "";
			element.style.transition = `opacity ${duration}ms ease-in-out`;

			// フレーム遅延を入れて確実にトランジションを発動
			requestAnimationFrame(() => {
				element.style.opacity = "1";

				setTimeout(() => {
					element.style.transition = "";
					resolve();
				}, duration);
			});
		});
	}

	/**
	 * 要素をフェードアウト
	 */
	static fadeOut(element: HTMLElement, duration = 300): Promise<void> {
		return new Promise((resolve) => {
			element.style.transition = `opacity ${duration}ms ease-in-out`;
			element.style.opacity = "0";

			setTimeout(() => {
				element.style.display = "none";
				element.style.transition = "";
				resolve();
			}, duration);
		});
	}

	/**
	 * 要素をスライドダウン
	 */
	static slideDown(element: HTMLElement, duration = 300): Promise<void> {
		return new Promise((resolve) => {
			const height = element.scrollHeight;
			element.style.height = "0px";
			element.style.overflow = "hidden";
			element.style.display = "";
			element.style.transition = `height ${duration}ms ease-in-out`;

			requestAnimationFrame(() => {
				element.style.height = `${height}px`;

				setTimeout(() => {
					element.style.height = "";
					element.style.overflow = "";
					element.style.transition = "";
					resolve();
				}, duration);
			});
		});
	}

	/**
	 * 要素をスライドアップ
	 */
	static slideUp(element: HTMLElement, duration = 300): Promise<void> {
		return new Promise((resolve) => {
			const height = element.scrollHeight;
			element.style.height = `${height}px`;
			element.style.overflow = "hidden";
			element.style.transition = `height ${duration}ms ease-in-out`;

			requestAnimationFrame(() => {
				element.style.height = "0px";

				setTimeout(() => {
					element.style.display = "none";
					element.style.height = "";
					element.style.overflow = "";
					element.style.transition = "";
					resolve();
				}, duration);
			});
		});
	}
}
