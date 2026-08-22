/**
 * Prisma giả lập chạy trong bộ nhớ - CHỈ dùng cho kiểm thử, không nằm trong sản phẩm.
 *
 * Ba điểm khiến bản giả lập này có giá trị thật:
 *   1. TÔN TRỌNG `select` / `include` -> kiểm chứng được `isCorrect` có lọt ra ngoài không;
 *   2. hỗ trợ toán tử `where` (in, gte, contains, OR) và lọc theo quan hệ;
 *   3. hỗ trợ `aggregate` / `groupBy` -> kiểm chứng được phần thống kê.
 */

type Row = Record<string, any>;

export const db = {
  users: [] as Row[],
  categories: [] as Row[],
  courses: [] as Row[],
  lessons: [] as Row[],
  enrollments: [] as Row[],
  lessonProgress: [] as Row[],
  quizzes: [] as Row[],
  questions: [] as Row[],
  choices: [] as Row[],
  submissions: [] as Row[],
  answers: [] as Row[],
};

/** Quan hệ giữa các model - dùng cho include/select và lọc theo quan hệ. */
const rel: Record<string, Record<string, (r: Row) => any>> = {
  user: {
    coursesTaught: (r) => db.courses.filter((c) => c.instructorId === r.id),
    enrollments: (r) => db.enrollments.filter((e) => e.studentId === r.id),
    submissions: (r) => db.submissions.filter((s) => s.studentId === r.id),
  },
  category: { courses: (r) => db.courses.filter((c) => c.categoryId === r.id) },
  course: {
    instructor: (r) => db.users.find((u) => u.id === r.instructorId),
    category: (r) => db.categories.find((c) => c.id === r.categoryId),
    lessons: (r) => db.lessons.filter((l) => l.courseId === r.id),
    enrollments: (r) => db.enrollments.filter((e) => e.courseId === r.id),
  },
  lesson: {
    course: (r) => db.courses.find((c) => c.id === r.courseId),
    quiz: (r) => db.quizzes.find((q) => q.lessonId === r.id),
    progresses: (r) => db.lessonProgress.filter((p) => p.lessonId === r.id),
  },
  enrollment: {
    student: (r) => db.users.find((u) => u.id === r.studentId),
    course: (r) => db.courses.find((c) => c.id === r.courseId),
    progresses: (r) => db.lessonProgress.filter((p) => p.enrollmentId === r.id),
  },
  quiz: {
    lesson: (r) => db.lessons.find((l) => l.id === r.lessonId),
    questions: (r) => db.questions.filter((q) => q.quizId === r.id),
    submissions: (r) => db.submissions.filter((s) => s.quizId === r.id),
  },
  question: {
    choices: (r) => db.choices.filter((c) => c.questionId === r.id),
    quiz: (r) => db.quizzes.find((q) => q.id === r.quizId),
    answers: (r) => db.answers.filter((a) => a.questionId === r.id),
  },
  quizSubmission: {
    quiz: (r) => db.quizzes.find((q) => q.id === r.quizId),
    student: (r) => db.users.find((u) => u.id === r.studentId),
    answers: (r) => db.answers.filter((a) => a.submissionId === r.id),
  },
  lessonProgress: {},
  choice: { question: (r) => db.questions.find((q) => q.id === r.questionId) },
  answer: {
    submission: (r) => db.submissions.find((s) => s.id === r.submissionId),
    question: (r) => db.questions.find((q) => q.id === r.questionId),
    choice: (r) => db.choices.find((c) => c.id === r.choiceId),
  },
};

const CHILD_MODEL: Record<string, string> = {
  instructor: "user", student: "user", course: "course", category: "category",
  courses: "course", coursesTaught: "course", lessons: "lesson", lesson: "lesson",
  enrollments: "enrollment", progresses: "lessonProgress", quiz: "quiz",
  questions: "question", choices: "choice", choice: "choice",
  submissions: "quizSubmission", submission: "quizSubmission",
  question: "question", answers: "answer",
};
const childModel = (key: string): string => CHILD_MODEL[key] ?? key;

// ---------------- where ----------------

/** Trả về null nếu `cond` không phải toán tử (để caller xử lý khóa unique ghép). */
function matchOperator(rowValue: any, cond: any): boolean | null {
  if (cond === null || typeof cond !== "object") return rowValue === cond;
  if (Array.isArray(cond)) return null;

  if ("in" in cond) return cond.in.includes(rowValue);
  if ("notIn" in cond) return !cond.notIn.includes(rowValue);
  if ("gte" in cond) return rowValue >= cond.gte;
  if ("lte" in cond) return rowValue <= cond.lte;
  if ("gt" in cond) return rowValue > cond.gt;
  if ("lt" in cond) return rowValue < cond.lt;
  if ("not" in cond) return rowValue !== cond.not;
  if ("contains" in cond) {
    const a = String(rowValue ?? "");
    const b = String(cond.contains);
    return cond.mode === "insensitive" ? a.toLowerCase().includes(b.toLowerCase()) : a.includes(b);
  }
  return null;
}

