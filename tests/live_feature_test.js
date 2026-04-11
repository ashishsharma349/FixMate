/**
 * FixMate — Live Feature Verification (correct endpoints)
 * Run: node tests/live_feature_test.js  (backend on port 3000)
 */
const BASE = "http://localhost:3000";
const results = [];
const cookies = { admin: "", user: "", staff: "" };

async function api(method, path, body, role) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (role && cookies[role]) headers["Cookie"] = cookies[role];
  const opts = { method, headers, redirect: "manual" };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const sc = res.headers.getSetCookie?.() || [];
  if (sc.length > 0 && role) cookies[role] = sc.map(c => c.split(";")[0]).join("; ");
  let data;
  try { data = await res.json(); } catch { try { data = await res.text(); } catch { data = ""; } }
  return { status: res.status, data };
}

function log(mod, test, pass, detail = "") {
  results.push({ mod, test, pass, detail });
  console.log(`  ${pass ? "✅" : "❌"} [${mod}] ${test}${detail ? " — " + detail : ""}`);
}

(async () => {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   FixMate — Full Feature Verification Test   ║");
  console.log("╚══════════════════════════════════════════════╝");

  // ── AUTH ──
  console.log("\n── 1. AUTH MODULE ──");
  let r;
  r = await api("POST", "/login", { email: "admin@gmail.com", password: "admin@123" }, "admin");
  log("Auth", "Admin Login", r.status === 200 && r.data?.success);
  r = await api("POST", "/login", { email: "ashishsharma90807@gmail.com", password: "Temp@1234" }, "user");
  log("Auth", "User Login", r.status === 200 && r.data?.success);
  r = await api("POST", "/login", { email: "sharmaji9080890@gmail.com", password: "Temp@1234" }, "staff");
  log("Auth", "Staff Login", r.status === 200 && r.data?.success);
  r = await api("GET", "/check-login", null, "admin");
  log("Auth", "Session check (admin)", r.data?.isLoggedIn && r.data?.role === "admin");
  r = await api("GET", "/check-login", null, "user");
  log("Auth", "Session check (user)", r.data?.isLoggedIn && r.data?.role === "user");
  r = await api("GET", "/check-login", null, "staff");
  log("Auth", "Session check (staff)", r.data?.isLoggedIn && r.data?.role === "staff");
  r = await api("POST", "/login", { email: "admin@gmail.com", password: "wrong" });
  log("Auth", "Reject wrong password", r.status === 401);
  r = await api("POST", "/login", { email: "nobody@x.com", password: "x" });
  log("Auth", "Reject unknown email", r.status === 401);

  // ── ADMIN DASHBOARD ──
  console.log("\n── 2. ADMIN DASHBOARD ──");
  r = await api("GET", "/admin/dashboard-stats", null, "admin");
  log("Admin", "Dashboard stats", r.status === 200 && r.data?.totalComplaints !== undefined,
    `complaints=${r.data?.totalComplaints}, residents=${r.data?.totalResidents}, staff=${r.data?.totalStaff}`);
  r = await api("GET", "/admin/monthly-stats", null, "admin");
  log("Admin", "Monthly stats", r.status === 200);

  // ── ADMIN: USER MANAGEMENT ──
  console.log("\n── 3. USER MANAGEMENT ──");
  r = await api("GET", "/admin/users", null, "admin");
  log("Admin", "Get all users", r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);
  r = await api("GET", "/admin/staff", null, "admin");
  log("Admin", "Get all staff", r.status === 200 && Array.isArray(r.data), `count=${r.data?.length}`);

  // ── ADMIN: COMPLAINTS MANAGEMENT ──
  console.log("\n── 4. COMPLAINTS ──");
  r = await api("GET", "/admin/complaints", null, "admin");
  const complaints = r.data?.complains || r.data || [];
  log("Admin", "All complaints (admin)", r.status === 200, `count=${Array.isArray(complaints) ? complaints.length : "?"}`);
  r = await api("GET", "/users/All-Complains", null, "user");
  log("User", "Own complaints", r.status === 200);
  r = await api("GET", "/admin/staff-availability", null, "admin");
  log("Admin", "Staff availability", r.status === 200);

  // Block non-admin
  r = await api("GET", "/admin/complaints", null, "user");
  log("Auth", "Block user from admin routes", r.status === 403);

  // ── INVENTORY ──
  console.log("\n── 5. INVENTORY ──");
  r = await api("GET", "/inventory/", null, "admin");
  log("Inventory", "Get all items", r.status === 200, `count=${Array.isArray(r.data) ? r.data.length : "?"}`);
  r = await api("GET", "/inventory/low-stock", null, "admin");
  log("Inventory", "Low stock alerts", r.status === 200);
  r = await api("GET", "/inventory/", null, "user");
  log("Inventory", "Block user access", r.status === 403);

  // ── PAYMENTS ──
  console.log("\n── 6. PAYMENTS ──");
  r = await api("GET", "/payments/list", null, "admin");
  log("Payments", "Admin payment list", r.status === 200);
  r = await api("GET", "/payments/my-payments", null, "user");
  log("Payments", "User own payments", r.status === 200);
  r = await api("GET", "/payments/monthly-revenue", null, "admin");
  log("Payments", "Monthly revenue chart", r.status === 200);
  r = await api("GET", "/payments/list", null, "user");
  log("Payments", "Block user from admin payments", r.status === 403);

  // ── ADMIN: REPORTS & FINANCE ──
  console.log("\n── 7. REPORTS & FINANCE ──");
  r = await api("GET", "/admin/reports-data", null, "admin");
  log("Reports", "Reports data", r.status === 200);
  r = await api("GET", "/admin/finances-data", null, "admin");
  log("Finance", "Finance data", r.status === 200);

  // ── PROFILE ──
  console.log("\n── 8. PROFILE ──");
  r = await api("GET", "/profile", null, "admin");
  log("Profile", "Admin profile", r.status === 200 && !!r.data?.name, `name=${r.data?.name}`);
  r = await api("GET", "/profile", null, "user");
  log("Profile", "User profile", r.status === 200 && !!r.data?.name, `name=${r.data?.name}`);
  r = await api("GET", "/profile", null, "staff");
  log("Profile", "Staff profile", r.status === 200 && !!r.data?.name, `name=${r.data?.name}`);

  // ── STAFF TASKS ──
  console.log("\n── 9. STAFF MODULE ──");
  r = await api("GET", "/users/Task", null, "staff");
  log("Staff", "Assigned tasks", r.status === 200);
  r = await api("GET", "/users/All-Staff", null, "admin");
  log("Staff", "Staff directory", r.status === 200 && Array.isArray(r.data));

  // ── MODELS ──
  console.log("\n── 10. MODEL SCHEMAS ──");
  [["Auth","email password role"],["User","name authId"],["Complain","title status"],["Payment","amount"],
   ["Inventory","name"],["staff","name department"],["finance",""],["Announcement",""]].forEach(([m,fields]) => {
    try {
      const M = require(`../model/${m}`);
      const ok = fields ? fields.split(" ").every(f => !!M.schema.paths[f]) : !!M.schema;
      log("Models", m, ok);
    } catch(e) { log("Models", m, false, e.message); }
  });

  // ── CONTROLLERS ──
  console.log("\n── 11. CONTROLLERS ──");
  [["auth",["handlePost_login","handlePost_createUser","handlePost_changePassword"]],
   ["admin",["getDashboardStats","getAllUsers","getAllComplaints","getReportsData","getFinancesData","assignComplaint","resolveComplaint"]],
   ["user",["handlePost_fileUpload","ShowComplains","handleComplainAssign","fetch_task","submitEstimate","completeTask"]],
   ["payment",["getUserPayments"]],
   ["inventory",["getAll","addItem","updateItem","deleteItem","restock","getLowStock"]],
   ["profile",["getProfile"]],
   ["staff",["getAssignedTasks"]]].forEach(([c,fns]) => {
    try {
      const mod = require(`../controller/${c}`);
      const ok = fns.every(f => typeof mod[f] === "function");
      const missing = fns.filter(f => typeof mod[f] !== "function");
      log("Ctrl", c, ok, missing.length ? `missing: ${missing.join(",")}` : "");
    } catch(e) { log("Ctrl", c, false, e.message); }
  });

  // ── ROUTES ──
  console.log("\n── 12. ROUTES ──");
  ["authRouter","adminRoutes","userRoutes","paymentRoutes","inventoryRoutes","profileRouter"].forEach(r => {
    try { log("Routes", r, typeof require(`../routes/${r}`) === "function"); }
    catch(e) { log("Routes", r, false, e.message); }
  });

  // ── SUMMARY ──
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log("\n══════════════════════════════════════════════");
  console.log(`  TOTAL: ${results.length} | ✅ PASSED: ${passed} | ❌ FAILED: ${failed}`);
  console.log("══════════════════════════════════════════════");
  if (failed > 0) {
    console.log("\n❌ FAILURES:");
    results.filter(r => !r.pass).forEach(r => console.log(`  [${r.mod}] ${r.test} — ${r.detail}`));
  } else {
    console.log("\n🎉 ALL FEATURES VERIFIED — EVERYTHING WORKS!");
  }
  process.exit(failed > 0 ? 1 : 0);
})();
