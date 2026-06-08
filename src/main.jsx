import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const money = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value || 0));
const dateLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
const minutesBetween = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 1440;
  return minutes;
};
const hours = (mins) => Math.round((mins / 60) * 100) / 100;
const weekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
};
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const isoFromDate = (date) => date.toISOString().slice(0, 10);

const starterData = {
  business: {
    name: 'Workforce Rota',
    locations: ['Main Site'],
    sections: ['Kitchen', 'FOH', 'Office', 'WFH', 'Housekeeping', 'KP'],
  },
  users: [
    { id: 'u_vikki', name: 'Vikki Fox', nickname: 'Vikki', email: '', age: '', wage: 0, jobArea: 'Office', pronouns: '', role: 'admin', holidayAllowanceDays: 28, active: true },
    { id: 'u_chip', name: 'Chip Butt', nickname: 'Chip', email: 'jameschipbutt@hotmail.com', age: '', wage: 0, jobArea: 'Office', pronouns: '', role: 'admin', holidayAllowanceDays: 28, active: true },
    { id: 'u_rhiannon', name: 'Rhiannon Green', nickname: 'Rhiannon', email: '', age: '', wage: 0, jobArea: 'Office', pronouns: '', role: 'admin', holidayAllowanceDays: 28, active: true },
    { id: 'u_sam', name: 'Sam Taylor', nickname: 'Sam', email: 'sam@example.com', age: 25, wage: 12.5, jobArea: 'FOH', pronouns: 'she/her', role: 'staff', holidayAllowanceDays: 20, active: true },
    { id: 'u_jordan', name: 'Jordan Lee', nickname: 'Jords', email: 'jordan@example.com', age: 28, wage: 13, jobArea: 'Kitchen', pronouns: 'he/him', role: 'staff', holidayAllowanceDays: 20, active: true },
  ],
  shifts: [
    { id: 's_1', userId: 'u_sam', section: 'FOH', location: 'Main Site', date: todayISO(), start: '09:00', end: '17:30', notes: 'Guest welcome and front desk cover.', status: 'published' },
    { id: 's_2', userId: 'u_jordan', section: 'Kitchen', location: 'Main Site', date: todayISO(), start: '10:15', end: '18:45', notes: 'Prep list must be checked before lunch.', status: 'published' },
  ],
  timeEntries: [],
  leaveRequests: [],
  availability: [],
  announcements: [
    { id: 'a_1', title: 'Welcome to RotaPro Workforce', body: 'This is the proper app foundation. Connect Firebase to make it live across staff devices.', createdAt: todayISO() },
  ],
  auditLog: [],
};

const STORAGE_KEY = 'rotapro-workforce-v1';
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return starterData;
  const parsed = JSON.parse(raw);
  return {
    ...starterData,
    ...parsed,
    business: { ...starterData.business, ...(parsed.business || {}) },
    users: parsed.users || starterData.users,
    shifts: parsed.shifts || starterData.shifts,
    timeEntries: parsed.timeEntries || [],
    leaveRequests: parsed.leaveRequests || [],
    availability: parsed.availability || [],
    announcements: parsed.announcements || starterData.announcements,
    auditLog: parsed.auditLog || [],
  };
}