function matches(model: string, row: Row, where?: Row): boolean {
  if (!where) return true;

  for (const [key, cond] of Object.entries<any>(where)) {
    if (key === "OR") {
      if (!cond.some((w: Row) => matches(model, row, w))) return false;
      continue;
    }
    if (key === "AND") {
      if (!cond.every((w: Row) => matches(model, row, w))) return false;
      continue;
    }
    if (key === "NOT") {
      if (matches(model, row, cond)) return false;
      continue;
    }

    const relations = rel[model] ?? {};
    if (relations[key]) {
      const value = relations[key](row);
      if (Array.isArray(value)) {
        if (!value.some((v) => matches(childModel(key), v, cond))) return false;
      } else if (!value || !matches(childModel(key), value, cond)) {
        return false;
      }
      continue;
    }

    const result = matchOperator(row[key], cond);
    if (result === null) {
      // khóa unique ghép, ví dụ studentId_courseId: { studentId, courseId }
      if (!Object.entries(cond).every(([k, v]) => row[k] === v)) return false;
    } else if (!result) {
      return false;
    }
  }
  return true;
}

// ---------------- orderBy ----------------

function sortRows(model: string, rows: Row[], orderBy?: Row): Row[] {
  if (!orderBy) return rows;
  const entry = Object.entries<any>(orderBy)[0];
  if (!entry) return rows;
  const [field, spec] = entry;

  // orderBy theo số lượng quan hệ: { enrollments: { _count: "desc" } }
  if (spec && typeof spec === "object" && "_count" in spec) {
    const dir = spec._count === "desc" ? -1 : 1;
    const size = (r: Row) => (rel[model]?.[field]?.(r) ?? []).length;
    return [...rows].sort((a, b) => (size(a) - size(b)) * dir);
  }

  const dir = spec === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * dir);
}

// ---------------- select / include ----------------

function project(model: string, row: Row | undefined, args: Row = {}): any {
  if (!row) return row;
  const relations = rel[model] ?? {};

  const attachCount = (out: Row, spec: any) => {
    out._count = {};
    for (const relName of Object.keys(spec.select ?? {})) {
      out._count[relName] = (relations[relName]?.(row) ?? []).length;
    }
  };

  const expand = (key: string, opts: Row) => {
    const value = relations[key]?.(row);
    if (!Array.isArray(value)) return project(childModel(key), value, opts);
    const filtered = value.filter((v) => matches(childModel(key), v, opts.where));
    return sortRows(childModel(key), filtered, opts.orderBy).map((v) => project(childModel(key), v, opts));
  };

  if (args.select) {
    const out: Row = {};
    for (const [key, spec] of Object.entries<any>(args.select)) {
      if (key === "_count") attachCount(out, spec);
      else if (spec === true) out[key] = row[key];
      else if (spec && typeof spec === "object") out[key] = expand(key, spec);
    }
    return out;
  }

  const out: Row = { ...row };
  for (const [key, spec] of Object.entries<any>(args.include ?? {})) {
    if (key === "_count") attachCount(out, spec);
    else out[key] = expand(key, spec === true ? {} : spec);
  }
  return out;
}

// ---------------- nested create ----------------

const nested: Record<string, Record<string, { store: Row[]; fk: string; model: string }>> = {
  quiz: { questions: { store: db.questions, fk: "quizId", model: "question" } },
  question: { choices: { store: db.choices, fk: "questionId", model: "choice" } },
  quizSubmission: { answers: { store: db.answers, fk: "submissionId", model: "answer" } },
};

function createRow(model: string, store: Row[], data: Row, nextId: () => number): Row {
  const childSpecs = nested[model] ?? {};
  const scalars: Row = {};
  const children: [string, any][] = [];

  for (const [key, value] of Object.entries(data)) {
    if (childSpecs[key]) children.push([key, value]);
    else scalars[key] = value;
  }

  const row: Row = { id: nextId(), ...scalars };
  store.push(row);

  for (const [key, spec] of children) {
    const meta = childSpecs[key];
    const items = Array.isArray(spec?.create) ? spec.create : spec?.create ? [spec.create] : [];
    for (const item of items) createRow(meta.model, meta.store, { ...item, [meta.fk]: row.id }, nextId);
  }
  return row;
}

// ---------------- aggregate / groupBy ----------------

