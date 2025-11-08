/**
 * サニタイゼーションユーティリティ
 *
 * 【機能概要】: XSS攻撃を防ぐためのHTML特殊文字エスケープ処理
 * 【実装方針】: HTML特殊文字を安全な文字列に変換
 * 【テスト対応】: TC-EDGE-004（特殊文字を含むデータの処理）を通すための実装
 * 🟡 信頼性レベル: 黄信号（要件定義に明記なし、実用的な推測）
 */

/**
 * HTML特殊文字のエスケープマップ
 *
 * 【セキュリティ】: XSS攻撃のベクトルとなる文字をエスケープ
 * 【対象文字】:
 *   - < : &lt;（スクリプトタグの開始）
 *   - > : &gt;（スクリプトタグの終了）
 *   - " : &quot;（属性値の区切り）
 *   - ' : &#x27;（属性値の区切り）
 *   - & : &amp;（エンティティの開始）
 * 🔵 信頼性レベル: 青信号（OWASP XSS Prevention Cheat Sheetより）
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '&': '&amp;',
};

/**
 * HTML特殊文字をエスケープする
 *
 * 【機能概要】: 文字列内のHTML特殊文字を安全なエンティティに変換
 * 【実装方針】: 正規表現で対象文字をマッチし、エスケープマップで置換
 * 【テスト対応】: TC-EDGE-004（<script>タグのエスケープ）を通すための実装
 * 【セキュリティ】:
 *   - <script>alert(1)</script> → &lt;script&gt;alert(1)&lt;/script&gt;
 *   - deck-"test" → deck-&quot;test&quot;
 * 🟡 信頼性レベル: 黄信号（testcases.md Lines 345-374、要件定義に明記なし）
 *
 * @param text - エスケープ対象の文字列
 * @returns エスケープされた文字列
 *
 * @example
 * escapeHtml('<script>alert(1)</script>') // '&lt;script&gt;alert(1)&lt;/script&gt;'
 * escapeHtml('deck-"test"') // 'deck-&quot;test&quot;'
 * escapeHtml("O'Reilly") // 'O&#x27;Reilly'
 */
export function escapeHtml(text: string): string {
  // 【null/undefined対策】: 入力がnullまたはundefinedの場合は空文字列を返す
  // 【安全性】: エラーを防ぎ、安全なデフォルト値を返す
  // 🟡 信頼性レベル: 黄信号（防御的プログラミングの推測）
  if (text == null) {
    return '';
  }

  // 【文字列変換】: 入力が文字列でない場合は文字列に変換
  // 【安全性】: 数値やオブジェクトが渡された場合も安全に処理
  // 🟡 信頼性レベル: 黄信号（防御的プログラミングの推測）
  const strText = String(text);

  // 【エスケープ処理】: 正規表現で特殊文字をマッチし、エスケープマップで置換
  // 【実装内容】:
  //   - /[<>"'&]/g でHTML特殊文字をすべてマッチ（グローバルフラグ）
  //   - replace() のコールバックでエスケープマップから対応する文字列を取得
  // 🔵 信頼性レベル: 青信号（標準的なHTMLエスケープロジック）
  return strText.replace(/[<>"'&]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * オブジェクトの文字列フィールドをサニタイズする
 *
 * 【機能概要】: オブジェクト内の文字列値をすべてエスケープする
 * 【実装方針】: 再帰的に文字列フィールドをエスケープ
 * 【テスト対応】: 対戦履歴オブジェクトのサニタイゼーション
 * 🟡 信頼性レベル: 黄信号（要件定義に明記なし、実用的な推測）
 *
 * @param obj - サニタイズ対象のオブジェクト
 * @returns サニタイズされたオブジェクト（新しいオブジェクトを返す）
 *
 * @example
 * sanitizeObject({ name: '<script>alert(1)</script>', value: 123 })
 * // { name: '&lt;script&gt;alert(1)&lt;/script&gt;', value: 123 }
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  // 【null/undefined対策】: 入力がnullまたはundefinedの場合はそのまま返す
  // 🟡 信頼性レベル: 黄信号（防御的プログラミングの推測）
  if (obj == null) {
    return obj;
  }

  // 【新しいオブジェクト作成】: 元のオブジェクトを変更せず、新しいオブジェクトを返す
  // 【イミュータブル】: 関数型プログラミングの原則に従う
  // 🔵 信頼性レベル: 青信号（ベストプラクティス）
  const sanitized = {} as T;

  // 【各フィールドを処理】: Object.entriesでキー・値のペアを取得
  // 🔵 信頼性レベル: 青信号（標準的なオブジェクト処理）
  for (const [key, value] of Object.entries(obj)) {
    // 【文字列のみエスケープ】: 値が文字列の場合のみエスケープ処理を適用
    // 【型保持】: 数値やブール値などはそのまま保持
    // 🟡 信頼性レベル: 黄信号（実装方針の推測）
    if (typeof value === 'string') {
      sanitized[key as keyof T] = escapeHtml(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}
