CREATE TABLE "competency_evaluations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "requirements" JSONB NOT NULL,
    "evidence_ids" JSONB NOT NULL DEFAULT '[]',
    "analysis_updated_at" TIMESTAMP(3) NOT NULL,
    "provider_name" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "prompt_template_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "competency_evaluations_opportunity_id_key" ON "competency_evaluations"("opportunity_id");
CREATE INDEX "competency_evaluations_user_id_updated_at_idx" ON "competency_evaluations"("user_id", "updated_at");

ALTER TABLE "competency_evaluations"
ADD CONSTRAINT "competency_evaluations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "competency_evaluations"
ADD CONSTRAINT "competency_evaluations_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
