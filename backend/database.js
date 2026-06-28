const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const db = new Database('./projects.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    color TEXT DEFAULT '#6366f1',
    priority TEXT DEFAULT 'medium',
    budget_total REAL DEFAULT 0,
    budget_spent REAL DEFAULT 0,
    start_date TEXT,
    deadline TEXT,
    final_deadline TEXT,
    resource_allocation TEXT,
    estimated_days INTEGER DEFAULT 0,
    delayed_days INTEGER DEFAULT 0,
    team_size INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    assignee TEXT,
    start_date TEXT,
    due_date TEXT,
    estimated_hours INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'developer',
    avatar_color TEXT DEFAULT '#6366f1'
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT,
    member_id TEXT,
    PRIMARY KEY (project_id, member_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );
  
`);

// Add new columns if upgrading existing DB
const cols = db.prepare("PRAGMA table_info(projects)").all().map(c => c.name);
if (!cols.includes('priority'))       db.exec("ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'medium'");
if (!cols.includes('budget_total'))   db.exec("ALTER TABLE projects ADD COLUMN budget_total REAL DEFAULT 0");
if (!cols.includes('budget_spent'))   db.exec("ALTER TABLE projects ADD COLUMN budget_spent REAL DEFAULT 0");
if (!cols.includes('start_date'))     db.exec("ALTER TABLE projects ADD COLUMN start_date TEXT");
if (!cols.includes('deadline'))       db.exec("ALTER TABLE projects ADD COLUMN deadline TEXT");
if (!cols.includes('final_deadline')) db.exec("ALTER TABLE projects ADD COLUMN final_deadline TEXT");

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    actor_name TEXT,
    project_id TEXT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Integrated daily_logs table right after activity_log
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    project_id TEXT,
    date TEXT NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    hours_spent REAL DEFAULT 0,
    budget_used REAL DEFAULT 0,
    breaks_taken INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
  );
`);

if (!cols.includes('resource_allocation')) db.exec("ALTER TABLE projects ADD COLUMN resource_allocation TEXT");
if (!cols.includes('estimated_days')) db.exec("ALTER TABLE projects ADD COLUMN estimated_days INTEGER DEFAULT 0");
if (!cols.includes('delayed_days'))   db.exec("ALTER TABLE projects ADD COLUMN delayed_days INTEGER DEFAULT 0");
if (!cols.includes('team_size'))      db.exec("ALTER TABLE projects ADD COLUMN team_size INTEGER DEFAULT 1");

const taskCols = db.prepare("PRAGMA table_info(tasks)").all().map(c => c.name);
if (!taskCols.includes('start_date')) db.exec("ALTER TABLE tasks ADD COLUMN start_date TEXT");
if (!taskCols.includes('estimated_hours')) db.exec("ALTER TABLE tasks ADD COLUMN estimated_hours REAL DEFAULT 0");

const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get();
if (projectCount.c === 0) {
  const pid1 = uuidv4(), pid2 = uuidv4(), pid3 = uuidv4();
  const mid1 = uuidv4(), mid2 = uuidv4(), mid3 = uuidv4(), mid4 = uuidv4();

  db.prepare(`
    INSERT INTO projects
      (id, name, description, status, color, priority, budget_total, budget_spent, start_date, deadline, final_deadline, resource_allocation, estimated_days, delayed_days, team_size, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
  `)
    .run(pid1,'LexAI Legal Assistant','India-focused plain-language legal assistant','active','#6366f1','high',50000,18000,'2025-05-01','2025-08-01',null,'',0,0,3);
  db.prepare(`
    INSERT INTO projects
      (id, name, description, status, color, priority, budget_total, budget_spent, start_date, deadline, final_deadline, resource_allocation, estimated_days, delayed_days, team_size, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
  `)
    .run(pid2,'Smart Wellbeing App','Gamified focus and digital wellness tracker','active','#10b981','medium',30000,12000,'2025-04-15','2025-07-15',null,'',0,0,2);
  db.prepare(`
    INSERT INTO projects
      (id, name, description, status, color, priority, budget_total, budget_spent, start_date, deadline, final_deadline, resource_allocation, estimated_days, delayed_days, team_size, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
  `)
    .run(pid3,'Agriculture Rover','Autonomous ESP32-based agriculture rover','completed','#f59e0b','low',20000,19500,'2025-02-01','2025-05-30',null,'',0,0,4);

  db.prepare(`INSERT INTO members VALUES (?,?,?,?,?)`).run(mid1,'Yogesh Tiwari','yogesh@iite.in','Lead Dev','#6366f1');
  db.prepare(`INSERT INTO members VALUES (?,?,?,?,?)`).run(mid2,'Nikhil Solanki','nikhil@iite.in','Developer','#10b981');
  db.prepare(`INSERT INTO members VALUES (?,?,?,?,?)`).run(mid3,'Abhimanyu Rajawat','abhi@iite.in','Hardware','#f59e0b');
  db.prepare(`INSERT INTO members VALUES (?,?,?,?,?)`).run(mid4,'Shiven Choksi','shiven@iite.in','Designer','#ec4899');

  db.prepare(`INSERT INTO project_members VALUES (?,?)`).run(pid1, mid1);
  db.prepare(`INSERT INTO project_members VALUES (?,?)`).run(pid1, mid2);
  db.prepare(`INSERT INTO project_members VALUES (?,?)`).run(pid1, mid4);
  db.prepare(`INSERT INTO project_members VALUES (?,?)`).run(pid2, mid1);
  db.prepare(`INSERT INTO project_members VALUES (?,?)`).run(pid2, mid2);
  db.prepare(`INSERT INTO project_members VALUES (?,?)`).run(pid3, mid2);
  db.prepare(`INSERT INTO project_members VALUES (?,?)`).run(pid3, mid3);

  const tasks = [
    [uuidv4(),pid1,'Setup Express API','Backend routes','done','high','Yogesh Tiwari',null,'2025-06-10',8],
    [uuidv4(),pid1,'Build Chat UI','Legal chatbot interface','in-progress','high','Nikhil Solanki',null,'2025-06-25',16],
    [uuidv4(),pid1,'Integrate Groq API','Connect AI model','todo','medium','Yogesh Tiwari',null,'2025-07-01',12],
    [uuidv4(),pid2,'Design Figma Mockup','App screens in Figma','done','medium','Yogesh Tiwari',null,'2025-06-05',10],
    [uuidv4(),pid2,'React Native Setup','Initialize RN project','in-progress','high','Nikhil Solanki',null,'2025-06-20',20],
    [uuidv4(),pid3,'ESP32 Motor Control','L298N integration','done','high','Abhimanyu Rajawat',null,'2025-05-15',24],
    [uuidv4(),pid3,'Phase 2 PPT','Presentation slides','done','low','Yogesh Tiwari',null,'2025-05-20',4],
  ];
  const ins = db.prepare(`INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))`);
  tasks.forEach(t => ins.run(...t));
}

module.exports = db;