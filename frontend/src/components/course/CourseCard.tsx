import { Card, CardActionArea, CardMedia, CardContent, Typography, Chip, Box, Stack } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { Link as RouterLink } from "react-router-dom";
import { LEVEL_LABEL, type CourseListItem } from "../../types/course";

const FALLBACK_THUMB = "https://placehold.co/600x400/e0e0e0/757575?text=LearnQuiz";

export default function CourseCard({ course }: { course: CourseListItem }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardActionArea
        component={RouterLink}
        to={`/courses/${course.id}`}
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <CardMedia
          component="img"
          height="160"
          image={course.thumbnail || FALLBACK_THUMB}
          alt={course.title}
          sx={{ objectFit: "cover", bgcolor: "grey.200" }}
        />
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }} useFlexGap>
            {course.category && <Chip size="small" color="primary" label={course.category.name} />}
            <Chip size="small" variant="outlined" label={LEVEL_LABEL[course.level]} />
          </Stack>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 52,
            }}
          >
            {course.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 40,
            }}
          >
            {course.description || "Chưa có mô tả"}
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mt: 1.5, color: "text.secondary" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MenuBookIcon fontSize="small" />
              <Typography variant="caption">{course._count.lessons} bài học</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <PeopleAltIcon fontSize="small" />
              <Typography variant="caption">{course._count.enrollments} học viên</Typography>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Giảng viên: {course.instructor.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
