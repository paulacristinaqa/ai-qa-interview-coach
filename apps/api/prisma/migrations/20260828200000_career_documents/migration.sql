CREATE TABLE "career_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "candidate_profile" TEXT NOT NULL,
    "cv_markdown" TEXT NOT NULL,
    "cover_letter" TEXT NOT NULL,
    "fit_matrix" JSONB NOT NULL,
    "provider_name" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "prompt_template_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "career_documents_opportunity_id_language_key" ON "career_documents"("opportunity_id", "language");
CREATE INDEX "career_documents_user_id_updated_at_idx" ON "career_documents"("user_id", "updated_at");

ALTER TABLE "career_documents"
ADD CONSTRAINT "career_documents_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "career_documents"
ADD CONSTRAINT "career_documents_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
