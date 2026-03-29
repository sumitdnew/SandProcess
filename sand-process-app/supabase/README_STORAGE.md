# Invoice PDF storage (Supabase)

1. In **Supabase Dashboard → Storage**, create a bucket named **`invoices`** (private recommended).
2. Allowed MIME: `application/pdf` (optional size limit e.g. 50 MB).
3. **Required:** add Storage policies, or uploads fail with  
   `new row violates row-level security policy`.  
   Run the SQL in **`supabase/migrations/20260213120002_storage_and_invoice_rls.sql`** (SQL Editor), or in Dashboard → **Storage → Policies** for bucket `invoices`, allow **INSERT** (and **SELECT** / **UPDATE** / **DELETE** as needed) for roles `anon` and `authenticated`.

The app uploads to paths like `{invoiceId}/{filename}.pdf` and stores the relative path in `invoices.invoice_pdf_storage_path`.

**If the PDF uploads but saving the invoice fails:** your `public.invoices` table may have RLS blocking `UPDATE`. Add an appropriate policy in **SQL → policies** for `invoices`, or use the service role server-side (production).

---

## Pickup gate documents (bucket `documents`)

1. Create a bucket named **`documents`** (private recommended) if you use pickup release file uploads.
2. Allow images and PDFs as needed (e.g. `image/*`, `application/pdf`).
3. Storage policies: **INSERT** / **SELECT** (and **DELETE** if you want staff to remove files) for `bucket_id = 'documents'`.

The app stores paths under `pickup-releases/{pickup_release_id}/…` and saves JSON in `pickup_releases.document_storage_paths` (see migration `20260213120001_pickup_release_documents.sql`).