function App() {
  const [data, setData] = useState(loadData);
  const [currentUserId, setCurrentUserId] = useState('u_chip');
  const [view, setView] = useState('dashboard');
  const [week, setWeek] = useState(weekStart());

  const currentUser = data.users.find((u) => u.id === currentUserId) || data.users[0];
  const isAdmin = currentUser?.role === 'admin';

  function commit(next, action = 'Updated app data') {
    const enriched = {
      ...next,
      auditLog: [
        ...(next.auditLog || []),
        { id: uid('audit'), at: new Date().toISOString(), by: currentUserId, action },
      ].slice(-200),
    };
    setData(enriched);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
  }

  const nav = [
    ['dashboard', 'Home'],
    ['rota', 'Rota'],
    ['clock', 'Clock In'],
    ['leave', 'Holiday'],
    ['availability', 'Availability'],
    ...(isAdmin ? [['people', 'People'], ['builder', 'Build Rota'], ['timesheets', 'Timesheets'], ['reports', 'Reports'], ['settings', 'Settings']] : []),
  ];

  return (
    <div className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">RotaPro Workforce</p>
          <h1>{data.business.name}</h1>
        </div>
        <div className="identityPanel">
          <label>
            Acting as
            <select value={currentUserId} onChange={(e) => setCurrentUserId(e.target.value)}>
              {data.users.map((u) => <option key={u.id} value={u.id}>{u.nickname} — {u.role}</option>)}
            </select>
          </label>
          <button onClick={() => requestNotificationPermission()}>Enable alerts</button>
        </div>
      </header>

      <nav className="navTabs">
        {nav.map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}</button>)}
      </nav>

      <main>
        {view === 'dashboard' && <Dashboard data={data} currentUser={currentUser} setView={setView} />}
        {view === 'rota' && <RotaView data={data} currentUser={currentUser} isAdmin={isAdmin} week={week} setWeek={setWeek} commit={commit} />}
        {view === 'clock' && <ClockView data={data} currentUser={currentUser} commit={commit} />}
        {view === 'leave' && <LeaveView data={data} currentUser={currentUser} isAdmin={isAdmin} commit={commit} />}
        {view === 'availability' && <AvailabilityView data={data} currentUser={currentUser} isAdmin={isAdmin} commit={commit} />}
        {view === 'people' && isAdmin && <PeopleView data={data} commit={commit} />}
        {view === 'builder' && isAdmin && <RotaBuilder data={data} commit={commit} />}
        {view === 'timesheets' && isAdmin && <Timesheets data={data} commit={commit} />}
        {view === 'reports' && isAdmin && <Reports data={data} />}
        {view === 'settings' && isAdmin && <Settings data={data} commit={commit} />}
      </main>
    </div>
  );
}

function Dashboard({ data, currentUser, setView }) {
  const myShifts = data.shifts.filter((s) => s.userId === currentUser.id).slice(0, 5);
  const myLeave = data.leaveRequests.filter((r) => r.userId === currentUser.id);
  const pendingLeave = myLeave.filter((r) => r.status === 'pending').length;
  return <div className="grid two">
    <section className="panel heroCard">
      <p className="eyebrow">Today</p>
      <h2>Hello, {currentUser.nickname}</h2>
      <p>Your next shifts, leave requests, clock actions, and messages sit here.</p>
      <div className="quickActions">
        <button onClick={() => setView('clock')}>Clock in / out</button>
        <button onClick={() => setView('leave')}>Request holiday</button>
        <button onClick={() => setView('availability')}>Update availability</button>
      </div>
    </section>
    <section className="panel">
      <h2>My next shifts</h2>
      <CardList items={myShifts} empty="No shifts assigned yet." render={(s) => <ShiftMini shift={s} user={currentUser} />} />
    </section>
    <section className="panel">
      <h2>Holiday balance</h2>
      <HolidayBalance data={data} user={currentUser} />
      <p className="muted">Pending requests: {pendingLeave}</p>
    </section>
    <section className="panel">
      <h2>Announcements</h2>
      <CardList items={data.announcements} empty="No announcements." render={(a) => <div><strong>{a.title}</strong><p>{a.body}</p></div>} />
    </section>
  </div>;
}

