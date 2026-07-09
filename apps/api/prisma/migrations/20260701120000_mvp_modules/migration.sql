ALTER TABLE "interview_turns" ADD COLUMN "coach_note" TEXT;

CREATE TABLE "learning_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "session_id" TEXT,
  "concept" TEXT NOT NULL,
  "help_level" TEXT NOT NULL,
  "retry_requested" BOOLEAN NOT NULL DEFAULT false,
  "language" TEXT NOT NULL DEFAULT 'pt-BR',
  "content" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "questions" (
  "id" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'pt-BR',
  "level" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "competency" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "criteria" JSONB NOT NULL,
  "hints" JSONB NOT NULL,
  "model_answer" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_attempts" (
  "id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "help_used" BOOLEAN NOT NULL DEFAULT false,
  "result" TEXT NOT NULL,
  "feedback" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technical_challenges" (
  "id" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "evaluation_criteria" JSONB NOT NULL,
  "model_solution" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "technical_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technical_attempts" (
  "id" TEXT NOT NULL,
  "challenge_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "feedback" JSONB NOT NULL,
  "solution_revealed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "technical_attempts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "technical_attempts" ADD CONSTRAINT "technical_attempts_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "technical_challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "technical_attempts" ADD CONSTRAINT "technical_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
