CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "applied_at" TIMESTAMP(3),
    "next_action" TEXT,
    "next_action_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_applications_opportunity_id_key" ON "job_applications"("opportunity_id");
CREATE INDEX "job_applications_user_id_status_idx" ON "job_applications"("user_id", "status");
CREATE INDEX "job_applications_user_id_next_action_at_idx" ON "job_applications"("user_id", "next_action_at");

ALTER TABLE "job_applications"
ADD CONSTRAINT "job_applications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "job_applications"
ADD CONSTRAINT "job_applications_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
