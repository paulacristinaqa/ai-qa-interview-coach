CREATE TABLE "professional_evidence" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "outcome" TEXT,
    "source_url" TEXT,
    "occurred_at" TIMESTAMP(3),
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_evidence_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "career_documents" ADD COLUMN "source_evidence_ids" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX "professional_evidence_user_id_type_idx" ON "professional_evidence"("user_id", "type");
CREATE INDEX "professional_evidence_user_id_favorite_idx" ON "professional_evidence"("user_id", "favorite");

ALTER TABLE "professional_evidence"
ADD CONSTRAINT "professional_evidence_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
