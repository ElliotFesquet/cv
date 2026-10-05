// Editor autocomplete: curated DuckDB vocabulary + schema. Short on purpose: "sel" must suggest SELECT, not SELF or SERIAL2.
import { ifNotIn, snippetCompletion, type Completion, type CompletionContext, type CompletionResult, type CompletionSource } from '@codemirror/autocomplete';
import { keywordCompletionSource, schemaCompletionSource, SQLDialect } from '@codemirror/lang-sql';
import { schema } from './schema';

const keywords = `select from where and or not in is null like ilike between as distinct all group by order having
limit offset join inner left right full outer cross natural on using union intersect except case when then else end
with recursive over partition window rows range preceding following unbounded current row asc desc nulls first last
exists any some insert into values update set delete create table view replace drop alter cast try_cast true false
qualify filter interval describe summarize pivot unpivot exclude lateral semi anti asof show tables explain analyze
primary key default`;
const types = 'integer int bigint double float decimal numeric varchar text boolean date timestamp time';
export const duck = SQLDialect.define({ keywords: keywords.replace(/\s+/g, ' '), types }); // lang-sql splits on single spaces

// Multi-word clauses rank above single keywords ("ord" -> ORDER BY first).
const phrases = ['GROUP BY', 'ORDER BY', 'PARTITION BY', 'LEFT JOIN', 'INNER JOIN', 'FULL OUTER JOIN', 'CROSS JOIN',
  'UNION ALL', 'IS NULL', 'IS NOT NULL', 'NOT IN', 'NOT EXISTS', 'GROUP BY ALL', 'ORDER BY ALL', 'CREATE TABLE',
  'ROWS BETWEEN', 'UNBOUNDED PRECEDING', 'CURRENT ROW'];
const functions = `count sum avg min max round coalesce nullif ifnull greatest least abs floor ceil sqrt power
row_number rank dense_rank ntile percent_rank lag lead first_value last_value nth_value
date_trunc date_part date_diff extract strftime strptime year month day hour week dayofweek epoch now current_date
length lower upper trim ltrim rtrim replace substring concat string_agg split_part starts_with contains regexp_matches
regexp_replace left right lpad rpad median quantile_cont mode stddev arg_max arg_min any_value count_if bool_and bool_or
list unnest generate_series range`;
const extra: Completion[] = [
  ...phrases.map((label) => ({ label, type: 'keyword', boost: 10 })),
  ...functions.split(/\s+/).map((f) =>
    snippetCompletion(`${f.toUpperCase()}(\${})`, { label: f.toUpperCase(), type: 'function', detail: '()', boost: -1 })),
];
const extraSource: CompletionSource = (ctx) => {
  const word = ctx.matchBefore(/\w+$/);
  return word || ctx.explicit ? { from: word ? word.from : ctx.pos, options: extra, validFor: /^\w*$/ } : null;
};

// lang-sql gives every keyword boost -1; lift the everyday ones above rare words.
const common = new Set('SELECT FROM WHERE JOIN ON AND OR AS HAVING LIMIT WITH CASE THEN ELSE END DISTINCT LEFT IN IS NOT NULL OVER'.split(' '));
const keywordBoost = (label: string, type: string): Completion => ({ label, type, boost: common.has(label) ? 4 : -1 });

const outside = ['QuotedIdentifier', 'String', 'LineComment', 'BlockComment', '.'];
const afterDot = (ctx: CompletionContext) => /\.\w*$/.test(ctx.state.sliceDoc(Math.max(0, ctx.pos - 64), ctx.pos));

// Keywords and functions never follow "alias."; schema results drop the word being typed
// (lang-sql briefly reads "FROM t a joi" as alias "joi" and would rank it first).
const noDot = (src: CompletionSource): CompletionSource => (ctx) => (afterDot(ctx) ? null : src(ctx));
const schemaSrc = schemaCompletionSource({ dialect: duck, upperCaseKeywords: true,
  schema: Object.fromEntries(Object.entries(schema).map(([t, cols]) => [t, cols.map(([c]) => c)])) });
const cleanSchema: CompletionSource = async (ctx) => {
  const res = (await schemaSrc(ctx)) as CompletionResult | null;
  if (!res) return res;
  const typed = ctx.state.sliceDoc(res.from, ctx.pos);
  return { ...res, options: res.options.filter((o) => o.label !== typed) };
};

// Bare column names (no "table." prefix): columns of the tables named in the query, else of every table.
const columnSource: CompletionSource = (ctx) => {
  const word = ctx.matchBefore(/\w+$/);
  if (!word && !ctx.explicit) return null;
  const doc = ctx.state.doc.toString().toLowerCase();
  const used = Object.keys(schema).filter((t) => new RegExp(`\\b${t}\\b`).test(doc));
  const seen = new Map<string, string[]>();
  for (const t of used.length ? used : Object.keys(schema))
    for (const [c] of schema[t]) seen.set(c, [...(seen.get(c) ?? []), t]);
  const options = [...seen].map(([label, ts]) => ({ label, type: 'property', detail: ts.join(', '), boost: 1 }));
  return { from: word ? word.from : ctx.pos, options, validFor: /^\w*$/ };
};

export const sqlCompletion = [
  duck.language.data.of({ autocomplete: ifNotIn(outside, noDot(columnSource)) }),
  duck.language.data.of({ autocomplete: cleanSchema }),
  duck.language.data.of({ autocomplete: noDot(keywordCompletionSource(duck, true, keywordBoost)) }),
  duck.language.data.of({ autocomplete: ifNotIn(outside, noDot(extraSource)) }),
];
