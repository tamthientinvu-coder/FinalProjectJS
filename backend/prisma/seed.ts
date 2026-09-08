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
  // Xóa luôn danh mục: category chỉ được course tham chiếu, mà course vừa bị xóa ở trên.
  // Nếu bỏ bước này, mọi danh mục từng tạo bằng tay sẽ nằm lại vĩnh viễn và hiện ra
  // như một mục rỗng trong bộ lọc của trang công khai.
  await prisma.category.deleteMany();

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

  const instructor3 = await prisma.user.upsert({
    where: { email: "instructor3@learnquiz.vn" },
    update: {},
    create: { name: "Nguyễn Hoàng Phúc", email: "instructor3@learnquiz.vn", password: hashed, role: Role.instructor },
  });

  const instructor4 = await prisma.user.upsert({
    where: { email: "instructor4@learnquiz.vn" },
    update: {},
    create: { name: "Phạm Cẩm Tú", email: "instructor4@learnquiz.vn", password: hashed, role: Role.instructor },
  });

  const instructor5 = await prisma.user.upsert({
    where: { email: "instructor5@learnquiz.vn" },
    update: {},
    create: { name: "Đặng Quốc Bảo", email: "instructor5@learnquiz.vn", password: hashed, role: Role.instructor },
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
    { name: "Dữ liệu & AI", slug: "du-lieu-va-ai" },
    { name: "Thiết kế & Đồ họa", slug: "thiet-ke-do-hoa" },
  ];

  const categories: Record<string, number> = {};
  for (const c of categoryData) {
    const saved = await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
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

  // === Khóa 4: Python căn bản (published) ===
  await prisma.course.create({
    data: {
      instructorId: instructor3.id,
      categoryId: categories["ngon-ngu-lap-trinh"],
      title: "Lập trình Python cho người mới bắt đầu",
      description:
        "Nhập môn Python: cú pháp, kiểu dữ liệu, cấu trúc điều khiển, hàm và các kiểu dữ liệu tập hợp. Học xong bạn tự viết được script xử lý tệp và dữ liệu hằng ngày.",
      thumbnail: "https://placehold.co/600x400/3776ab/fff?text=Python",
      level: CourseLevel.beginner,
      status: CourseStatus.published,
      publishedAt: new Date(),
      lessons: {
        create: [
          {
            order: 1,
            title: "Cú pháp, biến và kiểu dữ liệu",
            content:
              "Python dùng thụt lề để phân khối lệnh thay cho dấu ngoặc nhọn, nên sai thụt lề là lỗi cú pháp chứ không chỉ là xấu mã. Biến không cần khai báo kiểu; kiểu được suy ra khi gán và có thể đổi về sau. Bốn kiểu số và chuỗi hay dùng: int (số nguyên không giới hạn độ lớn), float (số thực dấu phẩy động), bool (True/False), str (chuỗi Unicode, bất biến). Vì chuỗi bất biến nên mọi thao tác như .upper() hay .replace() đều trả về chuỗi mới chứ không sửa chuỗi gốc. Dùng f-string để ghép chuỗi cho dễ đọc: f\"Xin chào {ten}\".",
          },
          {
            order: 2,
            title: "List, tuple, dict và set",
            content:
              "List là dãy có thứ tự và sửa được, viết trong ngoặc vuông. Tuple giống list nhưng bất biến, viết trong ngoặc tròn, nên dùng được làm khóa của dict. Dict lưu cặp khóa–giá trị, tra cứu theo khóa gần như tức thời. Set là tập hợp không trùng lặp và không có thứ tự, rất hợp để lọc trùng hoặc kiểm tra một phần tử có nằm trong tập không. Chọn đúng kiểu dữ liệu quan trọng hơn tối ưu vòng lặp: kiểm tra phần tử trong list phải duyệt tuần tự, còn trong set hay dict thì tra thẳng qua bảng băm.",
            quiz: {
              create: {
                title: "Kiểm tra: Kiểu dữ liệu trong Python",
                passScore: 70,
                maxAttempts: 3,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "Kiểu dữ liệu nào sau đây KHÔNG cho phép thay đổi nội dung sau khi tạo?",
                      choices: {
                        create: [
                          { text: "list", isCorrect: false },
                          { text: "tuple", isCorrect: true },
                          { text: "dict", isCorrect: false },
                          { text: "set", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Cấu trúc nào phù hợp nhất để loại bỏ các giá trị trùng lặp?",
                      choices: {
                        create: [
                          { text: "set", isCorrect: true },
                          { text: "list", isCorrect: false },
                          { text: "tuple", isCorrect: false },
                          { text: "str", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 3,
                      text: "Python phân biệt khối lệnh bằng cách nào?",
                      choices: {
                        create: [
                          { text: "Bằng thụt lề", isCorrect: true },
                          { text: "Bằng cặp ngoặc nhọn", isCorrect: false },
                          { text: "Bằng dấu chấm phẩy cuối dòng", isCorrect: false },
                          { text: "Bằng từ khóa begin và end", isCorrect: false },
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
  });

  // === Khóa 5: Phân tích dữ liệu (published) ===
  await prisma.course.create({
    data: {
      instructorId: instructor4.id,
      categoryId: categories["du-lieu-va-ai"],
      title: "Phân tích dữ liệu với Excel và Power BI",
      description:
        "Làm sạch dữ liệu, dựng bảng tổng hợp và kể chuyện bằng biểu đồ. Đi từ hàm Excel nền tảng đến mô hình dữ liệu và báo cáo tương tác trên Power BI.",
      thumbnail: "https://placehold.co/600x400/217346/fff?text=Data+Analysis",
      level: CourseLevel.beginner,
      status: CourseStatus.published,
      publishedAt: new Date(),
      lessons: {
        create: [
          {
            order: 1,
            title: "Làm sạch dữ liệu trước khi phân tích",
            content:
              "Phần lớn thời gian của một dự án phân tích nằm ở khâu làm sạch chứ không phải vẽ biểu đồ. Bốn lỗi hay gặp: ô trống bị hiểu nhầm là số 0, ngày tháng lưu dưới dạng chuỗi nên không sắp xếp đúng, khoảng trắng thừa ở đầu và cuối làm hai giá trị giống nhau bị đếm thành hai nhóm, và dòng trùng lặp do gộp nhiều nguồn. Nguyên tắc quan trọng: luôn giữ lại bản dữ liệu thô, mọi bước làm sạch phải ghi lại được để người khác lặp lại và kiểm chứng kết quả.",
          },
          {
            order: 2,
            title: "Bảng tổng hợp và biểu đồ biết kể chuyện",
            content:
              "Bảng tổng hợp trả lời nhanh câu hỏi tổng, trung bình và đếm theo từng nhóm mà không cần viết công thức. Khi chọn biểu đồ, hãy bám vào câu hỏi: so sánh giữa các nhóm thì dùng cột, diễn biến theo thời gian thì dùng đường, quan hệ giữa hai đại lượng thì dùng biểu đồ phân tán. Tránh biểu đồ tròn khi có quá nhiều phần, vì mắt người rất kém trong việc so sánh diện tích các hình quạt gần bằng nhau.",
            quiz: {
              create: {
                title: "Kiểm tra: Nền tảng phân tích dữ liệu",
                passScore: 70,
                maxAttempts: 3,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "Loại biểu đồ nào phù hợp nhất để thể hiện diễn biến doanh thu qua 12 tháng?",
                      choices: {
                        create: [
                          { text: "Biểu đồ đường", isCorrect: true },
                          { text: "Biểu đồ tròn", isCorrect: false },
                          { text: "Biểu đồ phân tán", isCorrect: false },
                          { text: "Biểu đồ radar", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Vì sao phải luôn giữ lại bản dữ liệu thô?",
                      choices: {
                        create: [
                          { text: "Để người khác lặp lại và kiểm chứng được kết quả", isCorrect: true },
                          { text: "Để tệp báo cáo có dung lượng lớn hơn", isCorrect: false },
                          { text: "Vì Power BI bắt buộc phải có", isCorrect: false },
                          { text: "Để biểu đồ hiển thị nhanh hơn", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 3,
                      text: "Khoảng trắng thừa ở đầu và cuối giá trị gây ra hậu quả gì khi nhóm dữ liệu?",
                      choices: {
                        create: [
                          { text: "Hai giá trị giống nhau bị đếm thành hai nhóm khác nhau", isCorrect: true },
                          { text: "Tệp bị hỏng không mở được", isCorrect: false },
                          { text: "Ngày tháng tự động đổi sang định dạng khác", isCorrect: false },
                          { text: "Không ảnh hưởng gì cả", isCorrect: false },
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
  });

  // === Khóa 6: Figma (pending - chờ duyệt) ===
  await prisma.course.create({
    data: {
      instructorId: instructor5.id,
      categoryId: categories["thiet-ke-do-hoa"],
      title: "Thiết kế giao diện web với Figma",
      description:
        "Dựng giao diện từ khung xương đến bản mẫu bấm được: lưới bố cục, hệ thống màu và chữ, component tái sử dụng và bàn giao cho lập trình viên. Khóa học đang chờ quản trị viên duyệt.",
      thumbnail: "https://placehold.co/600x400/a259ff/fff?text=Figma",
      level: CourseLevel.intermediate,
      status: CourseStatus.pending,
      lessons: {
        create: [
          {
            order: 1,
            title: "Lưới bố cục và hệ thống khoảng cách",
            content:
              "Giao diện trông chuyên nghiệp hay không phần lớn do khoảng cách chứ không do màu sắc. Hãy chọn một đơn vị cơ sở, thường là 8 điểm ảnh, rồi mọi khoảng cách và kích thước đều là bội số của nó. Cách này giúp các màn hình khác nhau vẫn nhất quán mà không cần đo lại từng chỗ. Lưới 12 cột chia hết cho 2, 3, 4 và 6 nên bố trí được nhiều kiểu chia khối mà vẫn thẳng hàng.",
          },
          {
            order: 2,
            title: "Component và biến thể",
            content:
              "Component là một khối giao diện được định nghĩa một lần rồi dùng lại nhiều nơi; sửa ở bản gốc thì mọi bản sao đổi theo. Biến thể gom các trạng thái của cùng một thành phần vào một chỗ, ví dụ nút bấm có trạng thái thường, di chuột lên, đang bấm và bị vô hiệu hóa. Đặt tên component theo vai trò chứ không theo hình thức: đặt là Nút chính thay vì Nút xanh, vì màu có thể đổi còn vai trò thì không.",
            quiz: {
              create: {
                title: "Kiểm tra: Nguyên tắc thiết kế giao diện",
                passScore: 70,
                maxAttempts: 3,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "Vì sao nên đặt tên component theo vai trò thay vì theo màu sắc?",
                      choices: {
                        create: [
                          { text: "Vì màu có thể thay đổi nhưng vai trò thì không", isCorrect: true },
                          { text: "Vì tên theo màu làm tệp nặng hơn", isCorrect: false },
                          { text: "Vì Figma không cho đặt tên có màu", isCorrect: false },
                          { text: "Vì tên theo vai trò ngắn hơn", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Lợi ích chính của việc lấy 8 điểm ảnh làm đơn vị khoảng cách cơ sở là gì?",
                      choices: {
                        create: [
                          { text: "Giữ khoảng cách nhất quán trên mọi màn hình", isCorrect: true },
                          { text: "Giúp trang tải nhanh hơn", isCorrect: false },
                          { text: "Bắt buộc theo chuẩn WCAG", isCorrect: false },
                          { text: "Giảm dung lượng ảnh xuất ra", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 3,
                      text: "Khi sửa component gốc thì các bản sao đang dùng sẽ ra sao?",
                      choices: {
                        create: [
                          { text: "Tự động cập nhật theo bản gốc", isCorrect: true },
                          { text: "Giữ nguyên như cũ", isCorrect: false },
                          { text: "Bị xóa khỏi trang", isCorrect: false },
                          { text: "Chuyển thành ảnh tĩnh", isCorrect: false },
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
  });

  // === Khóa 7: Selenium (draft - bản nháp của giảng viên) ===
  await prisma.course.create({
    data: {
      instructorId: instructor5.id,
      categoryId: categories["devops-cong-cu"],
      title: "Kiểm thử tự động với Selenium",
      description:
        "Viết kịch bản kiểm thử giao diện chạy được trên nhiều trình duyệt, xử lý chờ bất đồng bộ và tổ chức mã theo mô hình Page Object. Khóa học còn là bản nháp, chưa gửi duyệt.",
      thumbnail: "https://placehold.co/600x400/43b02a/fff?text=Selenium",
      level: CourseLevel.intermediate,
      status: CourseStatus.draft,
      lessons: {
        create: [
          {
            order: 1,
            title: "Định vị phần tử và chờ đúng cách",
            content:
              "Nguyên nhân số một khiến kiểm thử giao diện chập chờn là chờ sai cách. Chờ cứng bằng cách ngủ vài giây vừa làm bộ kiểm thử chậm vừa vẫn hỏng khi mạng chậm hơn thường lệ. Hãy dùng chờ tường minh: nêu rõ điều kiện cần đợi, ví dụ phần tử hiện ra hoặc bấm được, kèm thời hạn tối đa. Về cách định vị, ưu tiên thuộc tính dành riêng cho kiểm thử hoặc vai trò khả truy cập; tránh bám vào đường dẫn XPath dài vì chỉ cần đổi một thẻ bọc ngoài là hỏng.",
            quiz: {
              create: {
                title: "Kiểm tra: Nguyên tắc kiểm thử tự động",
                passScore: 70,
                maxAttempts: 3,
                questions: {
                  create: [
                    {
                      order: 1,
                      text: "Vì sao không nên dùng lệnh chờ cứng trong kịch bản kiểm thử?",
                      choices: {
                        create: [
                          { text: "Vừa làm chậm bộ kiểm thử vừa vẫn hỏng khi mạng chậm", isCorrect: true },
                          { text: "Vì Selenium không hỗ trợ lệnh chờ", isCorrect: false },
                          { text: "Vì nó chỉ chạy được trên Chrome", isCorrect: false },
                          { text: "Vì nó làm tăng dung lượng báo cáo", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 2,
                      text: "Cách định vị phần tử nào bền vững nhất trước thay đổi giao diện?",
                      choices: {
                        create: [
                          { text: "Thuộc tính dành riêng cho kiểm thử", isCorrect: true },
                          { text: "Đường dẫn XPath tuyệt đối", isCorrect: false },
                          { text: "Thứ tự phần tử trên trang", isCorrect: false },
                          { text: "Tọa độ điểm ảnh", isCorrect: false },
                        ],
                      },
                    },
                    {
                      order: 3,
                      text: "Mô hình Page Object giải quyết vấn đề gì?",
                      choices: {
                        create: [
                          { text: "Gom cách định vị vào một nơi để sửa giao diện chỉ phải sửa một chỗ", isCorrect: true },
                          { text: "Tăng tốc độ chạy trình duyệt", isCorrect: false },
                          { text: "Tự động sinh dữ liệu kiểm thử", isCorrect: false },
                          { text: "Thay thế hoàn toàn kiểm thử đơn vị", isCorrect: false },
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
  console.log("  instructor 3: instructor3@learnquiz.vn");
  console.log("  instructor 4: instructor4@learnquiz.vn");
  console.log("  instructor 5: instructor5@learnquiz.vn");
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
