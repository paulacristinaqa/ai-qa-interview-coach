CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "linkedin_url" TEXT,
    "country" TEXT,
    "city" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "work_culture" TEXT,
    "notes" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "linkedin_url" TEXT,
    "notes" TEXT,
    "last_contact_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "job_opportunities" ADD COLUMN "company_profile_id" TEXT;

CREATE UNIQUE INDEX "companies_user_id_name_key" ON "companies"("user_id", "name");
CREATE INDEX "companies_user_id_favorite_idx" ON "companies"("user_id", "favorite");
CREATE INDEX "company_contacts_company_id_updated_at_idx" ON "company_contacts"("company_id", "updated_at");
CREATE INDEX "company_contacts_user_id_last_contact_at_idx" ON "company_contacts"("user_id", "last_contact_at");
CREATE INDEX "job_opportunities_company_profile_id_idx" ON "job_opportunities"("company_profile_id");

ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
