'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// Create an invoice
const CreateInvoice = FormSchema.omit({ id: true, date: true }); // Remove the "id" and "date" fields from the schema

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100; // Convert the amount to cents
  const date = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `; // Insert the new invoice

  revalidatePath('/dashboard/invoices'); // Revalidate the invoices page
  redirect('/dashboard/invoices'); // Redirect to the invoices page
}
// end of creating an invoice

// Update an invoice
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
// end of updating an invoice

// Delete an invoice

/**
 * Deletes an invoice from the database based on the given ID.
 * @param {string} id - The ID of the invoice to delete.
 * @return {Promise<void>} - A promise that resolves when the invoice is deleted.
 */

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

// end of deleting an invoice
