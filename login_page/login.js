(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("loginForm");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const rememberMe = document.getElementById("rememberMe");

        const togglePasswordButton =
            document.getElementById("togglePassword");

        const eyeIcon = document.getElementById("eyeIcon");

        const submitButton =
            document.getElementById("submitButton");

        const submitText =
            document.getElementById("submitText");

        const submitIcon =
            document.getElementById("submitIcon");

        const feedback =
            document.getElementById("formFeedback");

        const emailError =
            document.getElementById("emailError");

        const passwordError =
            document.getElementById("passwordError");

        const forgotPasswordButton =
            document.getElementById("forgotPasswordButton");

        const resetPanel =
            document.getElementById("resetPanel");

        const resetForm =
            document.getElementById("resetForm");

        const resetEmail =
            document.getElementById("resetEmail");

        const closeResetButton =
            document.getElementById("closeResetButton");

        const resetSubmitButton =
            document.getElementById("resetSubmitButton");

        const supportButton =
            document.getElementById("supportButton");


        /*
        |--------------------------------------------------------------------------
        | Safety Check
        |--------------------------------------------------------------------------
        */

        if (
            !form ||
            !emailInput ||
            !passwordInput ||
            !togglePasswordButton ||
            !eyeIcon ||
            !submitButton
        ) {
            console.error("Login page: required elements are missing.");
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Constants
        |--------------------------------------------------------------------------
        */

        const EMAIL_PATTERN =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const MIN_PASSWORD_LENGTH = 6;


        /*
        |--------------------------------------------------------------------------
        | Feedback
        |--------------------------------------------------------------------------
        */

        function showFeedback(message, type = "info") {
            feedback.className =
                "rounded-lg border px-4 py-3 text-sm";

            feedback.textContent = message;

            const styles = {
                info: [
                    "border-blue-200",
                    "bg-blue-50",
                    "text-blue-700"
                ],

                success: [
                    "border-green-200",
                    "bg-green-50",
                    "text-green-700"
                ],

                warning: [
                    "border-amber-200",
                    "bg-amber-50",
                    "text-amber-700"
                ],

                error: [
                    "border-red-200",
                    "bg-red-50",
                    "text-red-700"
                ]
            };

            const selectedStyles =
                styles[type] || styles.info;

            feedback.classList.add(...selectedStyles);
            feedback.classList.remove("hidden");
        }


        function clearFeedback() {
            feedback.textContent = "";
            feedback.className =
                "hidden rounded-lg border px-4 py-3 text-sm";
        }


        /*
        |--------------------------------------------------------------------------
        | Field Errors
        |--------------------------------------------------------------------------
        */

        function setFieldError(field, errorElement, message) {
            field.setAttribute("aria-invalid", "true");

            field.classList.remove(
                "border-outline-variant"
            );

            field.classList.add(
                "border-red-500",
                "focus:border-red-500",
                "focus:ring-red-200"
            );

            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove("hidden");
            }
        }


        function clearFieldError(field, errorElement) {
            field.setAttribute("aria-invalid", "false");

            field.classList.remove(
                "border-red-500",
                "focus:border-red-500",
                "focus:ring-red-200"
            );

            field.classList.add(
                "border-outline-variant"
            );

            if (errorElement) {
                errorElement.textContent = "";
                errorElement.classList.add("hidden");
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Email Validation
        |--------------------------------------------------------------------------
        */

        function validateEmail() {
            const email = emailInput.value.trim();

            if (!email) {
                setFieldError(
                    emailInput,
                    emailError,
                    "Email address is required."
                );

                return false;
            }

            if (!EMAIL_PATTERN.test(email)) {
                setFieldError(
                    emailInput,
                    emailError,
                    "Please enter a valid email address."
                );

                return false;
            }

            clearFieldError(
                emailInput,
                emailError
            );

            return true;
        }


        /*
        |--------------------------------------------------------------------------
        | Password Validation
        |--------------------------------------------------------------------------
        */

        function validatePassword() {
            const password = passwordInput.value;

            if (!password) {
                setFieldError(
                    passwordInput,
                    passwordError,
                    "Password is required."
                );

                return false;
            }

            if (password.length < MIN_PASSWORD_LENGTH) {
                setFieldError(
                    passwordInput,
                    passwordError,
                    `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`
                );

                return false;
            }

            clearFieldError(
                passwordInput,
                passwordError
            );

            return true;
        }


        /*
        |--------------------------------------------------------------------------
        | Password Visibility
        |--------------------------------------------------------------------------
        */

        function togglePasswordVisibility() {
            const currentlyHidden =
                passwordInput.type === "password";

            passwordInput.type =
                currentlyHidden ? "text" : "password";

            togglePasswordButton.setAttribute(
                "aria-pressed",
                String(currentlyHidden)
            );

            togglePasswordButton.setAttribute(
                "aria-label",
                currentlyHidden
                    ? "Hide password"
                    : "Show password"
            );

            eyeIcon.textContent =
                currentlyHidden
                    ? "visibility_off"
                    : "visibility";
        }


        togglePasswordButton.addEventListener(
            "click",
            togglePasswordVisibility
        );


        /*
        |--------------------------------------------------------------------------
        | Submit Button State
        |--------------------------------------------------------------------------
        */

        function setLoadingState(isLoading) {
            submitButton.disabled = isLoading;
            submitButton.setAttribute(
                "aria-busy",
                String(isLoading)
            );

            if (isLoading) {
                submitText.textContent =
                    "Signing in...";

                submitIcon.textContent =
                    "progress_activity";

                submitIcon.classList.add(
                    "animate-spin"
                );
            } else {
                submitText.textContent =
                    "Sign In";

                submitIcon.textContent =
                    "arrow_forward";

                submitIcon.classList.remove(
                    "animate-spin"
                );
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Input Events
        |--------------------------------------------------------------------------
        */

        emailInput.addEventListener(
            "input",
            () => {
                clearFeedback();

                if (emailInput.value.trim()) {
                    validateEmail();
                }
            }
        );


        passwordInput.addEventListener(
            "input",
            () => {
                clearFeedback();

                if (passwordInput.value) {
                    validatePassword();
                }
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Login Submit
        |--------------------------------------------------------------------------
        */

        form.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                clearFeedback();

                const emailValid =
                    validateEmail();

                const passwordValid =
                    validatePassword();

                if (!emailValid) {
                    emailInput.focus();

                    showFeedback(
                        "Please correct your email address.",
                        "error"
                    );

                    return;
                }

                if (!passwordValid) {
                    passwordInput.focus();

                    showFeedback(
                        "Please correct your password.",
                        "error"
                    );

                    return;
                }

                /*
                 * IMPORTANT:
                 *
                 * There is intentionally NO:
                 *
                 * - hard-coded username
                 * - hard-coded password
                 * - localStorage authentication
                 * - fake successful login
                 * - file:/// redirect
                 *
                 * Django will handle authentication later.
                 */

                setLoadingState(true);

                showFeedback(
                    "Login form is valid and ready to be submitted.",
                    "info"
                );

                /*
                 * FRONTEND PROTOTYPE:
                 *
                 * We stop here until Django is connected.
                 *
                 * When Django is ready, this handler will submit
                 * the form to the Django login endpoint.
                 */

                await new Promise(
                    (resolve) => {
                        window.setTimeout(
                            resolve,
                            500
                        );
                    }
                );

                setLoadingState(false);

                showFeedback(
                    "Authentication will be handled by the Django backend.",
                    "info"
                );
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Forgot Password
        |--------------------------------------------------------------------------
        */

        forgotPasswordButton.addEventListener(
            "click",
            () => {
                resetPanel.classList.remove(
                    "hidden"
                );

                resetPanel.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });

                resetEmail.focus();

                clearFeedback();
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Close Password Reset
        |--------------------------------------------------------------------------
        */

        closeResetButton.addEventListener(
            "click",
            () => {
                resetPanel.classList.add(
                    "hidden"
                );

                resetForm.reset();

                clearFeedback();

                forgotPasswordButton.focus();
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Password Reset Request
        |--------------------------------------------------------------------------
        */

        resetForm.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                const email =
                    resetEmail.value.trim();

                if (!email) {
                    showFeedback(
                        "Please enter your email address.",
                        "error"
                    );

                    resetEmail.focus();

                    return;
                }

                if (!EMAIL_PATTERN.test(email)) {
                    showFeedback(
                        "Please enter a valid email address.",
                        "error"
                    );

                    resetEmail.focus();

                    return;
                }

                /*
                 * This is intentionally NOT pretending
                 * that an email was actually sent.
                 *
                 * Django will implement the real
                 * password-reset workflow.
                 */

                showFeedback(
                    "Your email is valid. Password recovery will be handled by the Django backend.",
                    "info"
                );
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Support
        |--------------------------------------------------------------------------
        */

        supportButton.addEventListener(
            "click",
            () => {
                showFeedback(
                    "Enterprise support is not connected yet. This will be implemented separately.",
                    "info"
                );
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Escape Key
        |--------------------------------------------------------------------------
        */

        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    clearFeedback();

                    if (
                        !resetPanel.classList.contains(
                            "hidden"
                        )
                    ) {
                        resetPanel.classList.add(
                            "hidden"
                        );

                        resetForm.reset();
                    }
                }
            }
        );


        /*
        |--------------------------------------------------------------------------
        | Initial State
        |--------------------------------------------------------------------------
        */

        emailInput.setAttribute(
            "aria-invalid",
            "false"
        );

        passwordInput.setAttribute(
            "aria-invalid",
            "false"
        );

        setLoadingState(false);
    });
})();