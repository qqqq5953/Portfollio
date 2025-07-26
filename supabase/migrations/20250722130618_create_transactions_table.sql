create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  cost numeric not null,
  price numeric not null,
  share numeric not null,
  side text not null check (side in ('buy', 'sell')),
  currency text not null check (currency in ('USD', 'TWD')),
  currency_pair text not null check (currency_pair ~ '^[A-Z]{3}/[A-Z]{3}$'),
  exchange_rate numeric not null,
  date date not null,
  fee numeric,
  tax numeric,
  note text,
  created_at timestamp with time zone default now()
);

alter table transactions enable row level security;

-- Policy: user can insert their own transactions
create policy "Users can insert their transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

-- Policy: user can select their own transactions
create policy "Users can view their transactions"
  on transactions for select
  using (auth.uid() = user_id);

-- Policy: user can update their own transactions
create policy "Users can update their transactions"
  on transactions for update
  using (auth.uid() = user_id);

-- Policy: user can delete their own transactions
create policy "Users can delete their transactions"
  on transactions for delete
  using (auth.uid() = user_id);