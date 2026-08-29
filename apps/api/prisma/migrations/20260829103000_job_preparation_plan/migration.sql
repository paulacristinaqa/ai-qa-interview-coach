CREATE TABLE "job_preparation_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "evaluation_updated_at" TIMESTAMP(3) NOT NULL,
    "provider_name" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "prompt_template_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_preparation_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_preparation_plans_opportunity_id_key" ON "job_preparation_plans"("opportunity_id");
CREATE INDEX "job_preparation_plans_user_id_updated_at_idx" ON "job_preparation_plans"("user_id", "updated_at");

ALTER TABLE "job_preparation_plans" ADD CONSTRAINT "job_preparation_plans_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "job_preparation_plans" ADD CONSTRAINT "job_preparation_plans_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
