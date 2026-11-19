import { expect, type Page } from '@playwright/test';

/** Seat list items whose visible text contains "To act". */
export const toActSeats = (page: Page) =>
  page.getByRole('list', { name: 'Seats' }).getByRole('listitem').filter({ hasText: 'To act' });

/** seat '' = nobody to act; else exactly one seat, that seat, with its "To act" text visible. */
export async function expectToAct(page: Page, seat: string): Promise<void> {
  const seats = toActSeats(page);
  if (seat === '') {
    await expect(seats).toHaveCount(0);
    return;
  }
  await expect(seats).toHaveCount(1);
  await expect(seats).toHaveAttribute('data-seat', seat);
  await expect(seats.getByText('To act', { exact: true })).toBeVisible();
}
