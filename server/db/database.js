const knex  = require('knex');
const path  = require('path');
const fs    = require('fs');

// ── Choose DB based on environment ────────────────────────────────────────────
// Production (Railway/Render): uses DATABASE_URL (PostgreSQL)
// Development (local):         uses SQLite app.db
const isProd = !!process.env.DATABASE_URL;

let db;

if (isProd) {
  // PostgreSQL — Railway / Render / Supabase
  db = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 0, max: 10 },
  });
  // Suppress pg SSL deprecation warning
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('🐘 Using PostgreSQL (production)');
} else {
  // SQLite — local development
  const dbDir = path.join(__dirname);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  db = knex({
    client: 'sqlite3',
    connection: { filename: path.join(__dirname, 'app.db') },
    useNullAsDefault: true,
    pool: {
      min: 1, max: 1,
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', (e) => {
          if (e) return cb(e);
          conn.run('PRAGMA journal_mode = WAL', cb);
        });
      },
    },
  });
  console.log('🗄️  Using SQLite (development)');
}

// ── Helper: get inserted id cross-DB ─────────────────────────────────────────
// SQLite knex returns [rowid], PostgreSQL returns [{id}] when using .returning('id')
// Use this helper after every insert to get the new row id safely.
db.getInsertId = async function(table, data) {
  if (isProd) {
    const [row] = await db(table).insert(data).returning('id');
    return row.id ?? row; // knex pg returns {id: N}
  } else {
    const [id] = await db(table).insert(data);
    return id;
  }
};

// ── Create tables if they don't exist ─────────────────────────────────────────
async function initDB() {
  // users
  if (!await db.schema.hasTable('users')) {
    await db.schema.createTable('users', t => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.string('email', 150).notNullable().unique();
      t.string('password', 255).notNullable();
      t.decimal('monthly_salary', 12, 2).defaultTo(0);
      t.integer('salary_date').defaultTo(1);
      t.string('language', 5).defaultTo('en');
      t.integer('savings_pct').defaultTo(20);
      t.boolean('setup_done').defaultTo(false);
      t.string('company', 150).nullable();
      t.string('city', 100).nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // categories
  if (!await db.schema.hasTable('categories')) {
    await db.schema.createTable('categories', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name_en', 100).notNullable();
      t.string('name_kn', 100).notNullable();
      t.enu('type', ['need', 'want', 'saving', 'income']).notNullable();
      t.string('icon', 50).notNullable().defaultTo('circle');
      t.string('color', 20).notNullable().defaultTo('#FF9933');
      t.decimal('monthly_budget', 12, 2).defaultTo(0);
      t.boolean('is_default').defaultTo(false);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // expenses
  if (!await db.schema.hasTable('expenses')) {
    await db.schema.createTable('expenses', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.integer('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
      t.decimal('amount', 12, 2).notNullable();
      t.string('date', 10).notNullable();
      t.string('month', 7).notNullable();
      t.string('payment_method', 20).defaultTo('upi');
      t.text('notes').nullable();
      t.boolean('is_split').defaultTo(false);
      t.boolean('recurring').defaultTo(false);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // income
  if (!await db.schema.hasTable('income')) {
    await db.schema.createTable('income', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.decimal('amount', 12, 2).notNullable();
      t.string('source', 100).notNullable().defaultTo('Salary');
      t.string('date', 10).notNullable();
      t.string('month', 7).notNullable();
      t.text('notes').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // emis
  if (!await db.schema.hasTable('emis')) {
    await db.schema.createTable('emis', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name', 100).notNullable();
      t.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('monthly_emi', 12, 2).notNullable();
      t.integer('total_months').notNullable();
      t.integer('paid_months').defaultTo(0);
      t.integer('due_date').notNullable().defaultTo(5);
      t.string('bank', 100).nullable();
      t.string('color', 20).defaultTo('#6366f1');
      t.boolean('is_active').defaultTo(true);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // bill_splits
  if (!await db.schema.hasTable('bill_splits')) {
    await db.schema.createTable('bill_splits', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('title', 150).notNullable();
      t.decimal('total_amount', 12, 2).notNullable();
      t.decimal('your_share', 12, 2).notNullable();
      t.string('split_with', 500).notNullable().defaultTo('[]');
      t.string('status', 20).defaultTo('pending');
      t.string('date', 10).notNullable();
      t.text('notes').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // savings_goals
  if (!await db.schema.hasTable('savings_goals')) {
    await db.schema.createTable('savings_goals', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name', 100).notNullable();
      t.string('type', 20).defaultTo('other');
      t.decimal('target_amount', 12, 2).notNullable();
      t.decimal('saved_amount', 12, 2).defaultTo(0);
      t.string('deadline', 10).nullable();
      t.string('color', 20).defaultTo('#10b981');
      t.string('icon', 50).defaultTo('piggy-bank');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // festival_savings
  if (!await db.schema.hasTable('festival_savings')) {
    await db.schema.createTable('festival_savings', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('festival_name', 100).notNullable();
      t.string('festival_name_kn', 100).nullable();
      t.decimal('target_amount', 12, 2).notNullable();
      t.decimal('saved_amount', 12, 2).defaultTo(0);
      t.string('festival_date', 10).notNullable();
      t.string('color', 20).defaultTo('#FF9933');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Indexes — works for both SQLite and PostgreSQL
  try {
    if (isProd) {
      await db.raw('CREATE INDEX IF NOT EXISTS idx_exp_user_month ON expenses(user_id, month)');
      await db.raw('CREATE INDEX IF NOT EXISTS idx_inc_user_month ON income(user_id, month)');
      await db.raw('CREATE INDEX IF NOT EXISTS idx_cat_user       ON categories(user_id, type)');
    } else {
      await db.raw('CREATE INDEX IF NOT EXISTS idx_exp_user_month ON expenses(user_id, month)');
      await db.raw('CREATE INDEX IF NOT EXISTS idx_inc_user_month ON income(user_id, month)');
      await db.raw('CREATE INDEX IF NOT EXISTS idx_cat_user       ON categories(user_id, type)');
    }
  } catch (e) {
    // Indexes may already exist — safe to ignore
  }

  console.log('✅ Database ready');
}

initDB().catch(e => {
  console.error('❌ DB init error:', e.message);
  process.exit(1);
});

module.exports = db;
