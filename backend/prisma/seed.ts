/**
 * Seed dữ liệu mẫu cho LearnQuiz.
 * Chạy: npm run seed  (hoặc npx prisma db seed)
 *
 * Nguyên tắc: seed phải chạy lại được nhiều lần mà không lỗi (idempotent)
 * -> dùng upsert cho user/category, và xóa sạch dữ liệu khóa học trước khi tạo lại.
 */
import { PrismaClient, Role, CourseStatus, CourseLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "123456";

async function main() {
  console.log("Bắt đầu seed dữ liệu...");

  // ---------- 1) Dọn dữ liệu cũ (thứ tự ngược với quan hệ phụ thuộc) ----------
  await prisma.answer.deleteMany();
  await prisma.quizSubmission.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.choice.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();

  // ---------- 2) Tài khoản ----------
  const hashed = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@learnquiz.vn" },
    update: {},
    create: { name: "Quản trị hệ thống", email: "admin@learnquiz.vn", password: hashed, role: Role.admin },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@learnquiz.vn" },
    update: {},
    create: { name: "Trần Minh Giảng", email: "instructor@learnquiz.vn", password: hashed, role: Role.instructor },
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: "instructor2@learnquiz.vn" },
    update: {},
    create: { name: "Lê Thu Hà", email: "instructor2@learnquiz.vn", password: hashed, role: Role.instructor },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@learnquiz.vn" },
    update: {},
    create: { name: "Nguyễn Văn Học", email: "student@learnquiz.vn", password: hashed, role: Role.student },
  });

  await prisma.user.upsert({
    where: { email: "student2@learnquiz.vn" },
    update: {},
    create: { name: "Phạm Thị Mai", email: "student2@learnquiz.vn", password: hashed, role: Role.student },
  });

  // ---------- 3) Category ----------
  const categoryData = [
    { name: "Lập trình Web", slug: "lap-trinh-web" },
    { name: "Ngôn ngữ lập trình", slug: "ngon-ngu-lap-trinh" },
    { name: "Cơ sở dữ liệu", slug: "co-so-du-lieu" },
    { name: "DevOps & Công cụ", slug: "devops-cong-cu" },
  ];

  const categories: Record<string, number> = {};
  for (const c of categoryData) {
    const saved = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    categories[c.slug] = saved.id;
  }

  // ---------- 4) Khóa học + bài học + quiz ----------

  // === Khóa 1: JavaScript căn bản (published) ===
  const jsCourse = await prisma.course.create({
    data: {
      instructorId: instructor.id,
      categoryId: categories["ngon-ngu-lap-trinh"],
      title: "JavaScript căn bản cho người mới",
      description:
        "Khóa học nhập môn JavaScript: biến, kiểu dữ liệu, hàm, scope và thao tác DOM. Học xong bạn viết được các tương tác cơ bản trên trang web.",
      thumbnail: "https://placehold.co/600x400/f7df1e/000?text=JavaScript",
      level: CourseLevel.beginner,
      status: CourseStatus.published,
      publishedAt: new Date(),
      lessons: {
        create: [
          {
            order: 1,
            title: "Biến và kiểu dữ liệu",
            content:
              "JavaScript có 3 cách khai báo biến: var, let và const. var có phạm vi function scope và bị hoisting nên dễ gây lỗi khó tìm; let và const có block scope, chỉ tồn tại trong cặp ngoặc nhọn gần nhất. const không cho gán lại giá trị, nhưng nếu là object thì vẫn sửa được thuộc tính bên trong. Các kiểu nguyên thủy gồm: string, number, boolean, null, undefined, symbol, bigint. Quy tắc thực hành: mặc định dùng const, chỉ đổi sang let khi thật sự cần gán lại, và không dùng var trong code mới.",
            videoUrl: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
            quiz: {
              create: {
                title: "Kiểm tra: Biến và kiểu dữ liệu",
                passScore: 70,
                maxAttempts: 3,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "Từ khóa nào KHÔNG cho phép gán lại giá trị sau khi khai báo?",
                      choices: {
                        create: [
                          { text: "var", isCorrect: false },
                          { text: "let", isCorrect: false },
                          { text: "const", isCorrect: true },
                          { text: "function", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Biến khai báo bằng let có phạm vi (scope) là gì?",
                      choices: {
                        create: [
                          { text: "Block scope - chỉ trong cặp ngoặc nhọn gần nhất", isCorrect: true },
                          { text: "Function scope - toàn bộ hàm chứa nó", isCorrect: false },
                          { text: "Global scope - toàn bộ chương trình", isCorrect: false },
                          { text: "Không có scope", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 3,
                      text: "typeof null trả về giá trị nào?",
                      choices: {
                        create: [
                          { text: '"null"', isCorrect: false },
                          { text: '"object"', isCorrect: true },
                          { text: '"undefined"', isCorrect: false },
                          { text: "Báo lỗi", isCorrect: false },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            order: 2,
            title: "Hàm và phạm vi biến",
            content:
              "Hàm trong JavaScript là công dân hạng nhất: gán được vào biến, truyền được làm tham số, trả về được từ hàm khác. Function declaration bị hoisting toàn bộ nên gọi trước khi khai báo vẫn chạy; arrow function thì không, và quan trọng hơn là arrow function không có this riêng mà kế thừa this của scope bao ngoài. Closure là hiện tượng hàm bên trong vẫn nhớ được biến của hàm bên ngoài kể cả sau khi hàm ngoài đã kết thúc - đây là nền tảng của module pattern và của hook useState trong React.",
            videoUrl: "https://www.youtube.com/watch?v=N8ap4k_1QEQ",
            quiz: {
              create: {
                title: "Kiểm tra: Hàm và closure",
                passScore: 70,
                maxAttempts: 3,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "Closure trong JavaScript là gì?",
                      choices: {
                        create: [
                          { text: "Hàm bên trong ghi nhớ được biến của hàm bên ngoài", isCorrect: true },
                          { text: "Cách đóng một cửa sổ trình duyệt", isCorrect: false },
                          { text: "Từ khóa để kết thúc vòng lặp", isCorrect: false },
                          { text: "Một kiểu dữ liệu nguyên thủy", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Arrow function khác function thường ở điểm quan trọng nào?",
                      choices: {
                        create: [
                          { text: "Không có this riêng, kế thừa this của scope bao ngoài", isCorrect: true },
                          { text: "Chạy nhanh gấp đôi", isCorrect: false },
                          { text: "Không nhận tham số được", isCorrect: false },
                          { text: "Bắt buộc phải trả về giá trị", isCorrect: false },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            order: 3,
            title: "Thao tác DOM và sự kiện",
            content:
              "DOM là cây đối tượng biểu diễn trang HTML. querySelector trả về phần tử đầu tiên khớp CSS selector, querySelectorAll trả về NodeList tĩnh. addEventListener gắn hàm xử lý cho sự kiện và cho phép gắn nhiều handler cho cùng một sự kiện, khác với onclick chỉ giữ được một. Sự kiện lan theo cơ chế bubbling từ phần tử con lên cha, nhờ đó ta dùng được kỹ thuật event delegation: gắn một listener duy nhất ở phần tử cha thay vì gắn cho hàng trăm phần tử con.",
            videoUrl: "https://www.youtube.com/watch?v=0ik6X4DJKCc",
          },
        ],
      },
    },
    include: { lessons: true },
  });

  // === Khóa 2: React (published) ===
  const reactCourse = await prisma.course.create({
    data: {
      instructorId: instructor.id,
      categoryId: categories["lap-trinh-web"],
      title: "ReactJS thực chiến: Component, State và Router",
      description:
        "Xây dựng ứng dụng React hoàn chỉnh từ component đầu tiên đến routing và gọi API. Có bài tập và quiz sau mỗi bài.",
      thumbnail: "https://placehold.co/600x400/61dafb/000?text=ReactJS",
      level: CourseLevel.intermediate,
      status: CourseStatus.published,
      publishedAt: new Date(),
      lessons: {
        create: [
          {
            order: 1,
            title: "Component và Props",
            content:
              "Component là đơn vị tái sử dụng của React, bản chất là một hàm nhận props và trả về JSX. Props là dữ liệu truyền một chiều từ cha xuống con và bất biến ở phía con - muốn đổi thì phải nhờ cha đổi qua callback. JSX không phải HTML: className thay cho class, htmlFor thay cho for, và mọi biểu thức JavaScript đặt trong cặp ngoặc nhọn. Khi render danh sách bằng map, mỗi phần tử cần prop key ổn định và duy nhất để React so sánh cây ảo hiệu quả.",
            quiz: {
              create: {
                title: "Kiểm tra: Component và Props",
                passScore: 70,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "Props trong React có tính chất gì?",
                      choices: {
                        create: [
                          { text: "Chỉ đọc, truyền một chiều từ cha xuống con", isCorrect: true },
                          { text: "Sửa trực tiếp được ở component con", isCorrect: false },
                          { text: "Truyền hai chiều tự động", isCorrect: false },
                          { text: "Chỉ chứa được kiểu string", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Vì sao khi render danh sách bằng map cần prop key?",
                      choices: {
                        create: [
                          { text: "Để React nhận diện phần tử nào thay đổi khi so sánh Virtual DOM", isCorrect: true },
                          { text: "Để sắp xếp danh sách theo thứ tự tăng dần", isCorrect: false },
                          { text: "Để đặt id cho thẻ HTML", isCorrect: false },
                          { text: "Không bắt buộc, chỉ để code đẹp", isCorrect: false },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            order: 2,
            title: "useState và useEffect",
            content:
              "useState trả về cặp [giá trị, hàm cập nhật]. Gọi hàm cập nhật sẽ đánh dấu component cần render lại; không được gán trực tiếp vào biến state vì React sẽ không biết mà render. useEffect chạy sau khi render xong, dùng cho side effect như gọi API hay đăng ký listener. Mảng dependency quyết định khi nào effect chạy lại: mảng rỗng nghĩa là chỉ chạy một lần sau lần mount đầu tiên. Hàm trả về trong useEffect là cleanup, dùng để hủy listener hoặc hủy request khi component unmount.",
            quiz: {
              create: {
                title: "Kiểm tra: Hooks cơ bản",
                passScore: 70,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "useEffect với mảng dependency rỗng [] sẽ chạy khi nào?",
                      choices: {
                        create: [
                          { text: "Một lần duy nhất sau lần render đầu tiên", isCorrect: true },
                          { text: "Sau mỗi lần render", isCorrect: false },
                          { text: "Không bao giờ chạy", isCorrect: false },
                          { text: "Chỉ chạy khi component bị unmount", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Hàm được return bên trong useEffect dùng để làm gì?",
                      choices: {
                        create: [
                          { text: "Dọn dẹp (cleanup) khi unmount hoặc trước lần chạy effect kế tiếp", isCorrect: true },
                          { text: "Trả kết quả về cho component cha", isCorrect: false },
                          { text: "Khởi tạo lại state", isCorrect: false },
                          { text: "Không có tác dụng gì", isCorrect: false },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
    include: { lessons: true },
  });

  // === Khóa 3: SQL & Prisma (pending - để demo màn hình Admin duyệt) ===
  await prisma.course.create({
    data: {
      instructorId: instructor2.id,
      categoryId: categories["co-so-du-lieu"],
      title: "PostgreSQL và Prisma ORM từ số 0",
      description:
        "Thiết kế bảng, viết truy vấn SQL, rồi ánh xạ sang Prisma schema và migration. Khóa học đang chờ quản trị viên duyệt.",
      thumbnail: "https://placehold.co/600x400/336791/fff?text=PostgreSQL",
      level: CourseLevel.intermediate,
      status: CourseStatus.pending,
      lessons: {
        create: [
          {
            order: 1,
            title: "Thiết kế bảng và khóa ngoại",
            content:
              "Khóa chính định danh duy nhất một dòng. Khóa ngoại tạo ràng buộc tham chiếu giữa hai bảng và quyết định hành vi khi bản ghi cha bị xóa: CASCADE xóa theo, SET NULL gán null, RESTRICT chặn không cho xóa. Chọn sai hành vi này là nguyên nhân phổ biến của dữ liệu mồ côi trong hệ thống thật.",
          },
        ],
      },
    },
  });

  // ---------- 5) Enrollment + tiến độ mẫu cho học viên ----------
  const enrollment = await prisma.enrollment.create({
    data: { studentId: student.id, courseId: jsCourse.id },
  });

  // Đã học xong bài 1
  await prisma.lessonProgress.create({
    data: {
      enrollmentId: enrollment.id,
      lessonId: jsCourse.lessons.find((l) => l.order === 1)!.id,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  await prisma.enrollment.create({
    data: { studentId: student.id, courseId: reactCourse.id },
  });

  console.log("Seed hoàn tất.");
  console.log("--------------------------------------------------");
  console.log("Tài khoản demo (mật khẩu chung: %s)", PASSWORD);
  console.log("  admin       : admin@learnquiz.vn");
  console.log("  instructor  : instructor@learnquiz.vn");
  console.log("  instructor 2: instructor2@learnquiz.vn");
  console.log("  student     : student@learnquiz.vn");
  console.log("  student 2   : student2@learnquiz.vn");
  console.log("--------------------------------------------------");
  console.log("Admin id=%d, Instructor id=%d, Student id=%d", admin.id, instructor.id, student.id);
}

main()
  .catch((e) => {
    console.error("Seed thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
