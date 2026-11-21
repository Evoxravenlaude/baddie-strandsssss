# Rebuilds the product rows in supabase/2-sample-products.sql from seed.js,
# so the demo shop and a fresh live shop start with the same pieces.
import json, re
ROOT = '/home/claude/bs5'
s = open(f'{ROOT}/shop/assets/js/seed.js').read()
pre = 'window.BS_SEED = '
data = json.loads(s[s.index(pre) + len(pre):].rstrip().rstrip(';'))
q = lambda v: "'" + str(v).replace("'", "''") + "'"
j = lambda v: q(json.dumps(v, ensure_ascii=False)) + '::jsonb'
arr = lambda v: 'array[' + ', '.join(q(x) for x in v) + ']::text[]'
rows = []
for p in data['products']:
    rows.append('  (' + ', '.join([q(p['slug']), q(p['name']), q(p['category']), q(p['texture']), q(p['description']), arr(p.get('details') or []),
        str(p['price']), 'null' if p.get('compare_at') is None else str(p['compare_at']), j(p.get('lengths') or []), j(p.get('shades') or []),
        arr(p.get('images') or []), str(p.get('stock') if p.get('stock') is not None else 'null'), str(bool(p.get('featured'))).lower(), str(bool(p.get('is_new'))).lower(), str(p.get('sort') or 0)]) + ')')
sql = open(f'{ROOT}/supabase/2-sample-products.sql').read()
a = sql.index('insert into public.products')
b = sql.index('on conflict (slug) do nothing;')
sql = sql[:a] + 'insert into public.products (slug, name, category, texture, description, details, price, compare_at, lengths, shades, images, stock, featured, is_new, sort) values\n' + ',\n'.join(rows) + '\n' + sql[b:]
open(f'{ROOT}/supabase/2-sample-products.sql', 'w').write(sql)
print('rows', len(rows))
