# Budget Tracker

個人用の家計簿・支出メモWebアプリ。

## コンセプト

iPhoneのメモに支出を書いている運用を、より入力しやすく、あとで集計しやすいWebアプリに置き換える。

最初のゴールは「毎日使える軽い支出メモ」。

家庭内の2人の支出を a / b に分けて記録し、どちらがいくら多く払っているかを見える化する。

a / b は内部の区分として使い、画面上の表示名はあとから変更できる。以前のメモ運用で使っていた `-` / `+` は画面には出さず、裏側の集計で置き換える。

## 想定機能

### MVP

- 支出を追加する
- 日付、金額、支払った人、カテゴリ、メモを保存する
- 支出一覧を見る
- 月別合計を見る
- a / b 別の支出合計を見る
- a / b の支払い差額を見る
- a / b の表示名を変更する
- カテゴリ別合計を見る
- ブラウザのローカルストレージに保存する

### 将来追加候補

- 収入管理
- 固定費・サブスク管理
- CSVインポート/エクスポート
- グラフ表示
- PWA対応
- 予算アラート
- レシート画像OCR

## 技術スタック案

- React
- TypeScript
- Vite
- CSS Modules または通常CSS
- localStorage / IndexedDB

## セットアップ予定

依存関係をインストールして起動する。

```powershell
npm install
npm run dev
```

## プロジェクト構成

```text
budget-tracker/
├─ AGENTS.md
├─ README.md
├─ docs/
│  └─ requirements.md
├─ public/
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ styles.css
├─ index.html
├─ package.json
└─ tsconfig.json
```
