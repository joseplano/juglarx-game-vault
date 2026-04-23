-- Allow a new completeness value: BOX_MANUAL_EXTRAS_NO_CART
-- (item has Box + Manual + Extras but the cartridge/disc is missing)
ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_completeness_check;

ALTER TABLE public.items
  ADD CONSTRAINT items_completeness_check
  CHECK (completeness IN (
    'CARTRIDGE_ONLY',
    'CIB',
    'BOX_ONLY',
    'MANUAL_ONLY',
    'BOX_AND_MANUAL_NO_EXTRAS',
    'BOX_MANUAL_EXTRAS_NO_CART',
    'OTHER'
  ));
