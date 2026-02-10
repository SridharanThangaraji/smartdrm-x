document.addEventListener("DOMContentLoaded", () => {
    // Check if already logged in (only on auth pages)
    const isAuthPage = window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html");
    if (localStorage.getItem("token") && isAuthPage) {
        window.location.href = "dashboard.html";
        return;
    }

    // Login Logic
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector("button");
            const originalText = btn.innerText;
            btn.innerText = "Authenticating...";
            btn.disabled = true;

            const u = document.getElementById("username").value;
            const p = document.getElementById("password").value;

            try {
                const data = await API.login(u, p);
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify({
                    username: data.username,
                    role: data.role,
                    id: data.token.split(":")[0]
                }));
                window.location.href = "dashboard.html";
            } catch (err) {
                alert("Login Failed: " + err.message);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Register Logic
    const regForm = document.getElementById("register-form");
    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector("button");
            const originalText = btn.innerText;
            btn.innerText = "Creating...";
            btn.disabled = true;

            const u = document.getElementById("reg-username").value;
            const p = document.getElementById("reg-password").value;
            const r = document.getElementById("reg-role").value;

            try {
                await API.register(u, p, r);
                alert("Registration successful! Please login.");
                window.location.href = "login.html";
            } catch (err) {
                alert("Registration Failed: " + err.message);
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
});
