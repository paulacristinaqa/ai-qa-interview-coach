CREATE TABLE "job_analyses" (
  "id" TEXT NOT NULL,
  "opportunity_id" TEXT NOT NULL,
  "technical_summary" TEXT NOT NULL,
  "responsibilities" JSONB NOT NULL,
  "required_requirements" JSONB NOT NULL,
  "preferred_requirements" JSONB NOT NULL,
  "technologies" JSONB NOT NULL,
  "soft_skills" JSONB NOT NULL,
  "estimated_seniority" TEXT NOT NULL,
  "profile_fit" JSONB NOT NULL,
  "gaps" JSONB NOT NULL,
  "preparation_plan" JSONB NOT NULL,
  "provider_name" TEXT NOT NULL,
  "model_name" TEXT NOT NULL,
  "prompt_template_version" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_analyses_opportunity_id_key" ON "job_analyses"("opportunity_id");

ALTER TABLE "job_analyses" ADD CONSTRAINT "job_analyses_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
