/**
 * 🔵 REQ-502: ローディング表示コンポーネント
 *
 * データ読み込み中にローディングインジケーターを表示
 */

/**
 * 🔵 REQ-502: ローディング表示コンポーネント
 *
 * API通信中のローディング状態を示すスピナーを表示
 */
export function Loading() {
  return (
    <div role="status" className="flex justify-center items-center py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}
