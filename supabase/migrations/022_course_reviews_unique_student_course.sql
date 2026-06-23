-- Um aluno só pode deixar um depoimento por curso
create unique index if not exists course_reviews_student_course_unique
  on public.course_reviews(student_id, course_id);