function computeAggregates(rows: Row[], args: Row): Row {
  const out: Row = {};

  if (args._count) {
    if (args._count === true || args._count._all !== undefined) {
      out._count = { _all: rows.length };
    } else {
      out._count = Object.fromEntries(
        Object.keys(args._count).map((k) => [k, rows.filter((r) => r[k] != null).length])
      );
    }
  }

  for (const op of ["_avg", "_sum", "_min", "_max"] as const) {
    if (!args[op]) continue;
    out[op] = Object.fromEntries(
      Object.keys(args[op]).map((field) => {
        const values = rows.map((r) => r[field]).filter((v) => typeof v === "number");
        if (values.length === 0) return [field, null];
        if (op === "_avg") return [field, values.reduce((a, b) => a + b, 0) / values.length];
        if (op === "_sum") return [field, values.reduce((a, b) => a + b, 0)];
        if (op === "_min") return [field, Math.min(...values)];
        return [field, Math.max(...values)];
      })
    );
  }
  return out;
}

// ---------------- model factory ----------------

function makeModel(model: string, store: Row[], nextId: () => number) {
  const filter = (where?: Row) => store.filter((r) => matches(model, r, where));

  return {
    findUnique: async (args: Row) => project(model, filter(args.where)[0], args),
    findFirst: async (args: Row = {}) =>
      project(model, sortRows(model, filter(args.where), args.orderBy)[0], args),
    findMany: async (args: Row = {}) => {
      let rows = sortRows(model, filter(args.where), args.orderBy);
      if (args.skip) rows = rows.slice(args.skip);
      if (args.take !== undefined) rows = rows.slice(0, args.take);
      return rows.map((r) => project(model, r, args));
    },
    count: async (args: Row = {}) => filter(args.where).length,
    aggregate: async (args: Row = {}) => computeAggregates(filter(args.where), args),
    groupBy: async (args: Row) => {
      const rows = filter(args.where);
      const keys: string[] = args.by;
      const groups = new Map<string, Row[]>();
      for (const row of rows) {
        const k = JSON.stringify(keys.map((key) => row[key]));
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(row);
      }
      return [...groups.entries()].map(([k, groupRows]) => {
        const values = JSON.parse(k);
        const out: Row = {};
        keys.forEach((key, i) => (out[key] = values[i]));
        return { ...out, ...computeAggregates(groupRows, args) };
      });
    },
    create: async (args: Row) => project(model, createRow(model, store, args.data, nextId), args),
    update: async (args: Row) => {
      const row = filter(args.where)[0];
      if (!row) return null;
      const childSpecs = nested[model] ?? {};
      for (const [key, value] of Object.entries<any>(args.data)) {
        if (childSpecs[key]) {
          const meta = childSpecs[key];
          const items = Array.isArray(value?.create) ? value.create : value?.create ? [value.create] : [];
          for (const item of items) createRow(meta.model, meta.store, { ...item, [meta.fk]: row.id }, nextId);
        } else {
          row[key] = value;
        }
      }
      return project(model, row, args);
    },
    upsert: async (args: Row) => {
      const row = filter(args.where)[0];
      if (row) {
        Object.assign(row, args.update);
        return project(model, row, args);
      }
      return project(model, createRow(model, store, args.create, nextId), args);
    },
    delete: async (args: Row) => {
      const i = store.findIndex((r) => matches(model, r, args.where));
      return i >= 0 ? store.splice(i, 1)[0] : null;
    },
    deleteMany: async (args: Row = {}) => {
      const keep = store.filter((r) => !matches(model, r, args.where));
      const removed = store.length - keep.length;
      store.length = 0;
      store.push(...keep);
      return { count: removed };
    },
  };
}

let idSeq = 9000;
const nextId = () => ++idSeq;

/** Dọn sạch dữ liệu giữa các bộ test. */
export function resetDb(): void {
  Object.values(db).forEach((arr) => (arr.length = 0));
  idSeq = 9000;
}

const fakePrisma: any = {
  user: makeModel("user", db.users, nextId),
  category: makeModel("category", db.categories, nextId),
  course: makeModel("course", db.courses, nextId),
  lesson: makeModel("lesson", db.lessons, nextId),
  enrollment: makeModel("enrollment", db.enrollments, nextId),
  lessonProgress: makeModel("lessonProgress", db.lessonProgress, nextId),
  quiz: makeModel("quiz", db.quizzes, nextId),
  question: makeModel("question", db.questions, nextId),
  choice: makeModel("choice", db.choices, nextId),
  quizSubmission: makeModel("quizSubmission", db.submissions, nextId),
  answer: makeModel("answer", db.answers, nextId),
  $transaction: async (arg: any) => (typeof arg === "function" ? arg(fakePrisma) : Promise.all(arg)),
  $queryRaw: async () => [{ ok: 1 }],
};

export default fakePrisma;
