CREATE TABLE "job_opportunities" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "city" TEXT,
  "work_model" TEXT NOT NULL,
  "seniority" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "link" TEXT,
  "original_description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'saved',
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_opportunities_user_id_status_idx" ON "job_opportunities"("user_id", "status");
CREATE INDEX "job_opportunities_user_id_work_model_idx" ON "job_opportunities"("user_id", "work_model");

ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
