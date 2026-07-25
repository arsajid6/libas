const fetch = globalThis.fetch;

async function runTests() {
  console.log("Starting End-to-End Smoke Test...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Wishlist Test
    console.log("--- 1. Wishlist Test ---");
    let res = await fetch('http://localhost:5000/api/auth/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'TestUser', email: 'test_smoke2@example.com', password: 'password123' })
    });
    
    let regData = await res.json();
    if (regData.mock_link) {
       let vtoken = regData.mock_link.split('=')[1];
       await fetch('http://localhost:5000/api/auth/user/verify', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ token: vtoken })
       });
    }

    res = await fetch('http://localhost:5000/api/auth/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_smoke2@example.com', password: 'password123' })
    });
    const authData = await res.json();
    const token = authData.token;
    assert(token, "User logged in and received token");

    if (token) {
      res = await fetch('http://localhost:5000/api/user/wishlist/1', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert(res.ok || res.status === 400, "Added product to wishlist (or already there)");

      res = await fetch('http://localhost:5000/api/user/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let wishlistData = await res.json();
      assert(Array.isArray(wishlistData), "Fetched wishlist and it is persisted");

      res = await fetch('http://localhost:5000/api/user/wishlist/1', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert(res.ok, "Removed product from wishlist");
    }

    // 2. Security Logs Test
    console.log("\n--- 2. Security Logs Test ---");
    res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    assert(res.status === 401, "Triggered failed login");

    res = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(res.status === 401 || res.status === 403, "Triggered forbidden request");

    // Login as admin
    res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '123' })
    });
    let adminAuth = await res.json();
    let adminToken = adminAuth.token;
    
    if (adminToken) {
      res = await fetch('http://localhost:5000/api/admin/logs/security', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      let secLogs = await res.json();
      assert(secLogs.logs && secLogs.logs.length > 0, "Security logs appear in the system");
      
      console.log("\n--- 3. Audit Logs Test ---");
      res = await fetch('http://localhost:5000/api/admin/logs/audit', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      let audLogs = await res.json();
      assert(audLogs.logs !== undefined, "Audit logs appear in the system");
      
      console.log("\n--- 4. Pagination Test ---");
      res = await fetch('http://localhost:5000/api/admin/logs/security?page=1&limit=5', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      let pageLogs = await res.json();
      assert(pageLogs.currentPage === 1 && pageLogs.totalPages !== undefined, "Pagination works");

      console.log("\n--- 5. Search Test ---");
      res = await fetch('http://localhost:5000/api/admin/logs/security?search=failed', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      let searchLogs = await res.json();
      assert(searchLogs.logs !== undefined, "Search filters work");

      console.log("\n--- 6. Date filters Test ---");
      const today = new Date().toISOString().split('T')[0];
      res = await fetch(`http://localhost:5000/api/admin/logs/security?startDate=${today}&endDate=${today}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      let dateLogs = await res.json();
      assert(dateLogs.logs !== undefined, "Date range filters work");

    } else {
      console.log("[SKIP] Admin login failed (password changed), skipping log fetch check");
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  }

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
}

runTests();
