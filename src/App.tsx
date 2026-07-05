import { FormEvent, useMemo, useState } from "react";

type Person = "a" | "b";

type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  person: Person;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

type PersonNames = Record<Person, string>;

const categories = ["食費", "外食", "日用品", "交通", "娯楽", "医療", "サブスク", "その他"];
const people: Person[] = ["a", "b"];
const expenseStorageKey = "budget-tracker.expenses";
const personNamesStorageKey = "budget-tracker.personNames";
const defaultPersonNames: PersonNames = { a: "a", b: "b" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatMonth(date: string) {
  return date.slice(0, 7);
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const nextDate = new Date(year, monthIndex - 1 + offset, 1);
  return nextDate.toISOString().slice(0, 7);
}

function loadExpenses(): Expense[] {
  try {
    const rawValue = window.localStorage.getItem(expenseStorageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((expense): expense is Expense => {
      return (
        typeof expense?.id === "string" &&
        typeof expense?.date === "string" &&
        typeof expense?.amount === "number" &&
        typeof expense?.category === "string" &&
        (expense?.person === "a" || expense?.person === "b") &&
        typeof expense?.createdAt === "string" &&
        typeof expense?.updatedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function loadPersonNames(): PersonNames {
  try {
    const rawValue = window.localStorage.getItem(personNamesStorageKey);
    if (!rawValue) {
      return defaultPersonNames;
    }

    const parsedValue = JSON.parse(rawValue);
    return {
      a: typeof parsedValue?.a === "string" && parsedValue.a.trim() ? parsedValue.a : defaultPersonNames.a,
      b: typeof parsedValue?.b === "string" && parsedValue.b.trim() ? parsedValue.b : defaultPersonNames.b,
    };
  } catch {
    return defaultPersonNames;
  }
}

function saveExpenses(expenses: Expense[]) {
  window.localStorage.setItem(expenseStorageKey, JSON.stringify(expenses));
}

function savePersonNames(personNames: PersonNames) {
  window.localStorage.setItem(personNamesStorageKey, JSON.stringify(personNames));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function firstLabelCharacter(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "?";
}

export function App() {
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);
  const [personNames, setPersonNames] = useState<PersonNames>(loadPersonNames);
  const [date, setDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(formatMonth(today()));
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState<Person>("a");
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => formatMonth(expense.date) === selectedMonth),
    [expenses, selectedMonth],
  );

  const summary = useMemo(() => {
    const personTotals: Record<Person, number> = { a: 0, b: 0 };
    const categoryTotals = new Map<string, number>();

    for (const expense of monthExpenses) {
      personTotals[expense.person] += expense.amount;
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
    }

    const categoryRows = Array.from(categoryTotals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((left, right) => right.total - left.total);

    return {
      total: personTotals.a + personTotals.b,
      personTotals,
      balance: personTotals.a - personTotals.b,
      categoryRows,
    };
  }, [monthExpenses]);

  const leadingPerson = summary.balance === 0 ? null : summary.balance > 0 ? "a" : "b";
  const balanceAmount = Math.abs(summary.balance);

  function updateExpenses(nextExpenses: Expense[]) {
    setExpenses(nextExpenses);
    saveExpenses(nextExpenses);
  }

  function updatePersonName(nextPerson: Person, nextName: string) {
    const nextPersonNames = {
      ...personNames,
      [nextPerson]: nextName,
    };
    setPersonNames(nextPersonNames);
    savePersonNames(nextPersonNames);
  }

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setSelectedMonth(formatMonth(nextDate));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const now = new Date().toISOString();
    const nextExpense: Expense = {
      id: crypto.randomUUID(),
      date,
      amount: Math.round(numericAmount),
      category,
      person,
      note: note.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    updateExpenses([nextExpense, ...expenses]);
    setSelectedMonth(formatMonth(date));
    setAmount("");
    setNote("");
  }

  function deleteExpense(id: string) {
    updateExpenses(expenses.filter((expense) => expense.id !== id));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">家計メモ</p>
          <h1>ふたりの支払いを、シンプルに</h1>
        </div>
        <details className="name-settings">
          <summary>名称変更</summary>
          <div className="name-settings-panel">
            {people.map((item) => (
              <label key={item}>
                {item} の表示名
                <input
                  value={personNames[item]}
                  onChange={(event) => updatePersonName(item, event.target.value)}
                  placeholder={`${item} の名前`}
                />
              </label>
            ))}
          </div>
        </details>
      </header>

      <section className="month-nav" aria-label="対象月">
        <button type="button" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}>
          前月
        </button>
        <strong>{selectedMonth}</strong>
        <button type="button" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}>
          次月
        </button>
      </section>

      <section className="summary-grid" aria-label="今月の集計">
        <article>
          <span className="label">{personNames.a} の支払い</span>
          <strong className="person-a">{formatCurrency(summary.personTotals.a)}</strong>
        </article>
        <article>
          <span className="label">合計支払額</span>
          <strong>{formatCurrency(summary.total)}</strong>
        </article>
        <article>
          <span className="label">{personNames.b} の支払い</span>
          <strong className="person-b">{formatCurrency(summary.personTotals.b)}</strong>
        </article>
      </section>

      <section className="balance-banner" aria-label="差額">
        <span>支払い差額</span>
        <strong>
          {leadingPerson
            ? `${personNames[leadingPerson]} が ${formatCurrency(balanceAmount)} 多く支払い`
            : "差額なし"}
        </strong>
      </section>

      <form className="quick-entry" aria-label="支出入力" onSubmit={handleSubmit}>
        <h2>新しい支払いを記録</h2>

        <label>
          金額
          <input
            inputMode="numeric"
            min="1"
            placeholder="例: 4980"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>

        <fieldset>
          <legend>支払った人</legend>
          <div className="segmented-control">
            {people.map((item) => (
              <button
                className={person === item ? "is-selected" : ""}
                key={item}
                type="button"
                onClick={() => setPerson(item)}
              >
                {personNames[item]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>カテゴリ</legend>
          <div className="category-grid">
            {categories.map((item) => (
              <button
                className={category === item ? "is-selected" : ""}
                key={item}
                type="button"
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <label>
          日付
          <input type="date" value={date} onChange={(event) => handleDateChange(event.target.value)} />
        </label>

        <label>
          メモ
          <input placeholder="例: スーパーで買い物" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>

        <button className="primary" type="submit">
          保存する
        </button>
      </form>

      <section className="data-section" aria-label="支出一覧">
        <div className="section-heading">
          <h2>最近の記録</h2>
          <span>{monthExpenses.length}件</span>
        </div>
        {monthExpenses.length > 0 ? (
          <div className="expense-list">
            {monthExpenses.map((expense) => (
              <article className="expense-row" key={expense.id}>
                <div className="expense-copy">
                  <span className={`person-badge ${expense.person}`}>
                    {firstLabelCharacter(personNames[expense.person])}
                  </span>
                  <div>
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <p>
                      {expense.category}
                      {expense.note ? ` / ${expense.note}` : ""}
                    </p>
                  </div>
                </div>
                <div className="expense-actions">
                  <span>{expense.date.slice(5).replace("-", "/")}</span>
                  <button className="ghost" type="button" onClick={() => deleteExpense(expense.id)}>
                    削除
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">金額を入れて保存すると、ここに履歴が表示されます。</p>
        )}
      </section>

      <section className="data-section" aria-label="カテゴリ別合計">
        <div className="section-heading">
          <h2>カテゴリ別</h2>
        </div>
        {summary.categoryRows.length > 0 ? (
          <div className="stacked-list">
            {summary.categoryRows.map((row) => (
              <div className="list-row" key={row.name}>
                <span>{row.name}</span>
                <strong>{formatCurrency(row.total)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">この月のカテゴリ集計はまだありません。</p>
        )}
      </section>
    </main>
  );
}