function RotaView({ data, currentUser, isAdmin, week, setWeek, commit }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const [mineOnly, setMineOnly] = useState(!isAdmin);
  return <section className="panel widePanel">
    <div className="sectionHeader">
      <div><h2>Weekly rota</h2><p className="muted">{dateLabel(isoFromDate(days[0]))} to {dateLabel(isoFromDate(days[6]))}</p></div>
      <div className="buttonRow">
        <button className="secondary" onClick={() => setWeek(addDays(week, -7))}>Previous</button>
        <button className="secondary" onClick={() => setWeek(weekStart())}>This week</button>
        <button className="secondary" onClick={() => setWeek(addDays(week, 7))}>Next</button>
      </div>
    </div>
    <label className="checkLine"><input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} /> Show my shifts only</label>
    <div className="rotaGrid">
      <div className="gridHead">Area</div>
      {days.map((d) => <div className="gridHead" key={d.toISOString()}>{dateLabel(isoFromDate(d))}</div>)}
      {data.business.sections.map((section) => <React.Fragment key={section}>
        <div className="sectionHead">{section}</div>
        {days.map((d) => {
          const iso = isoFromDate(d);
          const shifts = data.shifts.filter((s) => s.section === section && s.date === iso && (!mineOnly || s.userId === currentUser.id));
          return <div className="gridCell" key={`${section}-${iso}`}>{shifts.length ? shifts.map((shift) => {
            const user = data.users.find((u) => u.id === shift.userId);
            return <ShiftCard key={shift.id} shift={shift} user={user} isMine={shift.userId === currentUser.id} isAdmin={isAdmin} onDelete={() => commit({ ...data, shifts: data.shifts.filter((s) => s.id !== shift.id) }, 'Deleted shift')} />;
          }) : <span className="muted">No shifts</span>}</div>;
        })}
      </React.Fragment>)}
    </div>
  </section>;
}

function ShiftCard({ shift, user, isMine, isAdmin, onDelete }) {
  return <div className={`shiftCard ${isMine ? 'mine' : ''}`}>
    <strong>{user?.nickname || 'Unassigned'}</strong>
    <span>{shift.start}–{shift.end}</span>
    <small>{shift.section} · {hours(minutesBetween(shift.start, shift.end))} hrs</small>
    {shift.notes && <p>{shift.notes}</p>}
    {isAdmin && <button className="danger tiny" onClick={onDelete}>Remove</button>}
  </div>;
}
function ShiftMini({ shift, user }) { return <div className="miniCard"><strong>{dateLabel(shift.date)}</strong><span>{shift.start}–{shift.end}</span><small>{shift.section}</small>{shift.notes && <p>{shift.notes}</p>}</div>; }

