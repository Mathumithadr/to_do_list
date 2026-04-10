const API = "http://localhost:5000";

// ---------------------------
// USER AUTH (LOGIN / SIGNUP)
// ---------------------------

// Switch to signup form
const showSignup = document.getElementById("show-signup");
if (showSignup) {
    showSignup.addEventListener("click", () => {
        document.getElementById("signup-form").style.display = "block";
        document.getElementById("signup-title").style.display = "block";
    });
}

// SIGNUP — calls POST /signup
const signupForm = document.getElementById("signup-form");
if (signupForm) {
    signupForm.addEventListener("submit", async(e) => {
        e.preventDefault();

        const username = document.getElementById("signup-username").value;
        const password = document.getElementById("signup-password").value;

        try {
            const res = await fetch(`${API}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("Signup successful! Please login.");
                signupForm.reset();
            } else {
                document.getElementById("signup-error").innerText =
                    data.message || "Signup failed.";
            }
        } catch (err) {
            document.getElementById("signup-error").innerText =
                "Could not connect to server.";
        }
    });
}

// LOGIN — calls POST /login, stores JWT token
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async(e) => {
        e.preventDefault();

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        try {
            const res = await fetch(`${API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("loggedInUser", username);
                window.location.href = "mywebbook.html";
            } else {
                document.getElementById("login-error").innerText =
                    data.message || "Invalid credentials!";
            }
        } catch (err) {
            document.getElementById("login-error").innerText =
                "Could not connect to server.";
        }
    });
}


// ---------------------------
// MAIN PAGE LOGIC
// ---------------------------

const usernameDisplay = document.getElementById("username");
if (usernameDisplay) {
    const user = localStorage.getItem("loggedInUser");
    const token = localStorage.getItem("token");

    if (!user || !token) {
        window.location.href = "login.html";
    } else {
        usernameDisplay.innerText = user;
        loadBooks(); // fetch books from DB on page load
    }
}

// LOGOUT
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });
}


// ---------------------------
// BOOK MANAGEMENT
// ---------------------------

const addPopupBtn = document.getElementById("add_popup");
const popup = document.querySelector(".popup-container");
const overlay = document.querySelector(".opaque");

if (addPopupBtn) {
    addPopupBtn.addEventListener("click", () => {
        popup.style.display = "block";
        overlay.style.display = "block";
    });
}

// CANCEL BUTTON
const cancelBtn = document.getElementById("cancel");
if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        popup.style.display = "none";
        overlay.style.display = "none";
    });
}

// CLEAR BUTTON
const clearBtn = document.getElementById("clear");
if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("book-title-input").value = "";
        document.getElementById("book-author-input").value = "";
        document.getElementById("book-detail-input").value = "";
    });
}

// LOAD BOOKS from DB — calls GET /books
async function loadBooks() {
    const token = localStorage.getItem("token");
    const container = document.querySelector(".container");

    // Clear hardcoded sample book
    container.innerHTML = "";

    try {
        const res = await fetch(`${API}/books`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
            window.location.href = "login.html";
            return;
        }

        const books = await res.json();
        books.forEach((book) => renderBook(book, container));
    } catch (err) {
        console.error("Failed to load books:", err);
    }
}

// RENDER a single book card into container
function renderBook(book, container) {
    const div = document.createElement("div");
    div.classList.add("book-container");
    div.dataset.id = book.id;

    div.innerHTML = `
        <h2 class="book_name">${book.title}</h2>
        <p class="book_author"><b>${book.author}</b></p>
        <p class="book_detail">${book.detail}</p>
        <button class="book_remove">delete</button>
    `;

    div.querySelector(".book_remove").addEventListener("click", () => {
        deleteBook(book.id, div);
    });

    container.appendChild(div);
}

// ADD BOOK — calls POST /books
const addBtn = document.getElementById("add");
if (addBtn) {
    addBtn.addEventListener("click", async(e) => {
        e.preventDefault();

        const title = document.getElementById("book-title-input").value;
        const author = document.getElementById("book-author-input").value;
        const detail = document.getElementById("book-detail-input").value;

        if (!title || !author || !detail) {
            alert("Please fill all fields!");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API}/books`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title, author, detail }),
            });

            if (res.ok) {
                // Reload all books from DB to get the real ID
                await loadBooks();
                popup.style.display = "none";
                overlay.style.display = "none";

                document.getElementById("book-title-input").value = "";
                document.getElementById("book-author-input").value = "";
                document.getElementById("book-detail-input").value = "";
            } else {
                alert("Failed to add book.");
            }
        } catch (err) {
            alert("Could not connect to server.");
        }
    });
}

// DELETE BOOK — calls DELETE /books/:id
async function deleteBook(id, divElement) {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API}/books/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            divElement.remove();
        } else {
            alert("Failed to delete book.");
        }
    } catch (err) {
        alert("Could not connect to server.");
    }
}