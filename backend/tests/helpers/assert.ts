/** Bộ khẳng định tối giản dùng chung cho các file test - không cần thư viện ngoài. */
let passed = 0;
let failed = 0;

export function ok(name: string, condition: boolean, extra = ""): void {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    console.log(`  \u2717 ${name} ${extra}`);
  }
}

export function equal(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(name, a === e, `\n      nhận : ${a}\n      mong : ${e}`);
}

/** Khẳng định một lời gọi async phải ném AppError với đúng mã HTTP. */
export async function expectError(
  name: string,
  fn: () => Promise<unknown>,
  status: number,
  fragment?: string
): Promise<void> {
  try {
    await fn();
    failed++;
    console.log(`  \u2717 ${name} -> ĐÁNG LẼ PHẢI LỖI ${status} nhưng lại thành công`);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const okStatus = err.statusCode === status;
    const okMsg = !fragment || String(err.message).includes(fragment);
    if (okStatus && okMsg) {
      passed++;
      console.log(`  \u2713 ${name} -> ${status}: ${err.message}`);
    } else {
      failed++;
      console.log(`  \u2717 ${name} -> nhận ${err.statusCode}: ${err.message}`);
    }
  }
}

export function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

export function report(suite: string): void {
  console.log(`\n---- ${suite}: ${passed} đạt / ${failed} hỏng ----`);
  if (failed > 0) process.exit(1);
}
