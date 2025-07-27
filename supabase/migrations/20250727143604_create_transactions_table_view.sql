create view transactions_view as
select 
  id,
  symbol,
  cost,
  closing_price,
  share,
  side,
  currency,
  exchange_rate,
  date,
  fee,
  tax,
  note,
  created_at
from transactions;