function ClockView({ data, currentUser, commit }) {
  const todaysShifts = data.shifts.filter((s) => s.userId === currentUser.id && s.date === todayISO());
  const activeEntry = data.timeEntries.find((e) => e.userId === currentUser.id && !e.clockOutAt);
  function clockIn(shiftId) {
    if (activeEntry) return alert('You are already clocked in.');
    commit({ ...data, timeEntries: [...data.timeEntries, { id: uid('time'), userId: currentUser.id, shiftId, clockInAt: new Date().toISOString(), clockOutAt: null, breaks: [] }] }, 'Clocked in');
  }
  function clockOut(entryId) {
    commit({ ...data, timeEntries: data.timeEntries.map((e) => e.id === entryId ? { ...e, clockOutAt: new Date().toISOString() } : e) }, 'Clocked out');
  }
  function startBreak(entryId, paid) {
    commit({ ...data, timeEntries: data.timeEntries.map((e) => e.id === entryId ? { ...e, breaks: [...e.breaks, { id: uid('break'), startAt: new Date().toISOString(), endAt: null, paid }] } : e) }, paid ? 'Started paid break' : 'Started unpaid break');
  }
  function stopBreak(entryId) {
    commit({ ...data, timeEntries: data.timeEntries.map((e) => e.id === entryId ? { ...e, breaks: e.breaks.map((b) => !b.endAt ? { ...b, endAt: new Date().toISOString() } : b) } : e) }, 'Ended break');
  }
  return <div className="grid two">
    <section className="panel">
      <h2>Clock in</h2>
      <CardList items={todaysShifts} empty="No shift assigned today." render={(s) => <div className="workCard"><ShiftMini shift={s} user={currentUser} /><button disabled={!!activeEntry} onClick={() => clockIn(s.id)}>Clock in for this shift</button></div>} />
    </section>
    <section className="panel">
      <h2>Current time entry</h2>
      {activeEntry ? <div className="workCard"><p>Clocked in at {new Date(activeEntry.clockInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p><BreakSummary entry={activeEntry} /><div className="buttonRow"><button onClick={() => startBreak(activeEntry.id, false)}>Start unpaid break</button><button className="secondary" onClick={() => startBreak(activeEntry.id, true)}>Start paid break</button><button className="secondary" onClick={() => stopBreak(activeEntry.id)}>End break</button><button className="danger" onClick={() => clockOut(activeEntry.id)}>Clock out</button></div></div> : <p className="muted">You are not clocked in.</p>}
    </section>
  </div>;
}
function BreakSummary({ entry }) { return <p className="muted">Breaks: {entry.breaks.length} total, {entry.breaks.filter((b) => b.paid).length} paid, {entry.breaks.filter((b) => !b.paid).length} unpaid.</p>; }

function LeaveView({ data, currentUser, isAdmin, commit }) {
  const [form, setForm] = useState({ startDate: todayISO(), endDate: todayISO(), type: 'paid', days: 1, note: '' });
  const mine = data.leaveRequests.filter((r) => r.userId === currentUser.id);
  function submit(e) {
    e.preventDefault();
    commit({ ...data, leaveRequests: [...data.leaveRequests, { id: uid('leave'), userId: currentUser.id, ...form, days: Number(form.days), status: 'pending', submittedAt: new Date().toISOString(), reviewedBy: null, reviewedAt: null }] }, 'Submitted leave request');
    setForm({ startDate: todayISO(), endDate: todayISO(), type: 'paid', days: 1, note: '' });
  }
  function review(id, status) {
    commit({ ...data, leaveRequests: data.leaveRequests.map((r) => r.id === id ? { ...r, status, reviewedBy: currentUser.id, reviewedAt: new Date().toISOString() } : r) }, `${status} leave request`);
  }
  return <div className="grid two">
    <section className="panel">
      <h2>Request holiday / time off</h2>
      <HolidayBalance data={data} user={currentUser} />
      <form className="formGrid" onSubmit={submit}>
        <label>Start date<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
        <label>End date<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
        <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="paid">Paid holiday allowance</option><option value="unpaid">Unpaid time off</option></select></label>
        <label>Days<input type="number" min="0.5" step="0.5" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></label>
        <label className="full">Note<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        <button>Submit request</button>
      </form>
    </section>
    <section className="panel"><h2>My requests</h2><LeaveTable data={data} requests={mine} /></section>
    {isAdmin && <section className="panel fullWidth"><h2>Manager approvals</h2><LeaveTable data={data} requests={data.leaveRequests} onReview={review} /></section>}
  </div>;
}
function HolidayBalance({ data, user }) {
  const approvedPaid = data.leaveRequests.filter((r) => r.userId === user.id && r.type === 'paid' && r.status === 'approved').reduce((t, r) => t + Number(r.days || 0), 0);
  const allowance = Number(user.holidayAllowanceDays || 0);
  return <div className="balance"><strong>{allowance - approvedPaid} days remaining</strong><span>{approvedPaid} used of {allowance}</span></div>;
}
function LeaveTable({ data, requests, onReview }) {
  return <div className="tableWrap"><table><thead><tr><th>Staff</th><th>Dates</th><th>Type</th><th>Days</th><th>Status</th><th>Note</th>{onReview && <th>Action</th>}</tr></thead><tbody>{requests.map((r) => { const u = data.users.find((x) => x.id === r.userId); return <tr key={r.id}><td>{u?.nickname}</td><td>{r.startDate} to {r.endDate}</td><td>{r.type}</td><td>{r.days}</td><td><Status value={r.status} /></td><td>{r.note}</td>{onReview && <td><button className="tiny" onClick={() => onReview(r.id, 'approved')}>Approve</button><button className="tiny danger" onClick={() => onReview(r.id, 'rejected')}>Reject</button></td>}</tr>; })}</tbody></table></div>;
}
function Status({ value }) { return <span className={`status ${value}`}>{value}</span>; }

function AvailabilityView({ data, currentUser, isAdmin, commit }) {
  const [form, setForm] = useState({ date: todayISO(), from: '09:00', to: '17:00', status: 'available', note: '' });
  function submit(e) {
    e.preventDefault();
    commit({ ...data, availability: [...data.availability, { id: uid('avail'), userId: currentUser.id, ...form }] }, 'Updated availability');
  }
  const rows = isAdmin ? data.availability : data.availability.filter((a) => a.userId === currentUser.id);
  return <div className="grid two"><section className="panel"><h2>Availability</h2><form className="formGrid" onSubmit={submit}><label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>available</option><option>unavailable</option><option>preferred</option></select></label><label>From<input type="time" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></label><label>To<input type="time" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label><label className="full">Note<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label><button>Save availability</button></form></section><section className="panel"><h2>{isAdmin ? 'All availability' : 'My availability'}</h2><SimpleTable rows={rows.map((a) => ({ Staff: data.users.find((u) => u.id === a.userId)?.nickname, Date: a.date, Time: `${a.from}-${a.to}`, Status: a.status, Note: a.note }))} /></section></div>;
}

function PeopleView({ data, commit }) {
  const blank = { id: '', name: '', nickname: '', email: '', age: '', wage: 0, jobArea: data.business.sections[0], pronouns: '', role: 'staff', holidayAllowanceDays: 20, active: true };
  const [form, setForm] = useState(blank);
  function savePerson(e) {
    e.preventDefault();
    const person = { ...form, id: form.id || uid('u'), wage: Number(form.wage || 0), holidayAllowanceDays: Number(form.holidayAllowanceDays || 0) };
    const exists = data.users.some((u) => u.id === person.id);
    commit({ ...data, users: exists ? data.users.map((u) => u.id === person.id ? person : u) : [...data.users, person] }, exists ? 'Updated user profile' : 'Created user profile');
    setForm(blank);
  }
  return <div className="grid two"><section className="panel"><h2>People</h2><form className="formGrid" onSubmit={savePerson}>{['name','nickname','email','age','wage','holidayAllowanceDays','pronouns'].map((key) => <label key={key}>{labelFor(key)}<input value={form[key]} type={['age','wage','holidayAllowanceDays'].includes(key) ? 'number' : 'text'} step="0.5" onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}<label>Job area<select value={form.jobArea} onChange={(e) => setForm({ ...form, jobArea: e.target.value })}>{data.business.sections.map((s) => <option key={s}>{s}</option>)}</select></label><label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></select></label><button>Save person</button></form></section><section className="panel"><h2>Staff list</h2><div className="tableWrap"><table><thead><tr><th>Name</th><th>Nickname</th><th>Area</th><th>Wage</th><th>Holiday</th><th>Role</th><th></th></tr></thead><tbody>{data.users.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.nickname}</td><td>{u.jobArea}</td><td>{money(u.wage)}</td><td>{u.holidayAllowanceDays} days</td><td>{u.role}</td><td><button className="tiny" onClick={() => setForm(u)}>Edit</button></td></tr>)}</tbody></table></div></section></div>;
}
function labelFor(key) { return ({ holidayAllowanceDays: 'Holiday allowance, days', wage: 'Hourly wage (£)' }[key] || key.replace(/([A-Z])/g, ' $1')).replace(/^./, (c) => c.toUpperCase()); }

function RotaBuilder({ data, commit }) {
  const [form, setForm] = useState({ userId: data.users[0]?.id, section: data.business.sections[0], location: data.business.locations[0], date: todayISO(), start: '09:00', end: '17:00', notes: '', status: 'draft' });
  function saveShift(e) {
    e.preventDefault();
    commit({ ...data, shifts: [...data.shifts, { id: uid('s'), ...form }] }, form.status === 'published' ? 'Published shift' : 'Saved draft shift');
  }
  return <section className="panel"><h2>Build rota</h2><p className="muted">Create draft shifts, publish shifts, and attach notes visible to staff.</p><form className="formGrid" onSubmit={saveShift}><label>Staff<select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>{data.users.map((u) => <option key={u.id} value={u.id}>{u.nickname}</option>)}</select></label><label>Section<select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>{data.business.sections.map((s) => <option key={s}>{s}</option>)}</select></label><label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Start<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label><label>End<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="full">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><button>Save shift</button></form></section>;
}

function Timesheets({ data }) {
  const rows = data.timeEntries.map((entry) => {
    const user = data.users.find((u) => u.id === entry.userId);
    const shift = data.shifts.find((s) => s.id === entry.shiftId);
    const totalMinutes = entry.clockOutAt ? Math.round((new Date(entry.clockOutAt) - new Date(entry.clockInAt)) / 60000) : 0;
    const unpaidBreaks = entry.breaks.filter((b) => !b.paid && b.endAt).reduce((t, b) => t + Math.round((new Date(b.endAt) - new Date(b.startAt)) / 60000), 0);
    const payableHours = hours(Math.max(0, totalMinutes - unpaidBreaks));
    return { Staff: user?.nickname, Date: shift?.date || entry.clockInAt.slice(0, 10), Clocked: entry.clockOutAt ? 'Complete' : 'Open', Payable: payableHours, Pay: money(payableHours * Number(user?.wage || 0)) };
  });
  return <section className="panel"><h2>Timesheets</h2><SimpleTable rows={rows} /></section>;
}
function Reports({ data }) {
  const scheduledHours = data.shifts.reduce((t, s) => t + hours(minutesBetween(s.start, s.end)), 0);
  const approvedLeave = data.leaveRequests.filter((r) => r.status === 'approved').length;
  return <div className="grid three"><Metric title="Scheduled hours" value={scheduledHours} /><Metric title="Published shifts" value={data.shifts.filter((s) => s.status === 'published').length} /><Metric title="Approved leave" value={approvedLeave} /><section className="panel fullWidth"><h2>Reports roadmap</h2><ul><li>Labour cost by section</li><li>Payroll export</li><li>Late clock-in exceptions</li><li>Holiday liability</li><li>Staff availability coverage</li></ul></section></div>;
}
function Settings({ data, commit }) {
  const [section, setSection] = useState('');
  const [location, setLocation] = useState('');
  return <div className="grid two"><section className="panel"><h2>Sections</h2><form className="row" onSubmit={(e) => { e.preventDefault(); if (section) commit({ ...data, business: { ...data.business, sections: [...data.business.sections, section] } }, 'Added section'); setSection(''); }}><input value={section} onChange={(e) => setSection(e.target.value)} placeholder="New section" /><button>Add</button></form><div className="pillList">{data.business.sections.map((s) => <span className="pill" key={s}>{s}</span>)}</div></section><section className="panel"><h2>Locations</h2><form className="row" onSubmit={(e) => { e.preventDefault(); if (location) commit({ ...data, business: { ...data.business, locations: [...data.business.locations, location] } }, 'Added location'); setLocation(''); }}><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New location" /><button>Add</button></form><div className="pillList">{data.business.locations.map((s) => <span className="pill" key={s}>{s}</span>)}</div></section></div>;
}

function SimpleTable({ rows }) { if (!rows.length) return <p className="muted">No records yet.</p>; const keys = Object.keys(rows[0]); return <div className="tableWrap"><table><thead><tr>{keys.map((k) => <th key={k}>{k}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{keys.map((k) => <td key={k}>{r[k]}</td>)}</tr>)}</tbody></table></div>; }
function CardList({ items, empty, render }) { return items.length ? <div className="cardList">{items.map((item) => <div key={item.id} className="miniCard">{render(item)}</div>)}</div> : <p className="muted">{empty}</p>; }
function Metric({ title, value }) { return <section className="panel metric"><span>{title}</span><strong>{value}</strong></section>; }
function requestNotificationPermission() { if (!('Notification' in window)) return alert('This browser does not support notifications.'); Notification.requestPermission().then((permission) => alert(permission === 'granted' ? 'Notifications enabled for this browser.' : 'Notifications not enabled.')); }

createRoot(document.getElementById('root')).render(<App />);
