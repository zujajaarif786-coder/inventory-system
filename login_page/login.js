"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const resetForm = document.getElementById("resetForm");
    const resetPanel = document.getElementById("resetPanel");
    const forgotPasswordButton = document.getElementById("forgotPasswordButton");
    const closeResetButton = document.getElementById("closeResetButton");
    const formFeedback = document.getElementById("formFeedback");

    if (!form) {
        console.error("Login form not found.");
        return;
    }

    function showFeedback(message, type = "error") {
        if (!formFeedback) {
            alert(message);
            return;
        }

        formFeedback.textContent = message;
        formFeedback.className = `rounded-lg border px-4 py-3 text-sm ${
            type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
        }`;
        formFeedback.classList.remove("hidden");
    }

    function setButtonState(button, isLoading, loadingText) {
        if (!button) return;
        button.disabled = isLoading;
        button.dataset.originalText = button.dataset.originalText || button.textContent;
        button.textContent = isLoading ? loadingText : button.dataset.originalText;
    }

    console.log("StockMaster login.js loaded successfully.");

    if (forgotPasswordButton && resetPanel) {
        forgotPasswordButton.addEventListener("click", function () {
            resetPanel.classList.remove("hidden");
            if (formFeedback) {
                formFeedback.classList.add("hidden");
            }
        });
    }

    if (closeResetButton && resetPanel) {
        closeResetButton.addEventListener("click", function () {
            resetPanel.classList.add("hidden");
            resetForm?.reset();
        });
    }

    if (resetForm) {
        resetForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const resetEmail = document.getElementById("resetEmail");
            if (!resetEmail) return;

            const email = resetEmail.value.trim();
            if (!email) {
                showFeedback("Please enter your email address.");
                return;
            }

            const submitButton = document.getElementById("resetSubmitButton");
            setButtonState(submitButton, true, "Sending...");

            try {
                const response = await fetch(
                    "http://127.0.0.1:8000/api/accounts/forgot-password/",
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ email })
                    }
                );

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.error || "Unable to send reset request.");
                }

                showFeedback(data.message || "If that account exists, a reset email has been sent.", "success");
                resetForm.reset();
                resetPanel.classList.add("hidden");
            } catch (error) {
                console.error("Forgot password error:", error);
                showFeedback(error.message || "Unable to send reset request.");
            } finally {
                setButtonState(submitButton, false, "Send Request");
            }
        });
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        event.stopPropagation();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        if (!emailInput || !passwordInput) {
            alert("Login fields were not found.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const button =
            form.querySelector('button[type="submit"]') ||
            form.querySelector("button");

        const originalButtonText = button ? button.textContent : "";

        if (button) {
            button.disabled = true;
            button.textContent = "Signing In...";
        }

        try {
            console.log("Sending login request to Django...");

            const response = await fetch(
                "http://127.0.0.1:8000/api/accounts/login/",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch (error) {
                console.error("Could not read Django response:", error);
            }

            console.log("Django login response:", data);

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.detail ||
                    "Invalid email or password."
                );
            }

            if (data.user) {
                localStorage.setItem(
                    "stockmaster_user",
                    JSON.stringify(data.user)
                );
            }

            localStorage.setItem("isLoggedIn", "true");
            alert("Login successful!");
            window.location.href = "../dashboard_themed_alerts/code.html";

        } catch (error) {
            console.error("Login error:", error);
            alert(
                error.message ||
                "Unable to connect to the Django server."
            );

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalButtonText;
            }
        }
    });
});