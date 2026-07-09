CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'pt-BR',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "interview_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "target_role" TEXT NOT NULL,
  "seniority" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "interviewer_style" TEXT,
  "difficulty" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'started',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview_turns" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interview_turns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_reports" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "overall_summary" TEXT NOT NULL,
  "confidence_level" TEXT NOT NULL,
  "model_name" TEXT,
  "prompt_template_version" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedback_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_dimensions" (
  "id" TEXT NOT NULL,
  "report_id" TEXT NOT NULL,
  "dimension" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "evidence" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  CONSTRAINT "feedback_dimensions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_items" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "tags" JSONB,
  "source" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cri_snapshots" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "confidence_level" TEXT NOT NULL,
  "composition" JSONB NOT NULL,
  "evidence_gaps" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cri_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "diary_entries" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "entry_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "context" TEXT,
  "decision" TEXT,
  "next_steps" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "interview_turns" ADD CONSTRAINT "interview_turns_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback_dimensions" ADD CONSTRAINT "feedback_dimensions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "feedback_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cri_snapshots" ADD CONSTRAINT "cri_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

