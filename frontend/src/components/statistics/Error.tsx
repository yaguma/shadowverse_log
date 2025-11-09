/**
 * 🔵 エラー表示コンポーネント
 *
 * API通信エラー等のエラーメッセージと再試行ボタンを表示
 */

interface ErrorProps {
  /** 🔵 エラーメッセージ */
  message: string;
  /** 🔵 再試行ボタンクリックハンドラ */
  onRetry: () => void;
}

/**
 * 🔵 エラー表示コンポーネント
 *
 * エラーメッセージと再試行機能を提供するコンポーネント
 */
export function Error({ message, onRetry }: ErrorProps) {
  return (
    <div className="text-center py-8">
      <p className="text-red-600 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        再試行
      </button>
    </div>
  );
}
